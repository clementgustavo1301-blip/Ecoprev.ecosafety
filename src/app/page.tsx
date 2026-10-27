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
  Activity,
  Building2,
  Search,
  CheckCircle2,
  Loader2,
  Sparkles,
  AlertCircle
} from "lucide-react";

function LandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeRole, setActiveRole] = useState<"PARTNER" | "DOCTOR" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [crm, setCrm] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjSuccess, setCnpjSuccess] = useState(false);
  const [cnpjError, setCnpjError] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const formatCNPJ = (val: string) => {
    return val
      .replace(/\D/g, "")
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setCnpj(formatted);
    setCnpjSuccess(false);
    setCnpjError("");

    const clean = formatted.replace(/\D/g, "");
    if (clean.length === 14) {
      fetchCNPJData(clean);
    }
  };

  const fetchCNPJData = async (cleanCnpj?: string) => {
    const target = cleanCnpj || cnpj.replace(/\D/g, "");
    if (target.length !== 14) {
      setCnpjError("Digite os 14 dígitos do CNPJ");
      return;
    }
    setCnpjLoading(true);
    setCnpjError("");

    try {
      const res = await fetch(`/api/cnpj/${target}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "CNPJ não encontrado na Receita Federal");
      }
      setName(data.companyName || "");
      setTradeName(data.tradeName || "");
      if (data.email && !email) setEmail(data.email.toLowerCase());
      if (data.phone) setPhone(data.phone);
      if (data.address) setAddress(data.address);
      setCnpjSuccess(true);
    } catch (err: any) {
      setCnpjError(err.message || "Erro ao consultar CNPJ");
      setCnpjSuccess(false);
    } finally {
      setCnpjLoading(false);
    }
  };

  useEffect(() => {
    const role = searchParams.get("role");
    if (role === "DOCTOR" || role === "PARTNER") {
      setActiveRole(role);
      setTimeout(() => document.getElementById("acesso")?.scrollIntoView({ behavior: "smooth" }), 200);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    try {
      if (isRegister) {
        if (!name) throw new Error(activeRole === "PARTNER" ? "Preencha o CNPJ para buscar os dados da empresa." : "Preencha seu nome completo.");
        if (activeRole === "PARTNER" && !cnpj) throw new Error("CNPJ é obrigatório para cadastro de parceiro.");
        if (activeRole === "DOCTOR" && !crm) throw new Error("CRM é obrigatório para cadastro de médico perito.");

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name, 
            email, 
            password,
            role: activeRole,
            crm: activeRole === "DOCTOR" ? crm : null,
            specialty: activeRole === "DOCTOR" ? (specialty || "Medicina do Trabalho") : null,
            cnpj: activeRole === "PARTNER" ? cnpj : null,
            tradeName: activeRole === "PARTNER" ? tradeName : null,
            phone: phone || null,
            address: address || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao registrar");
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role: activeRole }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Falha no acesso");
      }
      window.location.href =
        activeRole === "DOCTOR" ? "/doctor/dashboard" : "/partner/dashboard";
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao autenticar");
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail(""); 
    setPassword(""); 
    setName("");
    setCrm(""); 
    setSpecialty(""); 
    setCnpj("");
    setTradeName("");
    setPhone("");
    setAddress("");
    setCnpjLoading(false);
    setCnpjSuccess(false);
    setCnpjError("");
    setIsRegister(false); 
    setErrorMsg("");
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

          {/* Right Column — Hero Image */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-[#10a37f]/[0.04] rounded-3xl blur-[80px] -z-10" />
            <div className="relative">
              <Image
                src="/hero-ecoprev.png"
                alt="Plataforma EcoPrev — Dashboard médico com estetoscópio e documentos"
                width={600}
                height={400}
                className="w-full h-auto object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section id="funcionalidades" className="relative z-10 py-20 md:py-28 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Como funciona</h2>
            <p className="text-[#737373] text-sm max-w-md mx-auto">
              Um fluxo inteligente que conecta empresas, documentos e médicos peritos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: FileCheck2,
                title: "Envio de Documentos",
                desc: "A empresa parceira faz o upload de exames, atestados e fichas clínicas pelo painel seguro.",
                step: "01",
              },
              {
                icon: Clock,
                title: "Triagem Inteligente",
                desc: "O sistema organiza e pré-analisa os documentos, criando uma minuta técnica automatizada.",
                step: "02",
              },
              {
                icon: Stethoscope,
                title: "Homologação Médica",
                desc: "O médico perito revisa a minuta, assina digitalmente e libera o laudo oficial.",
                step: "03",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 card-hover group backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-lg bg-[#10a37f]/10 border border-[#10a37f]/15 flex items-center justify-center group-hover:bg-[#10a37f]/20 transition-colors">
                    <item.icon className="w-5 h-5 text-[#10a37f]" />
                  </div>
                  <span className="text-[11px] font-mono text-white/10 group-hover:text-white/20 transition-colors">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-[13px] text-[#737373] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ LOGIN SECTION ═══════════ */}
      <section id="acesso" className="relative z-10 py-16 md:py-24 px-6 lg:px-10">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Acesse sua conta</h2>
            <p className="text-[13px] text-[#737373]">
              Selecione seu tipo de acesso para continuar.
            </p>
          </div>

          {/* Role Selector */}
          {!activeRole && (
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => { setActiveRole("PARTNER"); resetForm(); }}
                className="bg-white/[0.03] border border-white/[0.06] hover:border-[#10a37f]/30 rounded-xl p-5 text-left card-hover group flex items-center gap-4 backdrop-blur-sm"
              >
                <div className="w-11 h-11 rounded-xl bg-[#10a37f]/10 border border-[#10a37f]/15 flex items-center justify-center shrink-0 group-hover:bg-[#10a37f]/20 transition-colors">
                  <ShieldCheck className="w-5 h-5 text-[#10a37f]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-[13px] mb-0.5">Empresa Parceira</h3>
                  <p className="text-[12px] text-[#555]">Envie documentos e acompanhe laudos</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#333] group-hover:text-[#10a37f] transition-colors shrink-0" />
              </button>

              <button
                onClick={() => { setActiveRole("DOCTOR"); resetForm(); }}
                className="bg-white/[0.03] border border-white/[0.06] hover:border-[#10a37f]/30 rounded-xl p-5 text-left card-hover group flex items-center gap-4 backdrop-blur-sm"
              >
                <div className="w-11 h-11 rounded-xl bg-[#10a37f]/10 border border-[#10a37f]/15 flex items-center justify-center shrink-0 group-hover:bg-[#10a37f]/20 transition-colors">
                  <Stethoscope className="w-5 h-5 text-[#10a37f]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-[13px] mb-0.5">Médico Perito</h3>
                  <p className="text-[12px] text-[#555]">Revise minutas e homologue laudos</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#333] group-hover:text-[#10a37f] transition-colors shrink-0" />
              </button>
            </div>
          )}

          {/* Login Form */}
          {activeRole && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 backdrop-blur-sm glow-subtle">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#10a37f]/10 border border-[#10a37f]/15 flex items-center justify-center">
                    {activeRole === "DOCTOR" ? (
                      <Stethoscope className="w-4 h-4 text-[#10a37f]" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-[#10a37f]" />
                    )}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white">
                      {activeRole === "DOCTOR" ? "Médico Perito" : "Empresa Parceira"}
                    </p>
                    <p className="text-[11px] text-[#555]">
                      {isRegister ? "Criar nova conta" : "Entrar na plataforma"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setActiveRole(null); resetForm(); }}
                  className="text-[11px] text-[#555] hover:text-[#a3a3a3] transition-colors"
                >
                  Trocar ↩
                </button>
              </div>

              {errorMsg && (
                <div className="bg-[#ef4444]/10 border border-[#ef4444]/15 text-[#ef4444] px-3 py-2 rounded-lg mb-4 text-[12px] text-center">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleLogin} className="flex flex-col gap-3">
                {isRegister && activeRole === "PARTNER" && (
                  <>
                    {/* CNPJ Field with API Auto-Fetch */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-medium text-[#737373] uppercase tracking-wider">
                          CNPJ da Empresa
                        </label>
                        <span className="text-[10px] text-[#10a37f] font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Preenchimento Automático
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-24 py-2.5 text-[13px] text-white placeholder-[#444] focus:outline-none focus:border-[#10a37f]/40 focus:ring-1 focus:ring-[#10a37f]/20 transition-all font-mono"
                          placeholder="00.000.000/0001-00"
                          value={cnpj}
                          onChange={handleCnpjChange}
                          maxLength={18}
                        />
                        <Building2 className="w-4 h-4 text-[#737373] absolute left-3 pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => fetchCNPJData()}
                          disabled={cnpjLoading || cnpj.replace(/\D/g, "").length !== 14}
                          className="absolute right-1.5 px-2.5 py-1.5 rounded-md bg-[#10a37f]/15 hover:bg-[#10a37f]/25 text-[#10a37f] text-[11px] font-medium border border-[#10a37f]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {cnpjLoading ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Buscando...
                            </>
                          ) : (
                            <>
                              <Search className="w-3 h-3" />
                              Consultar
                            </>
                          )}
                        </button>
                      </div>
                      {cnpjError && (
                        <p className="text-[11px] text-[#ef4444] mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {cnpjError}
                        </p>
                      )}
                    </div>

                    {/* Verified Company Card (Data fetched from API) */}
                    {cnpjSuccess && (
                      <div className="p-3.5 bg-[#10a37f]/10 border border-[#10a37f]/25 rounded-lg text-xs flex flex-col gap-1.5 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="text-[#10a37f] font-semibold flex items-center gap-1.5 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Empresa Verificada na Receita Federal
                          </span>
                          <span className="text-[10px] bg-[#10a37f]/20 text-[#10a37f] px-1.5 py-0.5 rounded font-mono font-bold">
                            ATIVA
                          </span>
                        </div>
                        <p className="text-white font-medium text-[13px]">{name}</p>
                        {tradeName && tradeName !== name && (
                          <p className="text-[#a3a3a3] text-[11px]">Fantasia: {tradeName}</p>
                        )}
                        {address && (
                          <p className="text-[#737373] text-[11px] leading-snug">{address}</p>
                        )}
                      </div>
                    )}

                    {/* Razão Social (Auto-filled) */}
                    <div>
                      <label className="block text-[11px] font-medium text-[#737373] mb-1.5 uppercase tracking-wider">
                        Razão Social
                      </label>
                      <input
                        type="text"
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#10a37f]/40 focus:ring-1 focus:ring-[#10a37f]/20 transition-all"
                        placeholder="Nome Empresarial / Razão Social"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    {/* Nome Fantasia e Telefone */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-[#737373] mb-1.5 uppercase tracking-wider">
                          Nome Fantasia
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#10a37f]/40 focus:ring-1 focus:ring-[#10a37f]/20 transition-all"
                          placeholder="Nome Comercial"
                          value={tradeName}
                          onChange={(e) => setTradeName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#737373] mb-1.5 uppercase tracking-wider">
                          Telefone Comercial
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#10a37f]/40 focus:ring-1 focus:ring-[#10a37f]/20 transition-all"
                          placeholder="(11) 99999-9999"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {isRegister && activeRole === "DOCTOR" && (
                  <>
                    <div>
                      <label className="block text-[11px] font-medium text-[#737373] mb-1.5 uppercase tracking-wider">
                        Nome Completo do Médico
                      </label>
                      <input
                        type="text"
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#10a37f]/40 focus:ring-1 focus:ring-[#10a37f]/20 transition-all"
                        placeholder="Ex: Dr. Roberto Alcantara"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-[#737373] mb-1.5 uppercase tracking-wider">
                          CRM
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#10a37f]/40 focus:ring-1 focus:ring-[#10a37f]/20 transition-all"
                          placeholder="Ex: CRM/SP 123456"
                          value={crm}
                          onChange={(e) => setCrm(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#737373] mb-1.5 uppercase tracking-wider">
                          Especialidade
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-white placeholder-[#333] focus:outline-none focus:border-[#10a37f]/40 focus:ring-1 focus:ring-[#10a37f]/20 transition-all"
                          placeholder="Ex: Medicina do Trabalho"
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

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
                  className="btn-primary w-full text-white text-[13px] font-semibold py-2.5 px-4 rounded-lg mt-1 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      {isRegister ? "Criar conta" : "Entrar"}
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setIsRegister(!isRegister); setErrorMsg(""); }}
                  className="text-[11px] text-[#555] hover:text-[#10a37f] transition-colors"
                >
                  {isRegister ? "Já tem conta? Entre aqui" : "Primeira vez? Crie sua conta"}
                </button>
              </div>
            </div>
          )}
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
