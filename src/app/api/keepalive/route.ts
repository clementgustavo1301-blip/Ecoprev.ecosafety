import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Executa a função do_keepalive_ping() que insere 1KB e limpa registros antigos
    const result: any = await prisma.$queryRawUnsafe(`SELECT do_keepalive_ping();`);

    return NextResponse.json({
      success: true,
      message: "Keepalive executado com sucesso (1KB inserido e reciclado).",
      details: result?.[0]?.do_keepalive_ping || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Keepalive error:", error);
    return NextResponse.json({
      success: false,
      error: "Falha ao executar keepalive no banco de dados."
    }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
