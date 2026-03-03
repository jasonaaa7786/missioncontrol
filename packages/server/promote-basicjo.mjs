import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteBasicjo() {
  const updated = await prisma.user.update({
    where: { username: 'basicjo' },
    data: { role: 'admin' },
  });
  
  console.log('✅ Promoted:', updated.username);
  console.log('   - Name:', updated.name);
  console.log('   - Role:', updated.role);

  console.log('\n👑 All Admin Users:');
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { username: true, name: true },
    orderBy: { username: 'asc' },
  });
  console.table(admins);

  console.log('\n📊 User Summary:');
  const roleCount = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  });
  roleCount.forEach(r => {
    console.log(`  ${r.role}: ${r._count} user(s)`);
  });
}

promoteBasicjo()
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
