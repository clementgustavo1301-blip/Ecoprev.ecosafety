import { NextResponse } from 'next/server';
import { prisma, getMockDoctor } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { caseId, content } = await req.json();

    let doctor = await getCurrentUser();
    if (!doctor || doctor.role !== 'DOCTOR') {
      doctor = await getMockDoctor();
    }

    if (!doctor) {
      return NextResponse.json({ error: "No doctor available" }, { status: 500 });
    }

    await prisma.report.update({
      where: { caseId },
      data: {
        finalContent: content,
        signedAt: new Date(),
        signedByDoctorName: doctor.name || 'Dr. Carlos Silva',
        signedByDoctorCrm: doctor.crm || 'CRM/SP 123456'
      }
    });

    await prisma.case.update({
      where: { id: caseId },
      data: { status: 'COMPLETED' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sign error:', error);
    return NextResponse.json({ error: "Failed to sign report" }, { status: 500 });
  }
}
