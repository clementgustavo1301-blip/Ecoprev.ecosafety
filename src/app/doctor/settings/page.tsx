"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Stethoscope, 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  ShieldCheck, 
  User, 
  Award, 
  Phone, 
  Mail, 
  FileCheck2 
} from "lucide-react";

export default function DoctorSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [name, setName] = useState("");
  const [crm, setCrm] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (data.user) {
          setName(data.user.name || "");
          setCrm(data.user.crm || "");
          setSpecialty(data.user.specialty || "Medicina do Trabalho");
          setPhone(data.user.phone || "");
          setEmail(data.user.email || "");
        }
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, crm, specialty, phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao salvar alterações");
      }

      setSuccessMsg(data.message || "Dados atualizados com sucesso!");
      if (data.user) {
        setName(data.user.name);
        setCrm(data.user.crm);
        setSpecialty(data.user.specialty);
      }
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao atualizar dados");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-7 h-7 border-2 border-[#10a37f]/30 border-t-[#10a37f] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 min-h-screen w-full bg-[#0a0a0a]">
      <div className="max-w-[850px] mx-auto">
        
        {/* Navigation Back */}
        <div className="mb-6">
          <Link 
            href="/doctor/dashboard" 
            className="inline-flex items-center gap-2 text-sm text-[#737373] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o painel pericial
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Stethoscope className="w-6 h-6 text-[#10a37f]" />
              Configurações do Médico Perito
            </h1>
            <p className="text-sm text-[#737373] mt-1">
              Atualize seu nome profissional e CRM utilizados na emissão e assinatura digital de laudos.
            </p>
          </div>
        </div>

        {/* Feedback Messages */}
        {successMsg && (
          <div className="bg-[#10a37f]/10 border border-[#10a37f]/20 text-[#10a37f] px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] px-4 py-3 rounded-xl mb-6 text-sm">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSave} className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-6 shadow-xl flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider text-[#a3a3a3] pb-3 border-b border-[#1e1e1e]">
                Identificação Profissional
              </h2>

              {/* Nome do Médico */}
              <div>
                <label className="block text-xs font-medium text-[#a3a3a3] mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#10a37f]" />
                  Nome Completo com Título
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Dr. Carlos Eduardo Silva"
                  className="w-full bg-[#0d0d0d] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#404040] focus:outline-none focus:border-[#10a37f]/50 focus:ring-1 focus:ring-[#10a37f]/20 transition-all"
                />
                <span className="text-[11px] text-[#555] mt-1 block">
                  Exibido com destaque no cabeçalho e na assinatura dos laudos periciais.
                </span>
              </div>

              {/* CRM com UF */}
              <div>
                <label className="block text-xs font-medium text-[#a3a3a3] mb-1.5 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#10a37f]" />
                  Registro CRM (com UF)
                </label>
                <input
                  type="text"
                  required
                  value={crm}
                  onChange={(e) => setCrm(e.target.value.toUpperCase())}
                  placeholder="Ex: CRM/SP 123456"
                  className="w-full bg-[#0d0d0d] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#404040] focus:outline-none focus:border-[#10a37f]/50 focus:ring-1 focus:ring-[#10a37f]/20 transition-all uppercase font-mono"
                />
                <span className="text-[11px] text-[#555] mt-1 block">
                  Número de inscrição oficial no Conselho Regional de Medicina.
                </span>
              </div>

              {/* Especialidade */}
              <div>
                <label className="block text-xs font-medium text-[#a3a3a3] mb-1.5 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-[#10a37f]" />
                  Especialidade Médica
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ex: Medicina do Trabalho / Perícias Médicas"
                  className="w-full bg-[#0d0d0d] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#404040] focus:outline-none focus:border-[#10a37f]/50 focus:ring-1 focus:ring-[#10a37f]/20 transition-all"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs font-medium text-[#a3a3a3] mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#10a37f]" />
                  Telefone / WhatsApp (Opcional)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-[#0d0d0d] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#404040] focus:outline-none focus:border-[#10a37f]/50 focus:ring-1 focus:ring-[#10a37f]/20 transition-all"
                />
              </div>

              {/* E-mail (somente leitura) */}
              <div>
                <label className="block text-xs font-medium text-[#555] mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#555]" />
                  E-mail de Acesso (Login)
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-3.5 py-2.5 text-sm text-[#737373] cursor-not-allowed"
                />
              </div>

              <div className="pt-3 border-t border-[#1e1e1e] flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary inline-flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-[#10a37f]/15"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Side Preview Card */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5 shadow-xl">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider text-[#a3a3a3] mb-3 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#10a37f]" />
                Prévia da Assinatura
              </h3>
              <p className="text-[12px] text-[#737373] mb-4">
                É assim que sua assinatura oficial aparecerá no rodapé dos laudos homologados:
              </p>

              <div className="bg-[#0d0d0d] border border-dashed border-[#262626] rounded-xl p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-[#10a37f]/10 border border-[#10a37f]/20 flex items-center justify-center mx-auto mb-2 text-[#10a37f]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="font-semibold text-white text-sm">
                  {name || "Dr. Nome do Médico"}
                </div>
                <div className="font-mono text-xs text-[#10a37f] font-medium mt-0.5">
                  {crm || "CRM/UF 000000"}
                </div>
                <div className="text-[11px] text-[#737373] mt-1">
                  {specialty || "Medicina do Trabalho"}
                </div>
                <div className="mt-3 pt-2 border-t border-[#1e1e1e] text-[10px] text-[#555] uppercase tracking-wider font-mono">
                  Assinatura Digital ICP-Brasil
                </div>
              </div>
            </div>

            <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4 text-xs text-[#737373] leading-relaxed">
              <p className="font-medium text-white mb-1">💡 Dica de Conformidade</p>
              Mantenha seu CRM atualizado de acordo com o estado de emissão para garantir validade jurídica plena nos processos do INSS e judiciais.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

