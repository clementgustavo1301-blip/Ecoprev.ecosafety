import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { setSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { email, password, role: reqRole } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Tentar autenticar primariamente com o Supabase Auth (a senha é verificada diretamente pelo Supabase)
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

    if (!supabaseUser) {
      let detailedMsg = 'Credenciais inválidas. Verifique seu e-mail e senha no Supabase Auth.';
      if (supabaseError) {
        if (supabaseError.message === 'Invalid login credentials') {
          detailedMsg = 'E-mail ou senha incorretos no Supabase Auth.';
        } else {
          detailedMsg = `Supabase: ${supabaseError.message}`;
        }
      }
      return NextResponse.json({ 
        error: detailedMsg,
        supabaseMessage: supabaseError?.message,
        supabaseCode: (supabaseError as any)?.code
      }, { status: 401 });
    }

    // 2. Sincronizar o usuário autenticado do Supabase com a tabela do Prisma (necessária para relações de Casos, Laudos e Perfil)
    let dbUser = await prisma.user.findFirst({
      where: { email: cleanEmail }
    });

    if (!dbUser) {
      // Primeira vez que o usuário loga: define o papel fixo com base na opção selecionada ou metadata
      const initialRole = (supabaseUser?.user_metadata?.role as any) || reqRole || 'PARTNER';
      const rawName = supabaseUser?.user_metadata?.name || 
                      supabaseUser?.user_metadata?.full_name || 
                      cleanEmail.split('@')[0];
      const targetName = initialRole === 'DOCTOR' && !rawName.startsWith('Dr') ? `Dr. ${rawName}` : rawName;

      dbUser = await prisma.user.create({
        data: {
          id: supabaseUser?.id || undefined,
          email: cleanEmail,
          name: targetName,
          role: initialRole,
          crm: supabaseUser?.user_metadata?.crm || null,
          specialty: supabaseUser?.user_metadata?.specialty || (initialRole === 'DOCTOR' ? 'Medicina do Trabalho' : null),
          cnpj: supabaseUser?.user_metadata?.cnpj || null,
          tradeName: supabaseUser?.user_metadata?.tradeName || targetName,
          phone: supabaseUser?.user_metadata?.phone || null,
          address: supabaseUser?.user_metadata?.address || null,
        }
      });
    } else {
      // Se o perfil foi alterado no Supabase Auth (User Metadata), sincronizar para o banco
      const metadataRole = supabaseUser?.user_metadata?.role;
      if (metadataRole && (metadataRole === 'PARTNER' || metadataRole === 'DOCTOR') && dbUser.role !== metadataRole) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { role: metadataRole }
        });
      }

      // Validar estritamente: o usuário SÓ pode acessar o ambiente do seu perfil configurado no banco de dados
      if (reqRole && dbUser.role && dbUser.role !== reqRole) {
        const perfilCadastrado = dbUser.role === 'DOCTOR' ? 'Médico Perito' : 'Empresa Parceira';
        const perfilTentado = reqRole === 'DOCTOR' ? 'Médico Perito' : 'Empresa Parceira';

        return NextResponse.json({ 
          error: `Acesso negado: esta conta está cadastrada no banco de dados como ${perfilCadastrado} e não possui permissão para acessar o painel de ${perfilTentado}.` 
        }, { status: 403 });
      }
    }

    // Salvar sessão HTTP-Only via cookie com o ID do usuário
    await setSession(dbUser.id);

    // 3. Verificar se é necessário completar cadastro (Primeiro Login)
    const isDoctor = dbUser.role === 'DOCTOR';
    const isPartner = dbUser.role === 'PARTNER';

    const isDoctorIncomplete = isDoctor && (
      !dbUser.crm ||
      dbUser.crm.trim() === '' ||
      dbUser.crm.toUpperCase() === 'CRM/SP A DEFINIR' ||
      !dbUser.name ||
      dbUser.name.trim() === '' ||
      dbUser.name === cleanEmail.split('@')[0]
    );

    const isPartnerIncomplete = isPartner && (
      !dbUser.cnpj ||
      dbUser.cnpj.trim() === ''
    );

    const requiresOnboarding = isDoctorIncomplete || isPartnerIncomplete;

    return NextResponse.json({
      success: true,
      requiresOnboarding,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        crm: dbUser.crm,
        specialty: dbUser.specialty,
        cnpj: dbUser.cnpj,
        tradeName: dbUser.tradeName,
        phone: dbUser.phone,
        address: dbUser.address,
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar login' }, { status: 500 });
  }
}
