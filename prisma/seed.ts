const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Очищаем существующие данные (в правильном порядке из-за FK)
  await prisma.balanceTransaction.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.votingOption.deleteMany();
  await prisma.voting.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.class.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.groupStudent.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();
  console.log('✓ Cleared existing data\n');

  // ============== ТРЕНЕР ==============
  const trainer = await prisma.user.create({
    data: {
      telegramId: '100000001',
      firstName: 'Ирина',
      lastName: 'Тренер',
      role: 'TRAINER',
      balance: 0,
      phone: '+7 999 111 11 11',
      email: 'trainer@yoga.ru'
    }
  });
  console.log('✓ Created trainer:', trainer.firstName, trainer.lastName);

  // ============== 10 УЧЕНИКОВ ==============
  const studentsData = [
    { telegramId: '200000001', firstName: 'Мария', lastName: 'Петрова', balance: 8 },
    { telegramId: '200000002', firstName: 'Анна', lastName: 'Сидорова', balance: 5 },
    { telegramId: '200000003', firstName: 'Ольга', lastName: 'Иванова', balance: 12 },
    { telegramId: '200000004', firstName: 'Екатерина', lastName: 'Козлова', balance: 3 },
    { telegramId: '200000005', firstName: 'Наталья', lastName: 'Новикова', balance: 0 },
    { telegramId: '200000006', firstName: 'Елена', lastName: 'Морозова', balance: 6 },
    { telegramId: '200000007', firstName: 'Татьяна', lastName: 'Волкова', balance: 4 },
    { telegramId: '200000008', firstName: 'Светлана', lastName: 'Зайцева', balance: 10 },
    { telegramId: '200000009', firstName: 'Юлия', lastName: 'Соколова', balance: 2 },
    { telegramId: '200000010', firstName: 'Дарья', lastName: 'Лебедева', balance: 7 },
  ];

  const students = [];
  for (const data of studentsData) {
    const student = await prisma.user.create({
      data: {
        ...data,
        role: 'STUDENT',
      }
    });
    students.push(student);
  }
  console.log('✓ Created 10 students\n');

  // ============== ГРУППА 1: РЕГУЛЯРНЫЕ ЗАНЯТИЯ (FIXED) ==============
  const group1 = await prisma.group.create({
    data: {
      name: 'Утренняя хатха-йога',
      description: 'Регулярные занятия для начинающих и продолжающих. Вт, Чт, Сб в 07:30',
      groupType: 'REGULAR',
      pricingType: 'FIXED',
      fixedPrice: 1, // 1 занятие с баланса
      maxStudents: 15,
      trainerId: trainer.id,
      telegramChat: '-1001234567890',
      schedules: {
        create: [
          { dayOfWeek: 2, time: '07:30', description: 'Хатха' },
          { dayOfWeek: 4, time: '07:30', description: 'Хатха' },
          { dayOfWeek: 6, time: '09:00', description: 'Хатха + ОФП' },
        ]
      }
    }
  });
  console.log('✓ Created Group 1 (Regular/Fixed):', group1.name);

  // ============== ГРУППА 2: ПЛАВАЮЩИЕ ЗАНЯТИЯ (DYNAMIC) ==============
  const group2 = await prisma.group.create({
    data: {
      name: 'Вечерняя виньяса',
      description: 'Динамичные занятия. Расписание определяется еженедельным голосованием.',
      groupType: 'REGULAR',
      pricingType: 'DYNAMIC',
      fixedPrice: 1,
      maxStudents: 12,
      trainerId: trainer.id,
      schedules: {
        create: [
          { dayOfWeek: 1, time: '19:00', description: 'Виньяса' },
          { dayOfWeek: 3, time: '19:00', description: 'Виньяса' },
          { dayOfWeek: 5, time: '19:00', description: 'Виньяса flow' },
        ]
      }
    }
  });
  console.log('✓ Created Group 2 (Regular/Dynamic):', group2.name);

  // ============== ГРУППА 3: ИНТЕНСИВ ==============
  const group3 = await prisma.group.create({
    data: {
      name: 'Новогодний детокс',
      description: '3-дневный интенсив: очищающие практики, дыхание, медитация',
      groupType: 'INTENSIVE',
      pricingType: 'FIXED',
      fixedPrice: 3, // весь интенсив = 3 занятия
      maxStudents: 20,
      trainerId: trainer.id,
      startsAt: new Date('2026-02-15'),
      endsAt: new Date('2026-02-17'),
      schedules: {
        create: [
          { dayOfWeek: 6, time: '10:00', description: 'День 1: Очищение' },
          { dayOfWeek: 0, time: '10:00', description: 'День 2: Дыхание' },
          { dayOfWeek: 1, time: '10:00', description: 'День 3: Медитация' },
        ]
      }
    }
  });
  console.log('✓ Created Group 3 (Intensive):', group3.name);

  // ============== ДОБАВЛЯЕМ УЧЕНИКОВ В ГРУППЫ ==============
  // Группа 1: 8 учеников
  for (let i = 0; i < 8; i++) {
    await prisma.groupStudent.create({
      data: { groupId: group1.id, userId: students[i].id }
    });
  }
  
  // Группа 2: 6 учеников
  for (let i = 2; i < 8; i++) {
    await prisma.groupStudent.create({
      data: { groupId: group2.id, userId: students[i].id }
    });
  }
  
  // Группа 3 (интенсив): 5 учеников
  for (let i = 0; i < 5; i++) {
    await prisma.groupStudent.create({
      data: { groupId: group3.id, userId: students[i].id }
    });
  }
  console.log('✓ Added students to groups\n');

  // ============== 16 ПЛАТЕЖЕЙ ==============
  const paymentsData = [
    // Успешные платежи (разные тарифы)
    { userId: students[0].id, amount: 2800, classesCount: 4, status: 'COMPLETED', provider: 'tbank' },
    { userId: students[0].id, amount: 4800, classesCount: 8, status: 'COMPLETED', provider: 'tbank' },
    { userId: students[1].id, amount: 6000, classesCount: 12, status: 'COMPLETED', provider: 'tbank' },
    { userId: students[2].id, amount: 4800, classesCount: 8, status: 'COMPLETED', provider: 'telegram_stars' },
    { userId: students[2].id, amount: 2800, classesCount: 4, status: 'COMPLETED', provider: 'tbank' },
    { userId: students[3].id, amount: 2800, classesCount: 4, status: 'COMPLETED', provider: 'tbank' },
    { userId: students[4].id, amount: 6000, classesCount: 12, status: 'COMPLETED', provider: 'telegram_stars' },
    { userId: students[5].id, amount: 4800, classesCount: 8, status: 'COMPLETED', provider: 'tbank' },
    { userId: students[6].id, amount: 2800, classesCount: 4, status: 'COMPLETED', provider: 'tbank' },
    { userId: students[7].id, amount: 6000, classesCount: 12, status: 'COMPLETED', provider: 'tbank' },
    { userId: students[8].id, amount: 2800, classesCount: 4, status: 'COMPLETED', provider: 'telegram_stars' },
    { userId: students[9].id, amount: 4800, classesCount: 8, status: 'COMPLETED', provider: 'tbank' },
    // Pending платеж
    { userId: students[4].id, amount: 2800, classesCount: 4, status: 'PENDING', provider: 'tbank' },
    // Failed платежи
    { userId: students[5].id, amount: 6000, classesCount: 12, status: 'FAILED', provider: 'tbank' },
    // Refunded платеж
    { userId: students[1].id, amount: 2800, classesCount: 4, status: 'REFUNDED', provider: 'tbank' },
    // Ещё один успешный
    { userId: students[3].id, amount: 4800, classesCount: 8, status: 'COMPLETED', provider: 'tbank' },
  ];

  for (const data of paymentsData) {
    await prisma.payment.create({ data });
  }
  console.log('✓ Created 16 payments\n');

  // ============== ТРАНЗАКЦИИ БАЛАНСА ==============
  // Для наглядности добавим несколько транзакций
  const transactionsData = [
    { userId: students[0].id, amount: 4, type: 'PAYMENT_CREDIT', description: 'Покупка 4 занятий' },
    { userId: students[0].id, amount: 8, type: 'PAYMENT_CREDIT', description: 'Покупка 8 занятий' },
    { userId: students[0].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Хатха 10.02' },
    { userId: students[0].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Хатха 12.02' },
    { userId: students[0].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Хатха 14.02' },
    { userId: students[0].id, amount: -1, type: 'VOTE_DEDUCTION', description: 'Голос за пятницу 19:00' },
    { userId: students[1].id, amount: 12, type: 'PAYMENT_CREDIT', description: 'Покупка 12 занятий' },
    { userId: students[1].id, amount: -4, type: 'PAYMENT_REFUND', description: 'Возврат платежа' },
    { userId: students[1].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Виньясу' },
    { userId: students[1].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Виньясу' },
    { userId: students[1].id, amount: 1, type: 'CLASS_CANCELLED', description: 'Возврат — занятие отменено' },
  ];

  for (const data of transactionsData) {
    await prisma.balanceTransaction.create({ data });
  }
  console.log('✓ Created balance transactions\n');

  // ============== ГОЛОСОВАНИЕ ДЛЯ ГРУППЫ 1 ==============
  const voting1 = await prisma.voting.create({
    data: {
      groupId: group1.id,
      title: 'Занятие в пятницу 14 февраля',
      type: 'CONFIRM',
      chargeOnVote: true,
      multipleChoice: false,
      minParticipants: 5,
      deadline: new Date('2026-02-13T18:00:00'),
      options: {
        create: [
          { dayOfWeek: 5, time: '07:30', date: new Date('2026-02-14'), description: 'Утренняя хатха' },
        ]
      }
    },
    include: { options: true }
  });

  // Добавляем голоса
  for (let i = 0; i < 4; i++) {
    await prisma.vote.create({
      data: {
        votingId: voting1.id,
        optionId: voting1.options[0].id,
        userId: students[i].id,
        balanceCharged: true,
      }
    });
  }
  console.log('✓ Created voting for Group 1 with 4 votes');

  // ============== ГОЛОСОВАНИЕ ДЛЯ ГРУППЫ 2 (еженедельное) ==============
  const voting2 = await prisma.voting.create({
    data: {
      groupId: group2.id,
      title: 'Расписание на неделю 10-16 февраля',
      type: 'SCHEDULE',
      chargeOnVote: false,
      multipleChoice: true,
      minParticipants: 3,
      deadline: new Date('2026-02-09T20:00:00'),
      weekStart: new Date('2026-02-10'),
      weekEnd: new Date('2026-02-16'),
      options: {
        create: [
          { dayOfWeek: 1, time: '19:00', description: 'Понедельник вечер' },
          { dayOfWeek: 3, time: '19:00', description: 'Среда вечер' },
          { dayOfWeek: 5, time: '19:00', description: 'Пятница вечер' },
        ]
      }
    },
    include: { options: true }
  });

  // Голоса (множественный выбор)
  await prisma.vote.create({ data: { votingId: voting2.id, optionId: voting2.options[0].id, userId: students[2].id } });
  await prisma.vote.create({ data: { votingId: voting2.id, optionId: voting2.options[1].id, userId: students[2].id } });
  await prisma.vote.create({ data: { votingId: voting2.id, optionId: voting2.options[0].id, userId: students[3].id } });
  await prisma.vote.create({ data: { votingId: voting2.id, optionId: voting2.options[2].id, userId: students[3].id } });
  await prisma.vote.create({ data: { votingId: voting2.id, optionId: voting2.options[1].id, userId: students[4].id } });
  await prisma.vote.create({ data: { votingId: voting2.id, optionId: voting2.options[2].id, userId: students[5].id } });
  console.log('✓ Created weekly voting for Group 2 with votes');

  console.log('\n✅ Seeding completed!');
  console.log('\n📊 Summary:');
  console.log('   - 1 trainer');
  console.log('   - 10 students');
  console.log('   - 3 groups (Regular/Fixed, Regular/Dynamic, Intensive)');
  console.log('   - 16 payments');
  console.log('   - 2 active votings');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
