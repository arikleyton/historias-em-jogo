/**
 * context.js — o roteiro da contextualização histórica que abre o jogo.
 *
 * A ContextScene só consome esta lista: para reescrever um texto, trocar uma
 * ilustração ou mudar a ordem das telas, nada na cena precisa ser alterado.
 *
 * Campos:
 *   id        identificador único da página
 *   type      'story' (padrão) | 'timeline' | 'final'
 *   kicker    etiqueta curta acima do título (opcional)
 *   title     título curto da página
 *   text      corpo — 40 a 80 palavras, para ser lido de relance
 *   image     chave da ilustração (ver src/render/IllustrationKit.js)
 *   hotspots  pontos de curiosidade sobre a ilustração (opcional).
 *             x/y usam o espaço de desenho do IllustrationKit: -105 a 105,
 *             origem no centro da figura.
 *   steps     só em 'timeline': os marcos da linha do tempo
 *
 * Rigor histórico: nada aqui é apresentado como citação da Carta. A narrativa
 * evita tratar a terra como desabitada e deixa explícito que o documento
 * registra o ponto de vista de Caminha, não a visão dos povos indígenas.
 */
const CONTEXT_PAGES = [

  {
    id: 'expedicao',
    kicker: 'MARÇO DE 1500',
    title: 'UMA VIAGEM PELO ATLÂNTICO',
    text: 'Uma grande armada partiu de Lisboa rumo às Índias, sob o comando de '
      + 'Pedro Álvares Cabral. Era o tempo da expansão marítima portuguesa: '
      + 'navegar longe significava abrir rotas de comércio e ampliar o domínio '
      + 'do reino. Atravessando o Atlântico, a frota tomou rumo oeste e chegou '
      + 'a uma terra que os portugueses ainda não conheciam.',
    image: 'caravela',
    hotspots: [
      { x: 44, y: -62,
        text: 'Caravelas e naus eram as embarcações usadas nas viagens marítimas portuguesas.' },
    ],
  },

  {
    id: 'chegada',
    kicker: 'A CHEGADA',
    title: '22 DE ABRIL DE 1500',
    text: 'A armada avistou terra: um monte alto, que os portugueses chamaram '
      + 'de Monte Pascoal. Nos dias seguintes ancoraram junto à costa e '
      + 'passaram a chamar o lugar de Ilha de Vera Cruz. Aquela terra não '
      + 'estava vazia: nela já viviam diversos povos indígenas, com suas '
      + 'próprias línguas, crenças e modos de vida.',
    image: 'monte',
    hotspots: [
      { x: -6, y: -44,
        text: 'O monte recebeu o nome de Monte Pascoal porque a armada o avistou na semana da Páscoa.' },
    ],
  },

  {
    id: 'escrivao',
    kicker: 'QUEM ERA CAMINHA',
    title: 'O ESCRIVÃO',
    text: 'Pero Vaz de Caminha era o escrivão da armada. Sua função era '
      + 'registrar por escrito o que acontecia e o que se observava durante a '
      + 'viagem. Enquanto Cabral comandava os navios, era a pena de Caminha '
      + 'que transformava aqueles dias na nova terra em um relato para ser '
      + 'lido do outro lado do oceano.',
    image: 'caminha',
    hotspots: [
      { x: 38, y: -22,
        text: 'Pena e tinta eram os instrumentos usados para escrever documentos no século XVI.' },
    ],
  },

  {
    id: 'povos',
    kicker: 'O PRIMEIRO CONTATO',
    title: 'NOVOS POVOS',
    text: 'Portugueses e indígenas se encontraram na praia. Sem uma língua em '
      + 'comum, comunicavam-se por gestos e pela troca de objetos. Caminha '
      + 'anotou o que via: os corpos, as pinturas, os adornos de penas, os '
      + 'arcos, os costumes. São impressões escritas de fora, por quem '
      + 'acabara de chegar.',
    image: 'contato',
    hotspots: [
      { x: 2, y: 42,
        text: 'Sem intérprete, quase tudo se passou por gestos e por objetos oferecidos de um lado ao outro.' },
    ],
  },

  {
    id: 'terra',
    kicker: 'O QUE CAMINHA OBSERVOU',
    title: 'A TERRA',
    text: 'A Carta descreve com atenção a natureza ao redor: as muitas águas, '
      + 'o arvoredo, os frutos, as aves. Para Caminha, era uma terra fértil, '
      + 'que renderia bem a quem quisesse cultivá-la. Esse interesse pelas '
      + 'riquezas da terra dizia muito sobre o que Portugal esperava '
      + 'encontrar em uma nova rota.',
    image: 'vegetacao',
    hotspots: [
      { x: -64, y: -40,
        text: 'O arvoredo e a fartura de águas estão entre as observações mais insistentes da Carta.' },
    ],
  },

  {
    id: 'missa',
    kicker: 'RELIGIÃO E EXPEDIÇÃO',
    title: 'FÉ E EXPEDIÇÃO',
    text: 'A fé católica acompanhava as viagens portuguesas. Durante a parada '
      + 'foi celebrada uma missa e uma cruz foi erguida na terra, com os '
      + 'indígenas observando o ritual à distância. A Carta registra esses '
      + 'momentos: para a Coroa, levar a religião fazia parte do sentido '
      + 'daquelas expedições.',
    image: 'missa',
    hotspots: [
      { x: 24, y: -38,
        text: 'A cruz erguida junto ao altar marcava a presença da fé católica na expedição.' },
    ],
  },

  {
    id: 'carta',
    kicker: 'O DOCUMENTO',
    title: '1º DE MAIO DE 1500',
    text: 'Antes de a armada seguir viagem, Caminha concluiu seu relato e o '
      + 'datou de 1º de maio de 1500. O destinatário era o rei D. Manuel I, '
      + 'de Portugal. A carta voltou ao reino levada por um navio, para que o '
      + 'rei soubesse onde a frota havia chegado e o que ali fora encontrado.',
    image: 'carta',
    hotspots: [
      { x: 70, y: 72,
        text: 'O selo de cera fechava o documento e indicava quem o enviava.' },
    ],
  },

  {
    id: 'linha_do_tempo',
    type: 'timeline',
    title: 'DUAS DATAS, DOIS MOMENTOS',
    text: 'Uma data marca a chegada da armada à terra. A outra marca o dia em '
      + 'que Caminha datou a sua carta. São acontecimentos diferentes, '
      + 'separados por poucos dias.',
    steps: [
      { date: '22 DE ABRIL', label: 'A armada avista a terra', highlight: true },
      { label: 'Primeiros contatos na praia' },
      { label: 'Caminha observa e anota' },
      { date: '1º DE MAIO', label: 'A carta é concluída e datada', highlight: true },
    ],
  },

  {
    id: 'olhar',
    kicker: 'PENSE COMO HISTORIADOR',
    title: 'UM DOCUMENTO, UM PONTO DE VISTA',
    text: 'A Carta é uma fonte histórica valiosa — e é também o olhar de uma '
      + 'pessoa: um escrivão português do século XVI. Ela mostra como os '
      + 'portugueses perceberam a terra e os povos que encontraram. Não '
      + 'apresenta a visão que aqueles povos tinham daquele encontro. Ler uma '
      + 'fonte é sempre perguntar: quem escreveu, e para quem?',
    image: 'perspectivas',
  },

  {
    id: 'fonte',
    kicker: 'ATÉ HOJE',
    title: 'UMA FONTE HISTÓRICA',
    text: 'Por ser documento oficial dirigido ao rei, a Carta ficou guardada '
      + 'nos arquivos da Coroa e só veio a público muito tempo depois. O '
      + 'manuscrito original é conservado no Arquivo Nacional da Torre do '
      + 'Tombo, em Lisboa. Mais de cinco séculos depois, segue sendo uma das '
      + 'principais fontes sobre 1500.',
    image: 'arquivo',
    hotspots: [
      { x: -62, y: -50,
        text: 'A Torre do Tombo, em Lisboa, guarda o manuscrito original desde o século XVI.' },
    ],
  },

  {
    id: 'pronto',
    type: 'final',
    title: 'AGORA VOCÊ CONHECE A HISTÓRIA',
    text: 'Você já conhece os principais acontecimentos: a viagem, a chegada, '
      + 'o escrivão, o encontro e a carta.\nAgora é hora de testar o que '
      + 'descobriu.',
    image: 'mapa',
  },
];

if (typeof window !== 'undefined') {
  window.CONTEXT_PAGES = CONTEXT_PAGES;
}
