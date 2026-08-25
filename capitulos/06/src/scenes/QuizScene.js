/**
 * QuizScene — a tela de jogo.
 *
 * Divisão de trabalho: o QuizManager guarda o estado e decide o resultado;
 * esta cena só mostra a pergunta atual e traduz o clique em uma chamada ao
 * manager. Por isso adicionar pergunta nova não exige mexer aqui.
 *
 * A moldura (fundo, cabeçalho, painéis) é construída uma única vez. A cada
 * pergunta trocam apenas o texto, a ilustração e as alternativas — nada é
 * recriado por frame.
 */
class QuizScene extends Phaser.Scene {

  /* ---------------------------- Layout ------------------------------- */
  HEADER_H = 72;
  PANEL_Y = 239;
  PANEL_H = 262;
  Q_PANEL = { x: 450, w: 780 };
  ART_PANEL = { x: 1050, w: 340, size: 224 };
  ANSWERS = { top: 388, band: 260, w: 800, h: 78, gap: 14 };

  constructor() {
    super({ key: 'QuizScene' });
  }

  create() {
    const P = GameConfig.palette;
    this.P = P;
    this.sfx = SoundKit.get();
    this.input.once('pointerdown', () => this.sfx.unlock());
    UIKit.fadeIn(this);

    this.quiz = new QuizManager(QUESTIONS);
    this.answerButtons = [];
    this.illustration = null;
    this.feedbackLayer = null;
    this.shownScore = 0;

    UIKit.background(this);
    this.buildHeader();
    this.buildPanels();
    UIKit.muteButton(this, 1232, 668);

    if (!this.quiz.total) {
      this.showEmptyBank();
      return;
    }

    this.bindKeyboard();
    this.renderQuestion();
  }

  /* ------------------------------------------------------------------ */
  /*  Moldura fixa                                                       */
  /* ------------------------------------------------------------------ */

  /**
   * Faixa superior. Ganha um fundo semitransparente porque o fundo
   * ilustrado tem mapa e livro justamente nos cantos de cima — sem a faixa,
   * o texto do placar competiria com o desenho.
   */
  buildHeader() {
    const { width: W } = GameConfig;
    const P = this.P;

    const strip = this.add.graphics().setDepth(5);
    strip.fillStyle(0x2b1a0c, 0.62);
    strip.fillRect(0, 0, W, this.HEADER_H);
    strip.lineStyle(3, P.gold, 0.85);
    strip.lineBetween(0, this.HEADER_H, W, this.HEADER_H);

    UIKit.text(this, 36, 36, 'A CARTA DE CAMINHA', {
      size: '20px', weight: 'bold', color: P.creamHex, originX: 0,
    }).setDepth(10);

    this.progressLabel = UIKit.text(this, W / 2, 25, '', {
      size: '21px', weight: 'bold', color: P.creamHex,
    }).setDepth(10);

    this.progressBar = UIKit.progressBar(this, W / 2, 52, 430, 13);
    this.progressBar.setDepth(10);

    this.scoreLabel = UIKit.text(this, 1248, 36, '', {
      size: '23px', weight: 'bold', color: '#ffe066', originX: 1,
    }).setDepth(10);
    this.paintScore(0);
  }

  paintScore(value) {
    this.scoreLabel.setText(`★ ${Math.round(value)}`);
  }

  /** Painéis da pergunta e da ilustração: criados uma vez, reaproveitados. */
  buildPanels() {
    const P = this.P;

    UIKit.panel(this, this.Q_PANEL.x, this.PANEL_Y,
      this.Q_PANEL.w, this.PANEL_H).setDepth(10);

    this.questionText = UIKit.text(this, this.Q_PANEL.x, this.PANEL_Y, '', {
      size: '30px', wrap: this.Q_PANEL.w - 92, color: P.inkHex, lineSpacing: 8,
    }).setDepth(11);

    UIKit.panel(this, this.ART_PANEL.x, this.PANEL_Y,
      this.ART_PANEL.w, this.PANEL_H, { fill: P.paper }).setDepth(10);
  }

  /**
   * Banco vazio ou todo inválido. Aviso na tela em vez de tela preta, com o
   * arquivo a corrigir — o console já detalhou cada pergunta rejeitada.
   */
  showEmptyBank() {
    UIKit.text(this, this.Q_PANEL.x, this.PANEL_Y - 20,
      'Nenhuma pergunta válida no banco.', {
        size: '30px', weight: 'bold', color: '#b91c1c', wrap: 640,
      }).setDepth(12);

    UIKit.text(this, this.Q_PANEL.x, this.PANEL_Y + 44,
      'Confira src/data/questions.js — o console lista o que foi recusado.', {
        size: '21px', color: this.P.inkHex, wrap: 640,
      }).setDepth(12);

    UIKit.button(this, {
      x: 640, y: 470, w: 260, h: 62, label: 'VOLTAR AO MENU',
      fontSize: '24px', variant: 'secondary',
      onClick: () => UIKit.transition(this, 'MenuScene'),
    }).setDepth(12);
  }

