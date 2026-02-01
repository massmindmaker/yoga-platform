import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/votings - получить все активные голосования
export async function GET() {
  try {
    const votings = await prisma.voting.findMany({
      where: { status: 'ACTIVE' },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
        _count: {
          select: { votes: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: votings });
  } catch (error) {
    console.error('Error fetching votings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch votings' },
      { status: 500 }
    );
  }
}

// POST /api/votings - создать новое голосование
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { groupId, title, type, minParticipants, deadline, options } = body;

    const voting = await prisma.voting.create({
      data: {
        groupId,
        title,
        type,
        minParticipants,
        deadline: new Date(deadline),
        options: {
          create: options.map((opt: any) => ({
            dayOfWeek: opt.dayOfWeek,
            time: opt.time,
          }))
        }
      },
      include: {
        options: true
      }
    });

    return NextResponse.json({ success: true, data: voting });
  } catch (error) {
    console.error('Error creating voting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create voting' },
      { status: 500 }
    );
  }
}
