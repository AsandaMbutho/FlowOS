import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEAM_ROSTER = [
  { name: "Asanda", email: "asandambutho@icloud.com" },
  { name: "Sizwe", email: "sizweschaba723@gmail.com" },
  { name: "Themba", email: "netshifirathemba0@gmail.com" },
  { name: "Matlhodi", email: "moilamatlhodi707@gmail.com" },
  { name: "Lutendo", email: "lupreshie@gmail.com" },
  { name: "Ridwaan", email: "sridwaan0@gmail.com" }
];

const everyone = {
  name: "Everyone",
  email: TEAM_ROSTER.map(member => member.email)
};

TEAM_ROSTER.push(everyone);

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
  await deleteUserAndUnassign("Everyone", summary);

  const placeholderPassword = await bcrypt.hash("password123", 10);

  for (const member of TEAM_ROSTER) {
    const existingByName = await prisma.user.findFirst({
      where: { name: member.name },
    });

    if (existingByName) {
      await prisma.user.update({
        where: { id: existingByName.id },
        data: { email: member.email },
      });
      summary.updated.push(`${member.name} -> ${member.email}`);
      continue;
    }

    const existingByEmail = await prisma.user.findUnique({
      where: { email: member.email },
    });

    if (existingByEmail) {
      await prisma.user.update({
        where: { id: existingByEmail.id },
        data: { name: member.name },
      });
      summary.updated.push(`${member.name} -> ${member.email}`);
      continue;
    }

    await prisma.user.create({
      data: {
        name: member.name,
        email: member.email,
        role: Role.USER,
        password: placeholderPassword,
      },
    });
    summary.created.push(`${member.name} -> ${member.email}`);
  }

  console.log("Team roster update complete.");
  console.log(`Deleted: ${summary.deleted.join(", ") || "none"}`);
  console.log(`Workflows unassigned: ${summary.reassignedWorkflows}`);
  console.log(`Tasks unassigned: ${summary.reassignedTasks}`);
  console.log(`Created: ${summary.created.join(", ") || "none"}`);
  console.log(`Updated: ${summary.updated.join(", ") || "none"}`);
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
