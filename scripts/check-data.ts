import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  // All users
  const users = await db.user.findMany();
  console.log('=== ALL USERS ===');
  for (const u of users) {
    console.log(`  ${u.firstName} ${u.lastName || ''} | role=${u.role} | telegramId=${u.telegramId} | id=${u.id}`);
  }

  // Group with students
  const groups = await db.group.findMany({
    include: {
      students: { include: { user: true } },
      trainer: true,
    },
  });
  console.log('\n=== GROUPS ===');
  for (const g of groups) {
    console.log(`  ${g.name} | trainerId=${g.trainerId} | trainer=${g.trainer?.firstName || 'NONE'}`);
    console.log(`  telegramChat=${g.telegramChat}`);
    console.log(`  telegramChatId=${g.telegramChatId}`);
    console.log(`  Students (${g.students.length}):`);
    for (const s of g.students) {
      console.log(`    - ${s.user.firstName} ${s.user.lastName || ''} | telegramId=${s.user.telegramId}`);
    }
  }
}

main().finally(() => db.$disconnect());
