"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, FileSignature, CheckCircle2, AlertCircle, FileSearch, Eye, ExternalLink, X, FileImage } from 'lucide-react';

interface DocumentItem {
  id: string;
  type: string;
  url?: string | null;
}

interface CaseData {
  id: string;
  patientName: string;
  anamnesis?: string | null;
  documents?: DocumentItem[];
  partner?: { name?: string | null };
}

interface ReportData {
  id?: string;
  finalContent?: string | null;
  suggestedCIDs?: string | null;
  causalNexus?: string | null;
}

interface DoctorUser {
  name?: string | null;
  crm?: string | null;
}

const getFileName = (url?: string | null) => {
  if (!url) return 'Documento Anexo';
  try {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1] || '';
    const subParts = lastPart.split('-');
    if (subParts.length >= 3) {
      return decodeURIComponent(subParts.slice(2).join('-'));
    }
    return decodeURIComponent(lastPart);
  } catch {
    return 'Documento Anexo';
  }
};

const isImageUrl = (url?: string | null) => {
  if (!url) return false;
  return /\.(jpg|jpeg|png|webp|gif|bmp)(\?.*)?$/i.test(url);
};

const isPdfUrl = (url?: string | null) => {
  if (!url) return false;
  return /\.pdf(\?.*)?$/i.test(url);
};

