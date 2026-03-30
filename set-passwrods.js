const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const db = new PrismaClient();

// ── Set each person's password here ──────────────────────────────────────────
const PASSWORDS = {
  "themba@mediaonafrica.co.za": "Themba@2026",
  "asanda@mediaonafrica.co.za": "Asanda@2026",
  "sizwe@mediaonafrica.co.za": "Sizwe@2026",
  "shravan@mediaonafrica.co.za": "Shravan@2026",
};

async function main() {
  console.log("🔐 Setting passwords...");

  for (const [email, password] of Object.entries(PASSWORDS)) {
    const hashed = await bcrypt.hash(password, 12);
    await db.user.update({
      where: { email },
      data: { password: hashed },
    });
    console.log(`✅ ${email}`);
  }

  console.log("\n🎉 All passwords set!");
  console.log("\nLogin credentials:");
  console.log("  Themba:  themba@mediaonafrica.co.za  / Themba@2026");
  console.log("  Asanda:  asanda@mediaonafrica.co.za  / Asanda@2026");
  console.log("  Sizwe:   sizwe@mediaonafrica.co.za   / Sizwe@2026");
  console.log("  Shravan: shravan@mediaonafrica.co.za / Shravan@2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
