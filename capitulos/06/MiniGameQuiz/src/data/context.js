/**
 * context.js — roteiro da contextualização histórica em tela única.
 *
 * Apresenta em uma única visão tudo o que o jogador precisa compreender
 * antes do quiz: o que é a Carta de Caminha, quem a escreveu, o contexto de 1500,
 * a importância histórica (e o ponto de vista) do documento, as duas datas-chave
 * e como funciona a partida.
 */
const CONTEXT_SCREEN = {
  title: 'A CARTA DE PERO VAZ DE CAMINHA',
  subtitle: 'Uma janela para os primeiros registros portugueses sobre a Terra de Vera Cruz',

  blocks: [
    {
      num: '1',
      title: 'A CARTA E O ESCRIVÃO',
      text: 'A Carta foi escrita em 1º de maio de 1500 por Pero Vaz de Caminha, escrivão da armada comandada por Pedro Álvares Cabral, e enviada ao rei D. Manuel I de Portugal.',
    },
    {
      num: '2',
      title: 'O CONTEXTO DO ENCONTRO',
      text: 'A expedição chegou à terra em 22 de abril de 1500 (chamada de Vera Cruz). Caminha registrou suas primeiras impressões sobre a natureza, a missa celebrada e os povos indígenas que ali já viviam.',
    },
    {
      num: '3',
      title: 'PONTO DE VISTA E IMPORTÂNCIA',
      text: 'A Carta é uma fonte histórica valiosa, mas expressa o olhar do observador português — não a visão dos povos indígenas. Seu manuscrito original é preservado na Torre do Tombo, em Lisboa.',
    },
  ],

  timeline: {
    step1: {
      date: '22 DE ABRIL DE 1500',
      label: 'Chegada da armada à terra',
    },
    middle: '9 dias de relatos',
    step2: {
      date: '1º DE MAIO DE 1500',
      label: 'Data da Carta de Caminha',
    },
  },

  howTo: [
    { step: '1', title: 'LEIA', desc: 'A pergunta com atenção' },
    { step: '2', title: 'ESCOLHA', desc: 'Uma das alternativas' },
    { step: '3', title: 'DESCUBRA', desc: 'Curiosidades históricas' },
  ],

  cta: 'COMEÇAR O QUIZ',
};

if (typeof window !== 'undefined') {
  window.CONTEXT_SCREEN = CONTEXT_SCREEN;
}
