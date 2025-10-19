import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// 個別代講依頼の取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { id } = await params
    const substituteRequest = await prisma.substituteRequest.findUnique({
      where: {
        id
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
      }
    })

    if (!substituteRequest) {
      return NextResponse.json(
        { error: '代講依頼が見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({ substituteRequest })

  } catch (error) {
    console.error('Substitute request fetch error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 代講依頼の引き受け・拒否
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { action } = await request.json() // 'accept' または 'reject'

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: '無効なアクションです' },
        { status: 400 }
      )
    }

    // 代講依頼の存在確認
    const substituteRequest = await prisma.substituteRequest.findUnique({
      where: {
        id
      },
      include: {
        shift: true
      }
    })

    if (!substituteRequest) {
      return NextResponse.json(
        { error: '代講依頼が見つかりません' },
        { status: 404 }
      )
    }

    // シフトの作成者のみ引き受け・拒否可能
    if (substituteRequest.shift.teacherId !== session.user?.id) {
      return NextResponse.json(
        { error: 'この代講依頼を処理する権限がありません' },
        { status: 403 }
      )
    }

    // 既に処理済みの場合はエラー
    if (substituteRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'この代講依頼は既に処理済みです' },
        { status: 400 }
      )
    }

    // 引き受けの場合、他の代講依頼を拒否
    if (action === 'accept') {
      await prisma.$transaction(async (tx) => {
        // 他の代講依頼を拒否
        await tx.substituteRequest.updateMany({
          where: {
            shiftId: substituteRequest.shiftId,
            id: {
              not: id
            },
            status: 'PENDING'
          },
          data: {
            status: 'REJECTED'
          }
        })

        // この代講依頼を承認
        await tx.substituteRequest.update({
          where: {
            id
          },
          data: {
            status: 'ACCEPTED',
            acceptedById: session.user?.id
          }
        })

        // シフトの担当者を変更
        await tx.shift.update({
          where: {
            id: substituteRequest.shiftId
          },
          data: {
            teacherId: substituteRequest.createdById
          }
        })
      })
    } else {
      // 拒否の場合
      await prisma.substituteRequest.update({
        where: {
          id
        },
        data: {
          status: 'REJECTED',
          acceptedById: session.user?.id
        }
      })
    }

    // 更新された代講依頼を取得
    const updatedRequest = await prisma.substituteRequest.findUnique({
      where: {
        id
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
      }
    })

    return NextResponse.json(
      { 
        message: `代講依頼を${action === 'accept' ? '承認' : '拒否'}しました`,
        substituteRequest: updatedRequest 
      }
    )

  } catch (error) {
    console.error('Substitute request update error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 代講依頼の削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const { id } = await params
    // 代講依頼の存在確認と権限チェック
    const substituteRequest = await prisma.substituteRequest.findUnique({
      where: {
        id
      }
    })

    if (!substituteRequest) {
      return NextResponse.json(
        { error: '代講依頼が見つかりません' },
        { status: 404 }
      )
    }

    // 作成者のみ削除可能
    if (substituteRequest.createdById !== session.user?.id) {
      return NextResponse.json(
        { error: 'この代講依頼を削除する権限がありません' },
        { status: 403 }
      )
    }

    // 既に承認された場合は削除不可
    if (substituteRequest.status === 'ACCEPTED') {
      return NextResponse.json(
        { error: '承認済みの代講依頼は削除できません' },
        { status: 400 }
      )
    }

    // 代講依頼の削除
    await prisma.substituteRequest.delete({
      where: {
        id
      }
    })

    return NextResponse.json(
      { message: '代講依頼が正常に削除されました' }
    )

  } catch (error) {
    console.error('Substitute request deletion error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}


