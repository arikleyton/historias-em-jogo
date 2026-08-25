/**
 * questions.js — banco de perguntas do quiz.
 *
 * Para adicionar uma pergunta, basta acrescentar um objeto a esta lista.
 * Nenhuma cena precisa ser alterada.
 *
 * Campos:
 *   id            identificador único (usado em logs e futuros salvamentos)
 *   question      enunciado
 *   answers       2 ou 3 alternativas: { id, text }
 *   correctAnswer id da alternativa correta (nunca a posição — as
 *                 alternativas são embaralhadas em tempo de execução)
 *   explanation   por que a resposta é essa (aparece no feedback)
 *   curiosity     o "Você sabia?" — fato extra, curto
 *   image         chave da ilustração (ver src/render/IllustrationKit.js)
 *   category      personagens | documento | viagem | contato | terra | contexto
 *   difficulty    easy | medium | hard
 *
 * Rigor histórico: todas as citações abaixo são trechos documentados da
 * Carta. Paráfrases populares (como "em se plantando, tudo dá") foram
 * deixadas de fora de propósito.
 */
const QUESTIONS = [

  {
    id: 'q001',
    question: 'Quem escreveu a Carta que relatou a chegada da armada portuguesa à nova terra?',
    answers: [
      { id: 'a', text: 'Pero Vaz de Caminha' },
      { id: 'b', text: 'Pedro Álvares Cabral' },
      { id: 'c', text: 'Cristóvão Colombo' },
    ],
    correctAnswer: 'a',
    explanation: 'Pero Vaz de Caminha era o escrivão da armada de Cabral. Foi ele quem redigiu o relato, não o comandante da viagem.',
    curiosity: 'Cristóvão Colombo nem participou da expedição: ele navegava a serviço da Coroa espanhola, não da portuguesa.',
    image: 'caminha',
    category: 'personagens',
    difficulty: 'easy',
  },

  {
    id: 'q002',
    question: 'A quem a Carta foi endereçada?',
    answers: [
      { id: 'a', text: 'Ao rei D. Manuel I, de Portugal' },
      { id: 'b', text: 'Ao rei da Espanha' },
      { id: 'c', text: 'Ao Papa, em Roma' },
    ],
    correctAnswer: 'a',
    explanation: 'A Carta é um documento oficial dirigido a D. Manuel I, o rei português que financiou a armada.',
    curiosity: 'Por ser correspondência da Coroa, o documento foi arquivado e ficou mais de três séculos sem ser publicado.',
    image: 'rei',
    category: 'documento',
    difficulty: 'easy',
  },

  {
    id: 'q003',
    question: 'Em que ano a Carta foi escrita?',
    answers: [
      { id: 'a', text: '1500' },
      { id: 'b', text: '1492' },
      { id: 'c', text: '1530' },
    ],
    correctAnswer: 'a',
    explanation: 'Caminha datou o documento de 1º de maio de 1500, poucos dias depois de a armada avistar a terra.',
    curiosity: 'O próprio fecho da Carta registra o lugar e o dia: "Deste Porto Seguro, da Vossa Ilha de Vera Cruz, hoje, sexta-feira, primeiro dia de maio de 1500."',
    image: 'carta',
    category: 'documento',
    difficulty: 'easy',
  },

  {
    id: 'q004',
    question: 'Qual era a função de Pero Vaz de Caminha na expedição?',
    answers: [
      { id: 'a', text: 'Escrivão' },
      { id: 'b', text: 'Capitão-mor' },
      { id: 'c', text: 'Piloto' },
    ],
    correctAnswer: 'a',
    explanation: 'Caminha era escrivão, encarregado dos registros escritos. O capitão-mor da armada era Pedro Álvares Cabral.',
    curiosity: 'Caminha seguiu viagem para a Índia e morreu em Calicute, no fim de 1500, num ataque à feitoria portuguesa.',
    image: 'pena',
    category: 'personagens',
    difficulty: 'easy',
  },

  {
    id: 'q005',
    question: 'Qual era o destino original da armada de Cabral quando partiu de Lisboa?',
    answers: [
      { id: 'a', text: 'As Índias, para o comércio de especiarias' },
      { id: 'b', text: 'A nova terra a oeste, já conhecida' },
      { id: 'c', text: 'A costa da África do Sul' },
    ],
    correctAnswer: 'a',
    explanation: 'A armada partiu rumo a Calicute, na Índia, seguindo a rota aberta por Vasco da Gama. A chegada à nova terra aconteceu no caminho.',
    curiosity: 'Depois da parada, a maior parte da armada seguiu para a Índia. Só um navio voltou a Portugal levando a notícia.',
    image: 'mapa',
    category: 'viagem',
    difficulty: 'medium',
  },

  {
    id: 'q006',
    question: 'Que nome os portugueses deram à terra avistada, segundo a Carta?',
    answers: [
      { id: 'a', text: 'Ilha de Vera Cruz' },
      { id: 'b', text: 'Brasil' },
      { id: 'c', text: 'Nova Lusitânia' },
    ],
    correctAnswer: 'a',
    explanation: 'Caminha se refere à "Vossa Ilha de Vera Cruz". Naqueles primeiros dias, os portugueses ainda acreditavam estar diante de uma ilha.',
    curiosity: 'O nome "Brasil" só se firmou mais tarde, ligado ao pau-brasil, a madeira avermelhada explorada na costa.',
    image: 'cruz',
    category: 'documento',
    difficulty: 'medium',
  },

  {
    id: 'q007',
    question: 'O primeiro acidente geográfico avistado pela armada foi um monte, que recebeu nome. Qual?',
    answers: [
      { id: 'a', text: 'Monte Pascoal' },
      { id: 'b', text: 'Monte Cabral' },
      { id: 'c', text: 'Monte da Guia' },
    ],
    correctAnswer: 'a',
    explanation: 'A Carta relata que ao monte alto avistado deram o nome de Monte Pascoal, por ser a semana da Páscoa.',
    curiosity: 'O Monte Pascoal fica no sul do atual estado da Bahia e hoje está dentro de um parque nacional.',
    image: 'monte',
    category: 'viagem',
    difficulty: 'hard',
  },

  {
    id: 'q008',
    question: 'A Carta relata encontros entre os portugueses e os povos que já viviam na terra?',
    answers: [
      { id: 'a', text: 'Sim' },
      { id: 'b', text: 'Não' },
    ],
    correctAnswer: 'a',
    explanation: 'Boa parte da Carta é dedicada exatamente a esses encontros: a aproximação, os gestos, as trocas e a tentativa de comunicação sem língua comum.',
    curiosity: 'Como ninguém falava a língua do outro, quase toda a comunicação descrita se deu por gestos e por objetos oferecidos.',
    image: 'contato',
    category: 'contato',
    difficulty: 'easy',
  },

  {
    id: 'q009',
    question: 'A Carta descreve trocas de objetos entre os portugueses e os indígenas?',
    answers: [
      { id: 'a', text: 'Sim' },
      { id: 'b', text: 'Não' },
    ],
    correctAnswer: 'a',
    explanation: 'Caminha registra várias trocas, incluindo a de um sombreiro por um cocar de penas e a de contas e carapuças por arcos e flechas.',
    curiosity: 'Os objetos trocados tinham valor muito diferente para cada lado — o que era enfeite comum para uns podia ser novidade rara para os outros.',
    image: 'troca',
    category: 'contato',
    difficulty: 'medium',
  },

  {
    id: 'q010',
    question: 'A Carta menciona a realização de uma missa na nova terra?',
    answers: [
      { id: 'a', text: 'Sim' },
      { id: 'b', text: 'Não' },
    ],
    correctAnswer: 'a',
    explanation: 'Caminha descreve a missa celebrada por frei Henrique de Coimbra, com os indígenas observando o ritual à distância.',
    curiosity: 'A cena virou, séculos depois, um dos quadros mais conhecidos da pintura brasileira: "A Primeira Missa no Brasil", de Victor Meirelles, de 1861.',
    image: 'missa',
    category: 'contato',
    difficulty: 'easy',
  },

  {
    id: 'q011',
    question: 'Como Caminha descreve a terra quanto à água e à vegetação?',
    answers: [
      { id: 'a', text: 'Com muitas águas e arvoredo abundante' },
      { id: 'b', text: 'Seca e de vegetação escassa' },
    ],
    correctAnswer: 'a',
    explanation: 'A Carta insiste na fartura de águas e no arvoredo: para Caminha, era uma terra que renderia bem a quem quisesse cultivá-la.',
    curiosity: 'O trecho documentado diz que a terra "em tal maneira é graciosa que, querendo-a aproveitar, dar-se-á nela tudo, por bem das águas que tem".',
    image: 'vegetacao',
    category: 'terra',
    difficulty: 'medium',
  },

  {
    id: 'q012',
    question: 'Caminha registra observações sobre a aparência e os costumes dos indígenas?',
    answers: [
      { id: 'a', text: 'Sim' },
      { id: 'b', text: 'Não' },
    ],
    correctAnswer: 'a',
    explanation: 'A Carta descreve com detalhe os corpos, a pintura corporal, os adornos de pena, os arcos e flechas e o modo de viver que os portugueses observaram.',
    curiosity: 'São descrições feitas de fora, por quem acabara de chegar: registram o olhar português de 1500, não a visão que aqueles povos tinham de si mesmos.',
    image: 'indigenas',
    category: 'contato',
    difficulty: 'easy',
  },

  {
    id: 'q013',
    question: 'Segundo a Carta, o que Caminha sugere ao rei como o maior proveito daquela terra?',
    answers: [
      { id: 'a', text: 'A conversão dos habitantes ao cristianismo' },
      { id: 'b', text: 'O ouro e as pedras preciosas encontrados' },
      { id: 'c', text: 'A instalação imediata de uma cidade fortificada' },
    ],
    correctAnswer: 'a',
    explanation: 'Caminha escreve que o melhor fruto que dela se pode tirar é salvar aquela gente — ou seja, convertê-la à fé católica.',
    curiosity: 'A armada não encontrou ouro nem prata na parada, e a Carta diz isso com todas as letras ao rei.',
    image: 'cruz',
    category: 'contato',
    difficulty: 'hard',
  },

  {
    id: 'q014',
    question: 'Quantos dias a armada permaneceu na nova terra antes de seguir viagem?',
    answers: [
      { id: 'a', text: 'Cerca de dez dias' },
      { id: 'b', text: 'Cerca de seis meses' },
      { id: 'c', text: 'Cerca de dois anos' },
    ],
    correctAnswer: 'a',
    explanation: 'A armada avistou a terra em 22 de abril de 1500 e partiu em 2 de maio: pouco mais de uma semana de permanência.',
    curiosity: 'A Carta foi escrita bem no fim dessa parada, para voltar a Portugal no navio de mantimentos enviado com a notícia.',
    image: 'caravela',
    category: 'viagem',
    difficulty: 'hard',
  },

  {
    id: 'q015',
    question: 'A Carta de Caminha é uma fonte histórica para estudar as primeiras impressões portuguesas sobre o território?',
    answers: [
      { id: 'a', text: 'Sim' },
      { id: 'b', text: 'Não' },
    ],
    correctAnswer: 'a',
    explanation: 'É um relato de testemunha ocular, escrito dias após os fatos. Por isso é uma das principais fontes sobre o encontro de 1500.',
    curiosity: 'Ser fonte histórica não significa ser neutra: a Carta mostra o ponto de vista de quem chegou, com os interesses da Coroa por trás.',
    image: 'carta',
    category: 'documento',
    difficulty: 'easy',
  },

  {
    id: 'q016',
    question: 'Por que a Carta ficou desconhecida do público por tanto tempo?',
    answers: [
      { id: 'a', text: 'Ficou guardada nos arquivos da Coroa portuguesa' },
      { id: 'b', text: 'Foi perdida em um naufrágio e reescrita de memória' },
      { id: 'c', text: 'Foi proibida por tratar de assuntos religiosos' },
    ],
    correctAnswer: 'a',
    explanation: 'Por ser um documento oficial dirigido ao rei, ficou arquivada. Só veio a público no fim do século XVIII.',
    curiosity: 'O original está no Arquivo Nacional da Torre do Tombo, em Lisboa, onde é conservado até hoje.',
    image: 'arquivo',
    category: 'contexto',
    difficulty: 'hard',
  },
];

if (typeof window !== 'undefined') {
  window.QUESTIONS = QUESTIONS;
}
