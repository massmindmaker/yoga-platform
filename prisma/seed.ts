const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Очищаем существующие данные (в правильном порядке из-за FK)
  await prisma.attendance.deleteMany();
  await prisma.balanceTransaction.deleteMany();
  await prisma.pass.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.userNotificationSettings.deleteMany();
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

  // ============== 20 УЧЕНИКОВ ==============
  const studentsData = [
    { telegramId: '200000001', firstName: 'Мария', lastName: 'Петрова', balance: 8, phone: '+7 999 222 11 01' },
    { telegramId: '200000002', firstName: 'Анна', lastName: 'Сидорова', balance: 5, phone: '+7 999 222 11 02' },
    { telegramId: '200000003', firstName: 'Ольга', lastName: 'Иванова', balance: 12, phone: '+7 999 222 11 03' },
    { telegramId: '200000004', firstName: 'Екатерина', lastName: 'Козлова', balance: 3, phone: '+7 999 222 11 04' },
    { telegramId: '200000005', firstName: 'Наталья', lastName: 'Новикова', balance: 0, phone: '+7 999 222 11 05' },
    { telegramId: '200000006', firstName: 'Елена', lastName: 'Морозова', balance: 6, phone: '+7 999 222 11 06' },
    { telegramId: '200000007', firstName: 'Татьяна', lastName: 'Волкова', balance: 4, phone: '+7 999 222 11 07' },
    { telegramId: '200000008', firstName: 'Светлана', lastName: 'Зайцева', balance: 10, phone: '+7 999 222 11 08' },
    { telegramId: '200000009', firstName: 'Юлия', lastName: 'Соколова', balance: 2, phone: '+7 999 222 11 09' },
    { telegramId: '200000010', firstName: 'Дарья', lastName: 'Лебедева', balance: 7, phone: '+7 999 222 11 10' },
    // Новые ученики (без telegramId)
    { telegramId: null, firstName: 'Виктория', lastName: 'Смирнова', balance: 0, phone: '+7 999 222 11 11' },
    { telegramId: null, firstName: 'Алина', lastName: 'Кузнецова', balance: 4, phone: '+7 999 222 11 12' },
    { telegramId: '200000013', firstName: 'Полина', lastName: 'Васильева', balance: 15, phone: '+7 999 222 11 13' },
    { telegramId: null, firstName: 'Ксения', lastName: 'Попова', balance: 1, phone: '+7 999 222 11 14' },
    { telegramId: '200000015', firstName: 'Александра', lastName: 'Романова', balance: 6, phone: '+7 999 222 11 15' },
    { telegramId: null, firstName: 'Вероника', lastName: 'Макарова', balance: 0, phone: '+7 999 222 11 16' },
    { telegramId: '200000017', firstName: 'Алиса', lastName: 'Семенова', balance: 11, phone: '+7 999 222 11 17' },
    { telegramId: '200000018', firstName: 'Марина', lastName: 'Егорова', balance: 3, phone: '+7 999 222 11 18' },
    { telegramId: null, firstName: 'Людмила', lastName: 'Орлова', balance: 8, phone: '+7 999 222 11 19' },
    { telegramId: '200000020', firstName: 'Галина', lastName: 'Андреева', balance: 2, phone: '+7 999 222 11 20' },
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
  console.log('✓ Created 20 students\n');

  // ============== ГРУППА 1: РЕГУЛЯРНЫЕ ЗАНЯТИЯ (FIXED) ==============
  const group1 = await prisma.group.create({
    data: {
      name: 'Утренняя хатха-йога',
      description: 'Регулярные занятия для начинающих и продолжающих. Вт, Чт, Сб в 07:30',
      groupType: 'REGULAR',
      pricingType: 'FIXED',
      fixedPrice: 1,
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
      fixedPrice: 3,
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
  // Группа 1: 12 учеников
  for (let i = 0; i < 12; i++) {
    await prisma.groupStudent.create({
      data: { groupId: group1.id, userId: students[i].id }
    });
  }
  
  // Группа 2: 10 учеников
  for (let i = 5; i < 15; i++) {
    await prisma.groupStudent.create({
      data: { groupId: group2.id, userId: students[i].id }
    });
  }
  
  // Группа 3 (интенсив): 8 учеников
  for (let i = 0; i < 8; i++) {
    await prisma.groupStudent.create({
      data: { groupId: group3.id, userId: students[i].id }
    });
  }
  console.log('✓ Added students to groups\n');

  // ============== 20 ПЛАТЕЖЕЙ ==============
  const paymentsData = [
    // Успешные платежи - разные тарифы
    { userId: students[0].id, amount: 2800, classesCount: 4, status: 'COMPLETED', provider: 'tbank', externalId: 'tbank_001' },
    { userId: students[0].id, amount: 4800, classesCount: 8, status: 'COMPLETED', provider: 'tbank', externalId: 'tbank_002' },
    { userId: students[1].id, amount: 6000, classesCount: 12, status: 'COMPLETED', provider: 'tbank', externalId: 'tbank_003' },
    { userId: students[2].id, amount: 4800, classesCount: 8, status: 'COMPLETED', provider: 'telegram_stars', externalId: 'stars_001' },
    { userId: students[2].id, amount: 2800, classesCount: 4, status: 'COMPLETED', provider: 'tbank', externalId: 'tbank_004' },
    { userId: students[3].id, amount: 2800, classesCount: 4, status: 'COMPLETED', provider: 'tbank', externalId: 'tbank_005' },
    { userId: students[4].id, amount: 6000, classesCount: 12, status: 'COMPLETED', provider: 'telegram_stars', externalId: 'stars_002' },
    { userId: students[5].id, amount: 4800, classesCount: 8, status: 'COMPLETED', provider: 'tbank', externalId: 'tbank_006' },
    { userId: students[6].id, amount: 2800, classesCount: 4, status: 'COMPLETED', provider: 'tbank', externalId: 'tbank_007' },
    { userId: students[7].id, amount: 6000, classesCount: 12, status: 'COMPLETED', provider: 'tbank', externalId: 'tbank_008' },
    // Платежи новых учеников
    { userId: students[10].id, amount: 2800, classesCount: 4, status: 'COMPLETED', provider: 'tbank', externalId: 'tbank_009' },
    { userId: students[11].id, amount: 4800, classesCount: 8, status: 'COMPLETED', provider: 'telegram_stars', externalId: 'stars_003' },
    { userId: students[12].id, amount: 6000, classesCount: 12, status: 'COMPLETED', provider: 'tbank', externalId: 'tbank_010' },
    { userId: students[13].id, amount: 2800, classesCount: 4, status: 'COMPLETED', provider: 'tbank', externalId: 'tbank_011' },
    { userId: students[14].id, amount: 4800, classesCount: 8, status: 'COMPLETED', provider: 'telegram_stars', externalId: 'stars_004' },
    // Pending платежи
    { userId: students[4].id, amount: 2800, classesCount: 4, status: 'PENDING', provider: 'tbank', externalId: 'tbank_pending_001' },
    { userId: students[15].id, amount: 6000, classesCount: 12, status: 'PENDING', provider: 'tbank', externalId: 'tbank_pending_002' },
    // Failed платежи
    { userId: students[5].id, amount: 6000, classesCount: 12, status: 'FAILED', provider: 'tbank', externalId: 'tbank_failed_001' },
    { userId: students[16].id, amount: 2800, classesCount: 4, status: 'FAILED', provider: 'telegram_stars', externalId: 'stars_failed_001' },
    // Refunded платежи
    { userId: students[1].id, amount: 2800, classesCount: 4, status: 'REFUNDED', provider: 'tbank', externalId: 'tbank_refund_001' },
    { userId: students[17].id, amount: 4800, classesCount: 8, status: 'REFUNDED', provider: 'tbank', externalId: 'tbank_refund_002' },
  ];

  const createdPayments = [];
  for (const data of paymentsData) {
    const payment = await prisma.payment.create({ data });
    createdPayments.push(payment);
  }
  console.log('✓ Created 20 payments\n');

  // ============== АБОНЕМЕНТЫ (PASSES) ==============
  const passesData = [
    // Активные абонементы
    { userId: students[0].id, type: 'CLASSES_8', classesTotal: 8, classesUsed: 3, validDays: 90, validFrom: new Date('2026-01-15'), validUntil: new Date('2026-04-15'), status: 'ACTIVE' },
    { userId: students[2].id, type: 'CLASSES_12', classesTotal: 12, classesUsed: 5, validDays: 90, validFrom: new Date('2026-01-10'), validUntil: new Date('2026-04-10'), status: 'ACTIVE' },
    { userId: students[7].id, type: 'CLASSES_12', classesTotal: 12, classesUsed: 0, validDays: 90, validFrom: new Date('2026-02-01'), validUntil: new Date('2026-05-01'), status: 'ACTIVE' },
    { userId: students[12].id, type: 'CLASSES_12', classesTotal: 12, classesUsed: 2, validDays: 90, validFrom: new Date('2026-01-20'), validUntil: new Date('2026-04-20'), status: 'ACTIVE' },
    { userId: students[14].id, type: 'CLASSES_8', classesTotal: 8, classesUsed: 1, validDays: 90, validFrom: new Date('2026-02-05'), validUntil: new Date('2026-05-05'), status: 'ACTIVE' },
    { userId: students[3].id, type: 'CLASSES_4', classesTotal: 4, classesUsed: 1, validDays: 60, validFrom: new Date('2026-01-25'), validUntil: new Date('2026-03-25'), status: 'ACTIVE' },
    // Безлимитные абонементы
    { userId: students[8].id, type: 'UNLIMITED_30', classesTotal: 0, classesUsed: 0, validDays: 30, validFrom: new Date('2026-01-20'), validUntil: new Date('2026-02-19'), status: 'ACTIVE' },
    // Истёкшие абонементы
    { userId: students[1].id, type: 'CLASSES_8', classesTotal: 8, classesUsed: 6, validDays: 90, validFrom: new Date('2025-10-01'), validUntil: new Date('2025-12-30'), status: 'EXPIRED' },
    { userId: students[6].id, type: 'CLASSES_4', classesTotal: 4, classesUsed: 2, validDays: 60, validFrom: new Date('2025-11-01'), validUntil: new Date('2025-12-31'), status: 'EXPIRED' },
    // Исчерпанные абонементы
    { userId: students[9].id, type: 'CLASSES_4', classesTotal: 4, classesUsed: 4, validDays: 60, validFrom: new Date('2026-01-01'), validUntil: new Date('2026-03-01'), status: 'EXHAUSTED' },
    { userId: students[18].id, type: 'CLASSES_8', classesTotal: 8, classesUsed: 8, validDays: 90, validFrom: new Date('2025-12-01'), validUntil: new Date('2026-03-01'), status: 'EXHAUSTED' },
  ];

  for (const data of passesData) {
    await prisma.pass.create({ data });
  }
  console.log('✓ Created 11 passes\n');

  // ============== ТРАНЗАКЦИИ БАЛАНСА ==============
  const transactionsData = [
    // Мария - пополнения и списания
    { userId: students[0].id, amount: 4, type: 'PAYMENT_CREDIT', description: 'Покупка 4 занятий', paymentId: createdPayments[0].id },
    { userId: students[0].id, amount: 8, type: 'PAYMENT_CREDIT', description: 'Покупка 8 занятий', paymentId: createdPayments[1].id },
    { userId: students[0].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Хатха 10.02' },
    { userId: students[0].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Хатха 12.02' },
    { userId: students[0].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Хатха 14.02' },
    { userId: students[0].id, amount: -1, type: 'VOTE_DEDUCTION', description: 'Голос за пятницу 19:00' },
    // Анна - с возвратом
    { userId: students[1].id, amount: 12, type: 'PAYMENT_CREDIT', description: 'Покупка 12 занятий', paymentId: createdPayments[2].id },
    { userId: students[1].id, amount: 4, type: 'PAYMENT_CREDIT', description: 'Покупка 4 занятий', paymentId: createdPayments[19].id },
    { userId: students[1].id, amount: -4, type: 'PAYMENT_REFUND', description: 'Возврат платежа', paymentId: createdPayments[19].id },
    { userId: students[1].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Виньясу' },
    { userId: students[1].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Виньясу' },
    { userId: students[1].id, amount: 1, type: 'CLASS_CANCELLED', description: 'Возврат — занятие отменено' },
    // Ольга
    { userId: students[2].id, amount: 8, type: 'PAYMENT_CREDIT', description: 'Покупка 8 занятий (Telegram Stars)', paymentId: createdPayments[3].id },
    { userId: students[2].id, amount: 4, type: 'PAYMENT_CREDIT', description: 'Покупка 4 занятий', paymentId: createdPayments[4].id },
    { userId: students[2].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Хатха' },
    { userId: students[2].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Хатха' },
    { userId: students[2].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Виньясу' },
    { userId: students[2].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Виньясу' },
    { userId: students[2].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Виньясу' },
    // Екатерина
    { userId: students[3].id, amount: 4, type: 'PAYMENT_CREDIT', description: 'Покупка 4 занятий', paymentId: createdPayments[5].id },
    { userId: students[3].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Хатха' },
    // Наталья - без баланса
    { userId: students[4].id, amount: 12, type: 'PAYMENT_CREDIT', description: 'Покупка 12 занятий (Telegram Stars)', paymentId: createdPayments[6].id },
    { userId: students[4].id, amount: -12, type: 'BOOKING_DEDUCTION', description: 'Интенсив Новогодний детокс' },
    // Елена
    { userId: students[5].id, amount: 8, type: 'PAYMENT_CREDIT', description: 'Покупка 8 занятий', paymentId: createdPayments[7].id },
    { userId: students[5].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Виньясу' },
    { userId: students[5].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Виньясу' },
    // Татьяна
    { userId: students[6].id, amount: 4, type: 'PAYMENT_CREDIT', description: 'Покупка 4 занятий', paymentId: createdPayments[8].id },
    { userId: students[6].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Хатха' },
    // Светлана
    { userId: students[7].id, amount: 12, type: 'PAYMENT_CREDIT', description: 'Покупка 12 занятий', paymentId: createdPayments[9].id },
    { userId: students[7].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Хатха' },
    { userId: students[7].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Хатха' },
    // Юлия
    { userId: students[8].id, amount: 4, type: 'PAYMENT_CREDIT', description: 'Покупка 4 занятий (Telegram Stars)', paymentId: createdPayments[10].id },
    { userId: students[8].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Виньясу' },
    { userId: students[8].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Виньясу' },
    // Дарья
    { userId: students[9].id, amount: 8, type: 'PAYMENT_CREDIT', description: 'Покупка 8 занятий', paymentId: createdPayments[11].id },
    { userId: students[9].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на Хатха' },
    // Новые ученики
    { userId: students[10].id, amount: 4, type: 'PAYMENT_CREDIT', description: 'Покупка 4 занятий', paymentId: createdPayments[12].id },
    { userId: students[10].id, amount: -4, type: 'BOOKING_DEDUCTION', description: 'Интенсив Новогодний детокс' },
    { userId: students[11].id, amount: 8, type: 'PAYMENT_CREDIT', description: 'Покупка 8 занятий (Telegram Stars)', paymentId: createdPayments[13].id },
    { userId: students[11].id, amount: -4, type: 'BOOKING_DEDUCTION', description: 'Запись на занятия' },
    { userId: students[12].id, amount: 12, type: 'PAYMENT_CREDIT', description: 'Покупка 12 занятий', paymentId: createdPayments[14].id },
    { userId: students[12].id, amount: -2, type: 'BOOKING_DEDUCTION', description: 'Запись на занятия' },
    { userId: students[13].id, amount: 4, type: 'PAYMENT_CREDIT', description: 'Покупка 4 занятий', paymentId: createdPayments[15].id },
    { userId: students[13].id, amount: -3, type: 'BOOKING_DEDUCTION', description: 'Запись на занятия' },
    { userId: students[14].id, amount: 8, type: 'PAYMENT_CREDIT', description: 'Покупка 8 занятий (Telegram Stars)', paymentId: createdPayments[16].id },
    { userId: students[14].id, amount: -1, type: 'BOOKING_DEDUCTION', description: 'Запись на занятие' },
    // Ручная корректировка
    { userId: students[15].id, amount: 2, type: 'MANUAL_ADJUSTMENT', description: 'Бонус от тренера' },
    { userId: students[16].id, amount: -1, type: 'MANUAL_ADJUSTMENT', description: 'Корректировка баланса' },
    // Возврат за отмену
    { userId: students[17].id, amount: 8, type: 'PAYMENT_CREDIT', description: 'Покупка 8 занятий', paymentId: createdPayments[20].id },
    { userId: students[17].id, amount: -8, type: 'PAYMENT_REFUND', description: 'Возврат платежа', paymentId: createdPayments[20].id },
    { userId: students[17].id, amount: 3, type: 'MANUAL_ADJUSTMENT', description: 'Компенсация' },
    // Людмила
    { userId: students[18].id, amount: 8, type: 'PAYMENT_CREDIT', description: 'Покупка 8 занятий' },
    { userId: students[18].id, amount: -8, type: 'BOOKING_DEDUCTION', description: 'Запись на занятия' },
    // Галина
    { userId: students[19].id, amount: 4, type: 'PAYMENT_CREDIT', description: 'Покупка 4 занятий' },
    { userId: students[19].id, amount: -2, type: 'BOOKING_DEDUCTION', description: 'Запись на занятия' },
  ];

  for (const data of transactionsData) {
    await prisma.balanceTransaction.create({ data });
  }
  console.log('✓ Created 56 balance transactions\n');

  // ============== ЗАНЯТИЯ (CLASSES) ==============
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dayAfterTomorrow = new Date(now);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);

  // Получаем расписания
  const schedules = await prisma.schedule.findMany();
  const schedule1 = schedules.find((s: { groupId: string; dayOfWeek: number }) => s.groupId === group1.id && s.dayOfWeek === 2);
  const schedule2 = schedules.find((s: { groupId: string; dayOfWeek: number }) => s.groupId === group2.id && s.dayOfWeek === 1);
  const schedule3 = schedules.find((s: { groupId: string; dayOfWeek: number }) => s.groupId === group1.id && s.dayOfWeek === 4);

  const classesData = [
    // Прошедшие занятия
    { scheduleId: schedule1.id, trainerId: trainer.id, date: lastWeek, maxStudents: 15, price: 700, status: 'COMPLETED' },
    { scheduleId: schedule3.id, trainerId: trainer.id, date: yesterday, maxStudents: 15, price: 700, status: 'COMPLETED' },
    // Предстоящие занятия
    { scheduleId: schedule1.id, trainerId: trainer.id, date: tomorrow, maxStudents: 15, price: 700, status: 'SCHEDULED' },
    { scheduleId: schedule2.id, trainerId: trainer.id, date: tomorrow, maxStudents: 12, price: 800, status: 'CONFIRMED' },
    { scheduleId: schedule3.id, trainerId: trainer.id, date: dayAfterTomorrow, maxStudents: 15, price: 700, status: 'SCHEDULED' },
  ];

  const createdClasses = [];
  for (const data of classesData) {
    const cls = await prisma.class.create({ data });
    createdClasses.push(cls);
  }
  console.log('✓ Created 5 classes\n');

  // ============== БРОНИРОВАНИЯ (BOOKINGS) ==============
  const bookingsData = [
    // Прошедшие занятия - посещённые
    { userId: students[0].id, classId: createdClasses[0].id, status: 'ATTENDED' },
    { userId: students[1].id, classId: createdClasses[0].id, status: 'ATTENDED' },
    { userId: students[2].id, classId: createdClasses[0].id, status: 'ATTENDED' },
    { userId: students[0].id, classId: createdClasses[1].id, status: 'ATTENDED' },
    { userId: students[2].id, classId: createdClasses[1].id, status: 'ATTENDED' },
    // Прошедшие - неявка
    { userId: students[3].id, classId: createdClasses[0].id, status: 'NO_SHOW' },
    // Предстоящие
    { userId: students[0].id, classId: createdClasses[2].id, status: 'CONFIRMED' },
    { userId: students[1].id, classId: createdClasses[2].id, status: 'CONFIRMED' },
    { userId: students[2].id, classId: createdClasses[2].id, status: 'CONFIRMED' },
    { userId: students[3].id, classId: createdClasses[2].id, status: 'CONFIRMED' },
    { userId: students[4].id, classId: createdClasses[2].id, status: 'CONFIRMED' },
    { userId: students[5].id, classId: createdClasses[3].id, status: 'CONFIRMED' },
    { userId: students[6].id, classId: createdClasses[3].id, status: 'CONFIRMED' },
    { userId: students[7].id, classId: createdClasses[3].id, status: 'CONFIRMED' },
    // Отменённые
    { userId: students[8].id, classId: createdClasses[2].id, status: 'CANCELLED' },
  ];

  const createdBookings = [];
  for (const data of bookingsData) {
    const booking = await prisma.booking.create({ data });
    createdBookings.push(booking);
  }
  console.log('✓ Created 15 bookings\n');

  // ============== ПОСЕЩАНИЯ (ATTENDANCE) ==============
  const attendanceData = [
    { bookingId: createdBookings[0].id, status: 'ATTENDED', markedBy: trainer.id, notes: 'Отличная практика, хорошая растяжка' },
    { bookingId: createdBookings[1].id, status: 'ATTENDED', markedBy: trainer.id, notes: null },
    { bookingId: createdBookings[2].id, status: 'ATTENDED', markedBy: trainer.id, notes: 'Первый раз на занятии, справилась хорошо' },
    { bookingId: createdBookings[3].id, status: 'ATTENDED', markedBy: trainer.id, notes: null },
    { bookingId: createdBookings[4].id, status: 'ATTENDED', markedBy: trainer.id, notes: 'Отличное дыхание' },
    { bookingId: createdBookings[5].id, status: 'NO_SHOW', markedBy: trainer.id, notes: 'Не предупредила об отсутствии' },
  ];

  for (const data of attendanceData) {
    await prisma.attendance.create({ data });
  }
  console.log('✓ Created 6 attendance records\n');

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

  // ============== НАСТРОЙКИ УВЕДОМЛЕНИЙ ==============
  const notificationSettingsData = [
    { userId: trainer.id, telegramEnabled: true, emailEnabled: true, classReminder: true, lowBalanceEnabled: false },
    { userId: students[0].id, telegramEnabled: true, emailEnabled: false, classReminder: true, lowBalanceEnabled: true, lowBalanceThreshold: 2 },
    { userId: students[1].id, telegramEnabled: true, emailEnabled: false, classReminder: true, lowBalanceEnabled: true, lowBalanceThreshold: 3 },
    { userId: students[2].id, telegramEnabled: true, emailEnabled: true, classReminder: true, lowBalanceEnabled: true, lowBalanceThreshold: 2 },
    { userId: students[5].id, telegramEnabled: true, emailEnabled: false, classReminder: false, lowBalanceEnabled: true, lowBalanceThreshold: 1 },
  ];

  for (const data of notificationSettingsData) {
    await prisma.userNotificationSettings.create({ data });
  }
  console.log('✓ Created notification settings for 5 users');

  console.log('\n✅ Seeding completed!');
  console.log('\n📊 Summary:');
  console.log('   - 1 trainer');
  console.log('   - 20 students (10 with telegram, 10 without)');
  console.log('   - 3 groups (Regular/Fixed, Regular/Dynamic, Intensive)');
  console.log('   - 20 payments (COMPLETED, PENDING, FAILED, REFUNDED)');
  console.log('   - 11 passes (ACTIVE, EXPIRED, EXHAUSTED)');
  console.log('   - 56 balance transactions');
  console.log('   - 5 classes (past and upcoming)');
  console.log('   - 15 bookings');
  console.log('   - 6 attendance records');
  console.log('   - 2 active votings');
  console.log('   - 5 notification settings');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
