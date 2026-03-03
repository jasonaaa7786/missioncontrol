import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteUsers() {
  // Promote samira to admin
  const user1 = await prisma.user.update({
    where: { username: 'samira' },
    data: { role: 'admin' },
  });
  console.log('✅ Promoted:', user1.username, '→ Role:', user1.role);

  // Promote mimster to admin
  const user2 = await prisma.user.update({
    where: { username: 'mimster' },
    data: { role: 'admin' },
  });
  console.log('✅ Promoted:', user2.username, '→ Role:', user2.role);

  // Show all admin users
  console.log('\n👑 All Admin Users:');
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { username: true, name: true, createdAt: true }
  });
  console.table(admins);

  console.log('\n📊 User Summary:');
  const roleCount = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  });
  console.table(roleCount);
}

promoteUsers()
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
