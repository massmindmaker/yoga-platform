import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/votings/[id]/vote - проголосовать
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { optionId, userId } = await req.json();

    // Проверяем существует ли голосование
    const voting = await prisma.voting.findUnique({
      where: { id },
      include: { options: true }
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

    if (new Date() > voting.deadline) {
      return NextResponse.json(
        { success: false, error: 'Voting deadline has passed' },
        { status: 400 }
      );
    }

    // Проверяем что опция принадлежит этому голосованию
    const optionExists = voting.options.some(o => o.id === optionId);
    if (!optionExists) {
      return NextResponse.json(
        { success: false, error: 'Invalid option' },
        { status: 400 }
      );
    }

    // Создаем или обновляем голос
    const vote = await prisma.vote.upsert({
      where: {
        votingId_userId: {
          votingId: id,
          userId: userId
        }
      },
      update: {
        optionId: optionId
      },
      create: {
        votingId: id,
        optionId: optionId,
        userId: userId
      }
    });

    return NextResponse.json({ success: true, data: vote });
  } catch (error) {
    console.error('Error voting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to vote' },
      { status: 500 }
    );
  }
}
