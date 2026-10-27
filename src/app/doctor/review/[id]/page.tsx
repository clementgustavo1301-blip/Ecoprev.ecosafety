import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import ReviewClient from '@/components/ReviewClient';
import Link from 'next/link';
import { ArrowLeft, Stethoscope } from 'lucide-react';

import { unstable_noStore as noStore } from 'next/cache';
export const dynamic = 'force-dynamic';

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  noStore();
  
  const user = await getCurrentUser();
  if (!user || user.role !== 'DOCTOR') {
    redirect('/login?role=DOCTOR');
  }

  const { id: caseId } = await params;
  
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      partner: true,
      documents: true,
      report: true
    }
  });

  if (!caseData || caseData.status !== 'PENDING_REVIEW' || !caseData.report) {
    notFound();
  }

  return (
    <div className="p-5 md:p-8 min-h-screen w-full bg-[#0a0a0a]">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-6">
          <Link 
            href="/doctor/dashboard" 
            className="inline-flex items-center gap-2 text-sm text-[#737373] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a fila pericial
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-[#141414] border border-[#1e1e1e] p-5 rounded-xl shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#10a37f]/10 flex items-center justify-center shrink-0">
              <Stethoscope className="w-6 h-6 text-[#10a37f]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white mb-1">
                Homologação: {caseData.patientName}
              </h1>
              <p className="text-sm text-[#737373] flex items-center gap-2">
                <span>{caseData.partner.name || 'Sem empresa'}</span>
                <span>•</span>
                <span className="font-mono text-xs">#{caseData.id.slice(-6).toUpperCase()}</span>
              </p>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs text-[#737373] mb-1">Perito Responsável</p>
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-[#10a37f]">{user.crm || 'CRM Ativo'}</p>
          </div>
        </div>
        
        <ReviewClient caseData={caseData} reportData={caseData.report} doctor={user} />
      </div>
    </div>
  );
}
