import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Sessão expirada ou não autenticado. Faça login novamente.' }, { status: 401 });
    }

    const body = await req.json();

    if (user.role === 'DOCTOR') {
      const { name, crm, specialty } = body;

      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Nome completo é obrigatório' }, { status: 400 });
      }

      if (!crm || !crm.trim()) {
        return NextResponse.json({ error: 'CRM é obrigatório para médicos peritos' }, { status: 400 });
      }

      const cleanCrm = crm.trim().toUpperCase();
      let cleanName = name.trim();
      if (!cleanName.toLowerCase().startsWith('dr')) {
        cleanName = `Dr. ${cleanName}`;
      }
      const cleanSpecialty = specialty?.trim() || 'Medicina do Trabalho';

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: cleanName,
          crm: cleanCrm,
          specialty: cleanSpecialty,
        }
      });

      // Sincroniza metadados com Supabase Auth
      try {
        await supabase.auth.updateUser({
          data: {
            name: cleanName,
            crm: cleanCrm,
            specialty: cleanSpecialty,
          }
        });
      } catch (err) {
        console.warn('Erro ao atualizar metadata no Supabase:', err);
      }

      return NextResponse.json({
        success: true,
        user: updatedUser,
        redirectTo: '/doctor/dashboard',
      });
    }

    if (user.role === 'PARTNER') {
      const { cnpj, companyName, tradeName, phone, address } = body;

      if (!cnpj || !cnpj.trim()) {
        return NextResponse.json({ error: 'CNPJ é obrigatório para empresas parceiras' }, { status: 400 });
      }

      const cleanCnpj = cnpj.replace(/\D/g, '');
      if (cleanCnpj.length !== 14 && cleanCnpj.length !== 11) {
        return NextResponse.json({ error: 'CNPJ deve conter 14 dígitos (ou CPF com 11 dígitos)' }, { status: 400 });
      }

      const finalName = companyName?.trim() || tradeName?.trim() || user.name || 'Empresa Parceira';
      const finalTradeName = tradeName?.trim() || companyName?.trim() || finalName;

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          cnpj: cleanCnpj,
          name: finalName,
          tradeName: finalTradeName,
          phone: phone?.trim() || null,
          address: address?.trim() || null,
        }
      });

      // Sincroniza metadados com Supabase Auth
      try {
        await supabase.auth.updateUser({
          data: {
            cnpj: cleanCnpj,
            name: finalName,
            tradeName: finalTradeName,
            phone: phone?.trim() || null,
            address: address?.trim() || null,
          }
        });
      } catch (err) {
        console.warn('Erro ao atualizar metadata no Supabase:', err);
      }

      return NextResponse.json({
        success: true,
        user: updatedUser,
        redirectTo: '/partner/dashboard',
      });
    }

    return NextResponse.json({ error: 'Perfil de usuário inválido' }, { status: 400 });
  } catch (error: any) {
    console.error('Error completing profile:', error);
    return NextResponse.json({ error: error.message || 'Erro ao salvar informações do perfil' }, { status: 500 });
  }
}