export default function ReviewClient({ 
  caseData, 
  reportData, 
  doctor 
}: { 
  caseData: CaseData; 
  reportData: ReportData; 
  doctor?: DoctorUser | null; 
}) {
  const router = useRouter();
  const [content, setContent] = useState(reportData.finalContent || '');
  const [loading, setLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  const handleSign = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/report/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: caseData.id, content })
      });
      if (res.ok) {
        router.push('/doctor/dashboard');
        router.refresh();
      } else {
        alert("Erro ao homologar laudo.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro de conexão ao homologar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
      
      {/* Left Column: Intake Data */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl overflow-hidden shadow-xl">
          <div className="px-5 py-4 border-b border-[#1e1e1e] bg-[#111]">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-[#10a37f]" />
              Dados do Atendimento
            </h2>
            <span className="text-xs text-[#737373]">Coletados pelo parceiro</span>
          </div>
          
          <div className="p-5 flex flex-col gap-5">
            {/* Anamnese */}
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold text-[#737373] mb-2 block">
                Relato Clínico (Anamnese)
              </label>
              <div className="bg-[#0a0a0a] border border-[#262626] p-4 rounded-lg text-sm text-white leading-relaxed whitespace-pre-wrap">
                {caseData.anamnesis || "Nenhuma observação registrada."}
              </div>
            </div>

            {/* Documentos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-[#737373]">
                  Documentos Anexados
                </label>
                {caseData.documents && caseData.documents.length > 0 && (
                  <span className="text-[11px] text-[#10a37f] bg-[#10a37f]/10 border border-[#10a37f]/20 px-2 py-0.5 rounded font-medium">
                    {caseData.documents.length} anexo(s)
                  </span>
                )}
              </div>
              <div className="border border-[#262626] rounded-lg overflow-hidden bg-[#0a0a0a]">
                {caseData.documents && caseData.documents.length > 0 ? (
                  <div className="divide-y divide-[#262626]">
                    {caseData.documents.map((doc: DocumentItem) => {
                      const fileName = getFileName(doc.url);
                      const isImg = isImageUrl(doc.url);
                      return (
                        <div key={doc.id} className="p-3.5 flex flex-col gap-2.5 bg-[#0a0a0a] hover:bg-[#121212] transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            {isImg && doc.url ? (
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="w-10 h-10 rounded-lg overflow-hidden border border-[#262626] bg-[#161616] shrink-0 group relative focus:outline-none"
                                title="Clique para ampliar"
                              >
                                <img src={doc.url} alt={fileName} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                              </button>
                            ) : (
                              <div className="w-10 h-10 rounded-lg border border-[#262626] bg-white/5 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5 text-[#10a37f]" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-white truncate" title={fileName}>
                                {fileName}
                              </p>
                              <span className="text-[11px] text-[#737373] uppercase tracking-wider">
                                {doc.type === 'OUTRO' ? (isImg ? 'Imagem / Atestado' : 'Documento Médico') : doc.type}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {doc.url ? (
                            <div className="flex items-center gap-2 pt-1 border-t border-[#1a1a1a]">
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs text-white px-2.5 py-1.5 rounded-md bg-[#1e1e1e] hover:bg-[#262626] border border-[#2e2e2e] transition-all font-medium"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#10a37f]" />
                                Visualizar
                              </button>
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs text-[#10a37f] hover:text-[#12b88e] px-2.5 py-1.5 rounded-md bg-[#10a37f]/10 hover:bg-[#10a37f]/20 border border-[#10a37f]/25 transition-all font-medium"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Abrir ↗
                              </a>
                            </div>
                          ) : (
                            <span className="text-xs text-[#737373] italic">Sem URL disponível</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-sm text-[#737373] text-center italic">
                    Nenhum anexo adicional.
                  </div>
                )}
              </div>
            </div>
            
            {/* IA Suggestion */}
            {reportData.suggestedCIDs && (
              <div className="mt-2 bg-[#10a37f]/5 border border-[#10a37f]/20 p-4 rounded-lg">
                <span className="text-xs uppercase tracking-wider font-bold text-[#10a37f] flex items-center gap-1.5 mb-3">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Pré-Análise IA (EcoPrev)
                </span>
                <div className="space-y-3 text-sm text-[#e5e5e5]">
                  <div>
                    <strong className="text-white block mb-0.5">CID-10 Sugerido:</strong> 
                    <span className="text-[#a3a3a3]">{reportData.suggestedCIDs}</span>
                  </div>
                  {reportData.causalNexus && (
                    <div>
                      <strong className="text-white block mb-0.5">Nexo Ocupacional:</strong> 
                      <span className="text-[#a3a3a3]">{reportData.causalNexus}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Editing and Signing */}
      <div className="lg:col-span-8 flex flex-col">
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl overflow-hidden shadow-xl flex-1 flex flex-col">
          
          <div className="px-5 py-4 border-b border-[#1e1e1e] bg-[#111] flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-[#10a37f]" />
                Texto do Parecer Pericial
              </h2>
              <span className="text-xs text-[#737373]">Edição e homologação final</span>
            </div>
            <span className="bg-[#eab308]/10 text-[#eab308] border border-[#eab308]/20 px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#eab308] rounded-full animate-pulse" />
              Em Edição
            </span>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            <textarea 
              className="w-full flex-1 bg-[#0a0a0a] border border-[#262626] rounded-lg p-5 text-sm text-[#e5e5e5] leading-relaxed placeholder-[#404040] focus:outline-none focus:border-[#10a37f]/40 focus:ring-1 focus:ring-[#10a37f]/20 transition-all font-mono resize-y min-h-[400px]"
              value={content}
              onChange={e => setContent(e.target.value)}
              spellCheck="false"
            />
            
            <div className="mt-5 p-4 bg-[#111] border border-[#1e1e1e] rounded-lg flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-[#10a37f] shrink-0 mt-0.5" />
              <div className="text-sm text-[#a3a3a3]">
                <strong className="text-white">Autenticação Digital:</strong> O parecer será emitido com assinatura e carimbo profissional eletrônico de <span className="text-[#10a37f]">{doctor?.name || 'Dr. Carlos Silva'}</span> ({doctor?.crm ? `CRM: ${doctor.crm}` : 'CRM Ativo'}). Ao homologar, o documento ganha validade legal imediata.
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-[#1e1e1e] bg-[#111] flex gap-3 justify-end items-center">
            <Link 
              href="/doctor/dashboard" 
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#a3a3a3] hover:text-white hover:bg-[#1a1a1a] transition-all"
            >
              Cancelar
            </Link>
            <button 
              type="button" 
              className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSign} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Homologando...
                </>
              ) : (
                <>
                  Homologar e Assinar Laudo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Document Preview Modal */}
      {previewDoc && previewDoc.url && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-fadeIn"
          onClick={() => setPreviewDoc(null)}
        >
          <div 
            className="bg-[#141414] border border-[#262626] rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-[#262626] flex items-center justify-between bg-[#111]">
              <div className="flex items-center gap-2 min-w-0">
                {isImageUrl(previewDoc.url) ? (
                  <FileImage className="w-4 h-4 text-[#10a37f] shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-[#10a37f] shrink-0" />
                )}
                <span className="text-sm font-medium text-white truncate max-w-md">
                  {getFileName(previewDoc.url)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#10a37f] hover:text-[#12b88e] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10a37f]/10 border border-[#10a37f]/20 hover:bg-[#10a37f]/20 transition-all font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir em nova aba
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-[#737373] hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  title="Fechar visualização"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-[#0a0a0a] min-h-[450px]">
              {isImageUrl(previewDoc.url) ? (
                <img
                  src={previewDoc.url}
                  alt={getFileName(previewDoc.url)}
                  className="max-w-full max-h-[75vh] object-contain rounded border border-[#1e1e1e] shadow-lg"
                />
              ) : isPdfUrl(previewDoc.url) ? (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-[75vh] border-0 rounded bg-white"
                  title="Visualizador de PDF"
                />
              ) : (
                <div className="text-center p-8 max-w-md">
                  <FileText className="w-16 h-16 text-[#737373] mx-auto mb-4" />
                  <p className="text-sm text-white font-medium mb-1">{getFileName(previewDoc.url)}</p>
                  <p className="text-xs text-[#737373] mb-4">Clique abaixo para abrir ou baixar o arquivo original completo.</p>
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-2 text-white text-xs font-medium px-5 py-2.5 rounded-lg"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir Documento
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
