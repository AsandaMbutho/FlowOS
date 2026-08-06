const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Hash the password
  const hashedPassword = await bcrypt.hash("Password123", 10);
  console.log("✅ Password hashed");

  // Create users
  const users = [
    { email: "asandambutho@icloud.com", name: "Asanda", role: "USER" },
    { email: "netshifirathmba0@gmail.com", name: "Themba", role: "MANAGER" },
    { email: "sridwaan0@gmail.com", name: "Ridwaan", role: "USER" },
    { email: "sizweschaba723@gmail.com", name: "Sizwe", role: "USER" },
    { email: "test@example.com", name: "Test User", role: "USER" },
  ];

  for (const userData of users) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    let user;
    if (existingUser) {
      // Update existing user
      user = await prisma.user.update({
        where: { email: userData.email },
        data: {
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
        },
      });
      console.log(`🔄 Updated: ${user.email}`);
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
        },
      });
      console.log(`✅ Created: ${user.email}`);
    }

    // Create leave balance for each user
    const existingBalance = await prisma.leaveBalance.findUnique({
      where: { userId: user.id },
    });

    if (!existingBalance) {
      await prisma.leaveBalance.create({
        data: {
          userId: user.id,
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
      console.log(`   └─ Leave balance created for ${user.name}`);
    } else {
      console.log(`   └─ Leave balance already exists for ${user.name}`);
    }
  }

  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Test credentials (Password: Password123):");
  console.log("   👤 Asanda (Employee):   asandambutho@icloud.com");
  console.log("   👤 Themba (Manager):    netshifirathmba0@gmail.com");
  console.log("   👤 Ridwaan (Employee):  sridwaan0@gmail.com");
  console.log("   👤 Sizwe (Employee):    sizweschaba723@gmail.com");
  console.log("   👤 Test (Employee):     test@example.com");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
