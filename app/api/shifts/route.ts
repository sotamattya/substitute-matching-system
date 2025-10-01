import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// シフト一覧の取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    const shifts = await prisma.shift.findMany({
      where: {
        ...(startDate && endDate && {
          startTime: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
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
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return NextResponse.json({ shifts })

  } catch (error) {
    console.error('Shifts fetch error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// シフトの作成
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { title, description, startTime, endTime, subject, grade, location } = await request.json()

    // 入力値の検証
    if (!title || !startTime || !endTime || !subject) {
      return NextResponse.json(
        { error: '必須フィールドが不足しています' },
        { status: 400 }
      )
    }

    // 日時の検証
    const start = new Date(startTime)
    const end = new Date(endTime)
    
    if (start >= end) {
      return NextResponse.json(
        { error: '終了時間は開始時間より後である必要があります' },
        { status: 400 }
      )
    }

    // シフトの作成
    const shift = await prisma.shift.create({
      data: {
        title,
        description: description || null,
        startTime: start,
        endTime: end,
        subject,
        grade: grade || null,
        location: location || null,
        teacherId: session.user.id,
        status: 'SCHEDULED'
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
        message: 'シフトが正常に作成されました',
        shift 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Shift creation error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}


