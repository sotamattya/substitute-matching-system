// ビルド時にはPrismaを動的にインポート
export const getPrisma = async () => {
  console.log('getPrisma called:', {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nextPhase: process.env.NEXT_PHASE,
    nodeEnv: process.env.NODE_ENV
  })
  
  if (!process.env.DATABASE_URL || process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('Skipping Prisma import - no DATABASE_URL or build phase')
    return null
  }
  
  try {
    const { prisma } = await import('@/lib/db/prisma')
    console.log('Prisma imported successfully')
    return prisma
  } catch (error) {
    console.error('Failed to import Prisma:', error)
    return null
  }
}
