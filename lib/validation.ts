import { z } from 'zod';

// Common schemas
export const uuidSchema = z.string().uuid();

// User schemas
export const createUserSchema = z.object({
  telegramId: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  role: z.enum(['STUDENT', 'TRAINER', 'ADMIN']).optional(),
});

export const updateUserSchema = z.object({
  balance: z.number().int().min(0, 'Balance cannot be negative'),
});

// Payment schemas
export const createPaymentSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  amount: z.number().positive('Amount must be positive'),
  classesCount: z.number().int().positive('Classes count must be positive'),
  telegramId: z.string().optional(),
});

export const getPaymentsQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// Group schemas
export const scheduleItemSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6, 'Day of week must be 0-6'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  description: z.string().optional(),
});

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
  groupType: z.enum(['REGULAR', 'INTENSIVE']).optional().default('REGULAR'),
  pricingType: z.enum(['FIXED', 'DYNAMIC']).optional().default('FIXED'),
  fixedPrice: z.number().int().positive().optional().default(1),
  intensivePrice: z.number().int().positive().optional(),
  maxStudents: z.number().int().positive().optional().default(15),
  telegramChat: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  schedules: z.array(scheduleItemSchema).optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  groupType: z.enum(['REGULAR', 'INTENSIVE']).optional(),
  pricingType: z.enum(['FIXED', 'DYNAMIC']).optional(),
  fixedPrice: z.number().int().positive().optional(),
  maxStudents: z.number().int().positive().optional(),
  telegramChat: z.string().optional(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  schedules: z.array(scheduleItemSchema).optional(),
});

// Voting schemas
export const votingOptionSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  date: z.string().datetime().optional(),
  description: z.string().optional(),
});

export const createVotingSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['SCHEDULE', 'CONFIRM', 'SURVEY']).optional().default('SCHEDULE'),
  chargeOnVote: z.boolean().optional().default(false),
  multipleChoice: z.boolean().optional().default(true),
  minParticipants: z.number().int().positive().optional().default(1),
  deadline: z.string().datetime('Invalid datetime format'),
  weekStart: z.string().datetime().optional(),
  weekEnd: z.string().datetime().optional(),
  publishToTelegram: z.boolean().optional().default(false),
  options: z.array(votingOptionSchema).min(1, 'At least one option is required'),
});

export const voteSchema = z.object({
  optionIds: z.array(z.string().uuid('Invalid option ID')).min(1, 'Select at least one option'),
  userId: z.string().uuid('Invalid user ID'),
  telegramChatId: z.string().optional(),
});

export const finalizeVotingSchema = z.object({
  prices: z.array(z.object({
    optionId: z.string().uuid('Invalid option ID'),
    price: z.number().int().positive('Price must be positive'),
  })).min(1, 'At least one price required'),
});

export const refundSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  reason: z.string().optional(),
});

// Params schemas
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

// Type exports
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type CreateVotingInput = z.infer<typeof createVotingSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type FinalizeVotingInput = z.infer<typeof finalizeVotingSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
