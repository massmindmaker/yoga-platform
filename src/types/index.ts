// Prisma enums mapped to TypeScript types
export type UserRole = 'STUDENT' | 'TRAINER' | 'ADMIN';
export type PrismaRole = 'student' | 'trainer' | 'admin';

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface User {
  id: string;
  telegramId: string | null;
  firstName: string;
  lastName: string | null;
  username?: string;
  photoUrl?: string;
  role: UserRole;
  balance: number;
  phone: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student extends User {
  role: 'STUDENT';
  balance: number;
  subscription?: Subscription;
  bookings: Booking[];
}

export interface Trainer extends User {
  role: 'TRAINER';
  bio?: string;
  specialties: string[];
  classes: YogaClass[];
}

export type ClassType = 'hatha' | 'vinyasa' | 'ashtanga' | 'yin' | 'meditation' | 'intensive';
export type ClassLevel = 'beginner' | 'intermediate' | 'advanced' | 'all';
export type ClassStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface YogaClass {
  id: string;
  title: string;
  description?: string;
  type: ClassType;
  level: ClassLevel;
  trainerId: string;
  trainer: Trainer;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  maxStudents: number;
  enrolledStudents: number;
  status: ClassStatus;
  location?: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'ATTENDED' | 'NO_SHOW';

export interface Booking {
  id: string;
  studentId: string;
  student: Student;
  classId: string;
  yogaClass: YogaClass;
  status: BookingStatus;
  bookedAt: Date;
  cancelledAt?: Date;
  attendedAt?: Date;
  notes?: string;
}

export type SubscriptionType = 'single' | '4_classes' | '8_classes' | '12_classes' | 'unlimited';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAUSED';

export interface Subscription {
  id: string;
  studentId: string;
  type: SubscriptionType;
  totalClasses: number;
  usedClasses: number;
  remainingClasses: number;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tariff {
  id: string;
  name: string;
  type: SubscriptionType;
  classesCount: number;
  price: number;
  discountPercent: number;
  validityDays: number;
  description?: string;
  popular?: boolean;
}

export type IntensiveStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Intensive {
  id: string;
  title: string;
  description: string;
  trainerId: string;
  trainer: Trainer;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  maxParticipants: number;
  enrolledParticipants: number;
  price: number;
  status: IntensiveStatus;
  schedule: string[];
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentType = 'subscription' | 'intensive' | 'single_class';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentProvider = 'tbank' | 'telegram_stars' | 'stripe';

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  provider: PaymentProvider;
  externalId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainerStats {
  totalClasses: number;
  totalStudents: number;
  totalRevenue: number;
  averageAttendance: number;
  classesThisMonth: number;
  studentsThisMonth: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  groupType: GroupType;
  pricingType: PricingType;
  fixedPrice: number;
  trainerId?: string;
  students?: Student[];
  maxStudents: number;
  telegramChat?: string;
  startsAt?: Date;
  endsAt?: Date;
  createdAt: Date;
  schedules?: ScheduleInput[];
}

// Schedule item for group creation
export interface ScheduleInput {
  dayOfWeek: number;
  time: string;
  description?: string;
}

// Telegram types
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

// Group types
export type GroupType = 'REGULAR' | 'INTENSIVE';
export type PricingType = 'FIXED' | 'DYNAMIC';

// Voting types
export type VotingType = 'SCHEDULE' | 'CONFIRM' | 'SURVEY';
export type VotingStatus = 'ACTIVE' | 'FINALIZED' | 'CLOSED' | 'CANCELLED';

export interface VotingOption {
  id: string;
  votingId: string;
  dayOfWeek: number;
  time: string;
  date?: Date;
  description?: string;
  finalPrice?: number;
  paymentLink?: string;
  cancelled: boolean;
  _count?: { votes: number };
}

export interface VoteData {
  id: string;
  votingId: string;
  optionId: string;
  userId: string;
  balanceCharged: boolean;
  paidAmount?: number;
  paidAt?: Date;
  refunded: boolean;
  refundedAt?: Date;
  createdAt: Date;
  user?: {
    id: string;
    firstName: string;
    lastName?: string;
    balance: number;
  };
}

export interface Voting {
  id: string;
  groupId: string;
  title: string;
  type: VotingType;
  chargeOnVote: boolean;
  multipleChoice: boolean;
  minParticipants: number;
  deadline: Date;
  weekStart?: Date;
  weekEnd?: Date;
  status: VotingStatus;
  telegramPollId?: string;
  options: VotingOption[];
  votes?: VoteData[];
  _count?: { votes: number };
  group?: {
    id: string;
    name: string;
    pricingType: PricingType;
    fixedPrice: number;
  };
}

// API input types
export interface CreateGroupInput {
  name: string;
  description?: string;
  groupType?: GroupType;
  pricingType?: PricingType;
  fixedPrice?: number;
  maxStudents?: number;
  telegramChat?: string;
  startsAt?: string;
  endsAt?: string;
  schedules?: ScheduleInput[];
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
  groupType?: GroupType;
  pricingType?: PricingType;
  fixedPrice?: number;
  maxStudents?: number;
  telegramChat?: string;
  startsAt?: string;
  endsAt?: string;
  schedules?: ScheduleInput[];
}

export interface CreateVotingInput {
  groupId: string;
  title: string;
  type: VotingType;
  chargeOnVote?: boolean;
  multipleChoice?: boolean;
  minParticipants?: number;
  deadline: string;
  weekStart?: string;
  weekEnd?: string;
  publishToTelegram?: boolean;
  options: (ScheduleInput & { date?: string; description?: string })[];
}

export interface VoteInput {
  optionIds: string[];  // Множественный выбор
  userId: string;
}

export interface FinalizeVotingInput {
  prices: { optionId: string; price: number }[];
}

export interface RefundInput {
  userId: string;
  reason?: string;
}

export interface CreatePaymentInput {
  userId: string;
  amount: number;
  classesCount: number;
  telegramId?: string;
}

export interface CreateUserInput {
  telegramId?: string;
  firstName: string;
  lastName?: string;
  role?: UserRole;
  balance?: number;
}

// Prisma model types (for API responses)
export interface PrismaGroup {
  id: string;
  name: string;
  description: string | null;
  groupType: GroupType;
  pricingType: PricingType;
  fixedPrice: number;
  maxStudents: number;
  telegramChat: string | null;
  trainerId: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  schedules: PrismaSchedule[];
  students: PrismaGroupStudent[];
  _count?: {
    students: number;
  };
}

export interface PrismaSchedule {
  id: string;
  groupId: string;
  dayOfWeek: number;
  time: string;
  description: string | null;
}

export interface PrismaGroupStudent {
  id: string;
  groupId: string;
  userId: string;
  joinedAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string | null;
    balance: number;
  };
}

export interface PrismaVoting {
  id: string;
  groupId: string;
  title: string;
  type: VotingType;
  chargeOnVote: boolean;
  multipleChoice: boolean;
  minParticipants: number;
  deadline: Date;
  weekStart: Date | null;
  weekEnd: Date | null;
  status: VotingStatus;
  telegramPollId: string | null;
  createdAt: Date;
  options: PrismaVotingOption[];
  votes?: PrismaVote[];
  group?: { id: string; name: string; pricingType: PricingType; fixedPrice: number };
  _count?: {
    votes: number;
  };
}

export interface PrismaVotingOption {
  id: string;
  votingId: string;
  dayOfWeek: number;
  time: string;
  date: Date | null;
  description: string | null;
  finalPrice: number | null;
  paymentLink: string | null;
  cancelled: boolean;
  _count?: {
    votes: number;
  };
  votes?: PrismaVote[];
}

export interface PrismaVote {
  id: string;
  votingId: string;
  optionId: string;
  userId: string;
  balanceCharged: boolean;
  paidAmount: number | null;
  paidAt: Date | null;
  refunded: boolean;
  refundedAt: Date | null;
  createdAt: Date;
  user?: { id: string; firstName: string; lastName: string | null; balance: number };
}

export interface PrismaPayment {
  id: string;
  userId: string;
  amount: number;
  classesCount: number;
  status: PaymentStatus;
  provider: string;
  externalId: string | null;
  createdAt: Date;
}

// Helper type for converting Prisma Role to TypeScript UserRole
export function convertPrismaRole(role: string): UserRole {
  const roleMap: Record<string, UserRole> = {
    'STUDENT': 'STUDENT',
    'TRAINER': 'TRAINER',
    'ADMIN': 'ADMIN',
    'student': 'STUDENT',
    'trainer': 'TRAINER',
    'admin': 'ADMIN',
  };
  return roleMap[role] || 'STUDENT';
}

// Transaction types
export type TransactionType = 
  | 'BOOKING_DEDUCTION' 
  | 'BOOKING_REFUND' 
  | 'PAYMENT_CREDIT' 
  | 'MANUAL_ADJUSTMENT' 
  | 'INTENSIVE_DEDUCTION'
  | 'VOTE_DEDUCTION'
  | 'VOTE_REFUND'
  | 'CLASS_CANCELLED'
  | 'PAYMENT_REFUND';

export interface BalanceTransaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  description?: string;
  bookingId?: string;
  paymentId?: string;
  voteId?: string;
  votingId?: string;
  createdAt: Date;
}
