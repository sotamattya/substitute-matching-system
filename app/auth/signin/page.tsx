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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            代講マッチングシステム
          </h1>
          <p className="text-gray-600">塾講師の代講調整を効率化</p>
        </div>
        
        <Paper withBorder shadow="lg" p={40} radius="lg" className="bg-white">
          <form onSubmit={handleSubmit}>
            <TextInput
              label="メールアドレス"
              placeholder="your@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              mb="md"
              size="md"
            />
            
            <TextInput
              label="パスワード"
              placeholder="パスワード"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              mb="md"
              size="md"
            />
            
            <Button
              type="submit"
              fullWidth
              loading={loading}
              mt="xl"
              size="md"
              color="blue"
            >
              ログイン
            </Button>
            
            <Group justify="center" mt="md">
              <Anchor
                component="button"
                type="button"
                size="sm"
                onClick={() => router.push('/auth/signup')}
                className="text-blue-600 hover:text-blue-800"
              >
                アカウントをお持ちでない方はこちら
              </Anchor>
            </Group>
          </form>
        </Paper>
      </div>
    </div>
  )
}
