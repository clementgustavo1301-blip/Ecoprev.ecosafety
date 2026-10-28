import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FolderKanban, Clock, CheckCircle2, FileText, Plus, Settings } from 'lucide-react';

export const revalidate = 0;

interface CaseRecord {
  id: string;
  patientName: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export default async function PartnerDashboard() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'PARTNER') {
    redirect('/login?role=PARTNER');
  }

  const partner = user;
  
  const rawCases = await prisma.case.findMany({
    where: { partnerId: partner.id },
    orderBy: { createdAt: 'desc' }
  });

  const cases: CaseRecord[] = rawCases;

  const totalCases = cases.length;
  const inProgressCases = cases.filter((c: CaseRecord) => c.status !== 'COMPLETED').length;
  const completedCases = cases.filter((c: CaseRecord) => c.status === 'COMPLETED').length;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING_DOCS': 
        return <span title="Aguardando o envio de documentos complementares para iniciar a análise." className="bg-[#737373]/10 text-[#737373] px-2.5 py-0.5 rounded-md text-xs font-medium border border-[#737373]/15 cursor-help">Pendente</span>;
      case 'PROCESSING_AI': 
        return <span title="Nossa IA está extraindo os dados e gerando a minuta pericial preliminar." className="bg-[#3b82f6]/10 text-[#3b82f6] px-2.5 py-0.5 rounded-md text-xs font-medium border border-[#3b82f6]/15 cursor-help">Em Triagem</span>;
      case 'PENDING_REVIEW': 
        return <span title="A minuta está na fila do Médico Perito para avaliação e assinatura digital." className="bg-[#eab308]/10 text-[#eab308] px-2.5 py-0.5 rounded-md text-xs font-medium border border-[#eab308]/15 cursor-help">Revisão Médica</span>;
      case 'COMPLETED': 
        return <span title="O laudo foi assinado digitalmente pelo perito e está pronto para download." className="bg-[#10a37f]/10 text-[#10a37f] px-2.5 py-0.5 rounded-md text-xs font-medium border border-[#10a37f]/15 cursor-help">Homologado</span>;
      default: 
        return <span className="bg-[#737373]/10 text-[#737373] px-2.5 py-0.5 rounded-md text-xs font-medium border border-[#737373]/15">{status}</span>;
    }
  };

  const formatCnpj = (val?: string | null) => {
    if (!val) return '';
    const c = val.replace(/\D/g, '');
    if (c.length !== 14) return val;
    return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  return (
    <div className="p-5 md:p-8 min-h-screen w-full">
      <div className="max-w-[1100px] mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Painel do Parceiro</h1>
            <p className="text-sm text-[#737373] mt-1 flex flex-wrap items-center gap-2">
              <span className="text-white font-medium">{partner.tradeName || partner.name || 'Empresa Parceira'}</span>
              <span>•</span>
              {partner.cnpj && (
                <>
                  <span className="font-mono text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[#a3a3a3]">
                    CNPJ: {formatCnpj(partner.cnpj)}
                  </span>
                  <span>•</span>
                </>
              )}
              <span>{partner.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/partner/settings"
              className="inline-flex items-center gap-2 px-3 py-2 bg-[#141414] hover:bg-[#1a1a1a] border border-[#262626] hover:border-[#404040] text-xs font-medium text-[#d4d4d4] hover:text-white rounded-lg transition-all"
            >
              <Settings className="w-3.5 h-3.5 text-[#10a37f]" />
              <span>Dados da Empresa</span>
            </Link>
            <Link 
              href="/partner/new-case" 
              className="btn-primary inline-flex items-center justify-center text-white text-sm font-medium px-5 py-2.5 rounded-lg gap-2 shadow-lg shadow-[#10a37f]/20 hover:brightness-110 transition-all"
            >
              <Plus className="w-4 h-4" />
              Novo Atendimento
            </Link>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5 card-hover">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#737373] uppercase tracking-wider">Total</span>
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <FolderKanban className="w-4 h-4 text-white/70" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{totalCases}</p>
            <span className="text-xs text-[#404040] mt-1 block">Casos registrados</span>
          </div>

          <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5 card-hover">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#737373] uppercase tracking-wider">Em Processamento</span>
              <div className="w-8 h-8 rounded-lg bg-[#eab308]/10 border border-[#eab308]/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#eab308]" />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#eab308]">{inProgressCases}</p>
            <span className="text-xs text-[#404040] mt-1 block">Aguardando validação</span>
          </div>

          <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5 card-hover">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#737373] uppercase tracking-wider">Homologados</span>
              <div className="w-8 h-8 rounded-lg bg-[#10a37f]/10 border border-[#10a37f]/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-[#10a37f]" />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#10a37f]">{completedCases}</p>
            <span className="text-xs text-[#404040] mt-1 block">Disponíveis para download</span>
          </div>
        </div>

        {/* Cases Table */}
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1e1e1e] flex justify-between items-center">
            <h2 className="text-sm font-semibold text-white">Histórico de Atendimentos</h2>
            <span className="text-xs text-[#404040]">{cases.length} registro(s)</span>
          </div>

          {cases.length === 0 ? (
            <div className="text-center py-16 text-[#404040]">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-[#737373]">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm mb-3">Nenhum atendimento cadastrado.</p>
              <Link 
                href="/partner/new-case" 
                className="btn-primary inline-flex items-center text-white text-sm font-medium px-4 py-2 rounded-lg gap-2"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Primeiro Atendimento
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#555] uppercase bg-[#111] border-b border-[#1e1e1e]">
                  <tr>
                    <th className="px-5 py-3 font-medium">Data</th>
                    <th className="px-5 py-3 font-medium">Paciente</th>
                    <th className="px-5 py-3 font-medium">Protocolo</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Documento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1e1e]">
                  {cases.map((c: CaseRecord) => (
                    <tr key={c.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-5 py-3.5 text-[#737373] whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-white">{c.patientName}</td>
                      <td className="px-5 py-3.5 text-[#555] font-mono text-xs">
                        #{c.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-5 py-3.5">{getStatusBadge(c.status)}</td>
                      <td className="px-5 py-3.5 text-right">
                        {c.status === 'COMPLETED' ? (
                          <Link 
                            href={`/api/report/download/${c.id}`} 
                            target="_blank" 
                            className="text-xs text-[#10a37f] hover:text-[#12b88e] font-medium transition-colors"
                          >
                            Baixar Laudo →
                          </Link>
                        ) : (
                          <span className="text-[#333] text-xs">Em andamento</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
