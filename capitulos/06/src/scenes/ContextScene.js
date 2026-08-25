/**
 * ContextScene — a contextualização histórica que abre o jogo.
 *
 * Fica entre o menu e o quiz: primeiro o jogador conhece a história, depois é
 * desafiado a lembrar dela. A cena não guarda conteúdo nenhum — tudo vem de
 * `src/data/context.js`, então reescrever um texto ou reordenar as páginas não
 * exige mexer aqui.
 *
 * A moldura (fundo, cabeçalho, pergaminho, rodapé) é montada uma única vez. A
 * cada virada de página só o miolo é refeito, dentro de um container próprio
 * que entra e sai com um pequeno deslize — a sensação de folhear.
 *
 * Três formatos de página, escolhidos pelo campo `type`:
 *   'story'     título + ilustração + texto (o padrão)
 *   'timeline'  a linha do tempo entre 22 de abril e 1º de maio
 *   'final'     o convite para começar o quiz
 */
class ContextScene extends Phaser.Scene {

  /* ---------------------------- Layout ------------------------------- */
  HEADER_H = 72;
  PAGE = { x: 640, y: 372, w: 1120, h: 460 };
  ART = { dx: -350, dy: 50, box: 300, size: 250 };
  BODY = { dx: 175, dy: 52, wrap: 640 };
  FOOTER_Y = 656;

  constructor() {
    super({ key: 'ContextScene' });
  }

