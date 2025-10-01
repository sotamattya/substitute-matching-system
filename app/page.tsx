'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button, Group, Text } from '@mantine/core'
import CalendarView from '@/components/calendar/CalendarView'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    console.log('セッション状態:', { status, session })
    if (status === 'unauthenticated') {
      console.log('未認証、ログインページにリダイレクト')
      router.push('/auth/signin')
    }
  }, [status, router, session])

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </main>
    )
  }

  if (!session) {
    return null
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Group justify="space-between" mb="md">
          <h1 className="text-3xl font-bold" style={{ color: '#000000' }}>
            代講マッチングシステム
          </h1>
          <Group>
            <Text size="sm" style={{ color: '#000000' }}>
              こんにちは、{session.user?.name}さん
            </Text>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            >
              ログアウト
            </Button>
          </Group>
        </Group>
        <CalendarView />
      </div>
    </main>
  )
}
