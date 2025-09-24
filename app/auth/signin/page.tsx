'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button, TextInput, Paper, Title, Container } from '@mantine/core'
import { notifications } from '@mantine/notifications'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        notifications.show({
          title: 'エラー',
          message: 'ログインに失敗しました。',
          color: 'red',
        })
      } else {
        notifications.show({
          title: '成功',
          message: 'ログインしました。',
          color: 'green',
        })
        router.push('/')
      }
    } catch (error) {
      notifications.show({
        title: 'エラー',
        message: '予期しないエラーが発生しました。',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size={420} my={40}>
      <Title ta="center" mb="xl">
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
        </form>
      </Paper>
    </Container>
  )
}
