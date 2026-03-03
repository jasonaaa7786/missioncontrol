import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUsers() {
  // User 1: samira
  const hash1 = await bcrypt.hash('samwam', 10);
  const user1 = await prisma.user.upsert({
    where: { username: 'samira' },
    create: {
      username: 'samira',
      password: hash1,
      role: 'viewer',
      name: 'Samira',
    },
    update: {
      password: hash1,
    },
  });
  console.log('✅ Created user:', user1.username, '- Role:', user1.role);

  // User 2: mimster
  const hash2 = await bcrypt.hash('minnieme', 10);
  const user2 = await prisma.user.upsert({
    where: { username: 'mimster' },
    create: {
      username: 'mimster',
      password: hash2,
      role: 'viewer',
      name: 'Mimster',
    },
    update: {
      password: hash2,
    },
  });
  console.log('✅ Created user:', user2.username, '- Role:', user2.role);

  // List all users
  console.log('\n📋 All Users:');
  const allUsers = await prisma.user.findMany({
    select: { username: true, role: true, name: true, createdAt: true }
  });
  console.table(allUsers);
}

createUsers()
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
