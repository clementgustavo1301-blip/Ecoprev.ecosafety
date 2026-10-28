import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { setSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, role: reqRole } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Tentar autenticar primariamente com o Supabase Auth
    let supabaseUser: any = null;
    const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    });

    if (!supabaseError && supabaseData?.user) {
      supabaseUser = supabaseData.user;
    }

    // Se houve erro no Supabase, verificar se é caso de e-mail não confirmado
    if (supabaseError) {
      const errMsg = supabaseError.message || '';
      if (
        errMsg.toLowerCase().includes('confirm') || 
        errMsg.toLowerCase().includes('not confirmed') ||
        (supabaseError as any).code === 'email_not_confirmed'
      ) {
        return NextResponse.json({ 
          error: 'E-mail não confirmado no Supabase. No painel do Supabase > Authentication > Users, confirme o usuário ou habilite "Auto Confirm User".' 
        }, { status: 403 });
      }
    }

    // 2. Se o Supabase Auth falhou (usuário não existe lá ou credenciais erradas),
    // verificar fallback local no Prisma (ex: usuários criados via seed ou anteriormente)
    let dbUser = await prisma.user.findFirst({
      where: { email: cleanEmail }
    });

    let authenticated = false;

    if (supabaseUser) {
      authenticated = true;
    } else if (dbUser && dbUser.password) {
      const isValid = await bcrypt.compare(password, dbUser.password);
      if (isValid) {
        authenticated = true;
      }
    }

    if (!authenticated) {
      return NextResponse.json({ 
        error: 'Credenciais inválidas. Verifique seu e-mail e senha no Supabase Auth.' 
      }, { status: 401 });
    }

    // 3. Sincronizar o usuário autenticado do Supabase com a tabela do Prisma (necessária para relações de Casos, Laudos e Perfil)
    const targetRole = reqRole || supabaseUser?.user_metadata?.role || dbUser?.role || 'PARTNER';
    const rawName = supabaseUser?.user_metadata?.name || 
                    supabaseUser?.user_metadata?.full_name || 
                    dbUser?.name || 
                    cleanEmail.split('@')[0];
    const targetName = targetRole === 'DOCTOR' && !rawName.startsWith('Dr') ? `Dr. ${rawName}` : rawName;

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: supabaseUser?.id || undefined,
          email: cleanEmail,
          name: targetName,
          role: targetRole,
          crm: supabaseUser?.user_metadata?.crm || (targetRole === 'DOCTOR' ? 'CRM/SP A Definir' : null),
          specialty: supabaseUser?.user_metadata?.specialty || (targetRole === 'DOCTOR' ? 'Medicina do Trabalho' : null),
          cnpj: supabaseUser?.user_metadata?.cnpj || null,
          tradeName: supabaseUser?.user_metadata?.tradeName || targetName,
          phone: supabaseUser?.user_metadata?.phone || null,
          address: supabaseUser?.user_metadata?.address || null,
          password: hashedPassword,
        }
      });
    } else {
      // Atualizar dados se necessário (ex: papel ou sincronização de senha)
      const dataToUpdate: any = { password: hashedPassword };
      if (reqRole && dbUser.role !== reqRole) {
        dataToUpdate.role = reqRole;
      }
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: dataToUpdate
      });
    }

    // Salvar sessão HTTP-Only via cookie com o ID do usuário
    await setSession(dbUser.id);

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        crm: dbUser.crm,
        specialty: dbUser.specialty
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar login' }, { status: 500 });
  }
}

