export type UserRole = 'student' | 'trainer' | 'admin';

export interface User {
  id: string;
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  role: UserRole;
  phone?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student extends User {
  role: 'student';
  balance: number;
  subscription?: Subscription;
  bookings: Booking[];
}

export interface Trainer extends User {
  role: 'trainer';
  bio?: string;
  specialties: string[];
  classes: YogaClass[];
}

export type ClassType = 'hatha' | 'vinyasa' | 'ashtanga' | 'yin' | 'meditation' | 'intensive';
export type ClassLevel = 'beginner' | 'intermediate' | 'advanced' | 'all';
export type ClassStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

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

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';

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
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'paused';

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

export type IntensiveStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

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

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: 'subscription' | 'intensive' | 'single_class';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  provider: 'tbank' | 'telegram_stars' | 'stripe';
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
  trainerId: string;
  students: Student[];
  schedule: string;
  level: ClassLevel;
  maxStudents: number;
  createdAt: Date;
}
