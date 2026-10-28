"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ShieldCheck,
  Stethoscope,
  ArrowRight,
  FileCheck2,
  Clock,
  Lock,
  ChevronRight,
  ChevronDown,
  Activity,
  Building2,
  Search,
  Check,
  MapPin,
  Phone,
  ArrowLeft,
  Sparkles,
  UserCheck
} from "lucide-react";

function LandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeRole, setActiveRole] = useState<"PARTNER" | "DOCTOR">("PARTNER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Primeiro Acesso / Onboarding ──
  const [onboardingMode, setOnboardingMode] = useState(false);
  const [onboardingRole, setOnboardingRole] = useState<"PARTNER" | "DOCTOR">("PARTNER");
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  // Campos do Médico
  const [doctorName, setDoctorName] = useState("");
  const [doctorCrm, setDoctorCrm] = useState("");
  const [doctorSpecialty, setDoctorSpecialty] = useState("Medicina do Trabalho");

  // Campos da Empresa
  const [partnerCnpj, setPartnerCnpj] = useState("");
  const [fetchingCnpj, setFetchingCnpj] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<{
    companyName: string;
    tradeName: string;
    phone: string;
    address: string;
  } | null>(null);

  useEffect(() => {
    const role = searchParams.get("role");
    if (role === "DOCTOR" || role === "PARTNER") {
      setActiveRole(role);
      setTimeout(() => document.getElementById("acesso")?.scrollIntoView({ behavior: "smooth" }), 200);
    }
  }, [searchParams]);

  const formatCnpj = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 14);
    if (raw.length <= 2) return raw;
    if (raw.length <= 5) return `${raw.slice(0, 2)}.${raw.slice(2)}`;
    if (raw.length <= 8) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`;
    if (raw.length <= 12) return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`;
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12, 14)}`;
  };

  const handleFetchCnpj = async (inputCnpj: string) => {
    const clean = inputCnpj.replace(/\D/g, '');
    if (clean.length !== 14) {
      setErrorMsg("O CNPJ deve conter 14 dígitos.");
      return;
    }
    setFetchingCnpj(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/cnpj/${clean}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Não foi possível localizar os dados deste CNPJ na Receita Federal.");
      }
      setCompanyInfo({
        companyName: data.companyName || "",
        tradeName: data.tradeName || data.companyName || "",
        phone: data.phone || "",
        address: data.address || "",
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao consultar CNPJ");
    } finally {
      setFetchingCnpj(false);
    }
  };

  const onCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnpj(e.target.value);
    setPartnerCnpj(formatted);
    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 14) {
      handleFetchCnpj(formatted);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: activeRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no acesso");

      const finalRole = data.user?.role || activeRole;

      // Se for o primeiro acesso ou faltam dados essenciais, entra no modo Onboarding
      if (data.requiresOnboarding) {
        setOnboardingRole(finalRole);
        setOnboardingMode(true);
        setLoading(false);
        if (data.user?.name && !data.user.name.includes("@")) {
          setDoctorName(data.user.name);
        }
        if (data.user?.crm && data.user.crm !== "CRM/SP A Definir") {
          setDoctorCrm(data.user.crm);
        }
        if (data.user?.cnpj) {
          setPartnerCnpj(formatCnpj(data.user.cnpj));
        }
        setTimeout(() => document.getElementById("acesso")?.scrollIntoView({ behavior: "smooth" }), 100);
        return;
      }

      window.location.href =
        finalRole === "DOCTOR" ? "/doctor/dashboard" : "/partner/dashboard";
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao autenticar");
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingLoading(true);
    setErrorMsg("");

    try {
      if (onboardingRole === "DOCTOR") {
        if (!doctorName.trim()) throw new Error("Informe seu nome completo.");
        if (!doctorCrm.trim()) throw new Error("Informe seu CRM.");
      } else {
        const cleanCnpj = partnerCnpj.replace(/\D/g, '');
        if (cleanCnpj.length !== 14 && cleanCnpj.length !== 11) {
          throw new Error("Informe um CNPJ válido de 14 dígitos.");
        }
      }

      const payload = onboardingRole === "DOCTOR"
        ? {
            name: doctorName,
            crm: doctorCrm,
            specialty: doctorSpecialty,
          }
        : {
            cnpj: partnerCnpj,
            companyName: companyInfo?.companyName,
            tradeName: companyInfo?.tradeName,
            phone: companyInfo?.phone,
            address: companyInfo?.address,
          };

      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar informações");

      window.location.href = data.redirectTo || (onboardingRole === "DOCTOR" ? "/doctor/dashboard" : "/partner/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Falha ao completar cadastro");
      setOnboardingLoading(false);
    }
  };

  const resetForm = () => {
    setEmail(""); 
    setPassword(""); 
    setErrorMsg("");
    setOnboardingMode(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #0a0f0d 0%, #0d1a14 40%, #0a1210 100%)" }}>

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className="relative z-20 w-full border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#10a37f]" />
            <span className="text-[15px] font-semibold text-white tracking-tight">EcoPrev</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[13px] text-[#737373] font-medium">
            <a href="#sobre" className="hover:text-white transition-colors">Sobre</a>
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#acesso" className="hover:text-white transition-colors">Acesso</a>
          </div>

          <button
            onClick={() => {
              document.getElementById("acesso")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-[13px] font-medium text-[#10a37f] hover:text-[#12b88e] transition-colors flex items-center gap-1"
          >
            Entrar <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section id="sobre" className="relative z-10 flex-1 flex items-center px-6 lg:px-10 py-16 md:py-0">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Column — Text */}
          <div className="flex flex-col">
            <div className="inline-flex items-center gap-2 bg-[#10a37f]/10 border border-[#10a37f]/15 px-3.5 py-1.5 rounded-full text-[#10a37f] text-[12px] font-medium mb-8 w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10a37f] animate-pulse" />
              Plataforma de Perícia Médica
            </div>

            <h1 className="text-[2.5rem] md:text-[3.25rem] lg:text-[3.5rem] font-bold tracking-tight text-white leading-[1.1] mb-5">
              Laudos periciais com{" "}
              <span className="gradient-text">agilidade e precisão</span>
            </h1>

            <p className="text-[15px] text-[#737373] leading-relaxed mb-9 max-w-lg">
              Automatize a triagem documental, acelere a análise médica e entregue
              laudos homologados com segurança jurídica para a sua empresa.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setActiveRole("PARTNER");
                  resetForm();
                  setTimeout(() => document.getElementById("acesso")?.scrollIntoView({ behavior: "smooth" }), 100);
                }}
                className="btn-primary text-white text-[13px] font-semibold px-5 py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Sou Empresa Parceira
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setActiveRole("DOCTOR");
                  resetForm();
                  setTimeout(() => document.getElementById("acesso")?.scrollIntoView({ behavior: "smooth" }), 100);
                }}
                className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] hover:border-white/[0.15] text-white text-[13px] font-semibold px-5 py-3 rounded-lg flex items-center justify-center gap-2 transition-all backdrop-blur-sm"
              >
                <Stethoscope className="w-4 h-4" />
                Sou Médico Perito
              </button>
            </div>
          </div>

          {/* Right Column — Hero Visual */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-[#10a37f]/[0.04] rounded-3xl blur-[80px] -z-10" />
            <div className="relative bg-[#0d1a14]/60 border border-white/[0.08] rounded-2xl p-6 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#10a37f]/10 flex items-center justify-center">
                    <FileCheck2 className="w-5 h-5 text-[#10a37f]" />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-semibold">Minuta Pericial Inteligente</h4>
                    <p className="text-[#737373] text-[11px]">Extração automatizada via IA Multimodal</p>
                  </div>
                </div>
                <span className="text-[11px] font-medium bg-[#10a37f]/10 text-[#10a37f] px-2.5 py-1 rounded-full border border-[#10a37f]/20">
                  Em tempo real
                </span>
              </div>
              <div className="space-y-3 text-[12px] text-[#a3a3a3]">
                <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                  <p className="font-semibold text-white mb-1">CIDs Sugeridos:</p>
                  <p className="text-[#10a37f] font-mono">M54.5 - Dor lombar baixa | S50.9 - Contusão de membro</p>
                </div>
                <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                  <p className="font-semibold text-white mb-1">Nexo Causal:</p>
                  <p>Caracterizado nexo causal direto com as atividades ergonômicas registradas em anamnese.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ LOGIN SECTION ═══════════ */}
      <section id="acesso" className="relative z-10 py-16 md:py-24 px-6 lg:px-10">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {onboardingMode ? "Primeiro Acesso" : "Acesse sua conta"}
            </h2>
            <p className="text-[13px] text-[#737373]">
              {onboardingMode 
                ? "Complete suas informações cadastrais para liberar o acesso ao painel." 
                : "Selecione seu perfil e informe suas credenciais para entrar."}
            </p>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 backdrop-blur-sm glow-subtle">
            
            {errorMsg && (
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/15 text-[#ef4444] px-3 py-2.5 rounded-lg mb-4 text-[12px] text-center leading-relaxed">
                {errorMsg}
              </div>
            )}

            {!onboardingMode ? (
              /* ════════ FORMULÁRIO DE LOGIN NORMAL ════════ */
              <>
                {/* Segmented Switcher */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl mb-5">
                  <button
                    type="button"
                    onClick={() => { setActiveRole("PARTNER"); setErrorMsg(""); }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                      activeRole === "PARTNER"
                        ? "bg-[#10a37f] text-white shadow-sm"
                        : "text-[#737373] hover:text-white"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Empresa Parceira
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveRole("DOCTOR"); setErrorMsg(""); }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                      activeRole === "DOCTOR"
                        ? "bg-[#10a37f] text-white shadow-sm"
                        : "text-[#737373] hover:text-white"
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                    Médico Perito
                  </button>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
                  {/* Select do Tipo de Perfil */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#737373] mb-1.5 uppercase tracking-wider">
                      Perfil de Acesso
                    </label>
                    <div className="relative">
                      <select
                        value={activeRole}
                        onChange={(e) => {
                          setActiveRole(e.target.value as "PARTNER" | "DOCTOR");
                          setErrorMsg("");
                        }}
                        className="w-full bg-[#0a1210] border border-white/[0.1] rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#10a37f]/60 focus:ring-1 focus:ring-[#10a37f]/30 transition-all appearance-none cursor-pointer pr-10"
                      >
                        <option value="PARTNER" className="bg-[#0d1a14] text-white">🏢 Empresa Parceira (Envio e acompanhamento)</option>
                        <option value="DOCTOR" className="bg-[#0d1a14] text-white">🩺 Médico Perito (Revisão e homologação)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-[#737373]">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#737373] mb-1.5 uppercase tracking-wider">E-mail</label>
                    <input
                      type="email"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#10a37f]/40 focus:ring-1 focus:ring-[#10a37f]/20 transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      autoComplete="username"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#737373] mb-1.5 uppercase tracking-wider">Senha</label>
                    <input
                      type="password"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#10a37f]/40 focus:ring-1 focus:ring-[#10a37f]/20 transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full text-white text-[13px] font-semibold py-2.5 px-4 rounded-lg mt-2 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Entrar como {activeRole === "DOCTOR" ? "Médico Perito" : "Empresa Parceira"}
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <p className="text-[11px] text-[#555]">
                    Acesso restrito. Cada conta só tem acesso ao perfil configurado no banco de dados.
                  </p>
                </div>
              </>
            ) : (
              /* ════════ FORMULÁRIO DE PRIMEIRO ACESSO / ONBOARDING ════════ */
              <div>
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
                  {onboardingRole === "DOCTOR" ? (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-[#10a37f]/10 flex items-center justify-center">
                        <Stethoscope className="w-4 h-4 text-[#10a37f]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Dados do Médico Perito</h3>
                        <p className="text-[11px] text-[#737373]">Necessário para assinatura digital dos laudos</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-[#10a37f]/10 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-[#10a37f]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Dados da Empresa Parceira</h3>
                        <p className="text-[11px] text-[#737373]">Consulta automática na Receita Federal</p>
                      </div>
                    </>
                  )}
                </div>

                <form onSubmit={handleCompleteProfile} className="flex flex-col gap-3.5">
                  {onboardingRole === "DOCTOR" ? (
                    /* ─── CAMPOS DO MÉDICO ─── */
                    <>
                      <div>
                        <label className="block text-[11px] font-medium text-[#737373] mb-1.5 uppercase tracking-wider">
                          Nome Completo com Título
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-[#555] focus:outline-none focus:border-[#10a37f]/40 focus:ring-1 focus:ring-[#10a37f]/20 transition-all"
                          value={doctorName}
                          onChange={(e) => setDoctorName(e.target.value)}
                          placeholder="Ex: Dr. Carlos Eduardo Silva"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-[#737373] mb-1.5 uppercase tracking-wider">
                          CRM com UF
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-[#555] focus:outline-none focus:border-[#10a37f]/40 focus:ring-1 focus:ring-[#10a37f]/20 transition-all uppercase"
                          value={doctorCrm}
                          onChange={(e) => setDoctorCrm(e.target.value)}
                          placeholder="Ex: CRM/SP 123456"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-[#737373] mb-1.5 uppercase tracking-wider">
                          Especialidade Médica
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-[#555] focus:outline-none focus:border-[#10a37f]/40 focus:ring-1 focus:ring-[#10a37f]/20 transition-all"
                          value={doctorSpecialty}
                          onChange={(e) => setDoctorSpecialty(e.target.value)}
                          placeholder="Medicina do Trabalho"
                        />
                      </div>
                    </>
                  ) : (
                    /* ─── CAMPOS DA EMPRESA (CNPJ COM BUSCA NA RECEITA) ─── */
                    <>
                      <div>
                        <label className="block text-[11px] font-medium text-[#737373] mb-1.5 uppercase tracking-wider">
                          CNPJ da Empresa
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-3.5 pr-20 py-2.5 text-[13px] text-white placeholder-[#555] focus:outline-none focus:border-[#10a37f]/40 focus:ring-1 focus:ring-[#10a37f]/20 transition-all font-mono"
                            value={partnerCnpj}
                            onChange={onCnpjChange}
                            placeholder="00.000.000/0001-00"
                            maxLength={18}
                          />
                          <button
                            type="button"
                            onClick={() => handleFetchCnpj(partnerCnpj)}
                            disabled={fetchingCnpj || partnerCnpj.replace(/\D/g, '').length !== 14}
                            className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 bg-[#10a37f]/20 hover:bg-[#10a37f]/30 text-[#10a37f] text-[11px] font-semibold rounded-md flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {fetchingCnpj ? (
                              <div className="w-3.5 h-3.5 border-2 border-[#10a37f]/30 border-t-[#10a37f] rounded-full animate-spin" />
                            ) : (
                              <>
                                <Search className="w-3 h-3" />
                                Buscar
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-[#555] mt-1">
                          Ao digitar o CNPJ, os dados cadastrais serão buscados automaticamente na Receita Federal.
                        </p>
                      </div>

                      {/* Card de Dados da Empresa Puxados pela Receita Federal */}
                      {companyInfo && (
                        <div className="bg-[#10a37f]/10 border border-[#10a37f]/20 rounded-lg p-3 text-[12px] flex flex-col gap-1.5 transition-all">
                          <div className="flex items-center gap-1.5 text-[#10a37f] font-semibold text-[13px]">
                            <Building2 className="w-4 h-4 shrink-0" />
                            <span className="truncate">{companyInfo.companyName}</span>
                          </div>
                          {companyInfo.tradeName && companyInfo.tradeName !== companyInfo.companyName && (
                            <div className="text-[#a3a3a3]">
                              <span className="text-[#737373]">Nome Fantasia:</span> {companyInfo.tradeName}
                            </div>
                          )}
                          {companyInfo.address && (
                            <div className="text-[#a3a3a3] flex items-start gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#10a37f] shrink-0 mt-0.5" />
                              <span className="leading-tight">{companyInfo.address}</span>
                            </div>
                          )}
                          {companyInfo.phone && (
                            <div className="text-[#a3a3a3] flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-[#10a37f] shrink-0" />
                              <span>{companyInfo.phone}</span>
                            </div>
                          )}
                          <div className="text-[11px] text-[#10a37f] flex items-center gap-1 mt-1 pt-1.5 border-t border-[#10a37f]/15 font-medium">
                            <Check className="w-3.5 h-3.5" /> Dados validados pela Receita Federal
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={onboardingLoading || (onboardingRole === "PARTNER" && partnerCnpj.replace(/\D/g, '').length < 11)}
                    className="btn-primary w-full text-white text-[13px] font-semibold py-2.5 px-4 rounded-lg mt-2 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {onboardingLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        Concluir e Acessar Painel
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOnboardingMode(false); setErrorMsg(""); }}
                    className="w-full text-center text-[12px] text-[#737373] hover:text-white py-1 flex items-center justify-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o início
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="relative z-10 border-t border-white/[0.04] py-8 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#10a37f]/60" />
            <span className="text-[12px] font-medium text-[#333]">EcoPrev</span>
          </div>
          <p className="text-[11px] text-[#262626]">
            &copy; {new Date().getFullYear()} EcoPrev Medicina do Trabalho. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0f0d" }}>
          <div className="w-6 h-6 border-2 border-[#10a37f]/30 border-t-[#10a37f] rounded-full animate-spin" />
        </div>
      }
    >
      <LandingContent />
    </Suspense>
  );
}
