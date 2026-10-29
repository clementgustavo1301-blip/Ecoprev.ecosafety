import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateMedicalReport, extractTextFromMultipleImages, ImagePayload } from '@/lib/ai';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { caseId } = await req.json();

    if (!caseId) {
      return NextResponse.json({ error: "caseId é obrigatório" }, { status: 400 });
    }

    // Buscar o caso e documentos relacionados
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: { 
        documents: true,
        partner: { select: { name: true } }
      }
    });

    if (!caseData) {
      return NextResponse.json({ error: "Caso não encontrado" }, { status: 404 });
    }

    // Atualizar status para PROCESSING_AI
    await prisma.case.update({
      where: { id: caseId },
      data: { status: 'PROCESSING_AI' }
    });

    // Processar os documentos com a visão da IA (OCR + Análise Direta de Imagem)
    let extractedDocumentsText = 'Nenhum documento textual disponível.';
    const imagesPayload: ImagePayload[] = [];
    
    if (caseData.documents.length > 0) {
      for (const doc of caseData.documents) {
        if (!doc.url) continue;
        
        try {
          let base64 = '';
          
          if (doc.url.startsWith('http')) {
            // It's a remote URL (Supabase)
            const response = await fetch(doc.url);
            if (!response.ok) throw new Error(`Failed to fetch ${doc.url}: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();
            base64 = Buffer.from(arrayBuffer).toString('base64');
          } else {
            // Fallback for old local files during MVP transition
            const filePath = join(process.cwd(), 'public', doc.url);
            const fileBuffer = await readFile(filePath);
            base64 = fileBuffer.toString('base64');
          }
          
          let mimeType = 'image/jpeg';
          const lower = doc.url.toLowerCase();
          if (lower.endsWith('.png')) mimeType = 'image/png';
          if (lower.endsWith('.pdf')) mimeType = 'application/pdf';
          if (lower.endsWith('.webp')) mimeType = 'image/webp';
          
          imagesPayload.push({
            base64,
            mimeType,
            fileName: doc.url.split('/').pop() || 'documento'
          });
        } catch (fileErr) {
          console.error(`Falha ao ler arquivo ${doc.url}:`, fileErr);
        }
      }

      if (imagesPayload.length > 0) {
        extractedDocumentsText = await extractTextFromMultipleImages(
          imagesPayload.map(img => ({
            base64: img.base64,
            mimeType: img.mimeType,
            fileName: img.fileName || 'documento'
          }))
        );
      }
    }

    // Chamar o pipeline de IA com Gemini primário (visão multimodal direta das imagens + anamnese)
    const result = await generateMedicalReport(
      caseData.patientName,
      caseData.partner?.name || 'Não informada',
      caseData.createdAt.toLocaleDateString('pt-BR'),
      extractedDocumentsText,
      caseData.anamnesis || '',
      imagesPayload
    );

    // Criar ou atualizar o relatório no banco (upsert)
    await prisma.report.upsert({
      where: { caseId },
      create: {
        caseId,
        suggestedCIDs: result.suggestedCIDs,
        causalNexus: result.causalNexus,
        finalContent: result.draftContent,
      },
      update: {
        suggestedCIDs: result.suggestedCIDs,
        causalNexus: result.causalNexus,
        finalContent: result.draftContent,
      }
    });

    // Atualizar status para PENDING_REVIEW
    await prisma.case.update({
      where: { id: caseId },
      data: { status: 'PENDING_REVIEW' }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Minuta pericial gerada com sucesso via Gemini Visão'
    });
  } catch (error: any) {
    console.error("Erro no processamento IA:", error);
    return NextResponse.json({ 
      error: "Falha no processamento da IA", 
      details: error?.message || 'Erro desconhecido'
    }, { status: 500 });
  }
}
