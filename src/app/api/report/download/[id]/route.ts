import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: caseId } = await params;
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: { report: true, partner: true }
    });

    if (!caseData || !caseData.report || caseData.status !== 'COMPLETED') {
      return NextResponse.json({ error: "Report not found or not completed" }, { status: 404 });
    }

    if (user.role === 'PARTNER' && caseData.partnerId !== user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // A beautiful, highly professional medical-legal report template.
    // Uses 'marked' to render the AI's markdown safely and elegantly.
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Laudo Pericial Ocupacional - ${caseData.patientName}</title>
          <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            :root {
              --brand: #10a37f;
              --brand-dark: #065f46;
              --text-main: #0f172a;
              --text-muted: #475569;
              --border: #e2e8f0;
            }

            * {
              box-sizing: border-box;
            }

            body { 
              font-family: 'Inter', -apple-system, sans-serif; 
              padding: 0; 
              margin: 0; 
              color: var(--text-main); 
              background: #f8fafc; 
            }
            
            .a4-page {
              max-width: 210mm;
              min-height: 297mm;
              margin: 40px auto;
              background: #ffffff;
              padding: 60px 50px;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
              position: relative;
            }

            /* Watermark / Background Logo */
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-size: 180px;
              color: rgba(16, 163, 127, 0.03);
              font-weight: 900;
              z-index: 0;
              pointer-events: none;
              user-select: none;
            }

            .content-wrapper {
              position: relative;
              z-index: 1;
            }

            /* Header Section */
            .header { 
              border-bottom: 3px solid var(--brand); 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-end; 
            }
            .brand-name { 
              color: var(--brand-dark); 
              margin: 0; 
              font-size: 26px; 
              font-weight: 800; 
              letter-spacing: -0.02em; 
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .brand-name span { color: var(--brand); }
            .brand-sub { 
              margin: 4px 0 0 0; 
              color: var(--text-muted); 
              font-size: 13px;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.05em; 
            }
            .protocol-box {
              text-align: right;
            }
            .protocol-box .label {
              font-size: 10px;
              text-transform: uppercase;
              color: var(--text-muted);
              font-weight: 700;
              letter-spacing: 0.05em;
              display: block;
            }
            .protocol-box .value {
              font-size: 16px;
              font-family: monospace;
              color: var(--brand-dark);
              font-weight: 600;
            }

            /* Patient Info Box */
            .meta-box { 
              background: #f8fafc; 
              border: 1px solid var(--border); 
              border-radius: 8px; 
              padding: 20px; 
              margin-bottom: 30px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
            .meta-item {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }
            .meta-item .label {
              font-size: 11px;
              text-transform: uppercase;
              color: var(--text-muted);
              font-weight: 600;
              letter-spacing: 0.05em;
            }
            .meta-item .value {
              font-size: 14px;
              color: var(--text-main);
              font-weight: 500;
            }

            /* Title */
            .doc-title {
              text-align: center;
              font-size: 20px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin: 40px 0 30px;
              color: var(--text-main);
            }

            /* Markdown Content Styles */
            .markdown-content { 
              font-size: 14px; 
              color: #1e293b; 
              line-height: 1.8; 
            }
            .markdown-content h1, .markdown-content h2, .markdown-content h3 {
              color: var(--brand-dark);
              margin-top: 1.5em;
              margin-bottom: 0.5em;
              font-weight: 700;
            }
            .markdown-content h2 {
              font-size: 16px;
              border-bottom: 1px solid var(--border);
              padding-bottom: 6px;
              text-transform: uppercase;
              letter-spacing: 0.03em;
            }
            .markdown-content p {
              margin-bottom: 1em;
              text-align: justify;
            }
            .markdown-content ul {
              margin-bottom: 1em;
              padding-left: 20px;
            }
            .markdown-content li {
              margin-bottom: 0.5em;
            }
            .markdown-content strong {
              color: var(--text-main);
              font-weight: 600;
            }

            /* Footer & Signature */
            .footer { 
              margin-top: 60px; 
              padding-top: 40px; 
              display: flex;
              flex-direction: column;
              align-items: center;
              page-break-inside: avoid;
            }
            .signature-line {
              width: 300px;
              border-bottom: 1px solid var(--text-main);
              margin-bottom: 12px;
            }
            .signature-box { 
              text-align: center;
            }
            .doctor-name { 
              color: var(--text-main); 
              font-size: 16px; 
              font-weight: 700; 
            }
            .doctor-crm { 
              color: var(--text-muted); 
              font-size: 13px; 
              font-weight: 500; 
              margin-top: 4px;
            }
            
            .auth-seal {
              margin-top: 24px;
              padding: 12px 24px;
              background: #f0fdf4;
              border: 1px dashed var(--brand);
              border-radius: 4px;
              display: inline-flex;
              align-items: center;
              gap: 12px;
            }
            .auth-seal svg {
              width: 24px;
              height: 24px;
              color: var(--brand);
            }
            .auth-seal-text {
              text-align: left;
            }
            .auth-seal-title {
              color: var(--brand-dark);
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .auth-seal-date {
              color: var(--text-muted);
              font-size: 11px;
              margin-top: 2px;
              font-family: monospace;
            }

            .legal-disclaimer {
              margin-top: 40px;
              text-align: center;
              color: #94a3b8;
              font-size: 10px;
              line-height: 1.5;
              border-top: 1px solid var(--border);
              padding-top: 16px;
            }
          </style>
        </head>
        <body>
          <div class="a4-page" id="report-page">
            <div class="watermark">EcoPrev</div>
            
            <div class="content-wrapper">
              <div class="header">
                <div class="title-area">
                  <h1 class="brand-name">Eco<span>Prev</span></h1>
                  <p class="brand-sub">Departamento Pericial e Saúde Ocupacional</p>
                </div>
                <div class="protocol-box">
                  <span class="label">Protocolo Eletrônico</span>
                  <span class="value">#${caseData.id.slice(-8).toUpperCase()}</span>
                </div>
              </div>
              
              <div class="meta-box">
                <div class="meta-item">
                  <span class="label">Paciente Avaliado</span>
                  <span class="value">${caseData.patientName}</span>
                </div>
                <div class="meta-item">
                  <span class="label">Empresa Solicitante</span>
                  <span class="value">${caseData.partner.name || 'Não informada'}</span>
                </div>
                <div class="meta-item">
                  <span class="label">Data da Análise</span>
                  <span class="value">${new Date(caseData.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <div class="meta-item">
                  <span class="label">CID-10 Principal (Sugerido)</span>
                  <span class="value" style="color: var(--brand-dark); font-weight: 600;">${caseData.report.suggestedCIDs || 'Não especificado'}</span>
                </div>
              </div>
              
              <div class="doc-title">Parecer Técnico Médico-Pericial</div>
              
              <div class="markdown-content" id="md-content">
                <!-- Markdown content will be rendered here -->
              </div>
              
              <div class="footer">
                <div class="signature-line"></div>
                <div class="signature-box">
                  <div class="doctor-name">${caseData.report.signedByDoctorName || 'Dr. Médico Perito'}</div>
                  <div class="doctor-crm">${caseData.report.signedByDoctorCrm ? `CRM: ${caseData.report.signedByDoctorCrm}` : ''}</div>
                </div>
                
                <div class="auth-seal">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div class="auth-seal-text">
                    <div class="auth-seal-title">Documento Homologado Digitalmente</div>
                    <div class="auth-seal-date">
                      Carimbo Temporal: ${caseData.report.signedAt ? new Date(caseData.report.signedAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
                
                <p class="legal-disclaimer">
                  Este documento foi elaborado, assinado e homologado eletronicamente através da Plataforma EcoPrev de Perícias Médicas Ocupacionais.<br>
                  A validade e integridade técnica deste laudo estão resguardadas pela ICP-Brasil e pela legislação trabalhista/previdenciária vigente.
                </p>
              </div>
            </div>
          </div>
          
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          <script>
            // Get raw markdown from server
            const rawMarkdown = \`${(caseData.report.finalContent || '').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
            
            // Parse Markdown to HTML
            document.getElementById('md-content').innerHTML = marked.parse(rawMarkdown);

            window.onload = function() {
              const element = document.getElementById('report-page');
              const opt = {
                margin:       [0, 0, 0, 0], // Margins are handled by CSS inside .a4-page
                filename:     'Laudo_EcoPrev_${caseData.patientName.replace(/\\s+/g, '_')}_${caseData.id.slice(-6).toUpperCase()}.pdf',
                image:        { type: 'jpeg', quality: 1 },
                html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
              };
              
              html2pdf().set(opt).from(element).save();
            };
          </script>
        </body>
      </html>
    `;

    return new NextResponse(htmlContent, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
