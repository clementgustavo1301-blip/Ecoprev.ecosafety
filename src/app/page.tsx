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
  Activity
} from "lucide-react";

function LandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeRole, setActiveRole] = useState<"PARTNER" | "DOCTOR">("PARTNER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: activeRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no acesso");

      const finalRole = data.user?.role || activeRole;
      window.location.href =
        finalRole === "DOCTOR" ? "/doctor/dashboard" : "/partner/dashboard";
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao autenticar");
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail(""); 
    setPassword(""); 
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
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Acesse sua conta</h2>
            <p className="text-[13px] text-[#737373]">
              Selecione seu perfil e informe suas credenciais para entrar.
            </p>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 backdrop-blur-sm glow-subtle">
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

            {errorMsg && (
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/15 text-[#ef4444] px-3 py-2.5 rounded-lg mb-4 text-[12px] text-center leading-relaxed">
                {errorMsg}
              </div>
            )}

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
                    <option value="PARTNER" className="bg-[#0d1a14] text-white">🏢 Empresa Parceira (Envio e acompanhamento de casos)</option>
                    <option value="DOCTOR" className="bg-[#0d1a14] text-white">🩺 Médico Perito (Revisão e homologação de laudos)</option>
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
