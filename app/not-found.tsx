import Link from 'next/link'
import { Button, Container, Title, Text, Paper } from '@mantine/core'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Paper shadow="lg" p={40} radius="lg" className="bg-white text-center">
          <div className="text-6xl mb-4">🔍</div>
          <Title order={2} mb="md" className="text-gray-800">
            ページが見つかりません
          </Title>
          <Text mb="xl" className="text-gray-600">
            お探しのページは存在しないか、移動された可能性があります。
          </Text>
          <Link href="/">
            <Button variant="outline" color="blue" size="md">
              ホームに戻る
            </Button>
          </Link>
        </Paper>
      </div>
    </div>
  )
}
