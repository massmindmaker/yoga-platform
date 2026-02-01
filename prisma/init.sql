-- Create Enum Types
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TRAINER', 'ADMIN');
CREATE TYPE "ClassStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'ATTENDED', 'NO_SHOW');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "VotingType" AS ENUM ('CONDITIONAL', 'ONLINE');
CREATE TYPE "VotingStatus" AS ENUM ('ACTIVE', 'CLOSED', 'CANCELLED');

-- Create Users table
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "telegramId" TEXT UNIQUE,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create Groups table
CREATE TABLE "groups" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxStudents" INTEGER NOT NULL DEFAULT 15,
    "telegramChat" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Schedule table
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "groupId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "time" TEXT NOT NULL,
    FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE
);

-- Create GroupStudent table
CREATE TABLE "group_students" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("groupId", "userId"),
    FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create Class table
CREATE TABLE "classes" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "scheduleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "maxStudents" INTEGER NOT NULL DEFAULT 15,
    "price" INTEGER NOT NULL DEFAULT 700,
    "status" "ClassStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE CASCADE
);

-- Create Booking table
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE
);

-- Create Payment table
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "classesCount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create Voting table
CREATE TABLE "votings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "VotingType" NOT NULL,
    "minParticipants" INTEGER NOT NULL DEFAULT 10,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "VotingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE
);

-- Create VotingOption table
CREATE TABLE "voting_options" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "votingId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "time" TEXT NOT NULL,
    FOREIGN KEY ("votingId") REFERENCES "votings"("id") ON DELETE CASCADE
);

-- Create Vote table
CREATE TABLE "votes" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "votingId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("votingId", "userId"),
    FOREIGN KEY ("votingId") REFERENCES "votings"("id") ON DELETE CASCADE,
    FOREIGN KEY ("optionId") REFERENCES "voting_options"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "users_telegramId_idx" ON "users"("telegramId");
CREATE INDEX "schedules_groupId_idx" ON "schedules"("groupId");
CREATE INDEX "group_students_groupId_idx" ON "group_students"("groupId");
CREATE INDEX "group_students_userId_idx" ON "group_students"("userId");
CREATE INDEX "classes_scheduleId_idx" ON "classes"("scheduleId");
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");
CREATE INDEX "bookings_classId_idx" ON "bookings"("classId");
CREATE INDEX "payments_userId_idx" ON "payments"("userId");
CREATE INDEX "votings_groupId_idx" ON "votings"("groupId");
CREATE INDEX "votes_votingId_idx" ON "votes"("votingId");
