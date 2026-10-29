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

export interface ImagePayload {
  base64: string;
  mimeType: string;
  fileName?: string;
}

export interface AIAnalysisResult {
  suggestedCIDs: string;
  causalNexus: string;
  draftContent: string;
}

// ═══════════════════════════════════════════════
// ETAPA 1: Visão e Leitura de Imagens / OCR
// ═══════════════════════════════════════════════

const OCR_PROMPT = `Você é um médico perito especialista em análise de imagens diagnósticas e documentos médicos.
Analise esta imagem detalhadamente com rigor técnico.

Se for um DOCUMENTO de texto (atestado, exame laboratorial, receita, laudo de imagem):
- Extraia todo o texto visível com precisão literal.
- Identifique com destaque: Nome do paciente, data do exame/atendimento, médico emissor, CRM, CIDs explícitos, hipóteses diagnósticas e conclusões.
- Mantenha a descrição dos achados e da conclusão exatamente como no documento original.

Se for uma IMAGEM MÉDICA (Radiografia, Ressonância, Ultrassom, Tomografia, Foto de Lesão):
- Descreva detalhadamente os achados radiológicos objetivos observados diretamente na imagem.
- Aponte a região anatômica exata, existência ou não de fraturas (traço de fratura, alinhamento, cominuição), luxações, desvios ou alterações teciduais.
- Aponte o diagnóstico imagiológico correspondente.

Retorne APENAS o texto extraído e o laudo descritivo técnico da imagem. Não inclua saudações.`;

