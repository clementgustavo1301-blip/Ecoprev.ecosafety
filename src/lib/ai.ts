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
    baseURL: "https://api.groq.com/openai/v1",
  });
}

// ═══════════════════════════════════════════════
// ETAPA 1: Gemini Vision — Leitura de Imagens/OCR
// ═══════════════════════════════════════════════

/**
 * Usa o Gemini 2.0 Flash para extrair texto de uma imagem de documento médico.
 * Aceita base64 ou URL da imagem.
 */
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
  const groq = getGroq();

  const geminiModels = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.7-flash'];

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
      return response.text();
    } catch (err: any) {
      console.warn(`Failed with ${modelName} in extractTextFromImage:`, err.message);
    }
  }

  console.warn("All Gemini models failed. Falling back to OpenAI (gpt-4o-mini).");
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: OCR_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
    });
    return response.choices[0].message.content || "";
  } catch (openaiErr: any) {
    console.warn("OpenAI Fallback failed in extractTextFromImage:", openaiErr.message);
    
    console.warn("Falling back to Groq (Llama 3.2 Vision).");
    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.2-90b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: OCR_PROMPT },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
      });
      return response.choices[0].message.content || "";
    } catch (groqErr: any) {
      console.error("Groq Fallback failed in extractTextFromImage:", groqErr.message);
      throw groqErr;
    }
  }
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
      results.push(`\n📄 Documento: ${image.fileName}\n[Erro na leitura: ${(error as Error).message}]`);
    }
  }

  return results.join('\n\n');
}

// ═══════════════════════════════════════════════
// ETAPA 2: OpenAI GPT-4o — Análise Médica Pericial
// ═══════════════════════════════════════════════

const SYSTEM_PROMPT = `Você é um Médico Perito do Trabalho sênior, com vasta experiência em perícias judiciais e análise documental ocupacional.

Sua função é analisar as queixas, o histórico laboral (anamnese) e os documentos anexados (exames, atestados) para produzir uma Minuta de Parecer Pericial Ocupacional altamenta detalhada, técnica e estruturada.

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
 * e recebe a minuta pericial estruturada.
 */
export async function generateMedicalReport(
  patientName: string,
  companyName: string,
  caseDate: string,
  extractedDocumentsText: string,
  additionalNotes: string = ''
): Promise<AIAnalysisResult> {
  const genAI = getGenAI();
  const openai = getOpenAI();
  const groq = getGroq();

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

  const geminiModels = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.7-flash'];

  for (const modelName of geminiModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: SYSTEM_PROMPT + "\n\nAnalise os seguintes dados do caso:\n" + combinedText }] }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      });

      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);
      return {
        suggestedCIDs: parsed.suggestedCIDs || 'Não identificado',
        causalNexus: parsed.causalNexus || 'Não identificado',
        draftContent: parsed.draftContent || responseText,
      };
    } catch (error: any) {
      console.warn(`Failed with ${modelName} in generateMedicalReport:`, error.message);
    }
  }

  console.warn("All Gemini models failed. Falling back to OpenAI (gpt-4o-mini).");
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: "Analise os seguintes dados do caso:\n" + combinedText
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const responseText = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(responseText);
    return {
      suggestedCIDs: parsed.suggestedCIDs || 'Não identificado',
      causalNexus: parsed.causalNexus || 'Não identificado',
      draftContent: parsed.draftContent || responseText,
    };
  } catch (openaiErr: any) {
    console.warn("OpenAI Fallback failed in generateMedicalReport:", openaiErr.message);
    
    console.warn("Falling back to Groq (Llama 3.1 8B).");
    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: "Analise os seguintes dados do caso:\n" + combinedText
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      });
      
      const responseText = response.choices[0].message.content || "{}";
      const parsed = JSON.parse(responseText);
      return {
        suggestedCIDs: parsed.suggestedCIDs || 'Não identificado',
        causalNexus: parsed.causalNexus || 'Não identificado',
        draftContent: parsed.draftContent || responseText,
      };
    } catch (groqErr: any) {
      console.error("Groq Fallback failed in generateMedicalReport:", groqErr);
      return {
        suggestedCIDs: 'Análise automática falhou — verificar no relatório',
        causalNexus: 'Análise automática falhou — verificar no relatório',
        draftContent: `Falha na geração da IA após esgotar TODOS os modelos (Gemini, OpenAI e Groq): ${groqErr.message}. Por favor, crie o laudo manualmente.`,
      };
    }
  }
}
