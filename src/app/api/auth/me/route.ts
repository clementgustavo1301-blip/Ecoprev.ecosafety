import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  return NextResponse.json({
    authenticated: true,
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
    }
  });
}
