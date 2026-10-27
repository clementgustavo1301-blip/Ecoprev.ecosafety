import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const cases = await prisma.case.findMany();
  console.log(cases);
}

main().finally(() => prisma.$disconnect());
