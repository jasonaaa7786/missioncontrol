import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateUsers() {
  // Delete joanne user
  try {
    await prisma.user.delete({
      where: { username: 'joanne' },
    });
    console.log('✅ Deleted user: joanne');
  } catch (e) {
    console.log('⚠️  User joanne not found or already deleted');
  }

  // Update basicjo password (keep current role)
  const newPassword = await bcrypt.hash('jobasic', 10);
  const updated = await prisma.user.update({
    where: { username: 'basicjo' },
    data: { 
      password: newPassword,
    },
  });
  console.log('✅ Updated user:', updated.username);
  console.log('   - New password: jobasic');
  console.log('   - Role:', updated.role, '(unchanged)');

  // Show all users
  console.log('\n📋 All Users:');
  const allUsers = await prisma.user.findMany({
    select: { username: true, role: true, name: true },
    orderBy: { role: 'desc' },
  });
  console.table(allUsers);

  console.log('\n📊 Summary:');
  const roleCount = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  });
  roleCount.forEach(r => {
    console.log(`  ${r.role}: ${r._count} user(s)`);
  });
}

updateUsers()
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
