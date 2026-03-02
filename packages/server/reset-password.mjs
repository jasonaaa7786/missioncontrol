import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const password = await bcrypt.hash('test123', 10);

await prisma.user.update({
  where: { username: 'joanne' },
  data: { password }
});

console.log('Password reset for joanne to: test123');
await prisma.$disconnect();
