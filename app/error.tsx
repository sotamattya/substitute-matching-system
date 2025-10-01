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
    <Container size="sm" my="xl">
      <Paper shadow="sm" p="xl" radius="md">
        <Title order={2} ta="center" mb="md" c="black">
          エラーが発生しました
        </Title>
        <Text ta="center" mb="xl" c="dimmed">
          申し訳ございません。予期しないエラーが発生しました。
        </Text>
        <div style={{ textAlign: 'center' }}>
          <Button onClick={reset} variant="outline">
            再試行
          </Button>
        </div>
      </Paper>
    </Container>
  )
}
