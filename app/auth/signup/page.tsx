'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, TextInput, Paper, Title, Container, Group, Anchor } from '@mantine/core'
import { showSuccessNotification, showErrorNotification } from '@/components/ui/NotificationManager'
import { useForm } from '@mantine/form'

interface SignupFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export default function SignUp() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm<SignupFormData>({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      name: (value) => (value.length < 2 ? '名前は2文字以上で入力してください' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : '有効なメールアドレスを入力してください'),
      password: (value) => (value.length < 6 ? 'パスワードは6文字以上で入力してください' : null),
      confirmPassword: (value, values) =>
        value !== values.password ? 'パスワードが一致しません' : null,
    },
  })

  const handleSubmit = async (values: SignupFormData) => {
    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        showSuccessNotification('成功', 'アカウントが作成されました。ログインしてください。')
        router.push('/auth/signin')
      } else {
        showErrorNotification('エラー', data.error || 'アカウント作成に失敗しました。')
      }
    } catch (error) {
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
            アカウント作成
          </h1>
          <p className="text-gray-600">代講マッチングシステムに参加</p>
        </div>
        
        <Paper withBorder shadow="lg" p={40} radius="lg" className="bg-white">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              label="名前"
              placeholder="山田太郎"
              required
              {...form.getInputProps('name')}
              mb="md"
              size="md"
            />
            
            <TextInput
              label="メールアドレス"
              placeholder="your@email.com"
              required
              {...form.getInputProps('email')}
              mb="md"
              size="md"
            />
            
            <TextInput
              label="パスワード"
              placeholder="パスワード"
              type="password"
              required
              {...form.getInputProps('password')}
              mb="md"
              size="md"
            />
            
            <TextInput
              label="パスワード確認"
              placeholder="パスワード確認"
              type="password"
              required
              {...form.getInputProps('confirmPassword')}
              mb="xl"
              size="md"
            />
            
            <Button
              type="submit"
              fullWidth
              loading={loading}
              mb="md"
              size="md"
              color="blue"
            >
              アカウント作成
            </Button>
            
            <Group justify="center">
              <Anchor
                component="button"
                type="button"
                size="sm"
                onClick={() => router.push('/auth/signin')}
                className="text-blue-600 hover:text-blue-800"
              >
                既にアカウントをお持ちの方はこちら
              </Anchor>
            </Group>
          </form>
        </Paper>
      </div>
    </div>
  )
}


