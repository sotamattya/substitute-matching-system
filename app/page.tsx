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
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">読み込み中...</p>
        </div>
      </main>
    )
  }

  if (!session) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <Group justify="space-between" mb="md">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                代講マッチングシステム
              </h1>
              <p className="text-gray-600">塾講師の代講調整を効率化</p>
            </div>
            <Group>
              <div className="text-right">
                <Text size="sm" className="text-gray-600">
                  こんにちは、
                </Text>
                <Text size="md" className="font-semibold text-gray-800">
                  {session.user?.name}さん
                </Text>
              </div>
              <Button
                variant="outline"
                size="sm"
                color="red"
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              >
                ログアウト
              </Button>
            </Group>
          </Group>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <CalendarView />
        </div>
      </div>
    </main>
  )
}