export async function extractTextFromImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  const genAI = getGenAI();
  const openai = getOpenAI();

  // Modelos Gemini testados com suporte a visão e OCR
  const geminiModels = [
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-flash-latest',
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
// ETAPA 2: Análise Médica Pericial com Visão Direta
// ═══════════════════════════════════════════════

const SYSTEM_PROMPT = `Você é um Médico Perito do Trabalho sênior (CFM / Perícia Médica Judicial), com vasta experiência em Medicina Ocupacional, avaliação de nexo técnico previdenciário e análise direta de exames de imagem radiológica e documentos clínicos.

Sua missão é emitir uma Minuta de Laudo Pericial Ocupacional com MÁXIMA PRECISÃO TÉCNICA E RIGOR FACTUAL, analisando diretamente a anamnese/queixa do trabalhador E AS IMAGENS/DOCUMENTOS ANEXADOS (radiografias, laudos de exames, atestados médicos, prontuários).

═══════════════════════════════════════════════════════════════════════
DIRETRIZES CRÍTICAS PARA DETERMINAÇÃO DE CID (PROIBIDO ALUCINAR):
═══════════════════════════════════════════════════════════════════════
1. PRECISÃO CIRÚRGICA NO CID:
   - Identifique APENAS o CID principal EXATO e COMPROVADO pelo exame de imagem ou pelo documento anexado.
   - NUNCA invente, presuma ou gere listas com múltiplos CIDs genéricos ou diferenciais (ex: NÃO liste contusões múltiplas, quedas de veículo, escoriações ou dores inespecíficas se houver um diagnóstico real estabelecido).
   - EXEMPLO PRÁTICO: Se o exame de imagem ou o laudo anexado diagnostica fratura de clavícula, o campo suggestedCIDs DEVE SER ESTRITAMENTE: "S42.0 - Fratura da clavícula". NÃO inclua CIDs adicionais de trauma superficial ou contusão.
   - Limite a no MÁXIMO 1 a 2 CIDs ESTRITAMENTE confirmados pelos achados documentais ou visuais.
   - Se os documentos/imagens NÃO apresentarem comprovação diagnóstica suficiente para um CID definitivo, declare: "Documentação inconclusiva para fixação de CID definitivo" ou utilize apenas o código do sintoma/queixa restrita relatada.

2. RIGOR FACTUAL E ANÁLISE DE IMAGEM:
   - NUNCA invente sintomas, datas, lesões ou tratamentos que não constem no relato ou nas imagens.
   - Descreva com fidelidade o que você observou visualmente no exame de imagem (topografia anatômica, traço de fratura, alinhamento, tecidos moles, integridade ou ausência de alterações) ou no documento médico apresentado.

Você DEVE retornar a resposta EXCLUSIVAMENTE em formato JSON com a seguinte estrutura:
{
  "suggestedCIDs": "CID(s) específicos e comprovados com código e descrição (ex: S42.0 - Fratura da clavícula). Sem listas genéricas.",
  "causalNexus": "Parecer técnico sucinto sobre a presença ou ausência de nexo causal/concausal entre o acidente/trabalho e a patologia comprovada.",
  "draftContent": "Conteúdo pericial completo redigido em Markdown estruturado."
}

Regras para o 'draftContent':
- Escrito em 3ª pessoa, tom estritamente pericial, forense e formal.
- Deve conter obrigatoriamente as 4 seções Markdown:
  ## 1. Histórico Profissional e Queixa Principal
  (Síntese fidedigna do relato do trabalhador, função exercida e dinâmica do evento)
  ## 2. Análise Documental e de Imagens
  (Descrição técnica detalhada dos exames de imagem e documentos anexados analisados visualmente pelo perito)
  ## 3. Discussão Técnica e Nexo Causal
  (Correlação biomecânica e ergonômica entre a atividade/acidente e o diagnóstico médico confirmado, fundamentando a presença de nexo causal, concausalidade ou doença degenerativa/preexistente)
  ## 4. Conclusão Pericial
  (Parecer pericial sobre aptidão laboral, grau de incapacidade - temporária ou permanente -, necessidade de afastamento previdenciário e recomendações terapêuticas/ocupacionais)
`;

/**
 * Envia o caso completo COM AS IMAGENS DIRETAS para a IA.
 * Provedor Primário: Google Gemini com Visão Multimodal (vê a imagem diretamente).
 * Fallback: OpenAI GPT-4o-mini (com visão) -> Groq (texto).
 */
export async function generateMedicalReport(
  patientName: string,
  companyName: string,
  caseDate: string,
  extractedDocumentsText: string,
  additionalNotes: string = '',
  images: ImagePayload[] = []
): Promise<AIAnalysisResult> {
  const caseContext = `
DADOS DO PACIENTE E DO CASO:
Paciente: ${patientName}
Empresa Solicitante: ${companyName}
Data da Avaliação: ${caseDate}

ANAMNESE / RELATO OCUPACIONAL:
${additionalNotes || 'Nenhuma queixa adicional informada.'}

TEXTO EXTRAÍDO DOS DOCUMENTOS / LAUDOS (OCR):
${extractedDocumentsText || 'Nenhum texto documental pré-extraído.'}

IMAGENS ANEXADAS:
${images.length > 0 ? `${images.length} imagem(ns) médica(s)/documento(s) anexados para análise visual direta.` : 'Nenhuma imagem anexada.'}
  `.trim();

  // ══════════════════════════════════════════════════════════════════════
  // 1. PROVEDOR PRIMÁRIO: GOOGLE GEMINI (VISÃO MULTIMODAL DIRETA DAS IMAGENS)
  // ══════════════════════════════════════════════════════════════════════
  const genAI = getGenAI();
  const geminiModels = [
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ];

  for (const modelName of geminiModels) {
    try {
      console.log(`[AI] Gerando laudo com Gemini Visão (${modelName})...`);
      const model = genAI.getGenerativeModel({ model: modelName });

      // Monta as partes do prompt: imagens como inlineData + contexto textual
      const parts: any[] = [];

      // Inclui as imagens diretamente para visualização do Gemini
      for (const img of images) {
        if (img.base64) {
          parts.push({
            inlineData: {
              mimeType: img.mimeType || 'image/jpeg',
              data: img.base64,
            },
          });
        }
      }

      // Adiciona o prompt do sistema e o contexto detalhado do caso
      parts.push({
        text: `${SYSTEM_PROMPT}\n\n═══════════════════════════════════════════════════\nDADOS DO CASO PARA ELABORAÇÃO DO LAUDO PERICIAL:\n═══════════════════════════════════════════════════\n${caseContext}`,
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);

      if (parsed.draftContent || parsed.suggestedCIDs) {
        console.log(`[AI] Sucesso com Gemini Visão (${modelName})`);
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

  // ══════════════════════════════════════════════════════════════════════
  // 2. SEGUNDO PROVEDOR: OPENAI GPT-4o-mini (COM SUPORTE A VISÃO)
  // ══════════════════════════════════════════════════════════════════════
  const openai = getOpenAI();
  try {
    console.log('[AI] Tentando OpenAI (gpt-4o-mini com visão)...');
    
    const userContentParts: any[] = [
      { type: 'text', text: `Analise os seguintes dados do caso e as imagens anexadas:\n\n${caseContext}` },
    ];

    for (const img of images) {
      if (img.base64) {
        userContentParts.push({
          type: 'image_url',
          image_url: {
            url: `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}`,
          },
        });
      }
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContentParts },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const responseText = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(responseText);

    if (parsed.draftContent || parsed.suggestedCIDs) {
      console.log('[AI] Sucesso com OpenAI (gpt-4o-mini)');
      return {
        suggestedCIDs: parsed.suggestedCIDs || 'Não identificado',
        causalNexus: parsed.causalNexus || 'Não identificado',
        draftContent: parsed.draftContent || responseText,
      };
    }
  } catch (openaiErr: any) {
    console.warn('[AI] OpenAI falhou:', openaiErr.message);
  }

  // ══════════════════════════════════════════════════════════════════════
  // 3. TERCEIRO PROVEDOR: GROQ (FALLBACK TEXTUAL RÁPIDO)
  // ══════════════════════════════════════════════════════════════════════
  const groq = getGroq();
  const groqModels = [
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
  ];

  for (const modelName of groqModels) {
    try {
      console.log(`[AI] Tentando Groq fallback textual (${modelName})...`);
      const response = await groq.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: 'Analise os seguintes dados do caso:\n' + caseContext },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const responseText = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(responseText);

      if (parsed.draftContent || parsed.suggestedCIDs) {
        console.log(`[AI] Sucesso com Groq fallback (${modelName})`);
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

  // ══════════════════════════════════════════════════════════════════════
  // 4. FALLBACK ESTRUTURADO DE EMERGÊNCIA
  // ══════════════════════════════════════════════════════════════════════
  return {
    suggestedCIDs: 'CID a definir pelo perito médico com base no exame de imagem',
    causalNexus: 'Necessária avaliação pericial presencial e documental complementar',
    draftContent: `## 1. Histórico Profissional e Queixa Principal
Paciente **${patientName}**, vinculado à empresa **${companyName}**.
- **Data da Avaliação:** ${caseDate}
- **Relato Inicial:** ${additionalNotes || 'Sem anamnese informada.'}

## 2. Análise Documental e de Imagens
${extractedDocumentsText || 'Exame de imagem ou documento anexado. Realizar leitura direta do arquivo anexado.'}

## 3. Discussão Técnica e Nexo Causal
O relato apresenta histórico de evento ocupacional. Para a fixação definitiva de nexo técnico causal ou concausal, faz-se necessária a validação clínica direta e verificação da integridade das estruturas anatômicas através dos exames de imagem anexados.

## 4. Conclusão Pericial
Minuta inicial gerada para suporte. O médico perito responsável deve revisar os exames de imagem anexados, confirmar o CID específico da lesão e homologar o parecer conclusivo.`,
  };
}