  create() {
    this.P = GameConfig.palette;
    this.sfx = SoundKit.get();
    this.input.once('pointerdown', () => this.sfx.unlock());
    UIKit.fadeIn(this);

    this.pages = Array.isArray(window.CONTEXT_PAGES) ? window.CONTEXT_PAGES : [];
    this.index = 0;
    this.turning = false;
    this.leaving = false;
    this.pageLayer = null;
    this.tip = null;
    this.hotspots = [];

    UIKit.background(this);
    this.buildHeader();

    this.panel = UIKit.panel(this, this.PAGE.x, this.PAGE.y,
      this.PAGE.w, this.PAGE.h).setDepth(10);

    UIKit.muteButton(this, 1232, 668);

    if (!this.pages.length) {
      this.showEmpty();
      return;
    }

    this.buildFooter();
    this.bindKeyboard();
    this.showPage(0, 0);

    // O pergaminho chega antes do miolo, como quem abre o documento.
    this.panel.setScale(0.94).setAlpha(0);
    this.tweens.add({
      targets: this.panel, scale: 1, alpha: 1, duration: 420, ease: 'Back.easeOut',
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Moldura fixa                                                       */
  /* ------------------------------------------------------------------ */

  /** Mesma faixa do quiz: título à esquerda, progresso ao centro. */
  buildHeader() {
    const { width: W } = GameConfig;
    const P = this.P;

    const strip = this.add.graphics().setDepth(5);
    strip.fillStyle(0x2b1a0c, 0.62);
    strip.fillRect(0, 0, W, this.HEADER_H);
    strip.lineStyle(3, P.gold, 0.85);
    strip.lineBetween(0, this.HEADER_H, W, this.HEADER_H);

    UIKit.text(this, 36, 36, 'CONTEXTO HISTÓRICO', {
      size: '20px', weight: 'bold', color: P.creamHex, originX: 0,
    }).setDepth(10);

    this.counter = UIKit.text(this, W / 2, 24, '', {
      size: '20px', weight: 'bold', color: P.creamHex,
    }).setDepth(10);

    this.dots = this.add.graphics().setDepth(10);

    UIKit.text(this, W - 36, 36, 'ANTES DO QUIZ', {
      size: '18px', weight: 'bold', color: '#e6c98a', originX: 1,
    }).setDepth(10);
  }

  /**
   * Bolinhas de progresso: passadas cheias, atual maior e com anel, futuras
   * apagadas. O contador em números fica logo acima, para quem prefere ler.
   */
  paintProgress() {
    const { width: W } = GameConfig;
    const P = this.P;
    const total = this.pages.length;

    this.counter.setText(`${this.index + 1} / ${total}`);

    const gap = Math.min(26, 300 / Math.max(1, total - 1));
    const startX = W / 2 - ((total - 1) * gap) / 2;

    this.dots.clear();
    for (let i = 0; i < total; i++) {
      const x = startX + i * gap;
      if (i === this.index) {
        this.dots.fillStyle(P.gold, 1);
        this.dots.fillCircle(x, 52, 8);
        this.dots.lineStyle(2.5, 0xfff8e7, 0.9);
        this.dots.strokeCircle(x, 52, 8);
      } else if (i < this.index) {
        this.dots.fillStyle(P.gold, 0.95);
        this.dots.fillCircle(x, 52, 5);
      } else {
        this.dots.fillStyle(0xfff8e7, 0.32);
        this.dots.fillCircle(x, 52, 5);
      }
    }
  }

  /**
   * Rodapé. Na primeira página o botão da esquerda volta ao menu em vez de
   * ficar apagado — nenhuma tela fica sem saída.
   */
  buildFooter() {
    this.backBtn = UIKit.button(this, {
      x: 0, y: this.FOOTER_Y, w: 230, h: 60,
      label: '← VOLTAR', fontSize: '24px', variant: 'secondary',
      onClick: () => this.prev(),
    }).setDepth(12);

    this.nextBtn = UIKit.button(this, {
      x: 0, y: this.FOOTER_Y, w: 320, h: 66,
      label: 'CONTINUAR →', fontSize: '27px',
      onClick: () => this.next(),
    }).setDepth(12);

    this.skipBtn = UIKit.button(this, {
      x: 0, y: this.FOOTER_Y, w: 200, h: 46,
      label: 'IR AO QUIZ', fontSize: '19px', variant: 'secondary',
      onClick: () => this.startQuiz(),
    }).setDepth(12);
    this.skipBtn.setAlpha(0.8);
  }

  /**
   * Distribui os botões visíveis centrados no mesmo eixo do pergaminho. Na
   * última página o "IR AO QUIZ" some — sem recalcular, a dupla que sobra
   * ficaria encostada à esquerda.
   */
  layoutFooter(visiveis) {
    const GAP = 26;
    const largura = visiveis.reduce((a, b) => a + b.width, 0)
      + GAP * (visiveis.length - 1);

    let x = this.PAGE.x - largura / 2;
    visiveis.forEach((b) => {
      b.x = x + b.width / 2;
      x += b.width + GAP;
    });
  }

  updateFooter(page) {
    const primeira = this.index === 0;
    this.backBtn.labelText.setText(primeira ? '← MENU' : '← VOLTAR');

    const fim = page.type === 'final';
    this.nextBtn.labelText.setText(fim ? 'COMEÇAR O QUIZ' : 'CONTINUAR →');
    this.skipBtn.setVisible(!fim);

    this.layoutFooter(fim
      ? [this.backBtn, this.nextBtn]
      : [this.backBtn, this.nextBtn, this.skipBtn]);
  }

  /** Dados ausentes: avisa e libera o quiz, em vez de prender o jogador. */
  showEmpty() {
    UIKit.text(this, this.PAGE.x, this.PAGE.y - 40,
      'Nenhuma página de contexto encontrada.', {
        size: '30px', weight: 'bold', color: '#b91c1c', wrap: 800,
      }).setDepth(12);

    UIKit.text(this, this.PAGE.x, this.PAGE.y + 20,
      'Confira src/data/context.js.', {
        size: '22px', color: this.P.inkHex, wrap: 800,
      }).setDepth(12);

    UIKit.button(this, {
      x: this.PAGE.x, y: this.PAGE.y + 120, w: 300, h: 62,
      label: 'IR AO QUIZ', fontSize: '25px',
      onClick: () => this.startQuiz(),
    }).setDepth(12);
  }

  /* ------------------------------------------------------------------ */
  /*  Navegação                                                          */
  /* ------------------------------------------------------------------ */

  next() {
    if (this.turning || this.leaving) return;
    const page = this.pages[this.index];
    if (page.type === 'final' || this.index >= this.pages.length - 1) {
      this.startQuiz();
      return;
    }
    this.goTo(this.index + 1, 1);
  }

  prev() {
    if (this.turning || this.leaving) return;
    if (this.index === 0) {
      if (this.leaving) return;
      this.leaving = true;
      this.sfx.transition();
      UIKit.transition(this, 'MenuScene');
      return;
    }
    this.goTo(this.index - 1, -1);
  }

  startQuiz() {
    if (this.leaving) return;
    this.leaving = true;
    this.nextBtn?.setEnabled(false);
    this.backBtn?.setEnabled(false);
    this.skipBtn?.setEnabled(false);
    this.sfx.transition();
    UIKit.transition(this, 'QuizScene');
  }

  /**
   * A virada em si: a página atual sai deslizando para um lado, a nova entra
   * pelo outro. `turning` segura clique repetido enquanto isso acontece.
   */
  goTo(index, dir) {
    if (index < 0 || index >= this.pages.length) return;
    this.turning = true;
    this.sfx.transition();
    this.clearPage(dir);

    this.time.delayedCall(170, () => {
      this.showPage(index, dir);
      this.turning = false;
    });
  }

  /** Desmonta o miolo atual: dica aberta, marcadores e o container. */
  clearPage(dir = 1) {
    this.hideTip();
    this.hotspots.forEach((b) => this.tweens.killTweensOf(b));
    this.hotspots = [];

    const old = this.pageLayer;
    this.pageLayer = null;
    if (!old) return;

    this.tweens.killTweensOf(old);
    this.tweens.add({
      targets: old, alpha: 0, x: -dir * 30, duration: 165, ease: 'Cubic.easeIn',
      onComplete: () => old.destroy(),
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Uma página                                                         */
  /* ------------------------------------------------------------------ */

  showPage(index, dir = 1) {
    this.index = index;
    const page = this.pages[index];

    const layer = this.add.container(0, 0).setDepth(15);
    this.pageLayer = layer;

    if (page.type === 'timeline') this.buildTimeline(layer, page);
    else if (page.type === 'final') this.buildFinal(layer, page);
    else this.buildStory(layer, page);

    layer.setAlpha(0);
    layer.x = dir * 34;
    this.tweens.add({
      targets: layer, alpha: 1, x: 0, duration: 320, ease: 'Cubic.easeOut',
    });

    // O pergaminho respira junto com a virada
    if (dir !== 0) {
      this.tweens.killTweensOf(this.panel);
      this.panel.setScale(0.993);
      this.tweens.add({
        targets: this.panel, scale: 1, duration: 300, ease: 'Cubic.easeOut',
      });
    }

    this.paintProgress();
    this.updateFooter(page);
  }

  /** Etiqueta pequena acima do título, numa pílula de pergaminho. */
  buildKicker(layer, y, str) {
    const P = this.P;
    const txt = UIKit.text(this, this.PAGE.x, y, str, {
      size: '17px', weight: 'bold', color: '#8b5a2b', spacing: 1.2,
    });

    const w = txt.width + 38;
    const h = 30;
    const g = this.add.graphics();
    g.fillStyle(P.paper, 1);
    g.fillRoundedRect(this.PAGE.x - w / 2, y - h / 2, w, h, h / 2);
    g.lineStyle(2, P.gold, 1);
    g.strokeRoundedRect(this.PAGE.x - w / 2, y - h / 2, w, h, h / 2);

    layer.add(g);
    layer.add(txt);
  }

  /** Título + filete dourado: o topo comum a todos os formatos. */
  buildTitle(layer, page) {
    const { x: PX, y: PY } = this.PAGE;

    if (page.kicker) this.buildKicker(layer, PY - 188, page.kicker);

    const size = page.title.length > 26 ? '38px' : '42px';
    layer.add(UIKit.text(this, PX, PY - 146, page.title, {
      size, weight: 'bold', color: '#6b4423', spacing: 1.5,
      wrap: this.PAGE.w - 140,
    }));

    layer.add(UIKit.divider(this, PX, PY - 112, 560));
  }

  /** Página comum: ilustração emoldurada à esquerda, texto à direita. */
  buildStory(layer, page) {
    const { x: PX, y: PY } = this.PAGE;
    const P = this.P;

    this.buildTitle(layer, page);

    layer.add(UIKit.panel(this, PX + this.ART.dx, PY + this.ART.dy,
      this.ART.box, this.ART.box, { fill: P.paper, radius: 18 }));

    const art = IllustrationKit.create(this, page.image,
      PX + this.ART.dx, PY + this.ART.dy, this.ART.size);
    layer.add(art);

    // Guardada antes da animação: é a escala final que posiciona os marcadores.
    const base = art.scale;
    art.setAlpha(0).setScale(base * 0.9);
    this.tweens.add({
      targets: art, alpha: 1, scale: base,
      duration: 420, delay: 130, ease: 'Cubic.easeOut',
    });

    const len = page.text.length;
    layer.add(UIKit.text(this, PX + this.BODY.dx, PY + this.BODY.dy, page.text, {
      size: len > 330 ? '22px' : '24px', align: 'left',
      wrap: this.BODY.wrap, color: P.inkHex, lineSpacing: 8,
    }));

    this.buildHotspots(page, art, base);
  }

  /**
   * A linha do tempo. As duas datas que o quiz cobra ganham medalhão dourado
   * e etiqueta; os passos do meio ficam em creme, como etapas do caminho.
   */
  buildTimeline(layer, page) {
    const { x: PX, y: PY } = this.PAGE;
    const P = this.P;

    this.buildTitle(layer, page);

    layer.add(UIKit.text(this, PX, PY - 58, page.text, {
      size: '22px', wrap: 900, color: P.inkHex, lineSpacing: 6,
    }));

    const steps = page.steps || [];
    const y = PY + 96;
    const span = 840;
    const xs = steps.map((_, i) =>
      steps.length === 1 ? PX : PX - span / 2 + (i * span) / (steps.length - 1));

    const trilho = this.add.graphics();
    trilho.lineStyle(7, P.brown, 0.55);
    trilho.lineBetween(xs[0], y, xs[xs.length - 1], y);
    trilho.lineStyle(3, P.gold, 1);
    trilho.lineBetween(xs[0], y, xs[xs.length - 1], y);
    layer.add(trilho);

    // Setas entre um marco e o seguinte
    const setas = this.add.graphics();
    setas.lineStyle(4, P.gold, 1);
    for (let i = 0; i < xs.length - 1; i++) {
      const mx = (xs[i] + xs[i + 1]) / 2;
      setas.strokePoints([
        { x: mx - 7, y: y - 9 }, { x: mx + 6, y }, { x: mx - 7, y: y + 9 },
      ], false);
    }
    layer.add(setas);

    steps.forEach((step, i) => {
      const x = xs[i];
      const r = step.highlight ? 32 : 25;

      const disco = this.add.graphics();
      disco.fillStyle(0x000000, 0.22);
      disco.fillCircle(x + 3, y + 5, r);
      disco.fillStyle(step.highlight ? P.gold : P.cream, 1);
      disco.fillCircle(x, y, r);
      disco.lineStyle(5, P.brown, 1);
      disco.strokeCircle(x, y, r);
      layer.add(disco);

      layer.add(UIKit.text(this, x, y + 1, String(i + 1), {
        size: step.highlight ? '26px' : '22px', weight: 'bold', color: '#4b2e13',
      }));

      if (step.date) {
        const etiqueta = UIKit.text(this, x, y - 62, step.date, {
          size: '21px', weight: 'bold', color: '#4b2e13',
        });
        const w = etiqueta.width + 30;
        const g = this.add.graphics();
        g.fillStyle(P.gold, 1);
        g.fillRoundedRect(x - w / 2, y - 78, w, 32, 16);
        g.lineStyle(3, P.brown, 1);
        g.strokeRoundedRect(x - w / 2, y - 78, w, 32, 16);
        layer.add(g);
        layer.add(etiqueta);
      }

      layer.add(UIKit.text(this, x, y + 58, step.label, {
        size: '19px', wrap: 210, color: P.inkHex, lineSpacing: 4,
      }));

      // Os marcos chegam da esquerda para a direita, como quem percorre
      const alvos = layer.list.slice(-3);
      alvos.forEach((o) => {
        o.setAlpha(0);
        this.tweens.add({
          targets: o, alpha: 1, duration: 260, delay: 180 + i * 130,
        });
      });
    });
  }

  /** Fecho do contexto: a arte emoldurada, o título e o convite para o quiz. */
  buildFinal(layer, page) {
    const { x: PX, y: PY } = this.PAGE;
    const P = this.P;

    this.buildTitle(layer, page);

    // Moldura quadrada, a mesma das páginas de história: a arte do kit é
    // quadrada, e num medalhão redondo os cantos dela ficariam de fora.
    layer.add(UIKit.panel(this, PX, PY + 4, 196, 196,
      { fill: P.paper, radius: 18 }));

    const art = IllustrationKit.create(this, page.image, PX, PY + 4, 164);
    layer.add(art);

    const base = art.scale;
    art.setAlpha(0).setScale(base * 0.88);
    this.tweens.add({
      targets: art, alpha: 1, scale: base,
      duration: 460, delay: 120, ease: 'Back.easeOut',
    });

    layer.add(UIKit.text(this, PX, PY + 152, page.text, {
      size: '24px', wrap: 860, color: P.inkHex, lineSpacing: 8,
    }));
  }

  /* ------------------------------------------------------------------ */
  /*  Curiosidades sobre a ilustração                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Marcadores "?" sobre pontos da figura. As coordenadas vêm no espaço de
   * desenho do IllustrationKit (-105 a 105) e são convertidas pela escala do
   * container — assim o dado não precisa saber de que tamanho a arte saiu.
   *
   * `scale` vem de fora de propósito: quando esta função roda, a arte está
   * encolhida pela animação de entrada, e ler `art.scale` aqui deixaria os
   * marcadores fora do ponto que eles apontam.
   *
   * Extra opcional: se a página não declarar hotspots, nada acontece.
   */
  buildHotspots(page, art, scale) {
    if (!Array.isArray(page.hotspots) || !page.hotspots.length) return;
    const P = this.P;
    const s = scale ?? art.scale;

    page.hotspots.forEach((h, i) => {
      const x = art.x + h.x * s;
      const y = art.y + h.y * s;

      const badge = this.add.container(x, y).setDepth(30);
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.25);
      g.fillCircle(1, 2, 14);
      g.fillStyle(P.gold, 1);
      g.fillCircle(0, 0, 14);
      g.lineStyle(3, P.brown, 1);
      g.strokeCircle(0, 0, 14);
      badge.add(g);
      badge.add(UIKit.text(this, 0, 1, '?', {
        size: '19px', weight: 'bold', color: '#4b2e13',
      }));

      // O Phaser normaliza o ponto pelo displayOrigin do container (16,16),
      // então o círculo clicável fica centrado ali — ver nota em UIKit.button.
      badge.setSize(32, 32);
      badge.setInteractive(
        new Phaser.Geom.Circle(16, 16, 19),
        Phaser.Geom.Circle.Contains,
        { useHandCursor: true }
      );
      badge.on('pointerover', () => this.showTip(y, h.text));
      badge.on('pointerout', () => this.hideTip());
      badge.on('pointerdown', () => this.showTip(y, h.text));

      badge.setAlpha(0);
      this.tweens.add({
        targets: badge, alpha: 1, duration: 300, delay: 420 + i * 120,
      });
      this.tweens.add({
        targets: badge, scale: 1.14, duration: 950, delay: 700 + i * 120,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });

      this.pageLayer.add(badge);
      this.hotspots.push(badge);
    });
  }

  /**
   * A dica fica ao lado da moldura, nunca sobre ela: o marcador aponta um
   * detalhe do desenho, e tapar o desenho para explicá-lo anula a explicação.
   * Encosta o texto no corpo da página por um instante, o que é reversível —
   * some assim que o ponteiro sai.
   */
  showTip(y, str) {
    this.hideTip();

    const txt = UIKit.text(this, 0, 0, str, {
      size: '19px', wrap: 258, color: this.P.inkHex, lineSpacing: 4,
    });

    const w = 300;
    const h = Math.max(58, txt.height + 34);
    const arte = this.PAGE.x + this.ART.dx + this.ART.box / 2;   // borda direita
    const topo = this.PAGE.y - this.PAGE.h / 2;
    const base = this.PAGE.y + this.PAGE.h / 2;

    const tx = arte + 16 + w / 2;
    const ty = Phaser.Math.Clamp(y, topo + h / 2 + 14, base - h / 2 - 14);

    const tip = UIKit.panel(this, tx, ty, w, h, {
      radius: 14, border: 4, filet: false,
    }).setDepth(45);
    tip.add(txt);

    tip.setAlpha(0).setScale(0.94);
    this.tweens.add({
      targets: tip, alpha: 1, scale: 1, duration: 180, ease: 'Cubic.easeOut',
    });
    this.tip = tip;
  }

  hideTip() {
    if (!this.tip) return;
    const tip = this.tip;
    this.tip = null;
    this.tweens.killTweensOf(tip);
    tip.destroy();
  }

  /* ------------------------------------------------------------------ */
  /*  Teclado                                                            */
  /* ------------------------------------------------------------------ */

  /** Setas, Enter e espaço acompanham os botões — o mouse continua bastando. */
  bindKeyboard() {
    this.input.keyboard.on('keydown', (event) => {
      if (this.leaving) return;
      const k = event.key;
      if (k === 'ArrowRight' || k === 'Enter' || k === ' ') {
        this.sfx.click();
        this.next();
      } else if (k === 'ArrowLeft') {
        this.sfx.click();
        this.prev();
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.ContextScene = ContextScene;
}
