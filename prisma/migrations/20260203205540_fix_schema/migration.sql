-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TRAINER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ClassStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'ATTENDED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BOOKING_DEDUCTION', 'BOOKING_REFUND', 'PAYMENT_CREDIT', 'MANUAL_ADJUSTMENT', 'INTENSIVE_DEDUCTION');

-- CreateEnum
CREATE TYPE "VotingType" AS ENUM ('CONDITIONAL', 'ONLINE');

-- CreateEnum
CREATE TYPE "VotingStatus" AS ENUM ('ACTIVE', 'CLOSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxStudents" INTEGER NOT NULL DEFAULT 15,
    "telegramChat" TEXT,
    "trainerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "time" TEXT NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_students" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "maxStudents" INTEGER NOT NULL DEFAULT 15,
    "price" INTEGER NOT NULL DEFAULT 700,
    "status" "ClassStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "classesCount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balance_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" TEXT,
    "bookingId" TEXT,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votings" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "VotingType" NOT NULL,
    "minParticipants" INTEGER NOT NULL DEFAULT 10,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "VotingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voting_options" (
    "id" TEXT NOT NULL,
    "votingId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "time" TEXT NOT NULL,

    CONSTRAINT "voting_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "votingId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegramId_key" ON "users"("telegramId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_telegramId_idx" ON "users"("telegramId");

-- CreateIndex
CREATE INDEX "groups_trainerId_idx" ON "groups"("trainerId");

-- CreateIndex
CREATE INDEX "schedules_groupId_idx" ON "schedules"("groupId");

-- CreateIndex
CREATE INDEX "group_students_userId_idx" ON "group_students"("userId");

-- CreateIndex
CREATE INDEX "group_students_groupId_idx" ON "group_students"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "group_students_groupId_userId_key" ON "group_students"("groupId", "userId");

-- CreateIndex
CREATE INDEX "classes_scheduleId_idx" ON "classes"("scheduleId");

-- CreateIndex
CREATE INDEX "classes_trainerId_idx" ON "classes"("trainerId");

-- CreateIndex
CREATE INDEX "classes_date_idx" ON "classes"("date");

-- CreateIndex
CREATE INDEX "classes_status_idx" ON "classes"("status");

-- CreateIndex
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bookings_classId_idx" ON "bookings"("classId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_externalId_idx" ON "payments"("externalId");

-- CreateIndex
CREATE INDEX "balance_transactions_userId_idx" ON "balance_transactions"("userId");

-- CreateIndex
CREATE INDEX "balance_transactions_type_idx" ON "balance_transactions"("type");

-- CreateIndex
CREATE INDEX "balance_transactions_createdAt_idx" ON "balance_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "balance_transactions_bookingId_idx" ON "balance_transactions"("bookingId");

-- CreateIndex
CREATE INDEX "balance_transactions_paymentId_idx" ON "balance_transactions"("paymentId");

-- CreateIndex
CREATE INDEX "votings_groupId_idx" ON "votings"("groupId");

-- CreateIndex
CREATE INDEX "votings_status_idx" ON "votings"("status");

-- CreateIndex
CREATE INDEX "voting_options_votingId_idx" ON "voting_options"("votingId");

-- CreateIndex
CREATE INDEX "votes_userId_idx" ON "votes"("userId");

-- CreateIndex
CREATE INDEX "votes_optionId_idx" ON "votes"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "votes_votingId_userId_key" ON "votes"("votingId", "userId");

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_students" ADD CONSTRAINT "group_students_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_students" ADD CONSTRAINT "group_students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votings" ADD CONSTRAINT "votings_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voting_options" ADD CONSTRAINT "voting_options_votingId_fkey" FOREIGN KEY ("votingId") REFERENCES "votings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_votingId_fkey" FOREIGN KEY ("votingId") REFERENCES "votings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "voting_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
