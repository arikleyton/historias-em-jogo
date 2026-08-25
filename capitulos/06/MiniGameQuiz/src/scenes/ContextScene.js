/**
 * ContextScene — a contextualização histórica em uma única tela.
 *
 * Apresenta em uma única composição:
 * 1. Cabeçalho fixo com faixa escura (mesmo estilo do Quiz), eliminando bugs de sombra/duplicação.
 * 2. Painel esquerdo com 3 blocos históricos bem espaçados e legíveis.
 * 3. Painel direito com composição visual (carta, pena e caravela).
 * 4. Faixa de Linha do Tempo (22 de abril → 1º de maio).
 * 5. Faixa inferior com o guia "Como Funciona" e o botão "COMEÇAR O QUIZ".
 */
class ContextScene extends Phaser.Scene {

  HEADER_H = 70;

  GRID = {
    main: {
      left: { x: 420, y: 280, w: 760, h: 380 },
      right: { x: 1040, y: 280, w: 400, h: 380 },
    },
    timeline: { x: 640, y: 525, w: 1200, h: 85 },
    bottom: {
      howTo: { x: 420, y: 640, w: 760, h: 100 },
      cta: { x: 1040, y: 640, w: 400, h: 80 },
    },
  };

  constructor() {
    super({ key: 'ContextScene' });
  }

  create() {
    this.P = GameConfig.palette;
    this.sfx = SoundKit.get();
    this.input.once('pointerdown', () => this.sfx.unlock());
    UIKit.fadeIn(this);

    this.ctx = window.CONTEXT_SCREEN || null;
    this.leaving = false;

    UIKit.background(this);
    this.buildHeader();

    if (this.ctx) {
      this.buildLeftPanel();
      this.buildArtPanel();
      this.buildTimeline();
      this.buildHowTo();
    } else {
      this.buildEmpty();
    }

    this.buildCta();
    this.bindKeyboard();
    this.animateIn();
  }

  /* ------------------------------------------------------------------ */
  /*  Cabeçalho Superior (Faixa Escura Elegante)                         */
  /* ------------------------------------------------------------------ */

  /**
   * Faixa superior no mesmo padrão visual do Quiz: fundo escuro semitransparente
   * com linha dourada. Mantém o texto perfeitamente nítido sem artefatos de sombra.
   */
  buildHeader() {
    const { width: W } = GameConfig;
    const P = this.P;

    // Faixa de fundo
    const strip = this.add.graphics().setDepth(5);
    strip.fillStyle(0x2b1a0c, 0.78);
    strip.fillRect(0, 0, W, this.HEADER_H);
    strip.lineStyle(3, P.gold, 0.85);
    strip.lineBetween(0, this.HEADER_H, W, this.HEADER_H);

    // Botão Voltar ao Menu (Esquerda)
    this.menuBtn = UIKit.button(this, {
      x: 90, y: 35, w: 110, h: 38,
      label: '← MENU', fontSize: '15px', variant: 'secondary',
      onClick: () => this.goMenu(),
    }).setDepth(15);

    // Título Principal (Centro)
    this.title = UIKit.text(this, W / 2, 22,
      this.ctx ? this.ctx.title : 'A CARTA DE PERO VAZ DE CAMINHA', {
        size: '23px', weight: 'bold', color: '#fff8e7',
      }).setDepth(10);

    // Subtítulo (Centro)
    this.subtitle = UIKit.text(this, W / 2, 48,
      this.ctx ? this.ctx.subtitle : '', {
        size: '14px', color: '#e6c98a',
      }).setDepth(10);

    // Botão de Mudo (Direita)
    UIKit.muteButton(this, 1220, 35, 20);
  }

  /* ------------------------------------------------------------------ */
  /*  Painel Esquerdo: Blocos Históricos                                */
  /* ------------------------------------------------------------------ */

