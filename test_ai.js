require('dotenv').config({ path: '.env' });
const { generateMedicalReport } = require('./src/lib/ai');
const { PrismaClient } = require('@prisma/client');

async function test() {
  console.log('Testing generateMedicalReport with dummy data');
  const anamnesis = "Paciente relata dor de cabeça";
  const extractedTexts = ["Atestado de 2 dias por cefaleia"];
  
  try {
    const result = await generateMedicalReport(anamnesis, extractedTexts);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error generating report:', error);
  }
}

test();
