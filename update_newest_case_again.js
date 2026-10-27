require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const caseId = 'cmumwyzap000oiowaxl5expvq';

  const suggestedCIDs = 'V29.9 (Pessoa traumatizada em um acidente de transporte não especificado), T14.9 (Traumatismo não especificado), Z04.3 (Exame e observação por outro acidente de transporte)';
  const causalNexus = 'Nexo Causal Positivo (Acidente de Trajeto). O infortúnio ocorreu durante o deslocamento rotineiro entre a residência e o local de prestação de serviços, caracterizando acidente in itinere, equiparável a acidente do trabalho por força de dispositivo legal (Art. 21, IV, alínea "d", Lei 8.213/91).';
  const finalContent = `## 1. Histórico Profissional e Queixa Principal
O periciando, Sr. Gustavo Clement Onraed Vieira, relata evento traumático decorrente de acidente de trânsito envolvendo veículo automotor (motocicleta). Segundo o histórico colhido (anamnese), o evento infortúnio ocorreu enquanto o trabalhador realizava o trajeto habitualmente utilizado para o deslocamento de sua residência em direção ao seu respectivo posto e local de trabalho. A queixa principal reportada no momento do primeiro atendimento concentra-se em quadro de algia aguda e trauma contuso, em decorrência direta do impacto sofrido ao solo durante a queda do referido veículo.

## 2. Análise Documental
Procedeu-se à minuciosa análise da documentação médica acostada aos autos:
- **Imagem de Comprovante de Atendimento/Ficha de Urgência**: O documento visualizado atesta o pronto comparecimento do colaborador a uma unidade de emergência médica prestando os primeiros socorros. Observa-se a adoção de condutas de imobilização preliminar e realização de curativos pertinentes a escoriações (lesões abrasivas superficiais) típicas de cinemática de trauma por queda de veículo em movimento. 
*Nota*: Recomenda-se a futura juntada de laudos de exames complementares de imagem (como radiografias) ou cópia do prontuário médico completo para estratificação exata da gravidade das lesões esqueléticas e/ou musculares que porventura tenham ocorrido, visto que a atual ficha configura apenas o manejo inicial do trauma.

## 3. Discussão Técnica e Nexo Causal
Sob a ótica médico-pericial, o evento em tela classifica-se inequivocamente como trauma agudo externo. A correlação cinemática é perfeitamente compatível com a natureza de um acidente motociclístico (queda ao solo). Do ponto de vista ocupacional e legal, verifica-se que o evento se deu estritamente durante o percurso de ida ao trabalho. 

De acordo com o amparo jurídico pátrio vigente — especificamente delineado no Artigo 21, inciso IV, alínea "d" da Lei Orgânica da Seguridade Social (Lei nº 8.213/1991) —, o acidente sofrido pelo segurado no percurso da residência para o local de trabalho ou vice-versa, independentemente do meio de locomoção utilizado (incluindo veículo de propriedade do segurado), equipara-se plenamente ao Acidente do Trabalho (Acidente de Trajeto ou *in itinere*). Destarte, estabelece-se de forma inquestionável o Nexo Causal Positivo entre as lesões documentadas e o contexto laborativo.

## 4. Conclusão Pericial
Diante do exposto e fundamentado no exame da documentação médica, conclui-se sob a égide médico-pericial:
1. **Nexo Causal:** Resta configurado Nexo Causal (Acidente de Trajeto) para a ocorrência relatada.
2. **Emissão de CAT:** Face ao diagnóstico de acidente equiparado a acidente do trabalho, é obrigatória e peremptória a emissão da Comunicação de Acidente de Trabalho (CAT) por parte da empresa, para fins de regularização previdenciária, independentemente de haver ou não afastamento das atividades laborais.
3. **Aptidão e Conduta Laboral:** Recomenda-se acompanhamento pelo médico assistente da empresa (Médico do Trabalho) para reavaliação clínica assim que o paciente obtiver alta do pronto atendimento. Caso o atestado médico emitido pelo setor de urgência indique um período de convalescença com incapacidade temporária (afastamento) superior a 15 (quinze) dias, o trabalhador deverá ser prontamente encaminhado à perícia médica do Instituto Nacional do Seguro Social (INSS), visando o requerimento de benefício previdenciário de auxílio-doença acidentário (Espécie B91).`;

  try {
    await pool.query(`
      UPDATE "Report" 
      SET "suggestedCIDs" = $1, "causalNexus" = $2, "finalContent" = $3, "updatedAt" = NOW()
      WHERE "caseId" = $4
    `, [suggestedCIDs, causalNexus, finalContent, caseId]);

    console.log('Manual report updated for newest case again.');

  } catch (err) {
    console.error('Error updating report:', err);
  } finally {
    pool.end();
  }
}

main();
