import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export const GET = async (req: Request) => {
  try {
    return await handler(req)
  } catch (error) {
    console.error('NextAuth GET error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export const POST = async (req: Request) => {
  try {
    return await handler(req)
  } catch (error) {
    console.error('NextAuth POST error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
