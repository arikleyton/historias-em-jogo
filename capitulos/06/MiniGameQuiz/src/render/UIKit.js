/**
 * UIKit — peças de interface compartilhadas pelas cenas.
 *
 * Painéis de pergaminho, botões, estrelas, corações, barra de progresso e
 * fundo. Antes tudo isso morava dentro da cena única; separar evita que
 * MenuScene, QuizScene e ResultScene reescrevam o mesmo desenho três vezes.
 *
 * Todas as funções recebem a cena como primeiro argumento e devolvem objetos
 * do Phaser prontos para receber tween ou depth.
 */
const UIKit = {

  /* Getters em vez de cópia: sobrevive a qualquer ordem de carregamento. */
  get P() { return GameConfig.palette; },
  get FONT() { return GameConfig.font; },

  /* ------------------------------------------------------------------ */
  /*  Fontes                                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Espera as fontes do Google. Sem isso o Phaser mede o texto com a fonte
   * de fallback e o layout nasce torto.
   */
  fontsReady() {
    if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
    return Promise.all([
      document.fonts.load('700 56px Fredoka'),
      document.fonts.load('600 34px Fredoka'),
      document.fonts.load('400 26px Fredoka'),
      document.fonts.load('700 24px Nunito'),
      document.fonts.load('400 22px Nunito'),
    ]).catch(() => {});
  },

  /* ------------------------------------------------------------------ */
  /*  Texto                                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Texto com os padrões do jogo. `outline` só é usado por texto que fica
   * direto sobre o fundo ilustrado; dentro de painel, atrapalha a leitura.
   *
   * `spacing` afasta as letras: em caixa alta a Fredoka encosta pares como
   * "IV", que passam a ser lidos como uma letra só.
   */
  text(scene, x, y, str, opts = {}) {
    const t = scene.add.text(x, y, str, {
      fontFamily: opts.font || this.FONT,
      fontSize: opts.size || '24px',
      fontStyle: opts.weight || 'normal',
      color: opts.color || GameConfig.palette.inkHex,
      align: opts.align || 'center',
      lineSpacing: opts.lineSpacing ?? 4,
      wordWrap: opts.wrap ? { width: opts.wrap } : undefined,
    });

    t.setOrigin(opts.originX ?? 0.5, opts.originY ?? 0.5);

    if (opts.spacing) {
      t.setLetterSpacing(opts.spacing);
      const folga = this.kerningPad(t, str);
      if (folga > 0) {
        t.setPadding({ right: folga });
        t.x += folga * t.originX;
      }
    }

    if (opts.outline) t.setStroke(opts.outlineColor || '#4b2e13', opts.outline);
    if (opts.shadow) t.setShadow(2, 3, 'rgba(0,0,0,0.35)', 4);
    return t;
  },

  /**
   * Com letterSpacing o Phaser reserva a textura medindo a string inteira (com
   * kerning) mas desenha letra a letra (sem kerning): o texto sai mais largo
   * que o canvas e o último glifo é cortado. Devolve a largura perdida, para
   * virar padding à direita.
   */
  kerningPad(t, str) {
    t.style.syncFont(t.canvas, t.context);
    const ctx = t.context;
    let maior = 0;

    for (const linha of String(str).split('\n')) {
      let solto = 0;
      for (const ch of linha) solto += ctx.measureText(ch).width;
      maior = Math.max(maior, solto - ctx.measureText(linha).width);
    }
    return Math.ceil(maior) + 2;
  },

  /* ------------------------------------------------------------------ */
  /*  Painel de pergaminho                                               */
  /* ------------------------------------------------------------------ */

  /**
   * Cartão creme com contorno marrom e filete dourado — a moldura padrão de
   * tudo que é conteúdo. Origem no centro, para posicionar por coordenada.
   */
  panel(scene, x, y, w, h, opts = {}) {
    const P = this.P;
    const r = opts.radius ?? 22;
    const g = scene.make.graphics({ add: false });

    if (opts.shadow !== false) {
      g.fillStyle(0x000000, opts.shadowAlpha ?? 0.3);
      g.fillRoundedRect(-w / 2 + 5, -h / 2 + 8, w, h, r);
    }
    g.fillStyle(opts.fill ?? P.cream, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    g.lineStyle(opts.border ?? 6, opts.borderColor ?? P.brown, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, r);

    if (opts.filet !== false) {
      g.lineStyle(2.5, P.gold, 1);
      g.strokeRoundedRect(-w / 2 + 11, -h / 2 + 11, w - 22, h - 22, Math.max(4, r - 9));
    }

    const c = scene.add.container(x, y, [g]);
    c.setSize(w, h);
    c.panelW = w;
    c.panelH = h;
    return c;
  },

  /** Filete dourado horizontal — separa título de corpo dentro do painel. */
  divider(scene, x, y, w) {
    const g = scene.add.graphics().setPosition(x, y);
    g.lineStyle(4, this.P.gold, 1);
    g.lineBetween(-w / 2, 0, w / 2, 0);
    return g;
  },

  /* ------------------------------------------------------------------ */
  /*  Botões                                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Brilho de verniz: acompanha a borda superior da pílula em vez de ser um
   * arco solto no meio do botão. São as duas curvas dos cantos ligadas por uma
   * reta — o mesmo caminho da borda, recuado para dentro.
   */
  gloss(g, w, h) {
    const rec = 8;                       // recuo em relação à borda
    const r = h / 2 - rec;               // raio dos cantos já recuado
    const cx = w / 2 - h / 2;            // centro dos cantos arredondados
    const y = -h / 2 + rec;

    g.lineStyle(2, 0xffffff, 0.4);
    g.beginPath();
    g.arc(-cx, 0, r, Math.PI, Math.PI * 1.5);
    g.lineTo(cx, y);
    g.arc(cx, 0, r, Math.PI * 1.5, Math.PI * 2);
    g.strokePath();
  },

  /**
   * Botão de ação. `variant` escolhe a cor: 'primary' dourado (ação
   * principal), 'secondary' creme (ação alternativa).
   */
  button(scene, opts) {
    const P = this.P;
    const w = opts.w ?? 300;
    const h = opts.h ?? 66;
    const variant = opts.variant || 'primary';
    const face = variant === 'primary' ? P.gold : P.cream;
    const label = variant === 'primary' ? '#4b2e13' : '#6b4423';

    const g = scene.make.graphics({ add: false });
    g.fillStyle(0x000000, 0.28);
    g.fillRoundedRect(-w / 2 + 4, -h / 2 + 7, w, h, h / 2);
    g.fillStyle(face, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    g.lineStyle(5, P.brown, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    this.gloss(g, w, h);                               // brilho superior

    const txt = this.text(scene, 0, 1, opts.label, {
      size: opts.fontSize || '30px', weight: 'bold', color: label,
    });

    const btn = scene.add.container(opts.x ?? 0, opts.y ?? 0, [g, txt]);
    btn.setSize(w, h);
    btn.enabled = true;
    btn.labelText = txt;

    // Atenção: num Container o Phaser normaliza o ponto pelo displayOrigin
    // (metade do setSize acima) antes de testar a forma. Por isso a área
    // clicável começa em (0,0) e não em (-w/2,-h/2) — senão ela fica meio
    // botão deslocada para cima e para a esquerda do desenho.
    btn.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, w, h),
      Phaser.Geom.Rectangle.Contains,
      { useHandCursor: true }
    );

    btn.on('pointerover', () => { if (btn.enabled) btn.setScale(1.05); });
    btn.on('pointerout', () => btn.setScale(1));
    btn.on('pointerdown', () => {
      if (!btn.enabled) return;
      btn.setScale(0.97);
      if (scene.sfx) scene.sfx.click();
      if (opts.onClick) opts.onClick();
    });

    btn.setEnabled = (on) => {
      btn.enabled = on;
      btn.setAlpha(on ? 1 : 0.5);
      if (on) btn.setInteractive(); else btn.disableInteractive();
      return btn;
    };
    return btn;
  },

  /**
   * Alternativa do quiz. Nasce clicável e depois é revelada como correta ou
   * incorreta — daí a função de pintura ficar guardada no próprio objeto.
   *
   * Acessibilidade: o resultado nunca é só a cor. A insígnia troca para ✓/✕
   * e um rótulo textual aparece à direita.
   */
  answerButton(scene, opts) {
    const P = this.P;
    const w = opts.w ?? 780;
    const h = opts.h ?? 78;
    const letter = opts.letter;

    const g = scene.make.graphics({ add: false });
    const badge = scene.make.graphics({ add: false });

    const letterTxt = this.text(scene, -w / 2 + 40, 0, letter, {
      size: '28px', weight: 'bold', color: '#4b2e13',
    });

    const bodyTxt = this.text(scene, -w / 2 + 76, 0, opts.text, {
      size: opts.fontSize || '25px', align: 'left',
      wrap: w - 220, originX: 0, color: P.inkHex,
    });

    const statusTxt = this.text(scene, w / 2 - 24, 0, '', {
      size: '19px', weight: 'bold', originX: 1, color: '#ffffff',
    });

    const btn = scene.add.container(opts.x ?? 0, opts.y ?? 0,
      [g, badge, letterTxt, bodyTxt, statusTxt]);
    btn.setSize(w, h);
    btn.answerId = opts.answerId;
    btn.state = 'idle';
    btn.enabled = true;

    /** Redesenha tudo em função de btn.state. */
    const paint = () => {
      const s = btn.state;
      const face =
        s === 'correct' ? 0xdcf6dd :
        s === 'wrong' ? 0xfbdcdc :
        s === 'muted' ? 0xefe6d2 : P.cream;
      const edge =
        s === 'correct' ? P.greenDeep :
        s === 'wrong' ? P.redDeep : P.brown;
      const badgeFill =
        s === 'correct' ? P.green :
        s === 'wrong' ? P.red : P.gold;

      g.clear();
      g.fillStyle(0x000000, 0.22);
      g.fillRoundedRect(-w / 2 + 4, -h / 2 + 6, w, h, 18);
      g.fillStyle(face, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
      g.lineStyle(s === 'idle' || s === 'muted' ? 4 : 5, edge, 1);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);

      badge.clear();
      badge.fillStyle(badgeFill, 1);
      badge.fillCircle(-w / 2 + 40, 0, 23);
      badge.lineStyle(3, edge, 1);
      badge.strokeCircle(-w / 2 + 40, 0, 23);

      // A letra dá lugar ao símbolo do resultado
      if (s === 'correct' || s === 'wrong') {
        letterTxt.setText('');
        badge.lineStyle(5, 0xffffff, 1);
        const cx = -w / 2 + 40;
        if (s === 'correct') {
          badge.strokePoints([
            { x: cx - 10, y: 0 }, { x: cx - 3, y: 8 }, { x: cx + 11, y: -9 },
          ], false);
        } else {
          badge.lineBetween(cx - 8, -8, cx + 8, 8);
          badge.lineBetween(cx + 8, -8, cx - 8, 8);
        }
      } else {
        letterTxt.setText(letter);
      }

      statusTxt.setText(
        s === 'correct' ? '✓ CORRETO' : s === 'wrong' ? '✕ INCORRETO' : ''
      );
      statusTxt.setColor(s === 'correct' ? '#15803d' : '#b91c1c');
      btn.setAlpha(s === 'muted' ? 0.55 : 1);
    };
    paint();

    btn.setInteractive(                                // ver nota em button()
      new Phaser.Geom.Rectangle(0, 0, w, h),
      Phaser.Geom.Rectangle.Contains,
      { useHandCursor: true }
    );

    btn.on('pointerover', () => {
      if (!btn.enabled) return;
      btn.setScale(1.02);
      g.lineStyle(5, P.gold, 1);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
    });
    btn.on('pointerout', () => {
      if (!btn.enabled) return;
      btn.setScale(1);
      paint();
    });
    btn.on('pointerdown', () => {
      if (!btn.enabled) return;
      btn.setScale(0.99);
      if (opts.onClick) opts.onClick(btn);
    });

    /** Trava o clique — usada no instante da resposta, em todos os botões. */
    btn.lock = () => {
      btn.enabled = false;
      btn.disableInteractive();
      btn.setScale(1);
      return btn;
    };

    btn.reveal = (state) => {
      btn.state = state;
      paint();
      return btn;
    };
    return btn;
  },

  /**
   * Botão redondo de mudo. Depth alto de propósito: continua acessível com
   * o painel de feedback aberto.
   */
  muteButton(scene, x, y, r = 24) {
    const P = this.P;
    const btn = scene.add.container(x, y).setDepth(80);
    const g = scene.make.graphics({ add: false });
    const icon = scene.make.graphics({ add: false });
    btn.add(g);
    btn.add(icon);

    const paint = () => {
      const muted = scene.sfx.muted;
      g.clear();
      g.fillStyle(0x000000, 0.25);
      g.fillCircle(2, 3, r);
      g.fillStyle(muted ? 0xa9a29a : P.gold, 1);
      g.fillCircle(0, 0, r);
      g.lineStyle(4, P.brown, 1);
      g.strokeCircle(0, 0, r);

      icon.clear();
      icon.fillStyle(P.brownDark, 1);
      icon.fillRect(-10, -5, 6, 11);
      icon.fillPoints([
        { x: -4, y: -5 }, { x: 4, y: -12 }, { x: 4, y: 12 }, { x: -4, y: 5 },
      ], true);
      if (muted) {
        icon.lineStyle(4, P.redDeep, 1);
        icon.lineBetween(-14, -14, 14, 14);
      } else {
        icon.lineStyle(3, P.brownDark, 1);
        icon.beginPath(); icon.arc(6, 0, 7, -1.0, 1.0); icon.strokePath();
        icon.beginPath(); icon.arc(6, 0, 11, -1.0, 1.0); icon.strokePath();
      }
    };
    paint();

    btn.setSize(r * 2, r * 2);
    btn.setInteractive(                                // ver nota em button()
      new Phaser.Geom.Rectangle(0, 0, r * 2, r * 2),
      Phaser.Geom.Rectangle.Contains,
      { useHandCursor: true }
    );
    btn.on('pointerover', () => btn.setScale(1.08));
    btn.on('pointerout', () => btn.setScale(1));
    btn.on('pointerdown', () => {
      scene.sfx.unlock();
      const muted = scene.sfx.toggleMute();
      paint();
      if (!muted) scene.sfx.click();
    });
    return btn;
  },

  /* ------------------------------------------------------------------ */
  /*  Ícone de estado: estrela                                           */
  /* ------------------------------------------------------------------ */

  /** Estrela de 5 pontas. Cheia = conquistada; vazia = perdida. */
  drawStar(g, cx, cy, r, filled) {
    const P = this.P;
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rad = (i % 2 === 0) ? r : r * 0.45;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad });
    }
    g.fillStyle(filled ? P.goldStar : 0x000000, filled ? 1 : 0.16);
    g.fillPoints(pts, true);
    g.lineStyle(Math.max(2, r * 0.15), filled ? P.brown : 0x6b6257, 1);
    g.strokePoints(pts, true, true);
  },

  /* ------------------------------------------------------------------ */
  /*  Barra de progresso                                                 */
  /* ------------------------------------------------------------------ */

  /**
   * Trilha fixa + preenchimento animado. Devolve um controlador em vez do
   * Graphics cru, para a cena só precisar informar a fração.
   */
  progressBar(scene, x, y, w, h = 13) {
    const P = this.P;
    const track = scene.add.graphics().setPosition(x, y);
    track.fillStyle(0x2b1a0c, 0.42);
    track.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    track.lineStyle(2.5, P.brown, 0.95);
    track.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);

    const fill = scene.add.graphics().setPosition(x, y);
    const state = { v: 0 };

    const paint = () => {
      fill.clear();
      const fw = w * state.v;
      if (fw < 3) return;
      fill.fillStyle(P.gold, 1);
      fill.fillRoundedRect(-w / 2, -h / 2, fw, h, Math.min(h / 2, fw / 2));
      fill.fillStyle(0xffffff, 0.28);
      fill.fillRoundedRect(-w / 2 + 2, -h / 2 + 2, Math.max(0, fw - 4), h * 0.34,
        Math.min(h / 4, fw / 2));
    };
    paint();

    return {
      track,
      fill,
      setProgress(v, animate = true) {
        const target = Phaser.Math.Clamp(v, 0, 1);
        scene.tweens.killTweensOf(state);
        if (!animate) { state.v = target; paint(); return; }
        scene.tweens.add({
          targets: state, v: target, duration: 420,
          ease: 'Cubic.easeOut', onUpdate: paint,
        });
      },
      setDepth(d) { track.setDepth(d); fill.setDepth(d); return this; },
    };
  },

  /* ------------------------------------------------------------------ */
  /*  Transição entre cenas                                              */
  /* ------------------------------------------------------------------ */

  /** Escurece antes de trocar de cena — evita o corte seco. */
  transition(scene, key, data) {
    scene.cameras.main.fadeOut(260, 26, 14, 6);
    scene.cameras.main.once('camerafadeoutcomplete',
      () => scene.scene.start(key, data));
  },

  /** Par do transition(), chamado no começo de cada create(). */
  fadeIn(scene) {
    scene.cameras.main.fadeIn(260, 26, 14, 6);
  },

  /* ------------------------------------------------------------------ */
  /*  Fundo                                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Mesa de trabalho ao fundo. Usa a arte de assets/ quando ela carregou;
   * se não, desenha uma mesa de madeira em código. O jogo não depende de
   * download nenhum para ficar apresentável.
   */
  background(scene) {
    const { width: W, height: H } = GameConfig;
    if (scene.textures.exists('fundo_claro')) {
      return scene.add.image(W / 2, H / 2, 'fundo_claro')
        .setDisplaySize(W, H).setDepth(0);
    }

    const g = scene.add.graphics().setDepth(0);
    g.fillStyle(0xb07a45, 1);
    g.fillRect(0, 0, W, H);

    // Tábuas horizontais com veio
    for (let i = 0; i < 6; i++) {
      const y = i * (H / 6);
      g.fillStyle(i % 2 ? 0xa9713f : 0xb98450, 1);
      g.fillRect(0, y, W, H / 6);
      g.lineStyle(3, 0x8a5a30, 0.55);
      g.lineBetween(0, y, W, y);
      g.lineStyle(2, 0x8a5a30, 0.3);
      for (let k = 1; k <= 2; k++) {
        const gy = y + (H / 6) * (k / 3);
        g.strokePoints(IllustrationKit.qbez(0, gy, W / 2, gy + (k % 2 ? 7 : -7), W, gy, 18), false);
      }
    }

    // Vinheta: escurece as bordas e joga o olho para o centro
    g.fillStyle(0x2b1a0c, 0.22);
    g.fillRect(0, 0, W, 46);
    g.fillRect(0, H - 46, W, 46);
    g.fillRect(0, 0, 46, H);
    g.fillRect(W - 46, 0, 46, H);
    return g;
  },
};

if (typeof window !== 'undefined') {
  window.UIKit = UIKit;
}
