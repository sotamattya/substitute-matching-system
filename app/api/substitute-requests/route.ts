import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// 代講依頼一覧の取得
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
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    const substituteRequests = await prisma.substituteRequest.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(priority && { priority: priority as any })
      },
      include: {
        shift: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        acceptedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ substituteRequests })

  } catch (error) {
    console.error('Substitute requests fetch error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 代講依頼の作成
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { shiftId, reason, priority = 'NORMAL' } = await request.json()

    // 入力値の検証
    if (!shiftId || !reason) {
      return NextResponse.json(
        { error: '必須フィールドが不足しています' },
        { status: 400 }
      )
    }

    // シフトの存在確認
    const shift = await prisma.shift.findUnique({
      where: {
        id: shiftId
      },
      include: {
        teacher: true
      }
    })

    if (!shift) {
      return NextResponse.json(
        { error: 'シフトが見つかりません' },
        { status: 404 }
      )
    }

    // 自分のシフトには代講依頼を作成できない
    if (shift.teacherId === session.user?.id) {
      return NextResponse.json(
        { error: '自分のシフトには代講依頼を作成できません' },
        { status: 400 }
      )
    }

    // 既に代講依頼が存在するかチェック
    const existingRequest = await prisma.substituteRequest.findFirst({
      where: {
        shiftId: shiftId,
        createdById: session.user?.id,
        status: {
          in: ['PENDING', 'ACCEPTED']
        }
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'このシフトには既に代講依頼が存在します' },
        { status: 400 }
      )
    }

    // 代講依頼の作成
    const substituteRequest = await prisma.substituteRequest.create({
      data: {
        shiftId,
        reason,
        priority: priority as any,
        createdById: session.user?.id,
        status: 'PENDING'
      },
      include: {
        shift: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        createdBy: {
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
        message: '代講依頼が正常に作成されました',
        substituteRequest 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Substitute request creation error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}


