import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// 個別シフトの取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const shift = await prisma.shift.findUnique({
      where: {
        id: params.id
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        substituteRequests: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true
              }
            },
            acceptedBy: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (!shift) {
      return NextResponse.json(
        { error: 'シフトが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({ shift })

  } catch (error) {
    console.error('Shift fetch error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// シフトの更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { title, description, startTime, endTime, subject, grade, location, status } = await request.json()

    // シフトの存在確認と権限チェック
    const existingShift = await prisma.shift.findUnique({
      where: {
        id: params.id
      }
    })

    if (!existingShift) {
      return NextResponse.json(
        { error: 'シフトが見つかりません' },
        { status: 404 }
      )
    }

    // 作成者または管理者のみ更新可能
    if (existingShift.teacherId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'このシフトを更新する権限がありません' },
        { status: 403 }
      )
    }

    // 日時の検証
    if (startTime && endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      
      if (start >= end) {
        return NextResponse.json(
          { error: '終了時間は開始時間より後である必要があります' },
          { status: 400 }
        )
      }
    }

    // シフトの更新
    const updatedShift = await prisma.shift.update({
      where: {
        id: params.id
      },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(subject && { subject }),
        ...(grade !== undefined && { grade }),
        ...(location !== undefined && { location }),
        ...(status && { status })
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(
      { 
        message: 'シフトが正常に更新されました',
        shift: updatedShift 
      }
    )

  } catch (error) {
    console.error('Shift update error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// シフトの削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // シフトの存在確認と権限チェック
    const existingShift = await prisma.shift.findUnique({
      where: {
        id: params.id
      }
    })

    if (!existingShift) {
      return NextResponse.json(
        { error: 'シフトが見つかりません' },
        { status: 404 }
      )
    }

    // 作成者または管理者のみ削除可能
    if (existingShift.teacherId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'このシフトを削除する権限がありません' },
        { status: 403 }
      )
    }

    // シフトの削除
    await prisma.shift.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json(
      { message: 'シフトが正常に削除されました' }
    )

  } catch (error) {
    console.error('Shift deletion error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}


