import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

// Create Prisma client lazily to avoid issues during build
let prismaInstance: PrismaClient | undefined;

export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    // Initialize Prisma client on first access
    if (!prismaInstance) {
      if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = new PrismaClient({
          log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
      }
      prismaInstance = globalForPrisma.prisma;
    }
    return (prismaInstance as any)[prop];
  },
});

export default prisma;
