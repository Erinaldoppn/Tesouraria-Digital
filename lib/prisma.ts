import { PrismaClient } from '@prisma/client';

/**
 * Singleton do Prisma Client. 
 * Garante que não criaremos múltiplas conexões com o banco durante o Hot Reloading no Vercel.
 */

// Fix: Use globalThis to safely reference the global scope across Node.js and browser environments
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;