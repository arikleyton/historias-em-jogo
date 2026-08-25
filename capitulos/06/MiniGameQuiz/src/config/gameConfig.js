/**
 * gameConfig — regras do jogo e configuração do Phaser em um só lugar.
 *
 * Tudo que um professor ou designer pode querer ajustar sem abrir a lógica
 * das cenas mora aqui: pontos, quantas perguntas caem por partida e
 * as faixas de classificação do resultado.
 */
const GameConfig = {

  /* ----------------------- Resolução base ---------------------------- */
  width: 1280,
  height: 720,

  /* ------------------------- Regras ---------------------------------- */
  pointsPerCorrect: 100,
  streakBonus: 20,           // +20 por acerto consecutivo (a partir do 2º)
  maxStreakBonus: 100,       // teto do bônus, para não dominar a nota

  /**
   * Quantas perguntas caem por partida. Bem menor que o banco de propósito:
   * a rodada é curta e cada partida sorteia um recorte diferente das 16
   * perguntas, o que dá motivo para jogar de novo. Use null para cair todas.
   *
   * Não há eliminação — errar custa a sequência de bônus, e a partida sempre
   * vai até a última pergunta.
   */
  questionsPerRun: 6,

  /* --------------------- Ritmo da experiência ------------------------ */
  feedbackDelay: 450,        // ms entre clicar e o painel de feedback abrir
  minFeedbackRead: 900,      // ms mínimos antes de liberar o "Continuar"

  /* --------------------- Faixas de classificação --------------------- */
  /**
   * Lidas de cima para baixo: vale a primeira faixa cujo mínimo de acertos
   * for atingido. Percentual do total, para funcionar com qualquer
   * questionsPerRun.
   */
  ranks: [
    { minPct: 1.00, title: 'Grande Escrivão',        blurb: 'Nenhum erro. Você leu a Carta como quem esteve a bordo.' },
    { minPct: 0.70, title: 'Mestre da Carta',        blurb: 'Você conhece bem os primeiros registros portugueses sobre a nova terra.' },
    { minPct: 0.40, title: 'Explorador da História', blurb: 'Boa viagem. Alguns trechos da Carta ainda pedem uma segunda leitura.' },
    { minPct: 0.00, title: 'Aprendiz da Expedição',  blurb: 'A expedição começou. Releia a Carta e embarque outra vez.' },
  ],

  /* --------------------------- Estética ------------------------------ */
  palette: {
    ink: 0x1e3a8a,          // azul da caneta tinteiro
    inkHex: '#1e3a8a',
    gold: 0xd4af37,
    goldStar: 0xf5c518,
    brown: 0x8b4513,
    brownDark: 0x4b2e13,
    cream: 0xfff8e7,
    creamHex: '#fff8e7',
    paper: 0xf6e7c1,
    green: 0x4ade80,
    greenDeep: 0x15803d,
    red: 0xef4444,
    redDeep: 0xb91c1c,
  },

  font: "'Fredoka', 'Nunito', 'Arial Rounded MT Bold', sans-serif",
  fontMono: 'monospace',

  /** Classificação correspondente a um número de acertos. */
  rankFor(correct, total) {
    const pct = total > 0 ? correct / total : 0;
    return this.ranks.find((r) => pct >= r.minPct) || this.ranks[this.ranks.length - 1];
  },

  /**
   * Config do Phaser. É uma função porque as classes de cena só existem
   * depois que todos os scripts foram lidos — chamar isto no load resolve
   * as referências na hora certa.
   */
  phaser() {
    return {
      type: Phaser.AUTO,
      width: this.width,
      height: this.height,
      parent: 'game-container',
      backgroundColor: '#1a0e06',
      scene: [BootScene, PreloadScene, MenuScene, ContextScene, QuizScene, ResultScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };
  },
};

if (typeof window !== 'undefined') {
  window.GameConfig = GameConfig;
}
