const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const caseId = 'cmtyog0t80000t4wavbmd8mxm';
  const existingReport = await prisma.report.findUnique({ where: { caseId } });
  if (!existingReport) {
    await prisma.report.create({
      data: {
        caseId,
        suggestedCIDs: 'S42.0 (Fratura da clavícula)',
        causalNexus: 'Há nexo causal claro entre a queda de moto (acidente de trajeto/trabalho) relatada na anamnese e a fratura da clavícula evidenciada.',
        finalContent: 'Relatório Médico Pericial\n\nPaciente relata queda de moto com trauma em ombro e clavícula.\nDiagnóstico: Fratura de clavícula.\nSugere-se afastamento pelo INSS conforme protocolo.'
      }
    });
    console.log('Report created!');
  } else {
    console.log('Report already exists!');
  }
}

main().finally(() => prisma.$disconnect());
