/**
 * InvestigacaoScene — Minigame "Resumo Analítico" (Traço de Tinta)
 *
 * Mecânica: ligar conceitos (esquerda) às frases corretas (direita)
 * desenhando um traço de tinta com o mouse.
 *
 * - Resolução fixa 1280x720 (16:9) com Phaser.Scale.FIT + CENTER_BOTH.
 * - Estética leve/cartoon com fontes arredondadas (Fredoka/Nunito).
 * - Assets carregados de ./assets via HTTP (o jogo é servido online).
 * - Pontuação por estrelas: cada erro custa desempenho no modal final.
 * - Áudio sintetizado em tempo real (ver src/audio/SoundKit.js).
 */

class InvestigacaoScene extends Phaser.Scene {

  /* ------------------------------------------------------------------ */
  /*  CONSTANTES DE ESTILO E REGRA                                       */
  /* ------------------------------------------------------------------ */
  INK = 0x1e3a8a;          // Azul-tinta da caneta tinteiro
  INK_HEX = '#1e3a8a';
  FONT = "'Fredoka', 'Nunito', 'Arial Rounded MT Bold', sans-serif";

  GOLD = 0xF5C518;         // Estrela conquistada
  GREEN = 0x4ade80;        // Acerto
  RED = 0xef4444;          // Erro

  // Faixas de desempenho: até quantos erros para manter cada nota
  MAX_STARS = 3;
  ERROS_PARA_2_ESTRELAS = 2;   // 1..2 erros -> 2 estrelas; 3+ -> 1 estrela

  constructor() {
    super({ key: 'InvestigacaoScene' });
    this.matches = 0;
    this.errors = 0;
    this.drawing = null;       // traço em andamento { left, g, origin }
    this.connections = [];     // conexões fixas { left, target }
  }

  /* ------------------------------------------------------------------ */
  /*  1. CARREGAMENTO DE ASSETS                                          */
  /* ------------------------------------------------------------------ */
  preload() {
    // O Phaser baixa imagem por XHR (blob), e XHR é bloqueado em file://.
    // Sem servidor, o load falha e a cena desenha a textura __MISSING do
    // Phaser — um quadrado preto com borda e diagonal verdes. Registrar o
    // erro aqui troca esse sintoma mudo por uma mensagem que se explica.
    this.assetErrors = [];
    this.load.on('loaderror', (file) => this.assetErrors.push(file.key));

    this.load.image('fundo_claro', 'assets/fundo_claro.png');
    this.load.image('pergaminho_cartoon', 'assets/pergaminho_cartoon.png');
  }

  /* ------------------------------------------------------------------ */
  /*  2. CREATE — aguarda a fonte carregar e constrói o jogo             */
  /* ------------------------------------------------------------------ */
  create() {
    this.matches = 0;
    this.errors = 0;
    this.drawing = null;
    this.connections = [];
    this.locked = false;
    this.sfx = SoundKit.get();

    // Identifica esta execução do create(). O Phaser reaproveita a instância da
    // cena no restart, então comparar o token é o que impede um callback de
    // fonte obsoleto de construir o jogo duas vezes.
    const token = (this.buildToken = (this.buildToken || 0) + 1);

    this.loadingText = this.add.text(640, 360, 'Carregando a pena...', {
      fontFamily: this.FONT, fontSize: '34px', color: '#FFF8E7',
    }).setOrigin(0.5).setStroke('#000000', 4);

    this.fontsReady().then(() => {
      // A cena pode ter sido reiniciada enquanto a fonte carregava
      if (this.buildToken !== token || !this.scene.isActive()) return;
      if (this.loadingText) this.loadingText.destroy();
      if (this.assetErrors && this.assetErrors.length) {
        this.showAssetError();
        return;
      }
      this.buildGame();
    });
  }

