import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { voteSchema, idParamSchema } from '@/lib/validation';
import { sendTelegramMessage } from '@/lib/bot-messages';

// POST /api/votings/[id]/vote - проголосовать (множественный выбор)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: votingId } = await params;

    const idValidation = idParamSchema.safeParse({ id: votingId });
    if (!idValidation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid voting ID' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validationResult = voteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { optionIds, userId, telegramChatId } = validationResult.data;

    // Get voting with group info
    const voting = await prisma.voting.findUnique({
      where: { id: votingId },
      include: {
        group: { select: { pricingType: true, fixedPrice: true } },
        options: { select: { id: true } },
      },
    });

    if (!voting) {
      return NextResponse.json(
        { success: false, error: 'Voting not found' },
        { status: 404 }
      );
    }

    if (voting.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Voting is not active' },
        { status: 400 }
      );
    }

    // Validate all optionIds belong to this voting
    const validOptionIds = voting.options.map((o) => o.id);
    const invalidIds = optionIds.filter((id) => !validOptionIds.includes(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid option IDs: ' + invalidIds.join(', ') },
        { status: 400 }
      );
    }

    // Голос всегда бесплатный — оплата происходит отдельно через кнопки в Telegram

    // Create votes in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdVotes = [];

      for (const optionId of optionIds) {
        // Upsert — skip if already voted for this option
        const existing = await tx.vote.findUnique({
          where: { optionId_userId: { optionId, userId } },
        });

        if (existing && !existing.refunded) {
          createdVotes.push(existing);
          continue;
        }

        // Create vote
        const vote = await tx.vote.upsert({
          where: { optionId_userId: { optionId, userId } },
          update: { refunded: false, refundedAt: null, balanceCharged: false },
          create: {
            votingId,
            optionId,
            userId,
            balanceCharged: false,
          },
        });

        createdVotes.push(vote);
      }

      return createdVotes;
    });

    // Отправляем подтверждение в Telegram, если указан telegramChatId
    if (telegramChatId && result.length > 0) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { balance: true },
        });

        await sendTelegramMessage(
          parseInt(telegramChatId),
          `✅ *Голос принят!*\n\n🗳️ ${voting.title}\n✅ Вы проголосовали за ${result.length} вариант(ов)\n💳 Баланс: ${user?.balance || 0} занятий`,
          {
            inline_keyboard: [
              [{
                text: "🗳️ Посмотреть результаты",
                web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}/voting` }
              }]
            ]
          }
        );
      } catch (telegramError) {
        console.error('Error sending Telegram confirmation:', telegramError);
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[VOTE_POST]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to vote' },
      { status: 500 }
    );
  }
}

// DELETE /api/votings/[id]/vote - отменить голос(а)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: votingId } = await params;
    const body = await req.json();
    const { userId, optionIds } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const voting = await prisma.voting.findUnique({
      where: { id: votingId },
      include: { group: { select: { fixedPrice: true } } },
    });

    if (!voting || voting.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Voting not found or not active' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { votingId, userId, refunded: false };
    if (optionIds && Array.isArray(optionIds)) {
      where.optionId = { in: optionIds };
    }

    const votesToRefund = await prisma.vote.findMany({ where });

    if (votesToRefund.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No votes to cancel' },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const vote of votesToRefund) {
        // Mark vote as refunded
        await tx.vote.update({
          where: { id: vote.id },
          data: { refunded: true, refundedAt: new Date() },
        });

        // Refund balance if was charged
        if (vote.balanceCharged) {
          const refundAmount = voting.group.fixedPrice || 1;

          await tx.user.update({
            where: { id: userId },
            data: { balance: { increment: refundAmount } },
          });

          await tx.balanceTransaction.create({
            data: {
              userId,
              amount: refundAmount,
              type: 'VOTE_REFUND',
              description: `Возврат за отмену голоса: ${voting.title}`,
              voteId: vote.id,
              votingId,
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true, data: { refunded: votesToRefund.length } });
  } catch (error) {
    console.error('[VOTE_DELETE]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel vote' },
      { status: 500 }
    );
  }
}
