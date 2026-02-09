import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendTelegramMessage } from '@/lib/telegram';

// POST /api/votings/[id]/remind - send reminder to users who haven't voted
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const votingId = params.id;

    // Get voting with group and participants
    const voting = await prisma.voting.findUnique({
      where: { id: votingId },
      include: {
        group: {
          include: {
            students: {
              include: {
                user: {
                  select: { id: true, telegramId: true, firstName: true }
                }
              }
            }
          }
        },
        votes: {
          select: { userId: true }
        }
      }
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

    // Find users who haven't voted
    const votedUserIds = new Set(voting.votes.map(v => v.userId));
    const nonVoters = voting.group.students.filter(
      s => !votedUserIds.has(s.userId) && s.user.telegramId
    );

    // Send reminders
    const remindersSent = [];
    for (const student of nonVoters) {
      try {
        await sendTelegramMessage(student.user.telegramId!, {
          text: `⏰ Напоминание о голосовании!\n\n"${voting.title}"\n\nДедлайн: ${new Date(voting.deadline).toLocaleString('ru-RU')}\n\nПроголосуйте, чтобы мы могли спланировать занятия.`,
        });
        remindersSent.push(student.userId);
      } catch (err) {
        console.error(`Failed to send reminder to ${student.userId}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        remindersSent: remindersSent.length,
        totalNonVoters: nonVoters.length,
      }
    });
  } catch (error) {
    console.error('[VOTINGS_REMIND]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send reminders' },
      { status: 500 }
    );
  }
}
