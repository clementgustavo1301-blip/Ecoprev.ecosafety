"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  FileCheck2,
  RefreshCw
} from "lucide-react";

export default function PartnerSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingCnpj, setFetchingCnpj] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [cnpj, setCnpj] = useState("");
  const [name, setName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");

  const formatCnpj = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 14);
    if (raw.length <= 2) return raw;
    if (raw.length <= 5) return `${raw.slice(0, 2)}.${raw.slice(2)}`;
    if (raw.length <= 8) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`;
    if (raw.length <= 12) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`;
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12, 14)}`;
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (data.user) {
          setCnpj(data.user.cnpj ? formatCnpj(data.user.cnpj) : "");
          setName(data.user.name || "");
          setTradeName(data.user.tradeName || data.user.name || "");
          setPhone(data.user.phone || "");
          setAddress(data.user.address || "");
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

  const handleFetchCnpj = async () => {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) {
      setErrorMsg("O CNPJ deve conter 14 dígitos.");
      return;
    }

    setFetchingCnpj(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/cnpj/${clean}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Não foi possível consultar os dados deste CNPJ na Receita Federal.");
      }

      if (data.companyName) setName(data.companyName);
      if (data.tradeName) setTradeName(data.tradeName);
      if (data.phone) setPhone(data.phone);
      if (data.address) setAddress(data.address);

      setSuccessMsg("Dados da empresa atualizados com sucesso a partir da Receita Federal!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao consultar CNPJ");
    } finally {
      setFetchingCnpj(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnpj, name, tradeName, phone, address }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao salvar dados");
      }

      setSuccessMsg(data.message || "Dados atualizados com sucesso!");
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
            href="/partner/dashboard" 
            className="inline-flex items-center gap-2 text-sm text-[#737373] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o painel da empresa
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-[#10a37f]" />
              Configurações da Empresa Parceira
            </h1>
            <p className="text-sm text-[#737373] mt-1">
              Gerencie a Razão Social, CNPJ e endereço utilizados nos relatórios e laudos admissionais e periciais.
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
                Dados Cadastrais da Empresa
              </h2>

              {/* CNPJ com busca na Receita */}
              <div>
                <label className="block text-xs font-medium text-[#a3a3a3] mb-1.5 flex items-center justify-between">
                  <span>CNPJ da Empresa</span>
                  <span className="text-[11px] text-[#10a37f] font-normal">Integração Receita Federal</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={cnpj}
                    onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                    placeholder="00.000.000/0001-00"
                    maxLength={18}
                    className="flex-1 bg-[#0d0d0d] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#404040] focus:outline-none focus:border-[#10a37f]/50 focus:ring-1 focus:ring-[#10a37f]/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleFetchCnpj}
                    disabled={fetchingCnpj || cnpj.replace(/\D/g, '').length !== 14}
                    className="bg-[#10a37f]/10 hover:bg-[#10a37f]/20 border border-[#10a37f]/20 text-[#10a37f] text-xs font-semibold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                    title="Puxar dados atualizados da Receita Federal"
                  >
                    {fetchingCnpj ? (
                      <div className="w-4 h-4 border-2 border-[#10a37f]/30 border-t-[#10a37f] rounded-full animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        Puxar Receita
                      </>
                    )}
                  </button>
                </div>
                <span className="text-[11px] text-[#555] mt-1 block">
                  Clique em &quot;Puxar Receita&quot; para carregar automaticamente a Razão Social, Fantasia e Endereço.
                </span>
              </div>

              {/* Razão Social */}
              <div>
                <label className="block text-xs font-medium text-[#a3a3a3] mb-1.5">
                  Razão Social (Nome Oficial)
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Empresa Parceira de Saúde e Segurança Ltda"
                  className="w-full bg-[#0d0d0d] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#404040] focus:outline-none focus:border-[#10a37f]/50 focus:ring-1 focus:ring-[#10a37f]/20 transition-all"
                />
              </div>

              {/* Nome Fantasia */}
              <div>
                <label className="block text-xs font-medium text-[#a3a3a3] mb-1.5">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  placeholder="Ex: EcoPrev Parceiro"
                  className="w-full bg-[#0d0d0d] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#404040] focus:outline-none focus:border-[#10a37f]/50 focus:ring-1 focus:ring-[#10a37f]/20 transition-all"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs font-medium text-[#a3a3a3] mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#10a37f]" />
                  Telefone de Contato
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-[#0d0d0d] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#404040] focus:outline-none focus:border-[#10a37f]/50 focus:ring-1 focus:ring-[#10a37f]/20 transition-all"
                />
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-xs font-medium text-[#a3a3a3] mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#10a37f]" />
                  Endereço Completo
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro, Cidade/UF, CEP"
                  className="w-full bg-[#0d0d0d] border border-[#262626] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#404040] focus:outline-none focus:border-[#10a37f]/50 focus:ring-1 focus:ring-[#10a37f]/20 transition-all resize-none"
                />
              </div>

              {/* E-mail (somente leitura) */}
              <div>
                <label className="block text-xs font-medium text-[#555] mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#555]" />
                  E-mail da Conta (Login)
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
                Cartão da Empresa
              </h3>
              <p className="text-[12px] text-[#737373] mb-4">
                Identificação corporativa exibida nos laudos periciais emitidos:
              </p>

              <div className="bg-[#0d0d0d] border border-dashed border-[#262626] rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#10a37f]/10 border border-[#10a37f]/20 flex items-center justify-center text-[#10a37f] shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-white text-sm truncate">
                    {tradeName || name || "Nome da Empresa"}
                  </div>
                </div>

                <div className="font-mono text-xs text-[#10a37f] font-medium mb-2">
                  {cnpj || "00.000.000/0001-00"}
                </div>

                {name && name !== tradeName && (
                  <div className="text-[11px] text-[#737373] mb-1">
                    <span className="text-[#555]">Razão:</span> {name}
                  </div>
                )}

                {address && (
                  <div className="text-[11px] text-[#a3a3a3] flex items-start gap-1 mt-2 pt-2 border-t border-[#1e1e1e]">
                    <MapPin className="w-3.5 h-3.5 text-[#10a37f] shrink-0 mt-0.5" />
                    <span>{address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4 text-xs text-[#737373] leading-relaxed">
              <p className="font-medium text-white mb-1">🏢 Validade Documental</p>
              Os dados de CNPJ e endereço são incluídos na identificação da empresa contratante em cada laudo pericial gerado.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

