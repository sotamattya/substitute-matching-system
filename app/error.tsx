'use client'

import { useEffect } from 'react'
import { Button, Container, Title, Text, Paper } from '@mantine/core'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Paper shadow="lg" p={40} radius="lg" className="bg-white text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <Title order={2} mb="md" className="text-gray-800">
            エラーが発生しました
          </Title>
          <Text mb="xl" className="text-gray-600">
            申し訳ございません。予期しないエラーが発生しました。
          </Text>
          <Button onClick={reset} variant="outline" color="blue" size="md">
            再試行
          </Button>
        </Paper>
      </div>
    </div>
  )
}
