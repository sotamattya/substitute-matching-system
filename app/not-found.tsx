import Link from 'next/link'
import { Button, Container, Title, Text, Paper } from '@mantine/core'

export default function NotFound() {
  return (
    <Container size="sm" my="xl">
      <Paper shadow="sm" p="xl" radius="md">
        <Title order={2} ta="center" mb="md" c="black">
          ページが見つかりません
        </Title>
        <Text ta="center" mb="xl" c="dimmed">
          お探しのページは存在しないか、移動された可能性があります。
        </Text>
        <div style={{ textAlign: 'center' }}>
          <Link href="/">
            <Button variant="outline">
              ホームに戻る
            </Button>
          </Link>
        </div>
      </Paper>
    </Container>
  )
}