  /* ------------------------------------------------------------------ */
  /*  Uma pergunta                                                       */
  /* ------------------------------------------------------------------ */

  /**
   * Monta a pergunta atual. Chamada a cada avanço: limpa só o que muda
   * (texto, ilustração, alternativas) e mantém a moldura de pé.
   */
  renderQuestion() {
    const q = this.quiz.current;
    if (!q) return;

    this.progressLabel.setText(
      `PERGUNTA ${String(this.quiz.index + 1).padStart(2, '0')} / ` +
      String(this.quiz.total).padStart(2, '0')
    );
    this.progressBar.setProgress(this.quiz.progress);

    /* Enunciado: corpo menor quando o texto é longo, para nunca vazar. */
    const len = q.question.length;
    this.questionText.setFontSize(len > 96 ? '26px' : len > 62 ? '29px' : '32px');
    this.questionText.setText(q.question);
    this.animateIn(this.questionText, 0, 16);

    /* Ilustração: chave inexistente cai no fallback do IllustrationKit. */
    if (this.illustration) this.illustration.destroy();
    this.illustration = IllustrationKit.create(
      this, q.image, this.ART_PANEL.x, this.PANEL_Y, this.ART_PANEL.size
    ).setDepth(11);
    const artScale = this.illustration.scale;
    this.illustration.setAlpha(0).setScale(artScale * 0.92);
    this.tweens.add({
      targets: this.illustration, alpha: 1, scale: artScale,
      duration: 420, delay: 120, ease: 'Cubic.easeOut',
    });

    this.buildAnswers(q);
  }

  /** Fade curto com deslocamento vertical — a entrada padrão da cena. */
  animateIn(target, delay, dy) {
    const y = target.y;
    target.setAlpha(0);
    target.y = y + dy;
    this.tweens.add({
      targets: target, alpha: 1, y, duration: 380, delay, ease: 'Cubic.easeOut',
    });
  }

