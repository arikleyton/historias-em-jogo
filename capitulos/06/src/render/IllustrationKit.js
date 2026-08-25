/**
 * IllustrationKit — ilustrações desenhadas em código, com Phaser Graphics.
 *
 * Cada pergunta pede uma imagem pela chave em `questions.js` (image: 'carta').
 * Como as figuras são geradas por código, não existe arquivo para faltar: o
 * painel nunca aparece quebrado e o jogo não depende de download nenhum.
 *
 * Espaço de desenho: quadrado de SIZE x SIZE centrado na origem, ou seja
 * coordenadas de -SIZE/2 a +SIZE/2. O container devolvido por create() é
 * escalado para o tamanho pedido pela cena.
 *
 * Para adicionar uma ilustração: acrescente uma função em DRAWINGS com a
 * chave desejada e use-a no campo `image` da pergunta.
 */
const IllustrationKit = {

  SIZE: 210,
  get HALF() { return this.SIZE / 2; },

  /* Paleta compartilhada — o contorno único costura tudo no mesmo estilo. */
  P: {
    line: 0x4b2e13,
    lineSoft: 0x8b5a2b,
    plate: 0xf7ecd2,
    sky: 0xc9e6f7,
    skyWarm: 0xf6dfb4,
    sea: 0x3f8fc9,
    seaDeep: 0x2c6e9e,
    sand: 0xead9ac,
    grass: 0x5da84f,
    grassDark: 0x3d7d3a,
    wood: 0xa9713f,
    woodDark: 0x7a4f2a,
    parch: 0xf1e0b0,
    parchShade: 0xdcc48a,
    skinPt: 0xf0c091,
    skinIn: 0xc98a5e,
    blue: 0x2f5fa8,
    red: 0xc0392b,
    gold: 0xd4af37,
    white: 0xfffaf0,
    ink: 0x1e3a8a,
    stone: 0x9aa3ab,
    leaf: 0x2f7a34,
  },

  /* ------------------------------------------------------------------ */
  /*  API                                                                */
  /* ------------------------------------------------------------------ */

  has(key) {
    return typeof key === 'string' && Object.hasOwn(DRAWINGS, key);
  },

  /**
   * Monta a ilustração num container próprio, já escalado.
   * Chave desconhecida ou ausente cai no fallback — nunca falha.
   */
  create(scene, key, x, y, size) {
    const g = scene.add.graphics();
    const draw = DRAWINGS[key] || DRAWINGS.__fallback;
    draw(g, this, this.P);

    const container = scene.add.container(x, y, [g]);
    container.setScale(size / this.SIZE);
    container.illustrationKey = this.has(key) ? key : '__fallback';
    return container;
  },

  /* ------------------------------------------------------------------ */
  /*  Primitivas de desenho                                              */
  /* ------------------------------------------------------------------ */

  /** Polígono preenchido com contorno. */
  poly(g, pts, fill, lw = 3, line = this.P.line) {
    if (fill !== null) { g.fillStyle(fill, 1); g.fillPoints(pts, true); }
    if (lw > 0) { g.lineStyle(lw, line, 1); g.strokePoints(pts, true, true); }
  },

  circ(g, x, y, r, fill, lw = 3, line = this.P.line) {
    if (fill !== null) { g.fillStyle(fill, 1); g.fillCircle(x, y, r); }
    if (lw > 0) { g.lineStyle(lw, line, 1); g.strokeCircle(x, y, r); }
  },

  ell(g, x, y, w, h, fill, lw = 3, line = this.P.line) {
    if (fill !== null) { g.fillStyle(fill, 1); g.fillEllipse(x, y, w, h); }
    if (lw > 0) { g.lineStyle(lw, line, 1); g.strokeEllipse(x, y, w, h); }
  },

  rrect(g, x, y, w, h, r, fill, lw = 3, line = this.P.line) {
    if (fill !== null) { g.fillStyle(fill, 1); g.fillRoundedRect(x, y, w, h, r); }
    if (lw > 0) { g.lineStyle(lw, line, 1); g.strokeRoundedRect(x, y, w, h, r); }
  },

  /** Curva quadrática amostrada em pontos, para bordas orgânicas. */
  qbez(x0, y0, cx, cy, x1, y1, steps = 14) {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, mt = 1 - t;
      pts.push({
        x: mt * mt * x0 + 2 * mt * t * cx + t * t * x1,
        y: mt * mt * y0 + 2 * mt * t * cy + t * t * y1,
      });
    }
    return pts;
  },

  /** Traço grosso com as pontas arredondadas — serve de braço ou perna. */
  limb(g, x0, y0, x1, y1, w, color) {
    g.lineStyle(w, color, 1);
    g.lineBetween(x0, y0, x1, y1);
    g.fillStyle(color, 1);
    g.fillCircle(x0, y0, w / 2);
    g.fillCircle(x1, y1, w / 2);
  },

  /* ---------------------- Fundos ("pratos") -------------------------- */

  /** Prato de cor única, para ilustrações de objeto. */
  plate(g, K, color = K.P.plate) {
    const h = K.HALF;
    K.rrect(g, -h, -h, K.SIZE, K.SIZE, 14, color, 3, K.P.lineSoft);
  },

  /** Prato de cena: faixa de céu em cima, chão/mar embaixo. */
  scene(g, K, skyColor, groundColor, horizonY) {
    const h = K.HALF;
    g.fillStyle(skyColor, 1);
    g.fillRoundedRect(-h, -h, K.SIZE, K.SIZE, 14);
    g.fillStyle(groundColor, 1);
    g.fillRoundedRect(-h, horizonY, K.SIZE, h - horizonY,
      { tl: 0, tr: 0, bl: 14, br: 14 });
    g.lineStyle(3, K.P.lineSoft, 1);
    g.strokeRoundedRect(-h, -h, K.SIZE, K.SIZE, 14);
  },

  /** Ondinhas horizontais — mar visto de longe. */
  waves(g, K, yStart, rows, color) {
    g.lineStyle(3, color, 0.85);
    for (let r = 0; r < rows; r++) {
      const y = yStart + r * 14;
      const offset = (r % 2) * 18;
      for (let x = -92 + offset; x < 92; x += 36) {
        g.beginPath();
        g.arc(x, y, 9, Math.PI, 0, false);
        g.strokePath();
      }
    }
  },

  /** Estrela de N pontas — usada em bússolas e detalhes. */
  starPoints(cx, cy, outer, inner, points = 4, rotation = -Math.PI / 2) {
    const pts = [];
    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2 === 0) ? outer : inner;
      const a = rotation + (i * Math.PI) / points;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    return pts;
  },
};

