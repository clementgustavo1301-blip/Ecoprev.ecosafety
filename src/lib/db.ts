import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString ? new PrismaPg({ connectionString }) : null;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: adapter as any, // Using as any to satisfy types if connectionString is missing at build time
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Auto-keepalive heartbeat (1KB ping every 12 hours to prevent Supabase inactivity pause)
const globalKeepalive = global as unknown as { keepaliveTimer?: NodeJS.Timeout };
if (!globalKeepalive.keepaliveTimer) {
  globalKeepalive.keepaliveTimer = setInterval(async () => {
    try {
      await prisma.$queryRawUnsafe(`SELECT do_keepalive_ping();`);
      console.log(`[Keepalive] 1KB heartbeat executed successfully at ${new Date().toISOString()}`);
    } catch (e) {
      console.error('[Keepalive] Heartbeat execution error:', e);
    }
  }, 12 * 60 * 60 * 1000);
}

export async function getMockPartner() {
  let partner = await prisma.user.findFirst({ where: { role: 'PARTNER' } });
  if (!partner) {
    partner = await prisma.user.create({
      data: {
        email: 'partner@mock.com',
        name: 'Mock Partner',
        role: 'PARTNER'
      }
    });
  }
  return partner;
}

export async function getMockDoctor() {
  let doctor = await prisma.user.findFirst({ where: { role: 'DOCTOR' } });
  if (!doctor) {
    doctor = await prisma.user.create({
      data: {
        email: 'doctor@mock.com',
        name: 'Mock Doctor',
        role: 'DOCTOR',
        crm: 'CRM/SP 123456'
      }
    });
  }
  return doctor;
}
