import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { setSession } from '@/lib/auth';
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

    // Check if user already exists by email
    const existingUser = await prisma.user.findFirst({
      where: {
        email: cleanEmail
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'E-mail já cadastrado na plataforma' }, { status: 400 });
    }

    // If Partner, check if CNPJ already registered
    if (role === 'PARTNER' && cleanCnpj) {
      const existingCnpj = await prisma.user.findFirst({
        where: { cnpj: cleanCnpj }
      });
      if (existingCnpj) {
        return NextResponse.json({ error: 'Este CNPJ já está cadastrado' }, { status: 400 });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
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

    // Automatically set session
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
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Erro ao registrar usuário' }, { status: 500 });
  }
}
