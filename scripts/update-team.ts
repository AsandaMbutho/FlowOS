import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEAM_ROSTER = [
  { name: "Asanda", email: "asandambutho@icloud.com", role: Role.USER },
  { name: "Sizwe", email: "sizweschaba723@gmail.com", role: Role.USER },
  { name: "Themba", email: "netshifirathemba0@gmail.com", role: Role.MANAGER },
  { name: "Matlhodi", email: "moilamatlhodi707@gmail.com", role: Role.USER },
  { name: "Lutendo", email: "lupreshire@gmail.com", role: Role.USER },
  { name: "Ridwaan", email: "sridwaan0@gmail.com", role: Role.USER },
  { name: "Neo Matekane", email: "neomate03@gmail.com", role: Role.USER },
];

async function main() {
  console.log("Updating FlowOS team roster...");

  const summary = {
    created: [] as string[],
    updated: [] as string[],
    deleted: [] as string[],
    reassignedWorkflows: 0,
    reassignedTasks: 0,
  };

  await deleteUserAndUnassign("Shravan", summary);
  // Safety net: cleans up a stray "Everyone" user row if one was ever
  // created by mistake. "Everyone" is not a real account — broadcasting
  // to everyone happens by looping over real users when assigneeId is null.
  await deleteUserAndUnassign("Everyone", summary);

  // Stray duplicate/test accounts that show up in the attendee picker
  // alongside the real roster below (e.g. "Matlhodi" AND "Matlhodi Moila").
  // These aren't in TEAM_ROSTER so the name/email matching below would
  // never touch them — they have to be deleted explicitly.
  await deleteUserAndUnassign("Lutendo Matshidze", summary);
  await deleteUserAndUnassign("Matlhodi Moila", summary);
  await deleteUserAndUnassign("Test User", summary);

  const placeholderPassword = await bcrypt.hash("password123", 10);

  for (const member of TEAM_ROSTER) {
    const existingByName = await prisma.user.findFirst({
      where: { name: member.name },
    });

    if (existingByName) {
      await prisma.user.update({
        where: { id: existingByName.id },
        data: { email: member.email, role: member.role },
      });
      await ensureLeaveBalance(existingByName.id);
      summary.updated.push(`${member.name} -> ${member.email}`);
      continue;
    }

    const existingByEmail = await prisma.user.findUnique({
      where: { email: member.email },
    });

    if (existingByEmail) {
      await prisma.user.update({
        where: { id: existingByEmail.id },
        data: { name: member.name, role: member.role },
      });
      await ensureLeaveBalance(existingByEmail.id);
      summary.updated.push(`${member.name} -> ${member.email}`);
      continue;
    }

    const created = await prisma.user.create({
      data: {
        name: member.name,
        email: member.email,
        role: member.role,
        password: placeholderPassword,
      },
    });
    await ensureLeaveBalance(created.id);
    summary.created.push(`${member.name} -> ${member.email}`);
  }

  console.log("Team roster update complete.");
  console.log(`Deleted: ${summary.deleted.join(", ") || "none"}`);
  console.log(`Workflows unassigned: ${summary.reassignedWorkflows}`);
  console.log(`Tasks unassigned: ${summary.reassignedTasks}`);
  console.log(`Created: ${summary.created.join(", ") || "none"}`);
  console.log(`Updated: ${summary.updated.join(", ") || "none"}`);
}

async function ensureLeaveBalance(userId: string) {
  await prisma.leaveBalance.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      annualEntitlement: 20,
      annualUsed: 0,
      annualCarryOver: 0,
      sickEntitlement: 10,
      sickUsed: 0,
      sickCarryOver: 0,
      personalEntitlement: 3,
      personalUsed: 0,
    },
  });
}

async function deleteUserAndUnassign(
  name: string,
  summary: {
    deleted: string[];
    reassignedWorkflows: number;
    reassignedTasks: number;
  },
) {
  const user = await prisma.user.findFirst({ where: { name } });

  if (user) {
    const [workflowUpdate, taskUpdate] = await Promise.all([
      prisma.workflow.updateMany({
        where: { assigneeId: user.id },
        data: { assigneeId: null },
      }),
      prisma.task.updateMany({
        where: { assigneeId: user.id },
        data: { assigneeId: null },
      }),
    ]);

    summary.reassignedWorkflows += workflowUpdate.count;
    summary.reassignedTasks += taskUpdate.count;

    await prisma.commentMention.deleteMany({ where: { userId: user.id } });
    await prisma.activity.updateMany({
      where: { userId: user.id },
      data: { userId: null },
    });
    await prisma.comment.updateMany({
      where: { authorId: user.id },
      data: { authorId: null },
    });
    await prisma.document.updateMany({
      where: { uploadedBy: user.id },
      data: { uploadedBy: null },
    });
    await prisma.notification.updateMany({
      where: { userId: user.id },
      data: { userId: null },
    });

    await prisma.user.delete({ where: { id: user.id } });
    summary.deleted.push(name);
  }
}

main()
  .catch((error) => {
    console.error("Team roster update failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