  /**
   * Cria um botão por alternativa — dois ou três, conforme a pergunta. A
   * contagem vem sempre de answers.length; não existe botão fixo na cena.
   */
  buildAnswers(q) {
    this.answerButtons.forEach((b) => b.destroy());
    this.answerButtons = [];

    const { top, band, w, h, gap } = this.ANSWERS;
    const n = q.answers.length;
    const totalH = n * h + (n - 1) * gap;
    const startY = top + (band - totalH) / 2 + h / 2;
    const letters = ['A', 'B', 'C', 'D'];

    q.answers.forEach((ans, i) => {
      const btn = UIKit.answerButton(this, {
        x: 640, y: startY + i * (h + gap), w, h,
        letter: letters[i], text: ans.text, answerId: ans.id,
        onClick: (b) => this.onAnswer(b),
      }).setDepth(20);

      // Entrada escalonada: as alternativas chegam uma depois da outra
      this.animateIn(btn, 180 + i * 90, 20);
      this.answerButtons.push(btn);
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Resposta                                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Trata o clique. A trava contra duplo clique vive no QuizManager: a
   * segunda chamada devolve null e esta função sai sem pontuar de novo.
   */
  onAnswer(btn) {
    const result = this.quiz.answer(btn.answerId);
    if (!result) return;

    const q = this.quiz.current;
    this.answerButtons.forEach((b) => {
      b.lock();
      if (b.answerId === q.correctAnswer) b.reveal('correct');
      else if (b === btn) b.reveal('wrong');
      else b.reveal('muted');
    });

    if (result.correct) {
      this.sfx.correct();
      this.pulse(btn, 1.03);
      this.sparkle(btn);
      this.countScoreTo(this.quiz.score);
      this.floatPoints(btn, result.gained, result.streak);
    } else {
      this.sfx.wrong();
      this.shake(btn);
    }

    this.progressBar.setProgress(this.quiz.progress);
    this.time.delayedCall(GameConfig.feedbackDelay, () => this.showFeedback(result));
  }

  /* --------------------------- Game feel ---------------------------- */

  pulse(target, to = 1.06) {
    this.tweens.add({
      targets: target, scale: to, duration: 120, yoyo: true,
      onComplete: () => target.setScale(1),
    });
  }

  shake(target) {
    if (target.baseX === undefined) target.baseX = target.x;
    this.tweens.killTweensOf(target);
    target.x = target.baseX;
    this.tweens.add({
      targets: target, x: target.baseX + 9, duration: 55,
      yoyo: true, repeat: 2, ease: 'Sine.easeInOut',
      onComplete: () => { target.x = target.baseX; },
    });
  }

  /** Poucas partículas, curtas: marca o acerto sem virar fogos de artifício. */
  sparkle(btn) {
    for (let i = 0; i < 7; i++) {
      const g = this.add.graphics().setDepth(30);
      UIKit.drawStar(g, 0, 0, 7, true);
      g.setPosition(btn.x - 320 + Math.random() * 90, btn.y - 10);

      this.tweens.add({
        targets: g,
        x: g.x + (Math.random() * 70 - 35),
        y: g.y - 40 - Math.random() * 40,
        alpha: 0, scale: 0.3,
        duration: 620 + Math.random() * 260,
        ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      });
    }
  }

  /** Placar subindo de forma contínua em vez de saltar para o valor novo. */
  countScoreTo(target) {
    const state = { v: this.shownScore };
    this.tweens.killTweensOf(state);
    this.tweens.add({
      targets: state, v: target, duration: 460, ease: 'Cubic.easeOut',
      onUpdate: () => this.paintScore(state.v),
      onComplete: () => { this.shownScore = target; this.paintScore(target); },
    });
    this.pulse(this.scoreLabel, 1.18);
  }

  /**
   * "+120" subindo à direita do botão certo. Fica na faixa livre entre a
   * alternativa (que termina em x=1040) e a borda, para não cobrir o texto.
   */
  floatPoints(btn, gained, streak) {
    const label = streak >= 2 ? `+${gained}\n${streak} em sequência!` : `+${gained}`;
    const txt = UIKit.text(this, 1130, btn.y, label, {
      size: '25px', weight: 'bold', color: '#15803d', outline: 4,
      outlineColor: '#ffffff', lineSpacing: 2,
    }).setDepth(30);

    this.tweens.add({
      targets: txt, y: txt.y - 52, alpha: 0, duration: 900,
      ease: 'Quad.easeOut', onComplete: () => txt.destroy(),
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Feedback: resultado + explicação + curiosidade                     */
  /* ------------------------------------------------------------------ */

  /**
   * Um painel só, com tudo que o aluno precisa ler antes de seguir. Juntar
   * resultado, explicação e curiosidade evita dois cliques para ver duas
   * caixas — e é o momento em que o quiz vira aula.
   *
   * A altura é calculada a partir dos textos já medidos: título longo que
   * quebra em duas linhas empurra o painel, em vez de vazar dele.
   */
  showFeedback(result) {
    const { width: W, height: H } = GameConfig;
    const P = this.P;

    const layer = this.add.container(0, 0).setDepth(50);
    this.feedbackLayer = layer;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x1a0e06, 0.66);
    overlay.fillRect(0, 0, W, H);
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, H),
      Phaser.Geom.Rectangle.Contains);
    overlay.setAlpha(0);
    layer.add(overlay);

    /* ------ Textos criados antes do painel, para medir a altura ------ */
    const titulo = result.correct ? '✓  CORRETO!' : '✕  NÃO FOI DESSA VEZ!';
    const corTitulo = result.correct ? '#15803d' : '#b91c1c';

    const tituloTxt = UIKit.text(this, 0, 0, titulo, {
      size: '42px', weight: 'bold', color: corTitulo, wrap: 800,
    });

    const respostaTxt = result.correct ? null : UIKit.text(this, 0, 0,
      `Resposta correta:  ${result.correctOption.text}`, {
        size: '24px', weight: 'bold', color: '#6b4423', wrap: 800,
      });

    const explicacaoTxt = UIKit.text(this, 0, 0, result.explanation, {
      size: '23px', color: P.inkHex, wrap: 800, lineSpacing: 6,
    });

    const sabiaTxt = UIKit.text(this, 0, 0, 'VOCÊ SABIA?', {
      size: '23px', weight: 'bold', color: '#8b5a2b',
    });

    const curiosidadeTxt = UIKit.text(this, 0, 0, result.curiosity, {
      size: '22px', color: '#4a3728', wrap: 800, lineSpacing: 6,
    });

    /* --------------- Layout de cima para baixo ----------------------- */
    const MARGEM = 34;
    const BTN_H = 62;
    const alturas = {
      titulo: tituloTxt.height,
      resposta: respostaTxt ? respostaTxt.height + 14 : 0,
      explicacao: explicacaoTxt.height,
      sabia: sabiaTxt.height,
      curiosidade: curiosidadeTxt.height,
    };

    const conteudoH = alturas.titulo + 14 + alturas.resposta + alturas.explicacao
      + 22 + 16 + alturas.sabia + 10 + alturas.curiosidade + 26 + BTN_H;

    const pw = 880;
    const ph = Math.ceil(conteudoH + 2 * MARGEM);

    let cursor = -ph / 2 + MARGEM;
    const tituloY = cursor + alturas.titulo / 2;   cursor += alturas.titulo + 14;
    let respostaY = 0;
    if (respostaTxt) {
      respostaY = cursor + respostaTxt.height / 2;
      cursor += alturas.resposta;
    }
    const explicY = cursor + alturas.explicacao / 2; cursor += alturas.explicacao + 22;
    const divisorY = cursor;                         cursor += 16;
    const sabiaY = cursor + alturas.sabia / 2;       cursor += alturas.sabia + 10;
    const curiosY = cursor + alturas.curiosidade / 2;
    cursor += alturas.curiosidade + 26;
    const btnY = cursor + BTN_H / 2;

    /* ------------------------- O painel ------------------------------ */
    const panel = UIKit.panel(this, W / 2, H / 2, pw, ph);
    layer.add(panel);

    tituloTxt.y = tituloY;
    panel.add(tituloTxt);

    if (respostaTxt) {
      respostaTxt.y = respostaY;
      panel.add(respostaTxt);
    }

    explicacaoTxt.y = explicY;
    panel.add(explicacaoTxt);

    panel.add(UIKit.divider(this, 0, divisorY, 320));

    sabiaTxt.y = sabiaY;
    panel.add(sabiaTxt);

    curiosidadeTxt.y = curiosY;
    panel.add(curiosidadeTxt);

    /* ----------------------- Botão de avanço ------------------------- */
    const btn = UIKit.button(this, {
      x: 0, y: btnY, w: 300, h: BTN_H,
      label: result.lastQuestion ? 'VER RESULTADO' : 'CONTINUAR',
      fontSize: '26px',
      onClick: () => this.advance(),
    });
    panel.add(btn);
    this.continueButton = btn;

    /* Trava breve: impede que um clique apressado pule o texto sem ler. */
    btn.setEnabled(false);
    this.time.delayedCall(GameConfig.minFeedbackRead, () => {
      if (btn.active) btn.setEnabled(true);
    });

    /* --------------------------- Entrada ----------------------------- */
    panel.setScale(0.92).setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 200 });
    this.tweens.add({
      targets: panel, scale: 1, alpha: 1, duration: 380, ease: 'Back.easeOut',
    });

    // Enter e espaço também avançam — o teclado já serve para responder.
    this.feedbackKeys = true;
  }

  /* ------------------------------------------------------------------ */
  /*  Avanço e fim de jogo                                               */
  /* ------------------------------------------------------------------ */

  advance() {
    if (this.feedbackLayer) {
      const layer = this.feedbackLayer;
      this.feedbackLayer = null;
      this.feedbackKeys = false;
      this.continueButton = null;
      this.tweens.add({
        targets: layer, alpha: 0, duration: 180,
        onComplete: () => layer.destroy(),
      });
    }

    if (this.quiz.next()) {
      this.renderQuestion();
      return;
    }

    this.sfx.transition();
    UIKit.transition(this, 'ResultScene', { summary: this.quiz.summary });
  }

  /* ------------------------------------------------------------------ */
  /*  Teclado                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * A, B, C (ou 1, 2, 3) respondem; Enter e espaço avançam no feedback.
   * Atalho de acessibilidade — o mouse continua sendo o caminho principal.
   */
  bindKeyboard() {
    this.input.keyboard.on('keydown', (event) => {
      if (this.feedbackKeys) {
        if (event.key === 'Enter' || event.key === ' ') {
          if (this.continueButton && this.continueButton.enabled) {
            this.sfx.click();
            this.advance();
          }
        }
        return;
      }

      const map = { a: 0, b: 1, c: 2, 1: 0, 2: 1, 3: 2 };
      const i = map[event.key.toLowerCase()];
      const btn = this.answerButtons[i];
      if (btn && btn.enabled) this.onAnswer(btn);
    });
  }
}

if (typeof window !== 'undefined') {
  window.QuizScene = QuizScene;
}
