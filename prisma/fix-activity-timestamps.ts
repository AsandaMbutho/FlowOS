import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixActivityTimestamps() {
  console.log("📅 Fixing activity timestamps...");

  const activities = await prisma.activity.findMany();

  // Map activities to realistic dates based on workflow creation
  const activityDates: Record<string, Date> = {
    completed: new Date("2026-03-28"),
    created: new Date("2026-04-01"),
    updated: new Date("2026-04-07"),
    reviewed: new Date("2026-04-10"),
  };

  for (let i = 0; i < activities.length; i++) {
    const activity = activities[i];
    let newDate: Date;

    // Assign dates based on action type and index
    if (activity.action === "completed") {
      newDate = new Date("2026-03-28");
    } else if (activity.action === "created") {
      newDate = new Date("2026-04-01");
    } else if (activity.action === "updated") {
      newDate = new Date("2026-04-07");
    } else if (activity.action === "reviewed") {
      newDate = new Date("2026-04-10");
    } else {
      // Spread other activities over time
      newDate = new Date("2026-04-05");
      newDate.setDate(newDate.getDate() + i);
    }

    // Add random hours to make them look realistic
    newDate.setHours(10 + (i % 8), (i * 13) % 60, 0);

    await prisma.activity.update({
      where: { id: activity.id },
      data: { createdAt: newDate },
    });
  }

  console.log(`✅ Fixed ${activities.length} activity timestamps`);
}

fixActivityTimestamps()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
