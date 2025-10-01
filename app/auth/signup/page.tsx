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
    <Container size={420} my={40}>
      <Title ta="center" mb="xl" style={{ color: '#000000' }}>
        アカウント作成
      </Title>
      
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="名前"
            placeholder="山田太郎"
            required
            {...form.getInputProps('name')}
            mb="md"
          />
          
          <TextInput
            label="メールアドレス"
            placeholder="your@email.com"
            required
            {...form.getInputProps('email')}
            mb="md"
          />
          
          <TextInput
            label="パスワード"
            placeholder="パスワード"
            type="password"
            required
            {...form.getInputProps('password')}
            mb="md"
          />
          
          <TextInput
            label="パスワード確認"
            placeholder="パスワード確認"
            type="password"
            required
            {...form.getInputProps('confirmPassword')}
            mb="xl"
          />
          
          <Button
            type="submit"
            fullWidth
            loading={loading}
            mb="md"
          >
            アカウント作成
          </Button>
          
          <Group justify="center">
            <Anchor
              component="button"
              type="button"
              size="sm"
              onClick={() => router.push('/auth/signin')}
            >
              既にアカウントをお持ちの方はこちら
            </Anchor>
          </Group>
        </form>
      </Paper>
    </Container>
  )
}


