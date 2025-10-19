// ビルド時にはPrismaを動的にインポート
export const getPrisma = async () => {
  if (!process.env.DATABASE_URL || process.env.NEXT_PHASE === 'phase-production-build') {
    return null
  }
  try {
    const { prisma } = await import('@/lib/db')
    return prisma
  } catch (error) {
    console.error('Failed to import Prisma:', error)
    return null
  }
}
