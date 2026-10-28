import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Clock, CheckCircle2, Paperclip, Settings } from 'lucide-react';

import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

interface PendingCaseItem {
  id: string;
  patientName: string;
  updatedAt: Date;
  status: string;
  partner?: { name: string | null } | null;
  documents?: { id: string; url: string; type: string }[];
}

interface CompletedCaseItem {
  id: string;
  patientName: string;
  partner?: { name: string | null } | null;
  report?: { signedAt: Date | null } | null;
}

const getProgress = (status: string) => {
  if (status === 'PENDING_DOCS') return { pct: 25, label: 'Docs Pendentes', color: 'bg-[#737373]' };
  if (status === 'PROCESSING_AI') return { pct: 50, label: 'Triagem IA', color: 'bg-[#3b82f6]' };
  if (status === 'PENDING_REVIEW') return { pct: 75, label: 'Revisão Médica', color: 'bg-[#eab308]' };
  return { pct: 100, label: 'Homologado', color: 'bg-[#10a37f]' };
};

export default async function DoctorDashboard() {
  noStore();
  const user = await getCurrentUser();

  if (!user || user.role !== 'DOCTOR') {
    redirect('/login?role=DOCTOR');
  }

  const doctor = user;
  
  const rawPendingCases = await prisma.case.findMany({
    where: { status: { in: ['PENDING_REVIEW', 'PROCESSING_AI'] } },
    include: { partner: true, documents: true },
    orderBy: { updatedAt: 'asc' }
  });

  const pendingCases: PendingCaseItem[] = rawPendingCases;
  
  const casesReadyToReview = pendingCases.filter(c => c.status === 'PENDING_REVIEW').length;

  const rawCompletedCases = await prisma.case.findMany({
    where: { status: 'COMPLETED' },
    include: { partner: true, report: true },
    orderBy: { updatedAt: 'desc' },
    take: 5
  });

  const completedCases: CompletedCaseItem[] = rawCompletedCases;

  return (
    <div className="p-5 md:p-8 min-h-screen w-full">
      <div className="max-w-[1100px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Fila Pericial</h1>
            <p className="text-sm text-[#737373] mt-1">
              {doctor.name} • {doctor.crm ? `CRM ${doctor.crm}` : 'Médico Perito'} • {doctor.specialty || 'Medicina do Trabalho'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/doctor/settings"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#141414] hover:bg-[#1a1a1a] border border-[#262626] hover:border-[#404040] text-xs font-medium text-[#d4d4d4] hover:text-white rounded-lg transition-all"
            >
              <Settings className="w-3.5 h-3.5 text-[#10a37f]" />
              <span>Meu Perfil / CRM</span>
            </Link>
            {casesReadyToReview > 0 && (
              <div className="flex items-center gap-2 bg-[#10a37f]/10 border border-[#10a37f]/20 px-3 py-1.5 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10a37f] animate-pulse" />
                <span className="text-xs font-medium text-[#10a37f]">
                  {casesReadyToReview} caso(s) aguardando revisão
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5 card-hover">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#737373] uppercase tracking-wider">Aguardando Homologação</span>
              <div className="w-8 h-8 rounded-lg bg-[#eab308]/10 border border-[#eab308]/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#eab308]" />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#eab308]">
              {casesReadyToReview}
            </p>
            <span className="text-xs text-[#404040] mt-1 block">
              Minutas técnicas para revisão imediata
            </span>
          </div>

          <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5 card-hover">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#737373] uppercase tracking-wider">Laudos Homologados</span>
              <div className="w-8 h-8 rounded-lg bg-[#10a37f]/10 border border-[#10a37f]/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-[#10a37f]" />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#10a37f]">
              {completedCases.length}
            </p>
            <span className="text-xs text-[#404040] mt-1 block">
              Assinados e liberados
            </span>
          </div>
        </div>

        {/* Pending Queue */}
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl overflow-hidden mb-6 shadow-lg">
          <div className="px-5 py-4 border-b border-[#1e1e1e] bg-[#111] flex justify-between items-center">
            <h2 className="text-sm font-semibold text-white">Acompanhamento e Fila de Homologação</h2>
            <span className="text-xs text-[#404040]">Ordem cronológica</span>
          </div>

          {pendingCases.length === 0 ? (
            <div className="text-center py-16 text-[#404040]">
              <div className="w-14 h-14 rounded-full bg-[#10a37f]/10 border border-[#10a37f]/20 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-[#10a37f]" />
              </div>
              <p className="text-sm">Nenhum caso pendente no momento.</p>
              <p className="text-xs mt-1 text-[#333]">Novos casos aparecerão aqui automaticamente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#555] uppercase bg-[#111] border-b border-[#1e1e1e]">
                  <tr>
                    <th className="px-5 py-3 font-medium">Data</th>
                    <th className="px-5 py-3 font-medium">Paciente / Protocolo</th>
                    <th className="px-5 py-3 font-medium">Empresa</th>
                    <th className="px-5 py-3 font-medium">Status do Fluxo</th>
                    <th className="px-5 py-3 font-medium text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e1e]">
                  {pendingCases.map((c: PendingCaseItem) => {
                    const prog = getProgress(c.status);
                    return (
                      <tr key={c.id} className="hover:bg-[#1a1a1a] transition-colors">
                        <td className="px-5 py-3.5 text-[#737373] whitespace-nowrap">
                          {new Date(c.updatedAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-white">{c.patientName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[#555] font-mono text-xs">#{c.id.slice(-6).toUpperCase()}</span>
                            {c.documents && c.documents.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#10a37f] bg-[#10a37f]/10 px-1.5 py-0.5 rounded border border-[#10a37f]/20 font-medium">
                                <Paperclip className="w-3 h-3" />
                                {c.documents.length} anexo(s)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[#737373]">{c.partner?.name || '—'}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-1.5 w-32">
                            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-[#a3a3a3] tracking-wider">
                              <span className="flex items-center gap-1">
                                {c.status === 'PROCESSING_AI' && <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full animate-pulse" />}
                                {prog.label}
                              </span>
                              <span>{prog.pct}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-[#262626] rounded-full overflow-hidden">
                              <div className={`h-full ${prog.color} transition-all duration-1000 ease-out`} style={{ width: `${prog.pct}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {c.status === 'PENDING_REVIEW' ? (
                            <Link 
                              href={`/doctor/review/${c.id}`} 
                              className="btn-primary inline-flex items-center gap-1.5 text-white text-xs font-medium px-4 py-2 rounded-md shadow-lg shadow-[#10a37f]/20"
                            >
                              Revisar Laudo
                            </Link>
                          ) : (
                            <button disabled className="bg-[#262626] text-[#737373] inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-md cursor-not-allowed">
                              Aguardando IA
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Completed */}
        {completedCases.length > 0 && (
          <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl overflow-hidden shadow-lg">
            <div className="px-5 py-4 border-b border-[#1e1e1e] bg-[#111]">
              <h3 className="text-sm font-semibold text-white">Últimos Laudos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#555] uppercase bg-[#111] border-b border-[#1e1e1e]">
                  <tr>
                    <th className="px-5 py-3 font-medium">Data</th>
                    <th className="px-5 py-3 font-medium">Paciente / Protocolo</th>
                    <th className="px-5 py-3 font-medium">Empresa</th>
                    <th className="px-5 py-3 font-medium text-right">Laudo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e1e]">
                  {completedCases.map((c: CompletedCaseItem) => (
                    <tr key={c.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-5 py-3.5 text-[#737373]">
                        {c.report?.signedAt ? new Date(c.report.signedAt).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-white">{c.patientName}</p>
                        <p className="text-[#555] font-mono text-xs">#{c.id.slice(-6).toUpperCase()}</p>
                      </td>
                      <td className="px-5 py-3.5 text-[#737373]">{c.partner?.name}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Link 
                          href={`/api/report/download/${c.id}`} 
                          target="_blank" 
                          className="text-xs text-[#10a37f] hover:text-[#12b88e] font-medium transition-colors border border-[#10a37f]/30 px-3 py-1.5 rounded bg-[#10a37f]/5"
                        >
                          Visualizar PDF →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
