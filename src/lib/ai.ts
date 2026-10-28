import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// ═══════════════════════════════════════════════
// CLIENTS (Lazy getters to prevent build-time missing env var errors)
// ═══════════════════════════════════════════════

function getGenAI() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
}

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy_key_to_prevent_build_error',
  });
}

function getGroq() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY || 'dummy_key_to_prevent_build_error',
    baseURL: 'https://api.groq.com/openai/v1',
  });
}

// ═══════════════════════════════════════════════
// ETAPA 1: Visão e Leitura de Imagens / OCR
// ═══════════════════════════════════════════════

const OCR_PROMPT = `Você é um perito médico especializado em análise de imagens e documentos.
Analise esta imagem detalhadamente.

Se for um DOCUMENTO de texto (atestado, exame laboratorial, receita, laudo):
- Extraia todo o texto visível com precisão, mantendo a estrutura original.
- Identifique o nome do paciente, datas, médicos, CIDs, diagnósticos, carimbos e assinaturas.
- Se houver tabela ou resultados de exame, organize em formato legível.

Se for uma IMAGEM MÉDICA (Radiografia, Ressonância, Ultrassom, Tomografia, Foto Clínica):
- Descreva detalhadamente o que você está vendo.
- Aponte possíveis lesões, fraturas, alterações degenerativas, inflamações ou anormalidades visíveis.
- Descreva a região anatômica exibida e os achados técnicos.
- Use terminologia médica e radiológica apropriada.

Se for qualquer outro tipo de comprovante, descreva a imagem e seu contexto.

Retorne APENAS a extração do texto ou o laudo descritivo da imagem. Não inclua saudações.`;

export async function extractTextFromImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  const genAI = getGenAI();
  const openai = getOpenAI();

  // Modelos Gemini com suporte a visão e OCR
  const geminiModels = [
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
    'gemini-3-flash-preview',
  ];

  for (const modelName of geminiModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        },
        { text: OCR_PROMPT },
      ]);
      const response = result.response;
      const text = response.text();
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err: any) {
      console.warn(`[OCR] Gemini (${modelName}) falhou:`, err.message);
    }
  }

  // Fallback para OpenAI se disponível
  try {
    console.warn('[OCR] Tentando fallback OpenAI (gpt-4o-mini)...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: OCR_PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
    });
    const content = response.choices[0].message.content;
    if (content) return content;
  } catch (openaiErr: any) {
    console.warn('[OCR] OpenAI Fallback falhou:', openaiErr.message);
  }

  return 'Documento de imagem anexado pelo usuário. Verifique o arquivo original para leitura detalhada dos termos e diagnósticos.';
}

/**
 * Processa múltiplas imagens e retorna o texto extraído de cada uma.
 */
export async function extractTextFromMultipleImages(
  images: Array<{ base64: string; mimeType: string; fileName: string }>
): Promise<string> {
  const results: string[] = [];

  for (const image of images) {
    try {
      const text = await extractTextFromImage(image.base64, image.mimeType);
      results.push(`\n📄 Documento: ${image.fileName}\n${'─'.repeat(40)}\n${text}`);
    } catch (error) {
      results.push(`\n📄 Documento: ${image.fileName}\n[Leitura direta indisponível: ${(error as Error).message}]`);
    }
  }

  return results.join('\n\n');
}

// ═══════════════════════════════════════════════
// ETAPA 2: Análise Médica Pericial Estruturada
// ═══════════════════════════════════════════════

const SYSTEM_PROMPT = `Você é um Médico Perito do Trabalho sênior, com vasta experiência em perícias judiciais e análise documental ocupacional.

Sua função é analisar as queixas, o histórico laboral (anamnese) e os documentos anexados (exames, atestados) para produzir uma Minuta de Parecer Pericial Ocupacional altamente detalhada, técnica e estruturada.

Você deve retornar EXATAMENTE no formato JSON abaixo, sem markdown de bloco de código no início ou fim:

{
  "suggestedCIDs": "Lista de CIDs sugeridos com código e descrição (ex: M54.5 - Dor lombar baixa), separados por vírgula",
  "causalNexus": "Resumo técnico sobre a existência ou não de nexo causal/concausal entre a atividade laboral e a patologia",
  "draftContent": "O conteúdo completo do relatório em formato Markdown"
}

Regras para o 'draftContent' (O Relatório):
- O texto deve ser extremamente técnico e escrito em 3ª pessoa.
- ATENÇÃO MÁXIMA: NUNCA invente sintomas, lesões, dores, fraturas ou exames que não estejam explicitamente descritos no input (Anamnese ou Documentos Anexados). Trabalhe APENAS com os fatos fornecidos. Se a informação for vaga, mantenha-a vaga de forma técnica.
- Use formatação Markdown (## para seções, ** para negrito, - para listas).
- O relatório DEVE conter obrigatoriamente as seguintes seções:
  ## 1. Histórico Profissional e Queixa Principal
  (Resuma a anamnese, atividades exercidas pelo trabalhador e as queixas relatadas de forma fidedigna ao input)
  ## 2. Análise Documental
  (Liste e descreva tecnicamente os achados dos documentos fornecidos. Se não houver documento ou achado, informe explicitamente)
  ## 3. Discussão Técnica e Nexo Causal
  (Faça uma correlação biomecânica/ergonômica ou toxicológica entre o trabalho relatado e os achados médicos APRESENTADOS. Discuta se há nexo causal, concausal ou se é doença degenerativa/preexistente)
  ## 4. Conclusão Pericial
  (Parecer final conclusivo sobre aptidão, incapacidade temporária/permanente, necessidade de afastamento ao INSS ou reabilitação)
- Se faltarem informações clínicas ou documentais, aponte isso explicitamente como "Documentação insuficiente para análise clínica completa" ou "Relato escasso de sintomas".`;

