import { db } from "@/lib/db";

type MentionedUser = {
  id: string;
  name: string | null;
  email: string;
};

const NAME_ALIASES: Record<string, string[]> = {
  lutendo: ["lutendo matshidze"],
  matlhodi: ["matlhodi moila"],
};

function normalizeMention(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function aliasesForUser(user: MentionedUser) {
  const aliases = new Set<string>();
  const name = user.name?.trim();

  if (name) {
    aliases.add(normalizeMention(name));
    aliases.add(normalizeMention(name.split(/\s+/)[0]));
  }

  aliases.add(normalizeMention(user.email.split("@")[0]));

  for (const [shortName, fullNames] of Object.entries(NAME_ALIASES)) {
    if (name && fullNames.includes(normalizeMention(name))) {
      aliases.add(shortName);
    }
  }

  return aliases;
}

export function extractMentionTokens(body: string) {
  return [
    ...new Set(
      [...body.matchAll(/@([\p{L}\p{N}_.-]+)/gu)].map((match) =>
        normalizeMention(match[1]),
      ),
    ),
  ];
}

export async function resolveMentionedUsers(body: string) {
  const mentionTokens = extractMentionTokens(body);
  if (mentionTokens.length === 0) return [];

  const users = await db.user.findMany({
    where: {
      email: { not: "" },
    },
    select: { id: true, name: true, email: true },
  });

  const mentionedUsers = new Map<string, MentionedUser>();

  for (const token of mentionTokens) {
    for (const user of users) {
      if (aliasesForUser(user).has(token)) {
        mentionedUsers.set(user.id, user);
      }
    }
  }

  return [...mentionedUsers.values()];
}
