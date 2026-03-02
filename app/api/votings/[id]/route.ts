import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTelegramUser } from "@/lib/telegram";

// GET /api/votings/[id] - получить голосование
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTelegramUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const voting = await prisma.voting.findUnique({
      where: { id },
      include: {
        group: true,
        options: {
          include: {
            votes: {
              include: { user: true },
            },
            _count: { select: { votes: true } },
          },
        },
        _count: { select: { votes: true } },
      },
    });

    if (!voting) {
      return NextResponse.json(
        { success: false, error: "Голосование не найдено" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: voting });
  } catch (error) {
    console.error("[VOTING_GET]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка получения голосования" },
      { status: 500 }
    );
  }
}

// PATCH /api/votings/[id] - обновить голосование (только тренер)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getTelegramUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }
    if (user.role !== "TRAINER") {
      return NextResponse.json(
        { success: false, error: "Только тренер может редактировать голосование" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const { title, deadline, minParticipants } = body;

    const voting = await prisma.voting.findUnique({ where: { id } });
    if (!voting) {
      return NextResponse.json(
        { success: false, error: "Голосование не найдено" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (deadline !== undefined) updateData.deadline = new Date(deadline);
    if (minParticipants !== undefined) updateData.minParticipants = minParticipants;

    const updated = await prisma.voting.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[VOTING_PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Ошибка обновления голосования" },
      { status: 500 }
    );
  }
}
