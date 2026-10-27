"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, User, PlusCircle } from 'lucide-react';

export default function NewCase() {
  const router = useRouter();
  const [patientName, setPatientName] = useState('');
  const [anamnesis, setAnamnesis] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.authenticated || data.user.role !== 'PARTNER') {
          router.push('/login?role=PARTNER');
        } else {
          setVerifying(false);
        }
      })
      .catch(() => {
        router.push('/login?role=PARTNER');
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Upload files first
      let uploadedUrls: string[] = [];
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedUrls = uploadData.urls;
        } else {
          alert("Erro ao enviar arquivos.");
          setLoading(false);
          return;
        }
      }

      // 2. Create case
      const res = await fetch('/api/cases/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientName, anamnesis, documents: uploadedUrls }),
      });

      if (res.ok) {
        const { caseId } = await res.json();
        fetch('/api/ai/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caseId }),
        });
        
        router.push('/partner/dashboard');
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao registrar caso.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#10a37f]/30 border-t-[#10a37f] rounded-full animate-spin" />
          <span className="text-sm text-[#737373]">Carregando sessão...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 min-h-screen w-full bg-[#0a0a0a]">
      <div className="max-w-[720px] mx-auto">
        
        <div className="mb-6">
          <Link 
            href="/partner/dashboard" 
            className="inline-flex items-center gap-2 text-sm text-[#737373] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao painel
          </Link>
        </div>

        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl overflow-hidden shadow-2xl">
          <div className="px-6 py-5 border-b border-[#1e1e1e] bg-[#111]">
            <h1 className="text-lg font-semibold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#10a37f]" />
              Cadastro de Atendimento Ocupacional
            </h1>
            <p className="text-sm text-[#737373] mt-1">
              Preencha os dados do colaborador e anexe os documentos para abertura do protocolo pericial.
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* Paciente */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-white">
                  <User className="w-4 h-4 text-[#555]" />
                  Nome do Colaborador
                </label>
                <input 
                  type="text" 
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#404040] focus:outline-none focus:border-[#10a37f]/40 focus:ring-1 focus:ring-[#10a37f]/20 transition-all"
                  required 
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  placeholder="Ex: João Carlos da Silva"
                />
              </div>

              {/* Arquivos */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-white">
                  <Upload className="w-4 h-4 text-[#555]" />
                  Documentação (Laudos, Exames, Prontuários)
                </label>
                
                <div className="relative">
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    multiple 
                    accept=".pdf,image/*"
                    onChange={e => setFiles(Array.from(e.target.files || []))}
                  />
                  <div className="w-full border-2 border-dashed border-[#262626] hover:border-[#10a37f]/40 rounded-lg px-4 py-8 flex flex-col items-center justify-center bg-[#0a0a0a] transition-all group">
                    <Upload className="w-6 h-6 text-[#404040] group-hover:text-[#10a37f] mb-3 transition-colors" />
                    <span className="text-sm font-medium text-[#737373] group-hover:text-white transition-colors text-center">
                      {files.length > 0 
                        ? `${files.length} arquivo(s) selecionado(s)` 
                        : "Clique para selecionar ou arraste os arquivos aqui"}
                    </span>
                    <span className="text-xs text-[#404040] mt-1">PDF, JPG, PNG suportados</span>
                  </div>
                </div>
                
                {files.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {files.map((f, i) => (
                      <li key={i} className="text-xs text-[#737373] flex items-center gap-2 bg-[#1a1a1a] px-3 py-2 rounded-md border border-[#262626]">
                        <FileText className="w-3.5 h-3.5 text-[#10a37f]" />
                        {f.name} ({(f.size / 1024).toFixed(1)} KB)
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Anamnese */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-white">
                  <FileText className="w-4 h-4 text-[#555]" />
                  Relato Clínico e Ocupacional (Anamnese)
                </label>
                <textarea 
                  className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-4 py-3 text-sm text-white placeholder-[#404040] focus:outline-none focus:border-[#10a37f]/40 focus:ring-1 focus:ring-[#10a37f]/20 transition-all resize-y"
                  rows={5} 
                  required 
                  value={anamnesis}
                  onChange={e => setAnamnesis(e.target.value)}
                  placeholder="Descreva as queixas, sintomas relatados, histórico laboral e eventuais agentes aos quais o trabalhador esteve exposto..."
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3 justify-end mt-4 pt-6 border-t border-[#1e1e1e]">
                <Link 
                  href="/partner/dashboard" 
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#a3a3a3] hover:text-white hover:bg-[#1a1a1a] transition-all"
                >
                  Cancelar
                </Link>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando registro...
                    </>
                  ) : (
                    "Enviar Atendimento"
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
