import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { patientName, anamnesis, documents } = await req.json();

    if (!patientName) {
      return NextResponse.json({ error: "Nome do paciente é obrigatório" }, { status: 400 });
    }

    const partner = await getCurrentUser();
    if (!partner || partner.role !== 'PARTNER') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const newCase = await prisma.case.create({
      data: {
        partnerId: partner.id,
        patientName,
        anamnesis,
        status: 'PENDING_DOCS'
      }
    });

    if (documents && Array.isArray(documents) && documents.length > 0) {
      await prisma.document.createMany({
        data: documents.map((url: string) => ({
          caseId: newCase.id,
          type: "OUTRO",
          url
        }))
      });
    }

    return NextResponse.json({ caseId: newCase.id, success: true });
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json({ error: "Failed to create case" }, { status: 500 });
  }
}
