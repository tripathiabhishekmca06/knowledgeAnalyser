import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password || password.length < 12) {
  console.error("Usage: npm run admin:create -- admin@example.com 'strong-password-12+'");
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 12);
await prisma.adminUser.upsert({
  where: { email },
  update: { passwordHash, active: true },
  create: { email, passwordHash }
});
await prisma.$disconnect();
console.log(`Admin ready: ${email}`);
