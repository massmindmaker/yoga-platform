const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Создаем тренера
  const trainer = await prisma.user.create({
    data: {
      firstName: 'Алексей',
      lastName: 'Иванов',
      role: 'TRAINER',
      balance: 0
    }
  });
  console.log('Created trainer:', trainer.id);

  // Создаем студентов
  const student1 = await prisma.user.create({
    data: {
      telegramId: '123456789',
      firstName: 'Мария',
      lastName: 'Петрова',
      role: 'STUDENT',
      balance: 5
    }
  });
  console.log('Created student 1:', student1.id);

  const student2 = await prisma.user.create({
    data: {
      firstName: 'Анна',
      lastName: 'Сидорова',
      role: 'STUDENT',
      balance: 3
    }
  });
  console.log('Created student 2:', student2.id);

  // Создаем группу
  const group = await prisma.group.create({
    data: {
      name: 'Утренняя йога',
      description: 'Занятия по понедельникам и средам',
      maxStudents: 20,
      telegramChat: '@morning_yoga'
    }
  });
  console.log('Created group:', group.id);

  // Добавляем студентов в группу
  await prisma.groupStudent.create({
    data: {
      groupId: group.id,
      userId: student1.id
    }
  });
  await prisma.groupStudent.create({
    data: {
      groupId: group.id,
      userId: student2.id
    }
  });

  // Создаем расписание
  const scheduleMon = await prisma.schedule.create({
    data: {
      groupId: group.id,
      dayOfWeek: 1, // Понедельник
      time: '07:30'
    }
  });
  const scheduleWed = await prisma.schedule.create({
    data: {
      groupId: group.id,
      dayOfWeek: 3, // Среда
      time: '07:30'
    }
  });
  console.log('Created schedules');

  // Создаем голосование на пятницу
  const voting = await prisma.voting.create({
    data: {
      groupId: group.id,
      title: 'Йога в пятницу',
      type: 'CONDITIONAL',
      minParticipants: 10,
      deadline: new Date('2026-02-06T18:00:00'),
      options: {
        create: [
          { dayOfWeek: 5, time: '07:30' },
          { dayOfWeek: 5, time: '19:00' }
        ]
      }
    },
    include: {
      options: true
    }
  });
  console.log('Created voting:', voting.id);

  // Добавляем голоса
  await prisma.vote.create({
    data: {
      votingId: voting.id,
      optionId: voting.options[0].id,
      userId: student1.id
    }
  });
  await prisma.vote.create({
    data: {
      votingId: voting.id,
      optionId: voting.options[0].id,
      userId: student2.id
    }
  });
  console.log('Added votes');

  // Создаем платеж
  await prisma.payment.create({
    data: {
      userId: student1.id,
      amount: 2800,
      classesCount: 4,
      status: 'COMPLETED',
      provider: 'tbank'
    }
  });
  console.log('Created payment');

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