/* ==================================================================== */
/*  ILUSTRAÇÕES                                                          */
/* ==================================================================== */

const DRAWINGS = {

  /* --------------------------- Caravela ----------------------------- */
  caravela(g, K, P) {
    K.scene(g, K, P.sky, P.sea, 34);
    K.waves(g, K, 52, 4, P.seaDeep);

    // Mastro principal e vergas
    g.lineStyle(6, P.woodDark, 1);
    g.lineBetween(2, 30, 2, -92);
    g.lineBetween(-40, 30, -40, -46);

    // Vela grande com a cruz da Ordem de Cristo
    const mainSail = [
      { x: -30, y: -84 }, { x: 40, y: -84 },
      ...K.qbez(40, -84, 62, -46, 40, -8, 8).slice(1),
      { x: -30, y: -8 },
    ];
    K.poly(g, mainSail, P.white, 3, P.lineSoft);
    g.fillStyle(P.red, 1);
    g.fillRect(1, -70, 10, 48);
    g.fillRect(-13, -53, 38, 10);

    // Vela menor da proa
    K.poly(g, [
      { x: -66, y: -40 }, { x: -34, y: -40 },
      ...K.qbez(-34, -40, -50, -20, -34, -2, 6).slice(1),
      { x: -66, y: -2 },
    ], P.white, 3, P.lineSoft);

    // Bandeirola no topo
    K.poly(g, [{ x: 2, y: -92 }, { x: 34, y: -84 }, { x: 2, y: -76 }], P.red, 2);

    // Casco
    K.poly(g, [
      { x: -74, y: 6 }, { x: 76, y: 6 }, { x: 58, y: 42 },
      ...K.qbez(58, 42, 0, 52, -56, 42, 8).slice(1),
    ], P.wood, 3);
    g.fillStyle(P.woodDark, 1);
    g.fillRect(-70, 12, 142, 7);
    // Vigias
    for (let i = -1; i <= 1; i++) K.circ(g, i * 26 + 4, 28, 5, P.parch, 2);
  },

  /* ----------------------- Pena e tinteiro -------------------------- */
  pena(g, K, P) {
    K.plate(g, K);

    // Mesa
    g.fillStyle(P.wood, 1);
    g.fillRoundedRect(-105, 58, 210, 47, { tl: 0, tr: 0, bl: 14, br: 14 });
    g.lineStyle(3, P.woodDark, 1);
    g.lineBetween(-105, 58, 105, 58);

    // Tinteiro
    K.poly(g, [
      { x: -66, y: 58 }, { x: -18, y: 58 }, { x: -24, y: 6 }, { x: -60, y: 6 },
    ], P.woodDark, 3);
    K.ell(g, -42, 6, 40, 14, P.ink, 3);
    g.fillStyle(P.gold, 1);
    g.fillRect(-64, 32, 44, 8);

    // Pena, mergulhada no tinteiro
    g.lineStyle(5, P.lineSoft, 1);
    g.lineBetween(-42, 4, 34, -84);
    const barb = (side) => {
      const pts = [{ x: 34, y: -84 }];
      for (let i = 1; i <= 7; i++) {
        const t = i / 7;
        pts.push({ x: 34 - t * 52 + side * (14 * Math.sin(t * Math.PI)),
                   y: -84 + t * 60 + side * (10 * Math.sin(t * Math.PI)) });
      }
      return pts;
    };
    K.poly(g, [...barb(1), ...barb(-1).reverse()], P.white, 3, P.lineSoft);
    g.lineStyle(2, P.parchShade, 1);
    g.lineBetween(34, -84, -12, -30);

    // Gota de tinta na ponta
    K.circ(g, -46, 14, 5, P.ink, 0);
  },

  /* ------------------------- Carta selada --------------------------- */
  carta(g, K, P) {
    K.plate(g, K);

    // Folha, levemente inclinada
    K.poly(g, [
      { x: -66, y: -80 }, { x: 68, y: -70 }, { x: 60, y: 82 }, { x: -74, y: 72 },
    ], P.parch, 3);

    // Linhas manuscritas
    g.lineStyle(4, P.ink, 0.75);
    for (let i = 0; i < 7; i++) {
      const y = -50 + i * 17;
      const w = (i === 6) ? 52 : (i % 3 === 2 ? 92 : 112);
      g.lineBetween(-54, y, -54 + w, y + 6);
    }

    // Assinatura em traço solto
    g.lineStyle(3, P.ink, 0.9);
    g.strokePoints(K.qbez(-46, 62, -6, 44, 24, 64, 12), false);

    // Selo de cera
    K.circ(g, 44, 52, 19, P.red, 3);
    K.poly(g, K.starPoints(44, 52, 10, 4, 4), 0x8f2b1f, 0);
  },

  /* --------------------------- Mapa antigo -------------------------- */
  mapa(g, K, P) {
    K.plate(g, K, P.parch);

    // Mar
    g.fillStyle(P.sky, 1);
    g.fillRoundedRect(-105, -105, 210, 210, 14);

    // Litoral
    K.poly(g, [
      { x: -105, y: 105 }, { x: -105, y: -20 },
      ...K.qbez(-105, -20, -40, -6, -18, -58, 10),
      ...K.qbez(-18, -58, 30, -96, 62, -40, 10).slice(1),
      ...K.qbez(62, -40, 96, 6, 76, 60, 10).slice(1),
      { x: 105, y: 105 },
    ], P.grass, 3, P.grassDark);

    // Serras
    for (const s of [[-40, 30, 20], [4, 14, 26], [46, 34, 18]]) {
      K.poly(g, [
        { x: s[0] - s[2], y: s[1] },
        { x: s[0], y: s[1] - s[2] * 1.2 },
        { x: s[0] + s[2], y: s[1] },
      ], P.parchShade, 2, P.lineSoft);
    }

    // Rota pontilhada até o X
    g.fillStyle(P.red, 1);
    for (let i = 0; i <= 12; i++) {
      const t = i / 12, mt = 1 - t;
      g.fillCircle(
        mt * mt * -92 + 2 * mt * t * -40 + t * t * -6,
        mt * mt * 82 + 2 * mt * t * 40 + t * t * 58, 3.2);
    }
    g.lineStyle(5, P.red, 1);
    g.lineBetween(-14, 50, 2, 66);
    g.lineBetween(2, 50, -14, 66);

    // Rosa dos ventos
    K.circ(g, 66, 82, 17, P.parch, 2, P.lineSoft);
    K.poly(g, K.starPoints(66, 82, 15, 5, 4), P.red, 1, P.line);
  },

  /* ------------------------ Monte Pascoal --------------------------- */
  monte(g, K, P) {
    K.scene(g, K, P.sky, P.sea, 46);

    // Monte ao fundo
    K.poly(g, [
      { x: -78, y: 46 },
      ...K.qbez(-78, 46, -30, -30, -6, -74, 10),
      ...K.qbez(-6, -74, 26, -34, 74, 46, 10).slice(1),
    ], P.grassDark, 3);
    K.poly(g, [
      { x: -30, y: -18 }, { x: -6, y: -74 }, { x: 18, y: -20 },
    ], P.grass, 0);

    // Faixa de praia
    g.fillStyle(P.sand, 1);
    g.fillRect(-105, 44, 210, 12);

    K.waves(g, K, 66, 3, P.seaDeep);

    // Caravela pequena, a distância
    g.lineStyle(3, P.woodDark, 1);
    g.lineBetween(44, 62, 44, 34);
    K.poly(g, [{ x: 44, y: 34 }, { x: 62, y: 40 }, { x: 44, y: 54 }], P.white, 2, P.lineSoft);
    K.poly(g, [{ x: 30, y: 62 }, { x: 58, y: 62 }, { x: 52, y: 72 }, { x: 36, y: 72 }], P.wood, 2);

    // Gaivotas
    g.lineStyle(3, P.line, 0.8);
    for (const b of [[-56, -60], [-38, -76], [-70, -84]]) {
      g.beginPath(); g.arc(b[0] - 6, b[1], 7, -0.5, 0.9); g.strokePath();
      g.beginPath(); g.arc(b[0] + 6, b[1], 7, 2.2, 3.6); g.strokePath();
    }
  },

  /* --------------------- Cruz plantada na terra --------------------- */
  cruz(g, K, P) {
    K.scene(g, K, P.skyWarm, P.grass, 52);

    // Cruz de madeira
    K.rrect(g, -11, -84, 24, 152, 5, P.wood, 3);
    K.rrect(g, -52, -52, 106, 24, 5, P.wood, 3);
    g.lineStyle(2, P.woodDark, 0.7);
    g.lineBetween(-4, -74, -4, 58);
    g.lineBetween(-44, -44, 46, -44);

    // Terra revolvida no pé
    K.ell(g, 0, 68, 84, 22, P.grassDark, 3);

    // Moitas
    for (const b of [[-64, 62, 18], [58, 66, 15], [-34, 74, 13]]) {
      K.circ(g, b[0], b[1], b[2], P.grassDark, 3);
    }
    // Capim
    g.lineStyle(3, P.grassDark, 1);
    for (let i = -92; i < 96; i += 16) g.lineBetween(i, 56, i + 5, 42);

    // Sol
    K.circ(g, 66, -70, 20, P.gold, 3);
    g.lineStyle(4, P.gold, 0.9);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      g.lineBetween(66 + Math.cos(a) * 26, -70 + Math.sin(a) * 26,
                    66 + Math.cos(a) * 34, -70 + Math.sin(a) * 34);
    }
  },

  /* -------------------------- Primeira missa ------------------------ */
  missa(g, K, P) {
    K.scene(g, K, P.skyWarm, P.grass, 56);

    // Altar
    K.rrect(g, -46, 6, 92, 50, 4, P.parch, 3);
    g.fillStyle(P.parchShade, 1);
    g.fillRect(-46, 6, 92, 9);
    // Cruz sobre o altar
    K.rrect(g, -4, -46, 9, 54, 3, P.woodDark, 2);
    K.rrect(g, -22, -32, 45, 9, 3, P.woodDark, 2);

    // Celebrante, de costas para quem olha
    K.poly(g, [
      { x: -14, y: -6 }, { x: 16, y: -6 }, { x: 22, y: 56 }, { x: -20, y: 56 },
    ], P.white, 3, P.lineSoft);
    K.circ(g, 1, -18, 13, P.skinPt, 3);
    g.fillStyle(P.parchShade, 1);
    g.fillRect(-12, 10, 26, 7);

    // Assistência: portugueses à esquerda, indígenas à direita
    const person = (x, y, h, skin, cloth, feather) => {
      K.poly(g, [
        { x: x - 9, y: y }, { x: x + 9, y: y },
        { x: x + 12, y: y + h }, { x: x - 12, y: y + h },
      ], cloth, 3);
      K.circ(g, x, y - 9, 9, skin, 3);
      if (feather) {
        for (let i = -1; i <= 1; i++) {
          K.poly(g, [
            { x: x + i * 6, y: y - 17 }, { x: x + i * 6 - 3, y: y - 30 },
            { x: x + i * 6 + 3, y: y - 30 },
          ], P.red, 1);
        }
      }
    };
    person(-72, 16, 40, P.skinPt, P.blue, false);
    person(-50, 22, 34, P.skinPt, P.red, false);
    person(56, 16, 40, P.skinIn, P.grassDark, true);
    person(78, 22, 34, P.skinIn, P.grassDark, true);

    // Palmeira ao fundo
    g.lineStyle(6, P.woodDark, 1);
    g.lineBetween(-88, 56, -82, -6);
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.5;
      K.poly(g, [
        { x: -82, y: -6 },
        { x: -82 + Math.cos(a) * 34, y: -6 + Math.sin(a) * 30 - 6 },
        { x: -82 + Math.cos(a) * 30, y: -6 + Math.sin(a) * 26 + 8 },
      ], P.leaf, 2);
    }
  },

  /* ------------------ Primeiro contato: dois lados ------------------ */
  contato(g, K, P) {
    K.scene(g, K, P.sky, P.sand, 58);

    // Mar ao fundo
    g.fillStyle(P.sea, 1);
    g.fillRect(-105, 30, 210, 28);
    K.waves(g, K, 42, 1, P.seaDeep);

    // Português: gibão, chapéu, barba
    K.poly(g, [
      { x: -66, y: -18 }, { x: -30, y: -18 }, { x: -24, y: 66 }, { x: -72, y: 66 },
    ], P.blue, 3);
    K.circ(g, -48, -34, 16, P.skinPt, 3);
    K.poly(g, [{ x: -66, y: -44 }, { x: -30, y: -44 }, { x: -48, y: -60 }], P.line, 2);
    g.fillStyle(P.line, 1);
    g.fillRect(-68, -46, 40, 7);
    K.poly(g, [{ x: -58, y: -26 }, { x: -38, y: -26 }, { x: -48, y: -14 }], 0x6b4a2f, 0);
    // Braço estendido, oferecendo
    K.limb(g, -30, -6, 0, 6, 11, P.blue);
    K.circ(g, 2, 8, 7, P.skinPt, 2);

    // Indígena: cocar, arco, pintura corporal
    K.poly(g, [
      { x: 30, y: -18 }, { x: 66, y: -18 }, { x: 72, y: 66 }, { x: 24, y: 66 },
    ], P.skinIn, 3);
    K.circ(g, 48, -34, 16, P.skinIn, 3);
    for (let i = -2; i <= 2; i++) {
      K.poly(g, [
        { x: 48 + i * 8, y: -48 }, { x: 48 + i * 8 - 4, y: -70 },
        { x: 48 + i * 8 + 4, y: -70 },
      ], i % 2 === 0 ? P.red : P.gold, 1);
    }
    g.fillStyle(P.red, 0.75);
    for (let i = 0; i < 3; i++) g.fillRect(34, 4 + i * 14, 30, 5);
    // Braço estendido, recebendo
    K.limb(g, 30, -6, 12, 8, 11, P.skinIn);
    K.circ(g, 10, 10, 7, P.skinIn, 2);
    // Arco na outra mão
    g.lineStyle(4, P.woodDark, 1);
    g.beginPath(); g.arc(84, 20, 34, -1.1, 1.1); g.strokePath();
    g.lineStyle(2, P.parchShade, 1);
    g.lineBetween(69, -10, 69, 50);
  },

  /* ------------------------- Troca de objetos ----------------------- */
  troca(g, K, P) {
    K.plate(g, K);

    // Mão portuguesa, à esquerda, com o sombreiro
    K.limb(g, -105, 40, -44, 24, 20, P.blue);
    K.circ(g, -34, 20, 15, P.skinPt, 3);
    K.ell(g, -30, -22, 76, 20, P.red, 3);
    K.poly(g, [
      { x: -50, y: -24 }, { x: -10, y: -24 }, { x: -14, y: -52 }, { x: -46, y: -52 },
    ], P.red, 3);
    K.rrect(g, -52, -32, 46, 9, 3, P.gold, 2);

    // Mão indígena, à direita, com o cocar de penas
    K.limb(g, 105, 40, 44, 24, 20, P.skinIn);
    K.circ(g, 34, 20, 15, P.skinIn, 3);
    for (let i = -3; i <= 3; i++) {
      const a = (i * 0.22) - Math.PI / 2;
      K.poly(g, [
        { x: 34 + Math.cos(a) * 12, y: -6 + Math.sin(a) * 12 },
        { x: 34 + Math.cos(a) * 52 - 5, y: -6 + Math.sin(a) * 52 },
        { x: 34 + Math.cos(a) * 52 + 5, y: -6 + Math.sin(a) * 52 },
      ], i % 2 === 0 ? P.leaf : P.gold, 1);
    }
    K.ell(g, 34, -4, 34, 14, P.woodDark, 2);

    // Setas de troca, no centro
    g.lineStyle(5, P.lineSoft, 1);
    g.beginPath(); g.arc(0, 62, 22, Math.PI * 1.15, Math.PI * 1.85); g.strokePath();
    K.poly(g, [{ x: 20, y: 46 }, { x: 30, y: 54 }, { x: 17, y: 58 }], P.lineSoft, 0);
    K.poly(g, [{ x: -20, y: 46 }, { x: -30, y: 54 }, { x: -17, y: 58 }], P.lineSoft, 0);
  },

  /* ------------------------ Povos indígenas ------------------------- */
  indigenas(g, K, P) {
    K.scene(g, K, P.sky, P.grass, 62);

    // Figura central, de frente
    K.poly(g, [
      { x: -22, y: -14 }, { x: 22, y: -14 }, { x: 28, y: 70 }, { x: -28, y: 70 },
    ], P.skinIn, 3);
    K.circ(g, 0, -34, 20, P.skinIn, 3);
    g.fillStyle(P.line, 1);
    g.fillCircle(-7, -37, 2.6);
    g.fillCircle(7, -37, 2.6);

    // Cocar
    for (let i = -3; i <= 3; i++) {
      K.poly(g, [
        { x: i * 10, y: -50 }, { x: i * 10 - 5, y: -84 }, { x: i * 10 + 5, y: -84 },
      ], i % 2 === 0 ? P.red : P.gold, 1);
    }
    K.rrect(g, -36, -58, 72, 12, 6, P.woodDark, 2);

    // Pintura corporal e colar
    g.fillStyle(P.red, 0.8);
    for (let i = 0; i < 3; i++) g.fillRect(-18, 6 + i * 16, 36, 6);
    g.lineStyle(4, P.white, 1);
    g.beginPath(); g.arc(0, -14, 17, 0.25, Math.PI - 0.25); g.strokePath();

    // Braços: um com arco, outro relaxado
    K.limb(g, -22, -4, -48, 34, 12, P.skinIn);
    K.limb(g, 22, -4, 44, 30, 12, P.skinIn);
    g.lineStyle(5, P.woodDark, 1);
    g.beginPath(); g.arc(-62, 20, 40, -1.0, 1.0); g.strokePath();
    g.lineStyle(2, P.parchShade, 1);
    g.lineBetween(-40, -14, -40, 54);

    // Vegetação em volta
    for (const b of [[-88, 66, 16], [86, 70, 14]]) K.circ(g, b[0], b[1], b[2], P.grassDark, 3);
    g.lineStyle(3, P.grassDark, 1);
    for (let i = -96; i < 100; i += 18) g.lineBetween(i, 66, i + 6, 52);
  },

  /* ----------------------- Terra e vegetação ------------------------ */
  vegetacao(g, K, P) {
    K.scene(g, K, P.sky, P.grass, 44);

    // Rio
    K.poly(g, [
      { x: -18, y: 44 }, { x: 14, y: 44 },
      ...K.qbez(14, 44, 46, 74, 34, 105, 8).slice(1),
      { x: -46, y: 105 },
      ...K.qbez(-46, 105, -26, 72, -18, 44, 8).slice(1),
    ], P.sea, 3, P.seaDeep);
    g.lineStyle(3, P.white, 0.55);
    g.strokePoints(K.qbez(-14, 56, 8, 74, -6, 98, 10), false);

    // Palmeiras
    const palm = (x, base, top, size) => {
      g.lineStyle(7, P.woodDark, 1);
      g.strokePoints(K.qbez(x, base, x + 6, (base + top) / 2, x + 12, top, 8), false);
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i - 2.5) * 0.46;
        K.poly(g, [
          { x: x + 12, y: top },
          { x: x + 12 + Math.cos(a) * size, y: top + Math.sin(a) * size * 0.9 - 5 },
          { x: x + 12 + Math.cos(a) * size * 0.9, y: top + Math.sin(a) * size * 0.8 + 9 },
        ], i % 2 ? P.leaf : P.grassDark, 2);
      }
      K.circ(g, x + 6, top + 12, 5, P.woodDark, 0);
    };
    palm(-76, 60, -46, 36);
    palm(52, 74, -18, 40);

    // Morros ao fundo
    K.poly(g, [{ x: -105, y: 44 }, { x: -52, y: 4 }, { x: 4, y: 44 }], P.grassDark, 2);
    K.poly(g, [{ x: 18, y: 44 }, { x: 62, y: 12 }, { x: 105, y: 44 }], P.grassDark, 2);

    // Moitas e aves
    for (const b of [[-40, 76, 15], [22, 66, 12], [90, 84, 14]]) {
      K.circ(g, b[0], b[1], b[2], P.grassDark, 3);
    }
    g.lineStyle(3, P.line, 0.75);
    for (const b of [[-30, -68], [-6, -84], [24, -62]]) {
      g.beginPath(); g.arc(b[0] - 6, b[1], 7, -0.5, 0.9); g.strokePath();
      g.beginPath(); g.arc(b[0] + 6, b[1], 7, 2.2, 3.6); g.strokePath();
    }
  },

  /* ------------------------ Escrivão Caminha ------------------------ */
  caminha(g, K, P) {
    K.plate(g, K, P.skyWarm);

    // Mesa
    g.fillStyle(P.wood, 1);
    g.fillRoundedRect(-105, 62, 210, 43, { tl: 0, tr: 0, bl: 14, br: 14 });
    g.lineStyle(3, P.woodDark, 1);
    g.lineBetween(-105, 62, 105, 62);

    // Escrivão: túnica escura e chapéu de escriba
    K.poly(g, [
      { x: -34, y: -18 }, { x: 34, y: -18 }, { x: 46, y: 62 }, { x: -46, y: 62 },
    ], P.blue, 3);
    K.circ(g, 0, -40, 21, P.skinPt, 3);
    // Chapéu
    K.poly(g, [
      { x: -24, y: -54 }, { x: 24, y: -54 }, { x: 20, y: -74 }, { x: -20, y: -74 },
    ], P.line, 2);
    K.ell(g, 0, -54, 58, 14, P.line, 2);
    // Barba e olhos
    K.poly(g, [
      { x: -15, y: -34 }, { x: 15, y: -34 }, { x: 9, y: -14 }, { x: -9, y: -14 },
    ], 0x6b4a2f, 2);
    g.fillStyle(P.line, 1);
    g.fillCircle(-7, -42, 2.6);
    g.fillCircle(7, -42, 2.6);
    // Colarinho branco
    K.poly(g, [{ x: -18, y: -18 }, { x: 18, y: -18 }, { x: 0, y: -4 }], P.white, 2);

    // Papel sobre a mesa
    K.poly(g, [
      { x: -62, y: 44 }, { x: 30, y: 38 }, { x: 36, y: 76 }, { x: -58, y: 82 },
    ], P.parch, 3);
    g.lineStyle(3, P.ink, 0.7);
    for (let i = 0; i < 3; i++) g.lineBetween(-52, 52 + i * 11, 20, 49 + i * 11);

    // Braço com a pena
    K.limb(g, 30, 2, -6, 40, 13, P.blue);
    K.circ(g, -8, 42, 8, P.skinPt, 2);
    g.lineStyle(4, P.lineSoft, 1);
    g.lineBetween(-8, 42, 26, -6);
    K.poly(g, [
      { x: 26, y: -6 }, { x: 44, y: -34 }, { x: 34, y: 4 },
    ], P.white, 2, P.lineSoft);

    // Tinteiro no canto da mesa
    K.poly(g, [{ x: 62, y: 76 }, { x: 92, y: 76 }, { x: 88, y: 50 }, { x: 66, y: 50 }], P.woodDark, 2);
    K.ell(g, 77, 50, 24, 9, P.ink, 2);
  },

  /* --------------------------- Rei D. Manuel ------------------------ */
  rei(g, K, P) {
    K.plate(g, K, P.skyWarm);

    // Manto e ombros
    K.poly(g, [
      { x: -58, y: 14 }, { x: 58, y: 14 }, { x: 78, y: 105 }, { x: -78, y: 105 },
    ], P.red, 3);
    // Gola de arminho
    K.poly(g, [
      { x: -58, y: 14 }, { x: -22, y: 22 }, { x: -30, y: 105 }, { x: -78, y: 105 },
    ], P.white, 3, P.lineSoft);
    K.poly(g, [
      { x: 58, y: 14 }, { x: 22, y: 22 }, { x: 30, y: 105 }, { x: 78, y: 105 },
    ], P.white, 3, P.lineSoft);
    g.fillStyle(P.line, 1);
    for (const s of [[-52, 44], [-40, 74], [40, 44], [52, 74]]) g.fillCircle(s[0], s[1], 3.4);

    // Colar com pingente
    g.lineStyle(5, P.gold, 1);
    g.beginPath(); g.arc(0, 16, 30, 0.3, Math.PI - 0.3); g.strokePath();
    K.circ(g, 0, 48, 9, P.gold, 2);

    // Rosto e cabelo
    K.circ(g, 0, -22, 26, P.skinPt, 3);
    K.poly(g, [
      { x: -26, y: -26 }, { x: 26, y: -26 }, { x: 30, y: 6 }, { x: -30, y: 6 },
    ], 0x6b4a2f, 2);
    K.circ(g, 0, -22, 26, P.skinPt, 0);
    g.fillStyle(P.line, 1);
    g.fillCircle(-9, -26, 3);
    g.fillCircle(9, -26, 3);
    // Barba curta
    K.poly(g, [
      { x: -17, y: -12 }, { x: 17, y: -12 }, { x: 10, y: 12 }, { x: -10, y: 12 },
    ], 0x6b4a2f, 2);

    // Coroa
    K.poly(g, [
      { x: -30, y: -46 }, { x: 30, y: -46 }, { x: 26, y: -66 },
      { x: 14, y: -54 }, { x: 0, y: -76 }, { x: -14, y: -54 }, { x: -26, y: -66 },
    ], P.gold, 3);
    g.fillStyle(P.red, 1);
    g.fillCircle(0, -50, 4.5);
    g.fillStyle(P.blue, 1);
    g.fillCircle(-17, -48, 3.6);
    g.fillCircle(17, -48, 3.6);
  },

  /* --------------------- Arquivo da Torre do Tombo ------------------- */
  arquivo(g, K, P) {
    K.plate(g, K, 0xe6d9bd);

    // Estante
    K.rrect(g, -92, -88, 184, 176, 8, P.wood, 3);
    g.fillStyle(P.woodDark, 1);
    g.fillRect(-92, -18, 184, 9);
    g.fillRect(-92, 44, 184, 9);
    g.fillStyle(0xc99a63, 1);
    g.fillRect(-84, -80, 168, 62);
    g.fillRect(-84, -9, 168, 53);
    g.fillRect(-84, 53, 168, 30);

    // Rolos de pergaminho, de pé
    const roll = (x, y, h) => {
      K.rrect(g, x, y - h, 18, h, 4, P.parch, 2, P.lineSoft);
      K.ell(g, x + 9, y - h, 20, 8, P.parchShade, 2, P.lineSoft);
    };
    roll(-74, -20, 52); roll(-50, -20, 44); roll(-26, -20, 56);
    roll(28, -20, 48); roll(52, -20, 40);
    // Rolo deitado, com fita
    K.rrect(g, -12, -34, 46, 15, 7, P.parch, 2, P.lineSoft);
    g.fillStyle(P.red, 1);
    g.fillRect(6, -35, 7, 17);

    // Livros na prateleira do meio
    const book = (x, w, h, c) => K.rrect(g, x, 42 - h, w, h, 3, c, 2);
    book(-76, 17, 48, P.blue); book(-56, 15, 42, P.red);
    book(-38, 18, 50, P.grassDark); book(-17, 14, 38, P.gold);
    book(34, 16, 46, P.blue); book(54, 15, 40, P.red);

    // Caixa lacrada na prateleira de baixo
    K.rrect(g, -30, 58, 74, 24, 4, P.woodDark, 2);
    K.circ(g, 7, 70, 9, P.red, 2);
    g.fillStyle(P.gold, 1);
    g.fillRect(-24, 66, 62, 4);
  },

  /* ---------------- Dois olhares sobre o mesmo encontro -------------- */
  /**
   * Usada na contextualização: à esquerda o escrivão português e sua página;
   * à direita, os povos que já viviam na terra. A divisória dourada no meio é
   * o ponto da ilustração — a Carta conta o lado de quem escreveu.
   */
  perspectivas(g, K, P) {
    const h = K.HALF;

    // Dois campos de cor, um para cada lado
    g.fillStyle(P.parch, 1);
    g.fillRoundedRect(-h, -h, h, K.SIZE, { tl: 14, tr: 0, bl: 14, br: 0 });
    g.fillStyle(0xd6e8c6, 1);
    g.fillRoundedRect(0, -h, h, K.SIZE, { tl: 0, tr: 14, bl: 0, br: 14 });
    g.lineStyle(3, P.lineSoft, 1);
    g.strokeRoundedRect(-h, -h, K.SIZE, K.SIZE, 14);

    /* ----------------------- Escrivão português --------------------- */
    K.poly(g, [
      { x: -80, y: 10 }, { x: -24, y: 10 }, { x: -16, y: 92 }, { x: -88, y: 92 },
    ], P.blue, 3);
    K.poly(g, [{ x: -74, y: 10 }, { x: -30, y: 10 }, { x: -52, y: 26 }], P.white, 2);
    K.circ(g, -52, -12, 20, P.skinPt, 3);
    K.poly(g, [
      { x: -64, y: -6 }, { x: -40, y: -6 }, { x: -45, y: 13 }, { x: -59, y: 13 },
    ], 0x6b4a2f, 2);
    g.fillStyle(P.line, 1);
    g.fillCircle(-59, -16, 2.6);
    g.fillCircle(-45, -16, 2.6);
    // Chapéu de escriba
    K.poly(g, [
      { x: -68, y: -32 }, { x: -36, y: -32 }, { x: -39, y: -50 }, { x: -65, y: -50 },
    ], P.line, 2);
    K.ell(g, -52, -32, 50, 13, P.line, 2);

    // A página escrita, no alto do lado dele: o registro que chegou até nós
    K.rrect(g, -92, -94, 36, 30, 3, P.white, 2, P.lineSoft);
    g.lineStyle(2, P.ink, 0.8);
    for (let i = 0; i < 4; i++) g.lineBetween(-86, -86 + i * 6, -62, -86 + i * 6);

    /* ----------------------- Povos da terra ------------------------- */
    K.poly(g, [
      { x: 24, y: 10 }, { x: 80, y: 10 }, { x: 88, y: 92 }, { x: 16, y: 92 },
    ], P.skinIn, 3);
    K.circ(g, 52, -12, 20, P.skinIn, 3);
    g.fillStyle(P.line, 1);
    g.fillCircle(45, -16, 2.6);
    g.fillCircle(59, -16, 2.6);
    // Cocar
    for (let i = -2; i <= 2; i++) {
      K.poly(g, [
        { x: 52 + i * 9, y: -30 }, { x: 52 + i * 9 - 4, y: -62 },
        { x: 52 + i * 9 + 4, y: -62 },
      ], i % 2 === 0 ? P.red : P.gold, 1);
    }
    K.rrect(g, 24, -38, 56, 12, 6, P.woodDark, 2);
    // Colar e pintura corporal
    g.lineStyle(4, P.white, 1);
    g.beginPath(); g.arc(52, 10, 17, 0.25, Math.PI - 0.25); g.strokePath();
    g.fillStyle(P.red, 0.75);
    for (let i = 0; i < 3; i++) g.fillRect(34, 34 + i * 15, 36, 6);

    // O arco e a flecha, no alto do lado deles — o contraponto à página
    g.lineStyle(4, P.woodDark, 1);
    g.beginPath(); g.arc(62, -78, 20, -1.25, 1.25); g.strokePath();
    g.lineStyle(2, P.parchShade, 1);
    g.lineBetween(68, -97, 68, -59);
    g.lineStyle(3, P.woodDark, 1);
    g.lineBetween(46, -78, 80, -78);

    /* ------------------------- A divisória -------------------------- */
    g.lineStyle(4, P.gold, 1);
    g.lineBetween(0, -h, 0, h);
    K.circ(g, 0, 0, 16, P.plate, 3, P.lineSoft);
    K.poly(g, K.starPoints(0, 0, 13, 4.5, 4), P.gold, 1);
  },

  /* -------------- Fallback: pergaminho com bússola ------------------ */
  __fallback(g, K, P) {
    K.plate(g, K);

    // Pergaminho aberto, com rolos nas pontas
    K.poly(g, [
      { x: -78, y: -58 }, { x: 78, y: -58 }, { x: 78, y: 58 }, { x: -78, y: 58 },
    ], P.parch, 3);
    K.rrect(g, -92, -66, 20, 132, 10, P.parchShade, 3);
    K.rrect(g, 72, -66, 20, 132, 10, P.parchShade, 3);

    // Rosa dos ventos ao centro
    K.circ(g, 0, 0, 42, P.plate, 3, P.lineSoft);
    K.poly(g, K.starPoints(0, 0, 40, 12, 4), P.parchShade, 2, P.lineSoft);
    K.poly(g, K.starPoints(0, 0, 28, 9, 4, -Math.PI / 4), P.gold, 2);
    K.poly(g, [{ x: 0, y: -38 }, { x: -9, y: 4 }, { x: 0, y: 12 }], P.white, 2);
    K.poly(g, [{ x: 0, y: -38 }, { x: 9, y: 4 }, { x: 0, y: 12 }], P.red, 2);
    K.circ(g, 0, 0, 6, P.gold, 2);

    // Linhas de texto insinuadas
    g.lineStyle(3, P.lineSoft, 0.5);
    for (let i = 0; i < 2; i++) {
      g.lineBetween(-62, -44 + i * 12, 62, -44 + i * 12);
      g.lineBetween(-62, 34 + i * 12, 62, 34 + i * 12);
    }
  },
};

if (typeof window !== 'undefined') {
  window.IllustrationKit = IllustrationKit;
}
