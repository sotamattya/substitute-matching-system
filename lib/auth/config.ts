import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { getPrisma } from '@/lib/db/client'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('Authorize called with:', { email: credentials?.email })
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        // 一時的にハードコードされた認証（デバッグ用）
        if (credentials.email === 'admin@example.com' && credentials.password === 'admin123') {
          console.log('Hardcoded auth successful for admin')
          return {
            id: '1',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin',
          }
        }

        if (credentials.email === 'user@example.com' && credentials.password === 'user123') {
          console.log('Hardcoded auth successful for user')
          return {
            id: '2',
            email: 'user@example.com',
            name: 'Test User',
            role: 'user',
          }
        }

        try {
          const prisma = await getPrisma()
          if (!prisma) {
            console.log('Prisma client not available')
            return null
          }

          console.log('Looking up user:', credentials.email)
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            console.log('User not found:', credentials.email)
            return null
          }

          console.log('User found, checking password')
          // パスワードの検証（実際の実装では適切なハッシュ化が必要）
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          if (!isPasswordValid) {
            console.log('Invalid password for user:', credentials.email)
            return null
          }

          console.log('Authentication successful for user:', credentials.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  debug: true,
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
}
