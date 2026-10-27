import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cnpj: string }> }
) {
  try {
    const { cnpj: rawCnpj } = await params;
    const cleanCnpj = rawCnpj.replace(/\D/g, '');

    if (cleanCnpj.length !== 14) {
      return NextResponse.json(
        { error: 'CNPJ deve conter 14 dígitos numéricos' },
        { status: 400 }
      );
    }

    // 1. Tentar BrasilAPI primeiro
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EcoPrev/1.0',
        },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const data = await res.json();
        const addressParts = [
          data.logradouro ? `${data.descricao_tipo_de_logradouro ? data.descricao_tipo_de_logradouro + ' ' : ''}${data.logradouro}` : '',
          data.numero ? `nº ${data.numero}` : '',
          data.complemento || '',
          data.bairro ? `Bairro ${data.bairro}` : '',
          data.municipio && data.uf ? `${data.municipio}/${data.uf}` : '',
          data.cep ? `CEP ${data.cep}` : '',
        ].filter(Boolean).join(', ');

        return NextResponse.json({
          success: true,
          cnpj: cleanCnpj,
          companyName: data.razao_social || '',
          tradeName: data.nome_fantasia || data.razao_social || '',
          email: data.email || '',
          phone: data.ddd_telefone_1 || data.telefone || '',
          address: addressParts,
          status: data.descricao_situacao_cadastral || 'ATIVA',
          activity: data.cnae_fiscal_descricao || '',
        });
      }
    } catch (bErr) {
      console.warn('BrasilAPI falhou, tentando fallback ReceitaWS:', bErr);
    }

    // 2. Fallback: ReceitaWS
    try {
      const res = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanCnpj}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EcoPrev/1.0',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ERROR') {
          return NextResponse.json({ error: data.message || 'CNPJ não encontrado' }, { status: 404 });
        }

        const addressParts = [
          data.logradouro || '',
          data.numero ? `nº ${data.numero}` : '',
          data.complemento || '',
          data.bairro ? `Bairro ${data.bairro}` : '',
          data.municipio && data.uf ? `${data.municipio}/${data.uf}` : '',
          data.cep ? `CEP ${data.cep}` : '',
        ].filter(Boolean).join(', ');

        return NextResponse.json({
          success: true,
          cnpj: cleanCnpj,
          companyName: data.nome || '',
          tradeName: data.fantasia || data.nome || '',
          email: data.email || '',
          phone: data.telefone || '',
          address: addressParts,
          status: data.situacao || 'ATIVA',
          activity: data.atividade_principal?.[0]?.text || '',
        });
      }
    } catch (rErr) {
      console.error('ReceitaWS também falhou:', rErr);
    }

    return NextResponse.json(
      { error: 'Não foi possível consultar os dados do CNPJ no momento' },
      { status: 502 }
    );
  } catch (error) {
    console.error('Erro geral ao consultar CNPJ:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar consulta de CNPJ' },
      { status: 500 }
    );
  }
}
