const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const plainPassword = process.argv[3];
  const hash = await bcrypt.hash(plainPassword, 10);

  const user = await db.user.update({
    where: { email },
    data: { password: hash },
  });

  console.log(`Updated ${user.email}, new hash: ${user.password}`);
}

main().finally(() => db.$disconnect());
