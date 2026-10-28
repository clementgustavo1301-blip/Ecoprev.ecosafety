import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { setSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { 
      email, 
      password, 
      name, 
      role, 
      crm, 
      specialty, 
      cnpj, 
      tradeName, 
      phone, 
      address 
    } = await req.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCnpj = cnpj ? cnpj.replace(/\D/g, '') : null;

    // Verificar se já existe no banco local
    const existingUser = await prisma.user.findFirst({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'E-mail já cadastrado na plataforma' }, { status: 400 });
    }

    // Se parceiro, verificar CNPJ
    if (role === 'PARTNER' && cleanCnpj) {
      const existingCnpj = await prisma.user.findFirst({
        where: { cnpj: cleanCnpj }
      });
      if (existingCnpj) {
        return NextResponse.json({ error: 'Este CNPJ já está cadastrado' }, { status: 400 });
      }
    }

    // Criar no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          name,
          role,
          crm: role === 'DOCTOR' ? crm : null,
          specialty: role === 'DOCTOR' ? (specialty || 'Medicina do Trabalho') : null,
          cnpj: role === 'PARTNER' ? cleanCnpj : null,
          tradeName: role === 'PARTNER' ? (tradeName || name) : null,
          phone: phone || null,
          address: address || null,
        }
      }
    });

    if (authError) {
      console.warn('Supabase auth.signUp aviso/erro:', authError.message);
      // Se for erro de já cadastrado no Supabase
      if (authError.message.toLowerCase().includes('already registered')) {
        return NextResponse.json({ error: 'E-mail já cadastrado no Supabase Auth' }, { status: 400 });
      }
    }

    const userId = authData?.user?.id || undefined;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email: cleanEmail,
        password: hashedPassword,
        name: name,
        role: role, // 'PARTNER' or 'DOCTOR'
        crm: role === 'DOCTOR' ? crm : null,
        specialty: role === 'DOCTOR' ? (specialty || 'Medicina do Trabalho') : null,
        cnpj: role === 'PARTNER' ? cleanCnpj : null,
        tradeName: role === 'PARTNER' ? (tradeName || name) : null,
        phone: phone || null,
        address: address || null,
      }
    });

    // Salvar sessão
    await setSession(newUser.id);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        crm: newUser.crm,
        specialty: newUser.specialty,
        cnpj: newUser.cnpj,
        tradeName: newUser.tradeName,
        phone: newUser.phone,
        address: newUser.address
      }
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: error.message || 'Erro ao registrar usuário' }, { status: 500 });
  }
}

