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
      telegramId: 'trainer_telegram_id',
      firstName: 'Ирина',
      lastName: 'Петрова',
      role: 'TRAINER',
      balance: 0,
    }
  });
  console.log('✓ Created trainer:', trainer.firstName, trainer.lastName);

  // ============== 10 УЧЕНИКОВ С TELEGRAM ==============
  const studentNames = [
    { firstName: 'Анна', lastName: 'Иванова' },
    { firstName: 'Мария', lastName: 'Смирнова' },
    { firstName: 'Елена', lastName: 'Кузнецова' },
    { firstName: 'Ольга', lastName: 'Попова' },
    { firstName: 'Татьяна', lastName: 'Васильева' },
    { firstName: 'Наталья', lastName: 'Петрова' },
    { firstName: 'Светлана', lastName: 'Соколова' },
    { firstName: 'Ирина', lastName: 'Михайлова' },
    { firstName: 'Виктория', lastName: 'Новикова' },
    { firstName: 'Александра', lastName: 'Федорова' },
  ];

  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    const student = await prisma.user.create({
      data: {
        telegramId: `student_${i + 1}`,
        firstName: studentNames[i].firstName,
        lastName: studentNames[i].lastName,
        role: 'STUDENT',
        balance: Math.floor(Math.random() * 11), // Random 0-10
      }
    });
    students.push(student);
  }
  console.log('✓ Created 10 students with Telegram\n');

  // ============== ГРУППА 1: УТРЕННЯЯ ХАТХА-ЙОГА (REGULAR/FIXED) ==============
  const group1 = await prisma.group.create({
    data: {
      name: 'Утренняя хатха-йога',
      description: 'Регулярные утренние занятия хатха-йогой',
      groupType: 'REGULAR',
      pricingType: 'FIXED',
      fixedPrice: 1,
      maxStudents: 15,
      trainerId: trainer.id,
    }
  });
  console.log('✓ Created Group 1:', group1.name);

  // ============== ГРУППА 2: ВЕЧЕРНЯЯ ВИНЬЯСА (REGULAR/FIXED) ==============
  const group2 = await prisma.group.create({
    data: {
      name: 'Вечерняя виньяса',
      description: 'Динамичные вечерние занятия виньяса-йогой',
      groupType: 'REGULAR',
      pricingType: 'FIXED',
      fixedPrice: 1,
      maxStudents: 12,
      trainerId: trainer.id,
    }
  });
  console.log('✓ Created Group 2:', group2.name);

  // ============== ГРУППА 3: НОВОГОДНИЙ ДЕТОКС (INTENSIVE) ==============
  const group3 = await prisma.group.create({
    data: {
      name: 'Новогодний детокс',
      description: '3-дневный интенсив для очищения организма',
      groupType: 'INTENSIVE',
      pricingType: 'FIXED',
      fixedPrice: 1,
      intensivePrice: 3000,
      maxStudents: 20,
      trainerId: trainer.id,
      startsAt: new Date(2026, 1, 15), // Feb 15
      endsAt: new Date(2026, 1, 17),   // Feb 17
    }
  });
  console.log('✓ Created Group 3:', group3.name);

  // ============== РАСПИСАНИЯ ==============
  // Group 1: Monday (1), Wednesday (3), Friday (5) at 07:30
  const schedule1Mon = await prisma.schedule.create({
    data: {
      groupId: group1.id,
      dayOfWeek: 1,
      time: '07:30',
      description: 'Хатха-йога',
    }
  });

  const schedule1Wed = await prisma.schedule.create({
    data: {
      groupId: group1.id,
      dayOfWeek: 3,
      time: '07:30',
      description: 'Хатха-йога',
    }
  });

  const schedule1Fri = await prisma.schedule.create({
    data: {
      groupId: group1.id,
      dayOfWeek: 5,
      time: '07:30',
      description: 'Хатха-йога',
    }
  });

  // Group 2: Tuesday (2), Thursday (4) at 19:00
  const schedule2Tue = await prisma.schedule.create({
    data: {
      groupId: group2.id,
      dayOfWeek: 2,
      time: '19:00',
      description: 'Виньяса-флоу',
    }
  });

  const schedule2Thu = await prisma.schedule.create({
    data: {
      groupId: group2.id,
      dayOfWeek: 4,
      time: '19:00',
      description: 'Виньяса-флоу',
    }
  });

  console.log('✓ Created schedules for all groups\n');

  // ============== ГРУППА-СТУДЕНТЫ ==============
  // Group 1: first 5 students
  for (let i = 0; i < 5; i++) {
    await prisma.groupStudent.create({
      data: {
        groupId: group1.id,
        userId: students[i].id,
      }
    });
  }

  // Group 2: last 5 students (indices 5-9)
  for (let i = 5; i < 10; i++) {
    await prisma.groupStudent.create({
      data: {
        groupId: group2.id,
        userId: students[i].id,
      }
    });
  }

  console.log('✓ Added students to groups (5 in Group 1, 5 in Group 2)\n');

  // ============== ЗАНЯТИЯ (CLASSES) - 20+ занятий на 2 недели ==============
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Helper function to get date for specific day of week
  function getDateForDayOfWeek(dayOfWeek: number, weekOffset: number): Date {
    const date = new Date(today);
    const currentDay = date.getDay();
    const diff = dayOfWeek - currentDay + (weekOffset * 7);
    date.setDate(date.getDate() + diff);
    return date;
  }
  
  const classesData = [];
  
  // Group 1: Утренняя хатха-йога (Mon, Wed, Fri) - 2 weeks
  const group1Schedules = [schedule1Mon, schedule1Wed, schedule1Fri];
  for (let week = -1; week <= 2; week++) {
    for (const schedule of group1Schedules) {
      const classDate = getDateForDayOfWeek(schedule.dayOfWeek, week);
      const [hours, minutes] = schedule.time.split(':').map(Number);
      classDate.setHours(hours, minutes, 0, 0);
      
      let status = 'SCHEDULED';
      if (week < 0 || (week === 0 && schedule.dayOfWeek < today.getDay())) {
        status = 'COMPLETED';
      } else if (week === 0 && schedule.dayOfWeek === today.getDay()) {
        status = 'CONFIRMED';
      } else if (week === 0) {
        status = 'CONFIRMED';
      }
      
      classesData.push({
        scheduleId: schedule.id,
        trainerId: trainer.id,
        date: new Date(classDate),
        maxStudents: 15,
        price: 700,
        status
      });
    }
  }
  
  // Group 2: Вечерняя виньяса (Tue, Thu) - 2 weeks
  const group2Schedules = [schedule2Tue, schedule2Thu];
  for (let week = -1; week <= 2; week++) {
    for (const schedule of group2Schedules) {
      const classDate = getDateForDayOfWeek(schedule.dayOfWeek, week);
      const [hours, minutes] = schedule.time.split(':').map(Number);
      classDate.setHours(hours, minutes, 0, 0);
      
      let status = 'SCHEDULED';
      if (week < 0 || (week === 0 && schedule.dayOfWeek < today.getDay())) {
        status = 'COMPLETED';
      } else if (week === 0 && schedule.dayOfWeek === today.getDay()) {
        status = 'CONFIRMED';
      } else if (week === 0) {
        status = 'CONFIRMED';
      }
      
      classesData.push({
        scheduleId: schedule.id,
        trainerId: trainer.id,
        date: new Date(classDate),
        maxStudents: 12,
        price: 700,
        status
      });
    }
  }
  
  // Group 3: Новогодний детокс (Feb 15-17) - 3 classes
  const intensiveDates = [
    { day: 15, month: 1, desc: 'День 1: Очищение' },
    { day: 16, month: 1, desc: 'День 2: Дыхание' },
    { day: 17, month: 1, desc: 'День 3: Медитация' },
  ];
  
  for (const intensive of intensiveDates) {
    const classDate = new Date(2026, intensive.month, intensive.day, 10, 0, 0);
    classesData.push({
      scheduleId: schedule1Mon.id, // Using schedule1Mon as base for intensive
      trainerId: trainer.id,
      date: classDate,
      maxStudents: 20,
      price: 700,
      status: 'SCHEDULED'
    });
  }
  
  const createdClasses = [];
  for (const data of classesData) {
    const cls = await prisma.class.create({ data });
    createdClasses.push(cls);
  }
  console.log(`✓ Created ${classesData.length} classes\n`);
  
  // ============== БРОНИРОВАНИЯ (BOOKINGS) - 30+ бронирований ==============
  const bookingsData = [];
  
  // Get students per group
  const group1StudentIds = students.slice(0, 5).map(s => s.id);
  const group2StudentIds = students.slice(5, 10).map(s => s.id);
  const group3StudentIds = students.slice(0, 8).map(s => s.id); // First 8 for intensive
  
  // Separate classes by time period
  const pastClasses = createdClasses.filter(c => 
    c.date < today || c.status === 'COMPLETED'
  );
  const upcomingClasses = createdClasses.filter(c => 
    c.date >= today && c.status !== 'COMPLETED'
  );
  
  // Bookings for past classes (ATTENDED or NO_SHOW)
  for (const cls of pastClasses.slice(0, 8)) {
    const schedule = [...group1Schedules, ...group2Schedules].find(s => s.id === cls.scheduleId);
    let eligibleStudents = [];
    
    if (group1Schedules.some(s => s.id === cls.scheduleId)) {
      eligibleStudents = group1StudentIds;
    } else if (group2Schedules.some(s => s.id === cls.scheduleId)) {
      eligibleStudents = group2StudentIds;
    }
    
    // Create 3-5 bookings per past class
    const numBookings = 3 + Math.floor(Math.random() * 3);
    const shuffled = [...eligibleStudents].sort(() => 0.5 - Math.random());
    const selectedStudents = shuffled.slice(0, Math.min(numBookings, shuffled.length));
    
    for (const studentId of selectedStudents) {
      const status = Math.random() > 0.15 ? 'ATTENDED' : 'NO_SHOW';
      bookingsData.push({
        userId: studentId,
        classId: cls.id,
        status
      });
    }
  }
  
  // Bookings for upcoming classes (CONFIRMED)
  for (const cls of upcomingClasses.slice(0, 12)) {
    let eligibleStudents = [];
    
    if (group1Schedules.some(s => s.id === cls.scheduleId)) {
      eligibleStudents = group1StudentIds;
    } else if (group2Schedules.some(s => s.id === cls.scheduleId)) {
      eligibleStudents = group2StudentIds;
    } else {
      // Intensive classes
      eligibleStudents = group3StudentIds;
    }
    
    // Create 2-5 bookings per upcoming class
    const numBookings = 2 + Math.floor(Math.random() * 4);
    const shuffled = [...eligibleStudents].sort(() => 0.5 - Math.random());
    const selectedStudents = shuffled.slice(0, Math.min(numBookings, shuffled.length));
    
    for (const studentId of selectedStudents) {
      bookingsData.push({
        userId: studentId,
        classId: cls.id,
        status: 'CONFIRMED'
      });
    }
  }
  
  // Add some CANCELLED bookings
  const cancelledClasses = upcomingClasses.slice(3, 6);
  for (const cls of cancelledClasses) {
    let eligibleStudents = [];
    
    if (group1Schedules.some(s => s.id === cls.scheduleId)) {
      eligibleStudents = group1StudentIds;
    } else if (group2Schedules.some(s => s.id === cls.scheduleId)) {
      eligibleStudents = group2StudentIds;
    }
    
    if (eligibleStudents.length > 0) {
      bookingsData.push({
        userId: eligibleStudents[0],
        classId: cls.id,
        status: 'CANCELLED'
      });
    }
  }
  
  const createdBookings = [];
  for (const data of bookingsData) {
    const booking = await prisma.booking.create({ data });
    createdBookings.push(booking);
  }
  console.log(`✓ Created ${bookingsData.length} bookings\n`);
  
  // ============== ПОСЕЩАНИЯ (ATTENDANCE) ==============
  const attendedBookings = createdBookings.filter(b => b.status === 'ATTENDED' || b.status === 'CONFIRMED');
  for (const booking of attendedBookings) {
    // Randomly assign PRESENT (80%) or ABSENT (20%)
    const isPresent = Math.random() > 0.2;
    const notes = isPresent 
      ? ['Отличная работа!', 'Хороший прогресс', 'Отличная концентрация', 'Прекрасная гибкость'][Math.floor(Math.random() * 4)]
      : ['Не предупредил об отсутствии', 'Опоздал на 15 мин', 'Болел'][Math.floor(Math.random() * 3)];
    
    await prisma.attendance.create({
      data: {
        bookingId: booking.id,
        status: isPresent ? 'PRESENT' : 'ABSENT',
        markedBy: trainer.id,
        notes: isPresent ? notes : null
      }
    });
  }
  console.log(`✓ Created ${attendedBookings.length} attendance records\n`);

  // ============== PAYMENTS & BALANCE TRANSACTIONS ==============
  console.log('Creating payments and balance transactions...\n');
  
  const paymentAmounts = [
    { amount: 1000, classes: 4 },
    { amount: 2000, classes: 8 },
    { amount: 3000, classes: 12 },
    { amount: 6000, classes: 24 }
  ];
  
  const paymentStatuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'PENDING', 'FAILED'];
  const providers = ['tbank', 'telegram_stars'];
  
  for (const student of students) {
    // Each student has 2-4 payments
    const numPayments = 2 + Math.floor(Math.random() * 3);
    let totalBalance = 0;
    
    for (let i = 0; i < numPayments; i++) {
      const paymentConfig = paymentAmounts[Math.floor(Math.random() * paymentAmounts.length)];
      const status = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      
      const payment = await prisma.payment.create({
        data: {
          userId: student.id,
          amount: paymentConfig.amount,
          classesCount: paymentConfig.classes,
          status: status,
          provider: providers[Math.floor(Math.random() * providers.length)],
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
        }
      });
      
      // If payment is COMPLETED, create balance transaction and add to balance
      if (status === 'COMPLETED') {
        await prisma.balanceTransaction.create({
          data: {
            userId: student.id,
            amount: paymentConfig.classes,
            type: 'PAYMENT_CREDIT',
            description: `Покупка абонемента на ${paymentConfig.classes} занятий`,
            paymentId: payment.id
          }
        });
        totalBalance += paymentConfig.classes;
      }
    }
    
    // Create BOOKING_DEDUCTION transactions for confirmed bookings
    const studentBookings = createdBookings.filter(b => b.userId === student.id && (b.status === 'CONFIRMED' || b.status === 'ATTENDED'));
    const usedClasses = studentBookings.length;
    
    for (const booking of studentBookings) {
      await prisma.balanceTransaction.create({
        data: {
          userId: student.id,
          amount: -1,
          type: 'BOOKING_DEDUCTION',
          description: 'Списание за занятие',
          bookingId: booking.id
        }
      });
    }
    
    // Calculate final balance
    const finalBalance = totalBalance - usedClasses;
    
    // Update student balance
    await prisma.user.update({
      where: { id: student.id },
      data: { balance: finalBalance }
    });
  }
  
  // Create some refunds
  for (let i = 0; i < 3; i++) {
    const randomStudent = students[Math.floor(Math.random() * students.length)];
    await prisma.balanceTransaction.create({
      data: {
        userId: randomStudent.id,
        amount: 1,
        type: 'BOOKING_REFUND',
        description: 'Возврат за отмену записи'
      }
    });
    
    // Increment balance
    await prisma.user.update({
      where: { id: randomStudent.id },
      data: { balance: { increment: 1 } }
    });
  }
  
  console.log('✓ Created payments and balance transactions\n');

  // ============== VOTINGS (3-4 votings) ==============
  const now = new Date();
  
  // Active voting for Group 1 - SCHEDULE type
  const votingActive = await prisma.voting.create({
    data: {
      groupId: group1.id,
      title: 'Расписание на неделю 10-16 февраля',
      type: 'SCHEDULE',
      chargeOnVote: true,
      multipleChoice: true,
      minParticipants: 5,
      deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      status: 'ACTIVE',
      weekStart: new Date('2026-02-10'),
      weekEnd: new Date('2026-02-16'),
      options: {
        create: [
          { dayOfWeek: 1, time: '10:00', description: 'Понедельник 10:00 - Утренняя хатха' },
          { dayOfWeek: 2, time: '19:00', description: 'Вторник 19:00 - Вечерняя практика' },
          { dayOfWeek: 4, time: '10:00', description: 'Четверг 10:00 - Хатха для начинающих' },
          { dayOfWeek: 5, time: '19:00', description: 'Пятница 19:00 - Расслабляющая практика' },
        ]
      }
    },
    include: { options: true }
  });
  console.log('✓ Created active voting for Group 1');

  // Closed voting for Group 2 - CONFIRM type
  const votingClosed = await prisma.voting.create({
    data: {
      groupId: group2.id,
      title: 'Подтверждение занятий 3-9 февраля',
      type: 'CONFIRM',
      chargeOnVote: false,
      multipleChoice: false,
      minParticipants: 3,
      deadline: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      status: 'FINALIZED',
      weekStart: new Date('2026-02-03'),
      weekEnd: new Date('2026-02-09'),
      options: {
        create: [
          { dayOfWeek: 1, time: '19:00', description: 'Понедельник 19:00 - Виньяса' },
          { dayOfWeek: 3, time: '19:00', description: 'Среда 19:00 - Виньяса flow' },
          { dayOfWeek: 5, time: '19:00', description: 'Пятница 19:00 - Силовая виньяса' },
        ]
      }
    },
    include: { options: true }
  });
  console.log('✓ Created closed voting for Group 2');

  // Cancelled voting for Group 1
  const votingCancelled = await prisma.voting.create({
    data: {
      groupId: group1.id,
      title: 'Дополнительное занятие 20 февраля',
      type: 'CONFIRM',
      chargeOnVote: true,
      multipleChoice: false,
      minParticipants: 8,
      deadline: new Date('2026-02-19T12:00:00'),
      status: 'CANCELLED',
      options: {
        create: [
          { dayOfWeek: 5, time: '07:30', description: 'Пятница 07:30 - Утренняя практика' },
          { dayOfWeek: 5, time: '10:00', description: 'Пятница 10:00 - Дневная группа' },
        ]
      }
    },
    include: { options: true }
  });
  console.log('✓ Created cancelled voting for Group 1');

  // Voting for Group 3 (Intensive)
  const votingIntensive = await prisma.voting.create({
    data: {
      groupId: group3.id,
      title: 'Время проведения интенсива',
      type: 'SCHEDULE',
      chargeOnVote: false,
      multipleChoice: true,
      minParticipants: 5,
      deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      status: 'ACTIVE',
      options: {
        create: [
          { dayOfWeek: 6, time: '09:00', description: 'Суббота 09:00 - Раннее время' },
          { dayOfWeek: 6, time: '11:00', description: 'Суббота 11:00 - Позднее время' },
          { dayOfWeek: 0, time: '10:00', description: 'Воскресенье 10:00 - День 2' },
        ]
      }
    },
    include: { options: true }
  });
  console.log('✓ Created voting for Group 3 (Intensive)');
  console.log('✓ Created 4 votings total\n');

  // ============== VOTES (15+ votes) ==============
  // Votes for active voting (Group 1) - with balance charged
  await prisma.vote.create({ data: { votingId: votingActive.id, optionId: votingActive.options[0].id, userId: students[0].id, balanceCharged: true } });
  await prisma.vote.create({ data: { votingId: votingActive.id, optionId: votingActive.options[0].id, userId: students[1].id, balanceCharged: true } });
  await prisma.vote.create({ data: { votingId: votingActive.id, optionId: votingActive.options[1].id, userId: students[2].id, balanceCharged: true } });
  await prisma.vote.create({ data: { votingId: votingActive.id, optionId: votingActive.options[1].id, userId: students[3].id, balanceCharged: true } });
  await prisma.vote.create({ data: { votingId: votingActive.id, optionId: votingActive.options[2].id, userId: students[4].id, balanceCharged: true } });
  await prisma.vote.create({ data: { votingId: votingActive.id, optionId: votingActive.options[2].id, userId: students[5].id, balanceCharged: true } });
  await prisma.vote.create({ data: { votingId: votingActive.id, optionId: votingActive.options[3].id, userId: students[6].id, balanceCharged: true } });
  
  // Multiple choice votes for active voting
  await prisma.vote.create({ data: { votingId: votingActive.id, optionId: votingActive.options[0].id, userId: students[7].id, balanceCharged: true } });
  await prisma.vote.create({ data: { votingId: votingActive.id, optionId: votingActive.options[2].id, userId: students[7].id, balanceCharged: true } });
  await prisma.vote.create({ data: { votingId: votingActive.id, optionId: votingActive.options[1].id, userId: students[8].id, balanceCharged: true } });
  await prisma.vote.create({ data: { votingId: votingActive.id, optionId: votingActive.options[3].id, userId: students[8].id, balanceCharged: true } });
  
  // Votes for closed voting (Group 2) - no balance charged
  await prisma.vote.create({ data: { votingId: votingClosed.id, optionId: votingClosed.options[0].id, userId: students[5].id, balanceCharged: false } });
  await prisma.vote.create({ data: { votingId: votingClosed.id, optionId: votingClosed.options[0].id, userId: students[6].id, balanceCharged: false } });
  await prisma.vote.create({ data: { votingId: votingClosed.id, optionId: votingClosed.options[1].id, userId: students[7].id, balanceCharged: false } });
  await prisma.vote.create({ data: { votingId: votingClosed.id, optionId: votingClosed.options[1].id, userId: students[8].id, balanceCharged: false } });
  await prisma.vote.create({ data: { votingId: votingClosed.id, optionId: votingClosed.options[2].id, userId: students[9].id, balanceCharged: false } });
  
  // Votes for intensive voting
  await prisma.vote.create({ data: { votingId: votingIntensive.id, optionId: votingIntensive.options[0].id, userId: students[0].id, balanceCharged: false } });
  await prisma.vote.create({ data: { votingId: votingIntensive.id, optionId: votingIntensive.options[0].id, userId: students[1].id, balanceCharged: false } });
  await prisma.vote.create({ data: { votingId: votingIntensive.id, optionId: votingIntensive.options[1].id, userId: students[2].id, balanceCharged: false } });
  await prisma.vote.create({ data: { votingId: votingIntensive.id, optionId: votingIntensive.options[2].id, userId: students[3].id, balanceCharged: false } });
  await prisma.vote.create({ data: { votingId: votingIntensive.id, optionId: votingIntensive.options[2].id, userId: students[4].id, balanceCharged: false } });
  
  console.log('✓ Created 20 votes across all votings\n');

  // ============== ADDITIONAL ATTENDANCES with notes ==============
  // Update existing attendances with notes for some records
  const noShowBookings = createdBookings.filter(b => b.status === 'NO_SHOW');
  
  // Create additional attendance records with detailed notes
  const additionalAttendances = [
    { status: 'PRESENT', notes: 'Отличная практика, хорошая растяжка' },
    { status: 'PRESENT', notes: null },
    { status: 'PRESENT', notes: 'Первый раз на занятии, справилась хорошо' },
    { status: 'PRESENT', notes: 'Отличная работа!' },
    { status: 'ABSENT', notes: 'Не предупредила об отсутствии' },
    { status: 'PRESENT', notes: 'Опоздал на 10 мин' },
    { status: 'PRESENT', notes: 'Хороший прогресс в асанах' },
    { status: 'PRESENT', notes: 'Отличная концентрация' },
  ];

  // Add notes to some existing attended bookings
  const attendedWithNotes = attendedBookings.slice(0, 5);
  for (let i = 0; i < attendedWithNotes.length; i++) {
    const attendance = await prisma.attendance.findUnique({
      where: { bookingId: attendedWithNotes[i].id }
    });
    if (attendance && additionalAttendances[i]) {
      await prisma.attendance.update({
        where: { id: attendance.id },
        data: { notes: additionalAttendances[i].notes }
      });
    }
  }
  console.log('✓ Updated attendance records with notes\n');

  // ============== СВОДКА ==============
  console.log('\n✅ Seeding completed!');
  console.log('\n📊 Summary:');
  console.log('   - 1 trainer (Ирина Петрова)');
  console.log('   - 10 students with Telegram IDs');
  console.log('   - 3 groups:');
  console.log('     • Утренняя хатха-йога (REGULAR/FIXED, 15 max)');
  console.log('     • Вечерняя виньяса (REGULAR/FIXED, 12 max)');
  console.log('     • Новогодний детокс (INTENSIVE, Feb 15-17, 3000₽)');
  console.log('   - 5 schedules:');
  console.log('     • Group 1: Mon/Wed/Fri at 07:30');
  console.log('     • Group 2: Tue/Thu at 19:00');
  console.log('   - GroupStudents: 5 in Group 1, 5 in Group 2');
  console.log(`   - ${classesData.length} classes (past and upcoming)`);
  console.log(`   - ${bookingsData.length} bookings`);
  console.log(`   - ${attendedBookings.length} attendance records`);
  console.log('   - 4 votings (ACTIVE, FINALIZED, CANCELLED)');
  console.log('   - 20 votes');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