  buildLeftPanel() {
    const P = this.P;
    const { x, y, w, h } = this.GRID.main.left;

    this.leftPanel = UIKit.panel(this, x, y, w, h).setDepth(10);

    const blocks = this.ctx.blocks || [];
    const badgeYs = [-125, -15, 95];

    blocks.forEach((block, i) => {
      const by = badgeYs[i] ?? (-125 + i * 110);

      // Medalhão numerado
      const badge = this.add.graphics();
      badge.fillStyle(P.gold, 1);
      badge.fillCircle(-340, by, 15);
      badge.lineStyle(3, P.brown, 1);
      badge.strokeCircle(-340, by, 15);
      this.leftPanel.add(badge);

      this.leftPanel.add(UIKit.text(this, -340, by, block.num || String(i + 1), {
        size: '16px', weight: 'bold', color: '#4b2e13',
      }));

      // Título do bloco
      this.leftPanel.add(UIKit.text(this, -315, by, block.title, {
        size: '18px', weight: 'bold', color: '#6b4423', originX: 0, originY: 0.5,
      }));

      // Texto do bloco
      this.leftPanel.add(UIKit.text(this, -315, by + 16, block.text, {
        size: '16px', align: 'left', originX: 0, originY: 0, wrap: 660,
        color: P.inkHex, lineSpacing: 4,
      }));
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Painel Direito: Composição de Ilustrações                          */
  /* ------------------------------------------------------------------ */

  buildArtPanel() {
    const { x, y, w, h } = this.GRID.main.right;

    this.artPanel = UIKit.panel(this, x, y, w, h, { fill: this.P.paper }).setDepth(10);
    this.artItems = [];

    const addArt = (key, lx, ly, size) => {
      const a = IllustrationKit.create(this, key, lx, ly, size);
      this.artPanel.add(a);
      this.artItems.push(a);
    };

    // Carta principal no topo
    addArt('carta', 0, -70, 190);

    // Pena e Caravela na base do painel
    addArt('pena', -95, 105, 125);
    addArt('caravela', 95, 105, 125);
  }

  /* ------------------------------------------------------------------ */
  /*  Linha do Tempo (Datas-Chave)                                       */
  /* ------------------------------------------------------------------ */

  buildTimeline() {
    const P = this.P;
    const { x, y, w, h } = this.GRID.timeline;
    const tl = this.ctx.timeline;

    this.timelinePanel = UIKit.panel(this, x, y, w, h, { radius: 18 }).setDepth(10);

    // Cartão 1: 22 de Abril
    if (tl?.step1) {
      const pill1 = this.add.graphics();
      pill1.fillStyle(P.gold, 1);
      pill1.fillRoundedRect(-465, -30, 290, 34, 17);
      pill1.lineStyle(3, P.brown, 1);
      pill1.strokeRoundedRect(-465, -30, 290, 34, 17);
      this.timelinePanel.add(pill1);

      this.timelinePanel.add(UIKit.text(this, -320, -13, tl.step1.date, {
        size: '16px', weight: 'bold', color: '#4b2e13',
      }));

      this.timelinePanel.add(UIKit.text(this, -320, 18, tl.step1.label, {
        size: '15px', weight: 'bold', color: P.inkHex,
      }));
    }

    // Centro: Seta e intervalo
    this.timelinePanel.add(UIKit.text(this, 0, -6, '➜', {
      size: '28px', weight: 'bold', color: P.gold,
    }));

    this.timelinePanel.add(UIKit.text(this, 0, 18, tl?.middle || '9 dias de relatos', {
      size: '13px', color: '#8b5a2b',
    }));

    // Cartão 2: 1º de Maio
    if (tl?.step2) {
      const pill2 = this.add.graphics();
      pill2.fillStyle(P.gold, 1);
      pill2.fillRoundedRect(175, -30, 290, 34, 17);
      pill2.lineStyle(3, P.brown, 1);
      pill2.strokeRoundedRect(175, -30, 290, 34, 17);
      this.timelinePanel.add(pill2);

      this.timelinePanel.add(UIKit.text(this, 320, -13, tl.step2.date, {
        size: '16px', weight: 'bold', color: '#4b2e13',
      }));

      this.timelinePanel.add(UIKit.text(this, 320, 18, tl.step2.label, {
        size: '15px', weight: 'bold', color: P.inkHex,
      }));
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Faixa Inferior: Como Jogar                                         */
  /* ------------------------------------------------------------------ */

  buildHowTo() {
    const P = this.P;
    const { x, y, w, h } = this.GRID.bottom.howTo;

    this.howToPanel = UIKit.panel(this, x, y, w, h, { radius: 16 }).setDepth(10);

    this.howToPanel.add(UIKit.text(this, 0, -28, 'COMO FUNCIONA O QUIZ', {
      size: '15px', weight: 'bold', color: '#6b4423', spacing: 1,
    }));

    this.howToPanel.add(UIKit.divider(this, 0, -14, 280));

    const steps = this.ctx.howTo || [];
    const stepXs = [-240, 0, 240];
    const arrowXs = [-120, 120];

    steps.forEach((step, i) => {
      const sx = stepXs[i];

      this.howToPanel.add(UIKit.text(this, sx, 6, `${step.step}. ${step.title}`, {
        size: '16px', weight: 'bold', color: '#4b2e13',
      }));

      this.howToPanel.add(UIKit.text(this, sx, 25, step.desc, {
        size: '13px', color: P.inkHex,
      }));

      if (i < 2) {
        this.howToPanel.add(UIKit.text(this, arrowXs[i], 14, '➜', {
          size: '18px', weight: 'bold', color: P.gold,
        }));
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Botão Principal (Começar o Quiz)                                   */
  /* ------------------------------------------------------------------ */

  buildCta() {
    const { x, y, w, h } = this.GRID.bottom.cta;

    this.ctaBtn = UIKit.button(this, {
      x, y, w, h,
      label: this.ctx ? this.ctx.cta : 'COMEÇAR O QUIZ',
      fontSize: '28px',
      onClick: () => this.startQuiz(),
    }).setDepth(15);
  }

  buildEmpty() {
    UIKit.text(this, 640, 300, 'Conteúdo de contexto não encontrado.', {
      size: '28px', weight: 'bold', color: '#b91c1c',
    }).setDepth(12);
  }

  /* ------------------------------------------------------------------ */
  /*  Navegação                                                          */
  /* ------------------------------------------------------------------ */

  goMenu() {
    if (this.leaving) return;
    this.leaving = true;
    this.sfx.transition();
    UIKit.transition(this, 'MenuScene');
  }

  startQuiz() {
    if (this.leaving) return;
    this.leaving = true;
    this.ctaBtn?.setEnabled(false);
    this.menuBtn?.setEnabled(false);
    this.sfx.transition();
    UIKit.transition(this, 'QuizScene');
  }

  bindKeyboard() {
    this.input.keyboard.on('keydown', (event) => {
      const k = event.key;
      if (k === 'Enter' || k === ' ') this.startQuiz();
      else if (k === 'Escape') this.goMenu();
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Animação de Entrada                                                */
  /* ------------------------------------------------------------------ */

  animateIn() {
    const appear = (obj, delay, duration = 360) => {
      if (!obj) return;
      obj.setAlpha(0);
      this.tweens.add({ targets: obj, alpha: 1, duration, delay });
    };

    [this.title, this.subtitle].forEach((t, i) => appear(t, 60 + i * 80));

    [this.leftPanel, this.artPanel, this.timelinePanel, this.howToPanel].forEach((p, i) => {
      if (!p) return;
      p.setScale(0.96).setAlpha(0);
      this.tweens.add({
        targets: p, scale: 1, alpha: 1, duration: 420,
        delay: 120 + i * 70, ease: 'Back.easeOut',
      });
    });

    this.artItems?.forEach((a, i) => appear(a, 380 + i * 90));

    if (this.ctaBtn) {
      this.ctaBtn.setScale(0.96).setAlpha(0);
      this.tweens.add({
        targets: this.ctaBtn, scale: 1, alpha: 1,
        duration: 420, delay: 350, ease: 'Back.easeOut',
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.ContextScene = ContextScene;
}