  /**
   * Tela de erro para quando as imagens não carregam. O caso real é abrir o
   * HTML por file://, então a mensagem já entrega o comando que resolve.
   */
  showAssetError() {
    const viaFile = typeof location !== 'undefined' && location.protocol === 'file:';

    this.add.text(640, 250, 'As imagens não carregaram', {
      fontFamily: this.FONT, fontSize: '38px', fontStyle: 'bold', color: '#FFD9D9',
      align: 'center',
    }).setOrigin(0.5).setStroke('#7f1d1d', 6).setDepth(10);

    this.add.text(640, 340, viaFile
      ? 'O jogo foi aberto direto do arquivo (file://).\n' +
        'O navegador bloqueia o carregamento de imagens nesse modo.'
      : 'Não foi possível baixar: ' + this.assetErrors.join(', '), {
      fontFamily: this.FONT, fontSize: '24px', color: '#FFF8E7',
      align: 'center', lineSpacing: 6, wordWrap: { width: 900 },
    }).setOrigin(0.5).setStroke('#000000', 4).setDepth(10);

    this.add.text(640, 450,
      'Rode um servidor na pasta do projeto e acesse pelo endereço:\n\n' +
      'python3 -m http.server 8000\n' +
      'http://localhost:8000/minigame_Cap6.html', {
      fontFamily: 'monospace', fontSize: '22px', color: '#FFE066',
      align: 'center', lineSpacing: 6,
    }).setOrigin(0.5).setStroke('#000000', 5).setDepth(10);
  }

  fontsReady() {
    if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
    return Promise.all([
      document.fonts.load('700 42px Fredoka'),
      document.fonts.load('400 26px Fredoka'),
      document.fonts.load('400 24px Nunito'),
      document.fonts.load('700 24px Nunito'),
    ]).catch(() => {});
  }

  /* ------------------------------------------------------------------ */
  /*  3. CONSTRUÇÃO DO CENÁRIO                                           */
  /* ------------------------------------------------------------------ */
  buildGame() {
    // Fundo claro (cartoon/vetorial)
    this.add.image(640, 360, 'fundo_claro').setDisplaySize(1280, 720).setDepth(0);

    // Cabeçalho (Título e Subtítulo)
    this.add.text(640, 40, 'Estruture o Resumo Analítico', {
      fontFamily: this.FONT, fontSize: '42px', fontStyle: 'bold', color: this.INK_HEX,
    }).setOrigin(0.5).setStroke('#000000', 4).setDepth(10);

    this.add.text(640, 80, 'Texto-base: Carta de Caminha', {
      fontFamily: this.FONT, fontSize: '22px', color: '#FFE066',
    }).setOrigin(0.5).setStroke('#000000', 4).setDepth(10);

    const line = this.add.graphics().setDepth(10);
    line.lineStyle(2, 0xd4af37, 0.7);
    line.lineBetween(100, 106, 1180, 106);

    // Pergaminho da Direita (500x570 centrado em x=970, y=410 -> topo: 125, base: 695)
    const perg = this.add.image(970, 410, 'pergaminho_cartoon').setDepth(1);
    perg.setDisplaySize(500, 570);

    // Coluna da Esquerda: conceitos (Origens)
    this.leftItems = this.buildConcepts();

    // Coluna da Direita: frases (Destinos)
    this.rightItems = this.buildPhrases();

    // Traço fixo das conexões concluídas
    this.lines = this.add.graphics().setDepth(3);

    // Placar ao vivo e botão de som
    this.buildHud();
    this.buildMuteButton();

    // Instrução inferior
    this.add.text(640, 695, 'Clique em um conceito e arraste até a frase correspondente', {
      fontFamily: this.FONT, fontSize: '22px', color: '#FFF8E7',
    }).setOrigin(0.5).setStroke('#000000', 4).setDepth(10);

    // Handlers de ponteiro
    this.setupInput();
  }

  /* --------------------- HUD: estrelas ao vivo ---------------------- */
  /**
   * Três estrelas acima da coluna de conceitos, que apagam conforme o aluno
   * erra. Deixa o custo do erro visível durante a partida (fator replay).
   * Ocupa a faixa livre entre o filete do cabeçalho (y=106) e o primeiro
   * cartão (topo em y=212).
   */
  buildHud() {
    // Posicionado no centro da fileira e desenhado em coordenadas relativas:
    // é isso que faz o pulso de escala girar em torno das estrelas, e não da
    // origem da cena (que as arremessaria para fora do lugar).
    this.hudStars = this.add.graphics().setPosition(440, 148).setDepth(10);

    this.hudLabel = this.add.text(440, 180, '', {
      fontFamily: this.FONT, fontSize: '18px', color: '#FFF8E7',
    }).setOrigin(0.5).setStroke('#000000', 4).setDepth(10);

    this.updateHud();
  }

