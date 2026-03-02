import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

await prisma.user.update({
  where: { username: 'iqbal' },
  data: { role: 'admin' }
});

console.log('iqbal is now admin');
await prisma.$disconnect();
