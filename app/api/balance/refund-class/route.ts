import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTelegramUser } from "@/lib/telegram";

// POST /api/balance/refund-class - тренер возвращает занятие на баланс
export async function POST(req: NextRequest) {
  try {
    const trainer = await getTelegramUser(req);
    if (!trainer || trainer.role !== "TRAINER") {
      return NextResponse.json(
        { success: false, error: "Доступ только для тренера" },
        { status: 403 }
      );
    }

    const { userId, amount, reason, voteId, votingId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const refundAmount = amount || 1;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: refundAmount } },
      });

      await tx.balanceTransaction.create({
        data: {
          userId,
          amount: refundAmount,
          type: 'MANUAL_ADJUSTMENT',
          description: reason || 'Возврат занятия тренером',
          voteId: voteId || null,
          votingId: votingId || null,
        },
      });

      // Mark vote as refunded if voteId provided
      if (voteId) {
        await tx.vote.update({
          where: { id: voteId },
          data: { refunded: true, refundedAt: new Date() },
        });
      }
    });

    // Get updated user balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, balance: true },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('[REFUND_CLASS]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refund class' },
      { status: 500 }
    );
  }
}
