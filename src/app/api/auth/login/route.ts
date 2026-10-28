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

    // 3. Sincronizar o usuário autenticado do Supabase com a tabela do Prisma (necessária para relações de Casos, Laudos e Perfil)
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!dbUser) {
      // Primeira vez que o usuário loga: define o papel fixo com base na opção selecionada ou metadata
      const initialRole = supabaseUser?.user_metadata?.role || reqRole || 'PARTNER';
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
          crm: supabaseUser?.user_metadata?.crm || (initialRole === 'DOCTOR' ? 'CRM/SP A Definir' : null),
          specialty: supabaseUser?.user_metadata?.specialty || (initialRole === 'DOCTOR' ? 'Medicina do Trabalho' : null),
          cnpj: supabaseUser?.user_metadata?.cnpj || null,
          tradeName: supabaseUser?.user_metadata?.tradeName || targetName,
          phone: supabaseUser?.user_metadata?.phone || null,
          address: supabaseUser?.user_metadata?.address || null,
          password: hashedPassword,
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

      // Manter a senha sincronizada
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { password: hashedPassword }
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

