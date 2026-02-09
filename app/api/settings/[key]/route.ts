import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/settings/[key] - get specific setting
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      return NextResponse.json(
        { success: false, error: 'Setting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: setting });
  } catch (error) {
    console.error('[SETTINGS_GET_ONE]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch setting' },
      { status: 500 }
    );
  }
}

// PATCH /api/settings/[key] - update setting
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const { value, description } = await req.json();

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value: JSON.stringify(value),
        ...(description && { description }),
      },
      create: {
        key,
        value: JSON.stringify(value),
        description: description || '',
      },
    });

    return NextResponse.json({ success: true, data: setting });
  } catch (error) {
    console.error('[SETTINGS_PATCH]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}
