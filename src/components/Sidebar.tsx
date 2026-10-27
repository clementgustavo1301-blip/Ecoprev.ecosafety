"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  FileText, 
  Users, 
  Settings, 
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  Activity,
  LogOut,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  // Hide sidebar on landing page and login page
  if (pathname === "/" || pathname === "/login") {
    return null;
  }

  const isDoctor = pathname.startsWith("/doctor");

  const mainLinks = [
    { name: "Painel Principal", href: isDoctor ? "/doctor/dashboard" : "/partner/dashboard", icon: Home },
    { name: "Meus Laudos", href: "#", icon: FileText },
    { name: "Pacientes", href: "#", icon: Users },
  ];

  const secondaryLinks = [
    { name: "Configurações", href: "#", icon: Settings },
    { name: "Suporte", href: "#", icon: LifeBuoy },
  ];

  return (
    <aside 
      className={`sticky top-0 left-0 h-screen bg-[#0d0d0d] border-r border-[#1e1e1e] flex flex-col z-50 shrink-0 transition-all duration-300 ease-in-out ${
        isExpanded ? "w-56" : "w-[52px]"
      }`}
    >
      {/* Toggle button */}
      <div className="h-14 flex items-center justify-center border-b border-[#1e1e1e]">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-8 h-8 rounded-lg bg-[#141414] hover:bg-[#1a1a1a] border border-[#1e1e1e] flex items-center justify-center text-[#555] hover:text-[#a3a3a3] transition-all"
        >
          {isExpanded ? (
            <ChevronLeft className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Brand (visible when expanded) */}
      {isExpanded && (
        <div className="px-4 py-3 border-b border-[#1e1e1e]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#10a37f]/10 border border-[#10a37f]/20 flex items-center justify-center shrink-0">
              <Activity className="w-3 h-3 text-[#10a37f]" />
            </div>
            <span className="text-sm font-semibold text-white whitespace-nowrap">EcoPrev</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className={`flex-1 overflow-y-auto py-3 flex flex-col gap-5 ${isExpanded ? "px-2.5" : "px-1.5"}`}>
        <nav className="flex flex-col gap-0.5">
          {mainLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-2.5 py-2 rounded-lg transition-all overflow-hidden ${
                  isActive 
                    ? "bg-[#10a37f]/10 text-[#10a37f]" 
                    : "text-[#555] hover:bg-[#141414] hover:text-[#a3a3a3]"
                } ${isExpanded ? "px-2.5" : "justify-center"}`}
                title={!isExpanded ? link.name : undefined}
              >
                <link.icon className="w-[16px] h-[16px] shrink-0" strokeWidth={2} />
                {isExpanded && <span className="text-[13px] font-medium whitespace-nowrap">{link.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="h-px bg-[#1a1a1a] mx-1" />

        <nav className="flex flex-col gap-0.5">
          {secondaryLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-2.5 py-2 rounded-lg transition-all text-[#404040] hover:bg-[#141414] hover:text-[#737373] overflow-hidden ${
                isExpanded ? "px-2.5" : "justify-center"
              }`}
              title={!isExpanded ? link.name : undefined}
            >
              <link.icon className="w-[16px] h-[16px] shrink-0" strokeWidth={2} />
              {isExpanded && <span className="text-[13px] font-medium whitespace-nowrap">{link.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      {/* Bottom */}
      <div className={`border-t border-[#1e1e1e] py-2.5 ${isExpanded ? "px-2.5" : "px-1.5"}`}>
        <Link
          href="/"
          className={`flex items-center gap-2.5 py-2 rounded-lg text-[#404040] hover:bg-[#141414] hover:text-[#ef4444] transition-all overflow-hidden ${
            isExpanded ? "px-2.5" : "justify-center"
          }`}
          title={!isExpanded ? "Sair" : undefined}
        >
          <LogOut className="w-[16px] h-[16px] shrink-0" strokeWidth={2} />
          {isExpanded && <span className="text-[13px] font-medium whitespace-nowrap">Sair</span>}
        </Link>
      </div>
    </aside>
  );
}
