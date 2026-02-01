const { Client } = require('@neondatabase/serverless');

const connectionString = 'postgresql://neondb_owner:npg_vjuqDml2Mp9i@ep-flat-fire-a1qb7tmi.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const client = new Client(connectionString);

async function seed() {
  await client.connect();
  console.log('Connected to database');

  // Очищаем существующие данные
  await client.query(`
    DELETE FROM votes;
    DELETE FROM voting_options;
    DELETE FROM votings;
    DELETE FROM payments;
    DELETE FROM bookings;
    DELETE FROM classes;
    DELETE FROM group_students;
    DELETE FROM schedules;
    DELETE FROM "groups";
    DELETE FROM users;
  `);

  // Создаем тренера
  const trainerRes = await client.query(`
    INSERT INTO users (id, "firstName", "lastName", role, balance, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'Алексей', 'Иванов', 'TRAINER'::"Role", 0, NOW(), NOW())
    RETURNING id
  `);
  const trainerId = trainerRes.rows[0].id;
  console.log('Created trainer:', trainerId);

  // Создаем студентов
  const student1Res = await client.query(`
    INSERT INTO users (id, "telegramId", "firstName", "lastName", role, balance, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), '123456789', 'Мария', 'Петрова', 'STUDENT'::"Role", 5, NOW(), NOW())
    RETURNING id
  `);
  const student1Id = student1Res.rows[0].id;
  console.log('Created student 1:', student1Id);

  const student2Res = await client.query(`
    INSERT INTO users (id, "telegramId", "firstName", "lastName", role, balance, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), '987654321', 'Анна', 'Сидорова', 'STUDENT'::"Role", 3, NOW(), NOW())
    RETURNING id
  `);
  const student2Id = student2Res.rows[0].id;
  console.log('Created student 2:', student2Id);

  // Создаем группу
  const groupRes = await client.query(`
    INSERT INTO "groups" (id, name, description, "maxStudents", "telegramChat", "createdAt")
    VALUES (gen_random_uuid(), 'Утренняя йога', 'Занятия по понедельникам и средам', 20, '@morning_yoga', NOW())
    RETURNING id
  `);
  const groupId = groupRes.rows[0].id;
  console.log('Created group:', groupId);

  // Добавляем студентов в группу
  await client.query(`
    INSERT INTO group_students (id, "groupId", "userId", "joinedAt")
    VALUES 
      (gen_random_uuid(), '${groupId}', '${student1Id}', NOW()),
      (gen_random_uuid(), '${groupId}', '${student2Id}', NOW())
  `);

  // Создаем расписание
  await client.query(`
    INSERT INTO schedules (id, "groupId", "dayOfWeek", time)
    VALUES 
      (gen_random_uuid(), '${groupId}', 1, '07:30'),
      (gen_random_uuid(), '${groupId}', 3, '07:30')
  `);
  console.log('Created schedules');

  // Создаем голосование
  const votingRes = await client.query(`
    INSERT INTO votings (id, "groupId", title, type, "minParticipants", deadline, status, "createdAt")
    VALUES (gen_random_uuid(), '${groupId}', 'Йога в пятницу', 'CONDITIONAL'::"VotingType", 10, '2026-02-06T18:00:00', 'ACTIVE'::"VotingStatus", NOW())
    RETURNING id
  `);
  const votingId = votingRes.rows[0].id;
  console.log('Created voting:', votingId);

  // Создаем опции голосования
  const opt1Res = await client.query(`
    INSERT INTO voting_options (id, "votingId", "dayOfWeek", time)
    VALUES (gen_random_uuid(), '${votingId}', 5, '07:30')
    RETURNING id
  `);
  const opt1Id = opt1Res.rows[0].id;

  const opt2Res = await client.query(`
    INSERT INTO voting_options (id, "votingId", "dayOfWeek", time)
    VALUES (gen_random_uuid(), '${votingId}', 5, '19:00')
    RETURNING id
  `);
  const opt2Id = opt2Res.rows[0].id;

  // Добавляем голоса
  await client.query(`
    INSERT INTO votes (id, "votingId", "optionId", "userId", "createdAt")
    VALUES 
      (gen_random_uuid(), '${votingId}', '${opt1Id}', '${student1Id}', NOW()),
      (gen_random_uuid(), '${votingId}', '${opt1Id}', '${student2Id}', NOW())
  `);
  console.log('Added votes');

  // Создаем платеж
  await client.query(`
    INSERT INTO payments (id, "userId", amount, "classesCount", status, provider, "createdAt")
    VALUES (gen_random_uuid(), '${student1Id}', 2800, 4, 'COMPLETED'::"PaymentStatus", 'tbank', NOW())
  `);
  console.log('Created payment');

  console.log('✅ Seeding completed!');
  await client.end();
}

seed().catch(console.error);
