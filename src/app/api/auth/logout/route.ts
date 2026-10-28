import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    await supabase.auth.signOut().catch(() => {});
    await clearSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Erro ao sair' }, { status: 500 });
  }
}
