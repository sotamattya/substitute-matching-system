'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button, TextInput, Paper, Title, Container, Group, Anchor } from '@mantine/core'
import { showSuccessNotification, showErrorNotification } from '@/components/ui/NotificationManager'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('ログイン試行:', { email, password })
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      console.log('ログイン結果:', result)

      if (result?.error) {
        console.log('ログインエラー:', result.error)
        showErrorNotification('エラー', `ログインに失敗しました: ${result.error}`)
      } else {
        console.log('ログイン成功、リダイレクト中...')
        showSuccessNotification('成功', 'ログインしました。')
        router.push('/')
      }
    } catch (error) {
      console.log('予期しないエラー:', error)
      showErrorNotification('エラー', '予期しないエラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size={420} my={40}>
      <Title ta="center" mb="xl" style={{ color: '#000000' }}>
        代講マッチングシステム
      </Title>
      
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <TextInput
            label="メールアドレス"
            placeholder="your@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            mb="md"
          />
          
          <TextInput
            label="パスワード"
            placeholder="パスワード"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            mb="md"
          />
          
          <Button
            type="submit"
            fullWidth
            loading={loading}
            mt="xl"
          >
            ログイン
          </Button>
          
          <Group justify="center" mt="md">
            <Anchor
              component="button"
              type="button"
              size="sm"
              onClick={() => router.push('/auth/signup')}
            >
              アカウントをお持ちでない方はこちら
            </Anchor>
          </Group>
        </form>
      </Paper>
    </Container>
  )
}
