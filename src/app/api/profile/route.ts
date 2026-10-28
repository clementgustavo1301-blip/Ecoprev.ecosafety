import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      crm: user.crm,
      specialty: user.specialty,
      cnpj: user.cnpj,
      tradeName: user.tradeName,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt,
    }
  });
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();

    if (user.role === 'DOCTOR') {
      const { name, crm, specialty, phone } = body;

      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'O nome do médico é obrigatório' }, { status: 400 });
      }

      if (!crm || !crm.trim()) {
        return NextResponse.json({ error: 'O CRM é obrigatório' }, { status: 400 });
      }

      const cleanCrm = crm.trim().toUpperCase();
      let cleanName = name.trim();
      if (!cleanName.toLowerCase().startsWith('dr')) {
        cleanName = `Dr. ${cleanName}`;
      }
      const cleanSpecialty = specialty?.trim() || 'Medicina do Trabalho';

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: cleanName,
          crm: cleanCrm,
          specialty: cleanSpecialty,
          phone: phone?.trim() || null,
        }
      });

      // Sincroniza metadados com Supabase Auth
      try {
        await supabase.auth.updateUser({
          data: {
            name: cleanName,
            crm: cleanCrm,
            specialty: cleanSpecialty,
            phone: phone?.trim() || null,
          }
        });
      } catch (err) {
        console.warn('[Profile] Erro ao sincronizar metadata com Supabase:', err);
      }

      return NextResponse.json({
        success: true,
        user: updated,
        message: 'Perfil médico atualizado com sucesso!'
      });
    }

    if (user.role === 'PARTNER') {
      const { cnpj, name, tradeName, phone, address } = body;

      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'A Razão Social / Nome da empresa é obrigatório' }, { status: 400 });
      }

      const cleanCnpj = cnpj ? cnpj.replace(/\D/g, '') : null;
      if (cleanCnpj && cleanCnpj.length !== 14 && cleanCnpj.length !== 11) {
        return NextResponse.json({ error: 'CNPJ deve conter 14 dígitos (ou CPF com 11 dígitos)' }, { status: 400 });
      }

      const finalName = name.trim();
      const finalTradeName = tradeName?.trim() || finalName;

      const updated = await prisma.user.update({
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
        console.warn('[Profile] Erro ao sincronizar metadata com Supabase:', err);
      }

      return NextResponse.json({
        success: true,
        user: updated,
        message: 'Dados da empresa atualizados com sucesso!'
      });
    }

    return NextResponse.json({ error: 'Papel de usuário inválido' }, { status: 400 });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao atualizar dados' }, { status: 500 });
  }
}

