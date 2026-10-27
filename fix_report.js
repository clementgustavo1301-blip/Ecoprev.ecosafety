const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.kixvaekytglkysrcfdob:Ecoprev147854157@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
});

async function main() {
  const contentJoao = `## 1. Histórico Profissional e Queixa Principal
O Sr. Joao Joao, colaborador, relata que sofreu um acidente de trajeto enquanto se dirigia ao seu local de trabalho. A queixa principal está diretamente relacionada a esse evento, tratando-se de um típico acidente de trajeto (in itinere), equiparado a acidente de trabalho conforme legislação previdenciária.

## 2. Análise Documental
Nenhum documento médico (exames, atestados ou prontuários) foi disponibilizado para análise na presente data.
*Documentação insuficiente para análise médica completa e detalhamento de lesões.*

## 3. Discussão Técnica e Nexo Causal
Trata-se de um relato de acidente de trajeto. Embora a ocorrência seja equiparada a acidente de trabalho sob a ótica legal, sob a ótica estritamente médica e pericial, a ausência de documentação complementar (como ficha de atendimento de emergência ou boletim de ocorrência) inviabiliza o estabelecimento preciso da extensão das lesões. O nexo é presumido pelas circunstâncias de deslocamento.

## 4. Conclusão Pericial
A avaliação pericial conclui tratar-se de um evento condizente com acidente de trajeto. Contudo, devido à total ausência de documentação clínica, é impossível determinar a capacidade laborativa atual, a presença de lesões agudas ou a necessidade de afastamento junto ao INSS. Recomenda-se a apresentação dos atestados de atendimento inicial para reavaliação.`;

  const contentGustavo = `## 1. Histórico Profissional e Queixa Principal
O Sr. Gustavo Onraed relata ter sofrido um acidente de motocicleta durante o trajeto para o seu trabalho, ocorrido aproximadamente às 06:59. Conforme informado na anamnese, o evento resultou em fratura da clavícula e atendimento hospitalar. O trabalhador relata que foi informado pela equipe médica sobre a presença de uma lesão nervosa associada (possível acometimento de plexo braquial ou nervo periférico), com prognóstico reservado e provável limitação severa de mobilidade no membro superior ipsilateral.

## 2. Análise Documental
A análise baseia-se primordialmente no relato colhido durante a anamnese, visto que os documentos de imagem e prontuários originais do atendimento hospitalar estão pendentes de consolidação no sistema. As lesões relatadas são: fratura de clavícula e lesão nervosa.
*Documentação insuficiente para análise detalhada do laudo radiológico inicial e relatório cirúrgico/ortopédico.*

## 3. Discussão Técnica e Nexo Causal
Considerando a dinâmica narrada (acidente in itinere), há nexo causal direto entre o evento traumático de trajeto e as lesões incapacitantes atuais, sendo classificado como acidente do trabalho por equiparação legal. A fratura de clavícula acompanhada de déficit motor/lesão neurológica periférica no membro superior é um achado altamente compatível com a cinemática descrita para acidentes motociclísticos (tração cervical/ombro).

## 4. Conclusão Pericial
Conclui-se pela existência de incapacidade laborativa temporária total, com forte indicativo de sequela permanente a depender da evolução e tratamento fisioterápico, dada a lesão nervosa. Indica-se a emissão da Comunicação de Acidente de Trabalho (CAT) e o imediato encaminhamento do trabalhador ao INSS para fruição de benefício acidentário (B91). O colaborador encontra-se Inapto para o labor, devendo manter acompanhamento em neurologia/ortopedia.`;

  // Update joao joao
  await pool.query(
    'UPDATE "Report" SET "finalContent" = $1, "suggestedCIDs" = $2, "causalNexus" = $3 WHERE id = $4',
    [contentJoao, 'Z04.9 - Exame e observação por razões não especificadas', 'Nexo presumido (Acidente de Trajeto)', 'cmulitq090002mowa5fojbb4r']
  );
  
  // Update gustavo onraed
  await pool.query(
    'UPDATE "Report" SET "finalContent" = $1, "suggestedCIDs" = $2, "causalNexus" = $3 WHERE id = $4',
    [contentGustavo, 'S42.0 - Fratura da clavícula, S14.3 - Lesão do plexo braquial', 'Nexo Causal estabelecido (Acidente de Trajeto)', 'cmtyqrble0003ewwaj4vnn7e2']
  );

  console.log('Reports updated successfully');
  pool.end();
}
main();
