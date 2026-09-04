const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const TEST_PASSWORD = "password123";

const users = [
  { email: "asandambutho@icloud.com", name: "Asanda", role: "USER" },
  { email: "netshifirathemba0@gmail.com", name: "Themba", role: "MANAGER" },
  { email: "sridwaan0@gmail.com", name: "Ridwaan", role: "USER" },
  { email: "sizweschaba723@gmail.com", name: "Sizwe", role: "USER" },
  { email: "lupreshire@gmail.com", name: "Lutendo", role: "USER" },
  { email: "moilamatlhodi707@gmail.com", name: "Matlhodi", role: "USER" },
  { email: "neomate03@gmail.com", name: "Neo Matekane", role: "USER" },
];

async function ensureLeaveBalance(userId) {
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

async function main() {
  console.log("Starting seed...");

  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        password: hashedPassword,
        role: userData.role,
      },
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role,
      },
    });

    await ensureLeaveBalance(user.id);
    console.log(`Seeded ${user.email}`);
  }

  console.log(`Seed complete. Test password: ${TEST_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