  updateHud() {
    const stars = this.currentStars();
    this.hudStars.clear();
    for (let i = 0; i < this.MAX_STARS; i++) {
      this.drawStar(this.hudStars, (i - 1) * 40, 0, 14, i < stars);
    }
    this.hudLabel.setText(
      this.errors === 0 ? 'Sem erros — nota máxima!' :
      this.errors === 1 ? '1 erro' : `${this.errors} erros`
    );
  }

  /** Nota atual (3..1) em função dos erros cometidos. */
  currentStars() {
    if (this.errors === 0) return 3;
    if (this.errors <= this.ERROS_PARA_2_ESTRELAS) return 2;
    return 1;
  }

  /**
   * Desenha uma estrela de 5 pontas centrada em (cx, cy).
   * Preenchida = conquistada; vazia = perdida.
   */
  drawStar(g, cx, cy, r, filled) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rad = (i % 2 === 0) ? r : r * 0.45;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push(new Phaser.Geom.Point(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad));
    }
    g.fillStyle(filled ? this.GOLD : 0x000000, filled ? 1 : 0.18);
    g.fillPoints(pts, true);
    g.lineStyle(Math.max(2, r * 0.16), filled ? 0x8B4513 : 0x6b6257, 1);
    g.strokePoints(pts, true, true);
  }

  /* ----------------------- Botão de som ----------------------------- */
  /**
   * Alterna o mudo. Depth 60 para continuar acessível mesmo com o modal de
   * vitória aberto (que fica em 50/51).
   */
  buildMuteButton() {
    const x = 1218, y = 52, r = 26;
    const btn = this.add.container(x, y).setDepth(60);

    const g = this.make.graphics({ add: false });
    const icon = this.make.graphics({ add: false });
    btn.add(g);
    btn.add(icon);

    const paint = () => {
      const muted = this.sfx.muted;
      g.clear();
      g.fillStyle(0x000000, 0.25);
      g.fillCircle(2, 3, r);
      g.fillStyle(muted ? 0xa9a29a : 0xD4AF37, 1);
      g.fillCircle(0, 0, r);
      g.lineStyle(4, 0x8B4513, 1);
      g.strokeCircle(0, 0, r);

      // Alto-falante estilizado
      icon.clear();
      icon.fillStyle(0x4B2E13, 1);
      icon.fillRect(-11, -6, 7, 12);
      icon.fillPoints([
        new Phaser.Geom.Point(-4, -6),
        new Phaser.Geom.Point(4, -13),
        new Phaser.Geom.Point(4, 13),
        new Phaser.Geom.Point(-4, 6),
      ], true);
      if (muted) {
        icon.lineStyle(4, 0xb91c1c, 1);          // barra vermelha de "sem som"
        icon.lineBetween(-15, -15, 15, 15);
      } else {
        icon.lineStyle(3, 0x4B2E13, 1);          // ondas sonoras
        icon.beginPath(); icon.arc(6, 0, 7, -1.0, 1.0); icon.strokePath();
        icon.beginPath(); icon.arc(6, 0, 12, -1.0, 1.0); icon.strokePath();
      }
    };
    paint();

    btn.setSize(r * 2, r * 2);
    btn.setInteractive(
      new Phaser.Geom.Rectangle(-r, -r, r * 2, r * 2),
      Phaser.Geom.Rectangle.Contains,
      { useHandCursor: true }
    );
    btn.on('pointerover', () => btn.setScale(1.08));
    btn.on('pointerout', () => btn.setScale(1));
    btn.on('pointerdown', () => {
      this.sfx.unlock();
      const muted = this.sfx.toggleMute();
      paint();
      if (!muted) this.sfx.click();              // confirma que voltou o som
    });

    this.muteButton = btn;
  }

  /* ----------------------- Coluna de Origem ------------------------- */
  buildConcepts() {
    const concepts = [
      { label: 'Tese Principal', phrase: 'Em se plantando, tudo dá.' },
      { label: 'Argumento de Apoio', phrase: 'A terra é formosa e de muitos bons ares.' },
      { label: 'Conclusão', phrase: 'O melhor fruto que nela se pode fazer é salvar esta gente.' },
    ];

    const items = [];
    // x=440 -> cartões (w=360) abrangem 260..620; evitam arte da bússola/mapa
    // (canto inferior esquerdo x 0..245, y 551..613) e mantêm 100px até o pergaminho
    const x = 440, w = 360, h = 96;
    const startY = 260, step = 150;

    concepts.forEach((c, i) => {
      const y = startY + i * step; // y = 260, 410, 560
      const card = this.makeCard(x, y, w, h, c.label, '26px', 0xffffff, 0x93c5fd, { pad: 32 });
      card.setInteractive(
        new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
        Phaser.Geom.Rectangle.Contains,
        { useHandCursor: true }
      );
      card.concept = c;
      card.matched = false;
      card.on('pointerover', () => { if (!card.matched) card.setScale(1.04); });
      card.on('pointerout', () => { if (!card.matched) card.setScale(1); });
      card.on('pointerdown', (pointer) => this.startStroke(card, pointer));
      items.push(card);
    });

    return items;
  }

  /* ----------------------- Coluna de Destino ------------------------ */
  buildPhrases() {
    const defs = [
      { text: 'Em se plantando, tudo dá.', concept: 'Tese Principal' },
      { text: 'A terra é formosa e de muitos bons ares.', concept: 'Argumento de Apoio' },
      { text: 'O melhor fruto que nela se pode fazer é salvar esta gente.', concept: 'Conclusão' },
      { text: 'Vimos aves de muitas cores.', concept: null },
      { text: 'Trocamos um sombreiro por um colar de conchas.', concept: null },
    ];

    // Embaralha para variar a partida
    Phaser.Utils.Array.Shuffle(defs);

    const items = [];
    // Pergaminho: x=970, w=500. Cartões: x=970, w=440 (margem exata de 30px em cada lado)
    // Pergaminho y=410, h=570 (topo=125, base=695).
    // 5 cartões h=86, gap=20 -> centros: 198, 304, 410, 516, 622 (30px topo, 30px base)
    const x = 970, w = 440, h = 86;
    const startY = 198, step = 106;

    defs.forEach((d, i) => {
      const y = startY + i * step;
      const card = this.makeCard(x, y, w, h, d.text, '24px', 0xffffff, 0xf1c40f, { pad: 20 });
      card.phrase = d;
      card.used = false;
      items.push(card);
    });

    return items;
  }

  /* ----------------------- Cartão estilizado ------------------------ */
  makeCard(x, y, w, h, text, fontSize, fill, border, opts = {}) {
    const pad = opts.pad ?? 13;                      // padding interno (padrão: 13px)
    const fontFamily = opts.fontFamily || this.FONT;

    const g = this.make.graphics({ add: false });
    g.fillStyle(0x000000, 0.10);                                  // sombra suave
    g.fillRoundedRect(-w / 2 + 4, -h / 2 + 6, w, h, 18);
    g.fillStyle(fill, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
    g.lineStyle(3, border, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);

    const txt = this.add.text(0, 0, text, {
      fontFamily: fontFamily || this.FONT,
      fontSize: fontSize,
      color: this.INK_HEX,
      align: 'center',
      wordWrap: { width: w - pad * 2 },
    }).setOrigin(0.5);

    const card = this.add.container(x, y, [g, txt]).setDepth(2);
    card.setSize(w, h);
    card.cardW = w;
    card.cardH = h;
    return card;
  }

  /* ------------------------------------------------------------------ */
  /*  4. MECÂNICA DO TRAÇO DE TINTA                                      */
  /* ------------------------------------------------------------------ */
  setupInput() {
    // O áudio só pode ser criado a partir de um gesto do usuário
    this.input.on('pointerdown', () => this.sfx.unlock());

    // Seguindo o ponteiro: redesenha o traço a cada movimento
    this.input.on('pointermove', (pointer) => {
      if (!this.drawing || this.locked) return;
      const d = this.drawing;
      d.g.clear();
      this.drawInkLine(d.g, d.origin.x, d.origin.y, pointer.x, pointer.y);
    });

    // Soltou o clique: valida a conexão
    this.input.on('pointerup', (pointer) => this.finishStroke(pointer));

    // Soltou fora do canvas: cancela o traço (senão ele fica preso na tela)
    this.input.on('pointerupoutside', () => this.finishStroke(null));
  }

  /**
   * Encerra o traço em andamento e valida a conexão.
   * pointer nulo significa que o clique foi solto fora do canvas.
   */
  finishStroke(pointer) {
    if (!this.drawing || this.locked) return;
    const d = this.drawing;
    const target = pointer ? this.getTargetAt(pointer.x, pointer.y) : null;

    if (target && !target.used && d.left.concept.phrase === target.phrase.text) {
      this.onCorrect(d.left, target);
    } else if (target) {
      this.onWrong(d.left, target);
    }
    // ---- Soltou no vazio ou fora do canvas: a linha some, sem punição ----
    d.g.destroy();
    this.drawing = null;
  }

  /* ------------------------- Acerto --------------------------------- */
  onCorrect(left, target) {
    left.matched = true;
    target.used = true;
    this.connections.push({ left, target });
    this.redrawConnections();

    this.pulseCard(target);
    this.flashCard(target, this.GREEN);
    this.markCard(target, true);
    this.dimConcept(left);
    this.sfx.correct();

    this.matches++;
    if (this.matches === this.leftItems.length) {
      this.showVictory();
    }
  }

  /* -------------------------- Erro ---------------------------------- */
  /**
   * Feedback de erro em quatro canais simultâneos — visual no alvo, visual
   * na origem, texto explicativo e som — para o aluno entender na hora o
   * que aconteceu, em vez de só ver o traço sumir.
   */
  onWrong(left, target) {
    this.errors++;

    this.flashCard(target, this.RED);
    this.markCard(target, false);
    this.shakeCard(left);
    this.sfx.wrong();

    const msg = target.used
      ? 'Essa frase já foi ligada a outro conceito.'
      : 'Essa não é a frase certa. Releia e tente de novo!';
    this.showToast(msg);

    this.updateHud();
    this.pulseHud();
  }

  startStroke(card, pointer) {
    if (card.matched || this.locked) return;
    // Ancoragem: borda direita do cartão de origem
    this.drawing = {
      left: card,
      g: this.add.graphics().setDepth(6),
      origin: { x: card.x + card.cardW / 2, y: card.y },
    };
    const d = this.drawing;
    this.drawInkLine(d.g, d.origin.x, d.origin.y, pointer.x, pointer.y);
    this.sfx.pen();
  }

  /**
   * Desenha um traço de tinta: uma camada larga e translúcida por baixo,
   * a linha fina e escura por cima, e gotas de tinta nas extremidades.
   * A curva (quadrática) é aproximada por pontos amostrados.
   */
  drawInkLine(g, x0, y0, x1, y1) {
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    if (len < 2) return;

    // Ponto de controle para uma curva suave e orgânica
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const bend = Math.min(34, len * 0.07);
    const nx = -dy / len, ny = dx / len;
    const cx = mx + nx * bend, cy = my + ny * bend;

    // Amostra a curva quadrática em N pontos
    const steps = 24;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      pts.push(new Phaser.Geom.Point(
        mt * mt * x0 + 2 * mt * t * cx + t * t * x1,
        mt * mt * y0 + 2 * mt * t * cy + t * t * y1
      ));
    }

    // Camada larga e suave (simula o espalhamento da tinta)
    g.lineStyle(8, this.INK, 0.16);
    g.strokePoints(pts, false);
    // Linha fina e escura (o traço da pena)
    g.lineStyle(3.5, this.INK, 1);
    g.strokePoints(pts, false);

    // Gotas de tinta nas extremidades
    g.fillStyle(this.INK, 0.95);
    g.fillCircle(x0, y0, 5);
    g.fillCircle(x1, y1, 4);
  }

  redrawConnections() {
    this.lines.clear();
    for (const c of this.connections) {
      const x0 = c.left.x + c.left.cardW / 2;
      const y0 = c.left.y;
      const x1 = c.target.x - c.target.cardW / 2;
      const y1 = c.target.y;
      this.drawInkLine(this.lines, x0, y0, x1, y1);
    }
  }

  getTargetAt(x, y) {
    for (const card of this.rightItems) {
      const halfW = card.cardW / 2, halfH = card.cardH / 2;
      if (x >= card.x - halfW && x <= card.x + halfW &&
          y >= card.y - halfH && y <= card.y + halfH) {
        return card;
      }
    }
    return null;
  }

  /* ------------------------------------------------------------------ */
  /*  5. GAME FEEL                                                       */
  /* ------------------------------------------------------------------ */
  pulseCard(card) {
    this.tweens.add({
      targets: card, scale: 1.08, duration: 120, yoyo: true, repeat: 1,
      onComplete: () => card.setScale(1),
    });
  }

  flashCard(card, color) {
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(color, 0.35);
    g.fillRoundedRect(card.x - card.cardW / 2 - 4, card.y - card.cardH / 2 - 4,
      card.cardW + 8, card.cardH + 8, 18);
    this.tweens.add({
      targets: g, alpha: 0, duration: 600, ease: 'Quad.easeOut',
      onComplete: () => g.destroy(),
    });
  }

  /**
   * Selo de ✓ (verde) ou ✗ (vermelho) na borda esquerda do cartão-alvo.
   * Sobe e some — é o sinal mais legível do resultado da tentativa.
   */
  markCard(card, ok) {
    const x = card.x - card.cardW / 2 - 26;
    const y = card.y;
    const g = this.add.graphics().setDepth(7).setPosition(x, y);

    g.fillStyle(ok ? this.GREEN : this.RED, 1);
    g.fillCircle(0, 0, 19);
    g.lineStyle(4, 0xffffff, 1);
    if (ok) {
      g.strokePoints([
        new Phaser.Geom.Point(-8, 0),
        new Phaser.Geom.Point(-2, 7),
        new Phaser.Geom.Point(9, -7),
      ], false);
    } else {
      g.lineBetween(-7, -7, 7, 7);
      g.lineBetween(7, -7, -7, 7);
    }

    g.setScale(0);
    this.tweens.add({
      targets: g, scale: 1, duration: 200, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: g, y: y - 34, alpha: 0, duration: 620, delay: 220,
          ease: 'Quad.easeIn', onComplete: () => g.destroy(),
        });
      },
    });
  }

  /**
   * Mensagem curta abaixo da coluna de conceitos. Fica em x=440 (e não no
   * centro da tela) para não cruzar os cartões de frase, cuja base vai até
   * y=665.
   */
  showToast(msg) {
    // Dois erros seguidos: mata o fade do toast anterior antes de destruí-lo,
    // senão o tween continua escrevendo alpha num objeto já removido.
    if (this.toast) {
      this.tweens.killTweensOf(this.toast);
      this.toast.destroy();
    }

    this.toast = this.add.text(440, 652, msg, {
      fontFamily: this.FONT, fontSize: '20px', fontStyle: 'bold',
      color: '#FFD9D9', align: 'center', wordWrap: { width: 380 },
    }).setOrigin(0.5).setStroke('#7f1d1d', 5).setDepth(11).setAlpha(0);

    this.tweens.add({
      targets: this.toast, alpha: 1, duration: 140,
      onComplete: () => {
        this.tweens.add({
          targets: this.toast, alpha: 0, duration: 400, delay: 1500,
        });
      },
    });
  }

  /** Chama atenção para o placar quando uma estrela é perdida. */
  pulseHud() {
    this.tweens.add({
      targets: [this.hudStars, this.hudLabel],
      scaleX: 1.12, scaleY: 1.12, duration: 130, yoyo: true,
      onComplete: () => {
        this.hudStars.setScale(1);
        this.hudLabel.setScale(1);
      },
    });
  }

  dimConcept(card) {
    this.tweens.add({ targets: card, alpha: 0.45, duration: 300 });
  }

  /** Chacoalha o cartão de origem para sinalizar uma ligação incorreta. */
  shakeCard(card) {
    // Guarda a posição de repouso na primeira chamada e cancela um shake
    // anterior ainda em curso, para o cartão não acumular deslocamento.
    if (card.baseX === undefined) card.baseX = card.x;
    this.tweens.killTweensOf(card);
    card.x = card.baseX;

    this.tweens.add({
      targets: card, x: card.baseX + 9,
      duration: 55, yoyo: true, repeat: 2, ease: 'Sine.easeInOut',
      onComplete: () => { card.x = card.baseX; },
    });
  }

  /* ------------------------------------------------------------------ */
  /*  6. VITÓRIA — Modal Pergaminho Náutico com estrelas                 */
  /* ------------------------------------------------------------------ */
  showVictory() {
    // Bloqueia novas interações enquanto o modal estiver aberto
    this.locked = true;
    const stars = this.currentStars();

    /* Overlay escurecido semi-transparente (foco no modal) */
    const overlay = this.add.graphics().setDepth(50).setAlpha(0);
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, 1280, 720);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 450, ease: 'Quad.easeOut' });

    /* Título e balanço variam com o desempenho — dá motivo para rejogar */
    const titulos = {
      3: 'Impecável! Resumo Analítico perfeito!',
      2: 'Muito bem! Você estruturou o Resumo Analítico!',
      1: 'Você conseguiu! Vale revisar os conceitos.',
    };
    const balancos = {
      3: 'Nenhum erro — leitura analítica afiada.',
      2: this.errors === 1 ? '1 erro pelo caminho.' : `${this.errors} erros pelo caminho.`,
      1: `${this.errors} erros. Tente de novo para as 3 estrelas!`,
    };

    /* Textos criados primeiro para medir a altura real */
    const titleTxt = this.add.text(0, 0, titulos[stars], {
      fontFamily: this.FONT, fontSize: '38px', fontStyle: 'bold',
      color: '#B8860B', align: 'center', wordWrap: { width: 820 },
    }).setOrigin(0.5);

    const pedTxt = this.add.text(0, 0,
      'A Tese apresenta a ideia central do autor sobre o valor da terra e da colonização; ' +
      'o Argumento fundamenta essa visão com observações do meio; e a Conclusão sintetiza ' +
      'o propósito principal da Carta de Caminha.', {
        fontFamily: this.FONT, fontSize: '22px', color: '#4A3728',
        align: 'center', lineSpacing: 5, wordWrap: { width: 830 },
      }).setOrigin(0.5);

    const scoreTxt = this.add.text(0, 0, balancos[stars], {
      fontFamily: this.FONT, fontSize: '22px', fontStyle: 'bold',
      color: '#8B4513', align: 'center', wordWrap: { width: 820 },
    }).setOrigin(0.5);

    /*
     * Layout de cima para baixo, com o painel dimensionado a partir das
     * alturas de texto medidas. Altura fixa estourava quando o título
     * quebrava em duas linhas, então quem manda aqui é o conteúdo.
     */
    const R = 34;                                      // raio das estrelas
    const MARGEM = 36;                                 // respiro interno do painel
    const BTN_H = 64;
    const scoreH = scoreTxt.height, pedH = pedTxt.height, titleH = titleTxt.height;

    const conteudoH = (2 * R) + 22 + titleH + 16 + 18 + pedH + 16 + scoreH + 20 + BTN_H;
    const pw = 900;
    const ph = Math.max(500, Math.ceil(conteudoH + 2 * MARGEM));

    let cursor = -ph / 2 + MARGEM;
    const starsY = cursor + R;            cursor += 2 * R + 22;
    const titleY = cursor + titleH / 2;   cursor += titleH + 16;
    const dividerY = cursor;              cursor += 18;
    const pedY = cursor + pedH / 2;       cursor += pedH + 16;
    const scoreY = cursor + scoreH / 2;   cursor += scoreH + 20;
    const btnY = cursor + BTN_H / 2;

    /* Painel do Pergaminho Náutico (creme + contorno marrom/dourado) */
    const modal = this.add.container(640, 360).setDepth(51).setScale(0).setAlpha(0);

    const g = this.make.graphics({ add: false });
    g.fillStyle(0x000000, 0.35);                                  // sombra do painel
    g.fillRoundedRect(-pw / 2 + 8, -ph / 2 + 14, pw, ph, 30);
    g.fillStyle(0xFFF8E7, 1);                                     // pergaminho creme
    g.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 30);
    g.lineStyle(10, 0x8B4513, 1);                                 // contorno marrom escuro
    g.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 30);
    g.lineStyle(3, 0xC9A227, 1);                                  // filete interno dourado
    g.strokeRoundedRect(-pw / 2 + 14, -ph / 2 + 14, pw - 28, ph - 28, 20);
    modal.add(g);

    /* Título, filete dourado, reforço pedagógico e balanço */
    titleTxt.y = titleY;
    modal.add(titleTxt);

    const div = this.make.graphics({ add: false });
    div.lineStyle(5, 0xC9A227, 1);
    div.lineBetween(-280, dividerY, 280, dividerY);
    modal.add(div);

    pedTxt.y = pedY;
    modal.add(pedTxt);

    scoreTxt.y = scoreY;
    modal.add(scoreTxt);

    /* Botão de ação no rodapé do modal */
    this.makeRestartButton(modal, btnY);

    /* Entrada animada: escala 0 -> 1 com leve pop */
    const modalDelay = 300, modalDur = 550;
    this.tweens.add({
      targets: modal, scaleX: 1, scaleY: 1, alpha: 1,
      duration: modalDur, ease: 'Back.easeOut', delay: modalDelay,
    });

    this.buildModalStars(modal, stars, starsY, R, modalDelay + modalDur);
  }

  /**
   * Fileira de estrelas do modal. Cada uma é um Graphics próprio posicionado
   * no seu centro, para que o tween de escala gire em torno da estrela e não
   * do centro do modal. As conquistadas entram em sequência, com som.
   */
  buildModalStars(modal, stars, y, r, startDelay) {
    for (let i = 0; i < this.MAX_STARS; i++) {
      const conquistada = i < stars;
      const sg = this.make.graphics({ add: false });
      this.drawStar(sg, 0, 0, r, conquistada);
      sg.setPosition((i - 1) * 96, y);
      modal.add(sg);

      if (!conquistada) continue;                 // estrelas perdidas ficam estáticas

      sg.setScale(0);
      this.tweens.add({
        targets: sg, scaleX: 1, scaleY: 1,
        duration: 320, ease: 'Back.easeOut',
        delay: startDelay + i * 190,
        onStart: () => this.sfx.star(i),
      });
    }

    // Fanfarra junto com a primeira estrela
    this.time.delayedCall(startDelay, () => this.sfx.victory(stars));
  }

  makeRestartButton(modal, y) {
    const w = 300, h = 64;
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x000000, 0.25);                                  // sombra
    g.fillRoundedRect(-w / 2 + 4, -h / 2 + 7, w, h, 32);
    g.fillStyle(0xD4AF37, 1);                                     // dourado
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 32);
    g.lineStyle(5, 0x8B4513, 1);                                  // contorno marrom
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 32);

    const txt = this.add.text(0, 0, 'Jogar Novamente', {
      fontFamily: this.FONT, fontSize: '30px', fontStyle: 'bold', color: '#4B2E13',
    }).setOrigin(0.5);

    const btn = this.add.container(0, y, [g, txt]);              // local do modal
    btn.setSize(w, h);
    btn.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains,
      { useHandCursor: true }
    );

    btn.on('pointerover', () => btn.setScale(1.05));
    btn.on('pointerout', () => btn.setScale(1));
    btn.on('pointerdown', () => {
      btn.setScale(0.96);
      this.sfx.click();
      this.scene.restart();
    });
    modal.add(btn);
  }
}

if (typeof window !== 'undefined') {
  window.InvestigacaoScene = InvestigacaoScene;
  window.PuzzleScene = InvestigacaoScene;
}

/* Configuração do Phaser: resolução base 1280x720 com FIT 16:9 estrito */
const GAME_CONFIG = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#fdf3d7',
  scene: [InvestigacaoScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

if (typeof window !== 'undefined') {
  window.GAME_CONFIG = GAME_CONFIG;
}