export interface AIAnalysisResult {
  suggestedCIDs: string;
  causalNexus: string;
  draftContent: string;
}

/**
 * Envia o texto extraído dos documentos + contexto do caso para a IA
 * e recebe a minuta pericial estruturada com fallback multi-provedor (Groq, Gemini, OpenAI).
 */
export async function generateMedicalReport(
  patientName: string,
  companyName: string,
  caseDate: string,
  extractedDocumentsText: string,
  additionalNotes: string = ''
): Promise<AIAnalysisResult> {
  const combinedText = `
DADOS DO PACIENTE:
Nome: ${patientName}
Empresa: ${companyName}
Data: ${caseDate}

ANAMNESE / RELATO (Notas adicionais):
${additionalNotes || 'Não informado'}

DOCUMENTOS ANEXADOS:
${extractedDocumentsText || 'Nenhum documento textual disponível.'}
  `;

  // ── 1. PROVEDOR PRIMÁRIO: GROQ (Ultra-rápido, modelos modernos de raciocínio) ──
  const groq = getGroq();
  const groqModels = [
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
  ];

  for (const modelName of groqModels) {
    try {
      console.log(`[AI] Tentando Groq (${modelName})...`);
      const response = await groq.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: 'Analise os seguintes dados do caso:\n' + combinedText },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const responseText = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(responseText);

      if (parsed.draftContent || parsed.suggestedCIDs) {
        console.log(`[AI] Sucesso com Groq (${modelName})`);
        return {
          suggestedCIDs: parsed.suggestedCIDs || 'Não identificado',
          causalNexus: parsed.causalNexus || 'Não identificado',
          draftContent: parsed.draftContent || responseText,
        };
      }
    } catch (groqErr: any) {
      console.warn(`[AI] Groq (${modelName}) falhou:`, groqErr.message);
    }
  }

  // ── 2. SEGUNDO PROVEDOR: GOOGLE GEMINI ──
  const genAI = getGenAI();
  const geminiModels = [
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
    'gemini-3-flash-preview',
  ];

  for (const modelName of geminiModels) {
    try {
      console.log(`[AI] Tentando Gemini (${modelName})...`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\nAnalise os seguintes dados do caso:\n' + combinedText }] },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);

      if (parsed.draftContent || parsed.suggestedCIDs) {
        console.log(`[AI] Sucesso com Gemini (${modelName})`);
        return {
          suggestedCIDs: parsed.suggestedCIDs || 'Não identificado',
          causalNexus: parsed.causalNexus || 'Não identificado',
          draftContent: parsed.draftContent || responseText,
        };
      }
    } catch (geminiErr: any) {
      console.warn(`[AI] Gemini (${modelName}) falhou:`, geminiErr.message);
    }
  }

  // ── 3. TERCEIRO PROVEDOR: OPENAI GPT-4o-mini ──
  const openai = getOpenAI();
  try {
    console.log('[AI] Tentando OpenAI (gpt-4o-mini)...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'Analise os seguintes dados do caso:\n' + combinedText },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const responseText = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(responseText);

    return {
      suggestedCIDs: parsed.suggestedCIDs || 'Não identificado',
      causalNexus: parsed.causalNexus || 'Não identificado',
      draftContent: parsed.draftContent || responseText,
    };
  } catch (openaiErr: any) {
    console.warn('[AI] OpenAI falhou:', openaiErr.message);
  }

  // ── 4. FALLBACK ESTRUTURADO DE EMERGÊNCIA ──
  return {
    suggestedCIDs: 'CID a definir pelo perito médico',
    causalNexus: 'Necessária avaliação pericial complementar',
    draftContent: `## 1. Histórico Profissional e Queixa Principal
Paciente **${patientName}**, vinculado à empresa **${companyName}**.
- **Relato Inicial:** ${additionalNotes || 'Sem anamnese informada.'}

## 2. Análise Documental
${extractedDocumentsText || 'Nenhum documento textual disponível no momento.'}

## 3. Discussão Técnica e Nexo Causal
O relato apresenta dados que necessitam de correlação médica presencial ou documental complementar para a consolidação técnica do nexo de causalidade ou concausalidade.

## 4. Conclusão Pericial
Minuta inicial gerada para suporte. O médico perito responsável deve revisar as informações clínicas, adicionar o CID específico e emitir o parecer conclusivo.`,
  };
}
