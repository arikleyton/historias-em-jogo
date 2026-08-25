// ChopScene: minigame de corte do pau-brasil. Uma barra de precisao com um indicador
// em ping-pong define a qualidade de cada golpe (verde = perfeito, amarelo = parcial,
// vermelho = erro); acumular golpes bons avanca o tronco de estagio ate virar toco.

const CHOP_STAGES = ["tronco_inteiro", "tronco_cortado", "toco"];
const CHOP_TREE_DISPLAY_WIDTH = 650;
const CHOP_TREE_DISPLAY_HEIGHT = 867;
const CHOP_AXE_DISPLAY_SIZE = 200;
const CHOP_AXE_SWING_DURATION = 130; // ida; com yoyo o golpe completo dura ~260ms
const CHOP_WOOD_REWARD = 2; // madeira ganha por arvore cortada (ritmo: 5 arvores = 10 no total)
const CHOP_TREE_SHAKE_OFFSET = 10; // deslocamento horizontal do tremor, em pixels
const CHOP_TREE_SHAKE_LEG_DURATION = 30; // duracao de cada trecho do tremor (3 ciclos com yoyo = ~180ms)
const CHOP_YELLOW_HITS_NEEDED = 2; // acertos amarelos necessarios pra valer 1 estagio

// ---- Barra de precisao ----
const CHOP_BAR_WIDTH = 44;
const CHOP_BAR_HEIGHT = 440;
const CHOP_BAR_TOP = 140;
const CHOP_BAR_TRAVEL_MS = 900; // tempo pra percorrer a barra inteira em uma direcao
const CHOP_BAR_RESULT_PAUSE = 350; // ms que o indicador fica parado mostrando o resultado

// Zonas da barra, de cima (0) a baixo (1). Vermelho ~50% total, amarelo ~30%, verde ~20%.
const CHOP_ZONES = [
  { from: 0, to: 0.25, kind: "red" },
  { from: 0.25, to: 0.4, kind: "yellow" },
  { from: 0.4, to: 0.6, kind: "green" },
  { from: 0.6, to: 0.75, kind: "yellow" },
  { from: 0.75, to: 1, kind: "red" },
];

const CHOP_ZONE_STYLE = {
  green: { fill: 0x3fbf5f, css: "#3fbf5f", label: "Acerto perfeito!" },
  yellow: { fill: 0xe0b93a, css: "#e0b93a", label: "Parcial!" },
  red: { fill: 0xcc3333, css: "#cc3333", label: "Errou!" },
};

class ChopScene extends Phaser.Scene {
  constructor() {
    super("ChopScene");
  }

  init(data) {
    this.treeId = data && data.treeId !== undefined ? data.treeId : null;
  }

  preload() {
    this.load.image("fundo_floresta", "assets/fundo_floresta.png");
    this.load.image("chao_floresta", "assets/chao_floresta.png");
    this.load.image("tronco_inteiro", "assets/tronco_inteiro.png");
    this.load.image("tronco_cortado", "assets/tronco_cortado.png");
    this.load.image("toco", "assets/toco.png");
    this.load.image("machado", "assets/machado.png");
    this.load.image("madeira_icone", "assets/madeira_icone.png");
  }

  create() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // ---- Camadas de fundo (fixas) ----
    this.add.image(centerX, centerY, "fundo_floresta").setDisplaySize(this.scale.width, this.scale.height).setDepth(0);
    this.add.image(centerX, centerY, "chao_floresta").setDisplaySize(this.scale.width, this.scale.height).setDepth(1);

    // ---- Estado de progresso do corte ----
    this.stageIndex = 0;
    this.yellowHitCount = 0;
    this.choppingDone = false;

    // ---- Arvore (origem na base para o tronco "encolher" no lugar certo entre estagios) ----
    this.treeX = centerX;
    this.treeBaseY = 660;
    this.tree = this.add
      .image(this.treeX, this.treeBaseY, CHOP_STAGES[this.stageIndex])
      .setOrigin(0.5, 1)
      .setDisplaySize(CHOP_TREE_DISPLAY_WIDTH, CHOP_TREE_DISPLAY_HEIGHT)
      .setDepth(5);

    // ---- Machado (fica sempre puxado pra tras/em riste; o clique so faz o golpe pra frente) ----
    this.axeRestX = this.treeX + 190;
    this.axeRestY = this.treeBaseY - 200;
    this.axeRestAngle = -55;
    this.axeHitAngle = 25;
    this.axe = this.add
      .image(this.axeRestX, this.axeRestY, "machado")
      .setOrigin(0.5, 0.85)
      .setDisplaySize(CHOP_AXE_DISPLAY_SIZE, CHOP_AXE_DISPLAY_SIZE)
      .setAngle(this.axeRestAngle)
      .setDepth(10);

    // ---- Indicador de progresso (golpes amarelos parciais acumulados) ----
    this.progressText = createPanelText(this, this.treeX, 70, "", {
      fontSize: "20px",
      bold: true,
      originX: 0.5,
      originY: 0,
      depth: 998,
    });
    this.updateProgressText();

    // ---- Prompt final (mesmo estilo do prompt de proximidade da MapScene) ----
    this.promptText = createPanelText(this, this.treeX, 70, "", {
      fontSize: "18px",
      bold: true,
      originX: 0.5,
      originY: 0,
      depth: 998,
      visible: false,
    });

    this.createTimingBar();

    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.input.on("pointerdown", this.handleStrike, this);

    addWoodHud(this);
    addMapButton(this);
  }

  update(time, delta) {
    if (this.choppingDone) {
      if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
        this.scene.start("MapScene");
      }
      return;
    }

    this.updateTimingBar(delta);
  }

  // ---- Barra de precisao ----

  createTimingBar() {
    const barX = this.scale.width - 70;
    this.barX = barX;
    this.barTop = CHOP_BAR_TOP;

    this.barContainer = this.add.container(0, 0).setDepth(30);

    CHOP_ZONES.forEach((zone) => {
      const yTop = this.barTop + zone.from * CHOP_BAR_HEIGHT;
      const yBottom = this.barTop + zone.to * CHOP_BAR_HEIGHT;
      const rect = this.add.rectangle(
        barX,
        (yTop + yBottom) / 2,
        CHOP_BAR_WIDTH,
        yBottom - yTop,
        CHOP_ZONE_STYLE[zone.kind].fill
      );
      this.barContainer.add(rect);
    });

    const borderGraphics = this.add.graphics();
    borderGraphics.lineStyle(3, 0xf3e6d3, 0.9);
    borderGraphics.strokeRoundedRect(barX - CHOP_BAR_WIDTH / 2 - 3, this.barTop - 3, CHOP_BAR_WIDTH + 6, CHOP_BAR_HEIGHT + 6, 6);
    this.barContainer.add(borderGraphics);

    this.indicatorMarker = this.add
      .rectangle(barX, this.barTop, CHOP_BAR_WIDTH + 18, 8, 0xffffff)
      .setDepth(31);

    this.strikeResultText = createPanelText(this, barX, this.barTop - 34, "", {
      fontSize: "16px",
      bold: true,
      originX: 0.5,
      originY: 0.5,
      depth: 998,
      visible: false,
    });

    this.indicatorT = 0;
    this.indicatorDir = 1;
    this.barLocked = false;
  }

  updateTimingBar(delta) {
    if (this.barLocked) return;

    this.indicatorT += (this.indicatorDir * delta) / CHOP_BAR_TRAVEL_MS;

    if (this.indicatorT >= 1) {
      this.indicatorT = 1;
      this.indicatorDir = -1;
    } else if (this.indicatorT <= 0) {
      this.indicatorT = 0;
      this.indicatorDir = 1;
    }

    this.indicatorMarker.y = this.barTop + this.indicatorT * CHOP_BAR_HEIGHT;
  }

  getZoneAt(t) {
    const zone = CHOP_ZONES.find((z) => t >= z.from && t <= z.to);
    return zone.kind;
  }

  hideTimingBar() {
    this.barContainer.setVisible(false);
    this.indicatorMarker.setVisible(false);
    this.strikeResultText.setVisible(false);
  }

  // ---- Golpe ----

  handleStrike() {
    if (this.choppingDone || this.barLocked) return;

    const zone = this.getZoneAt(this.indicatorT);
    this.barLocked = true;

    this.playAxeSwing();

    if (zone !== "red") {
      this.scheduleTreeShake();
    }

    const style = CHOP_ZONE_STYLE[zone];
    this.strikeResultText.setText(style.label);
    this.strikeResultText.setColor(style.css);
    this.strikeResultText.setVisible(true);
    this.indicatorMarker.setFillStyle(style.fill);

    this.time.delayedCall(CHOP_BAR_RESULT_PAUSE, () => this.resolveStrike(zone), [], this);
  }

  resolveStrike(zone) {
    if (zone === "green") {
      this.yellowHitCount = 0;
      this.advanceStage();
    } else if (zone === "yellow") {
      this.yellowHitCount++;
      if (this.yellowHitCount >= CHOP_YELLOW_HITS_NEEDED) {
        this.yellowHitCount = 0;
        this.advanceStage();
      } else {
        this.updateProgressText();
      }
    }
    // vermelho: nenhum progresso.

    if (!this.choppingDone) {
      this.resetTimingBar();
    }
  }

  resetTimingBar() {
    this.indicatorT = 0;
    this.indicatorDir = 1;
    this.barLocked = false;
    this.indicatorMarker.setFillStyle(0xffffff);
    this.strikeResultText.setVisible(false);
  }

  playAxeSwing() {
    this.tweens.killTweensOf(this.axe);
    this.axe.setAngle(this.axeRestAngle);
    this.axe.x = this.axeRestX;

    this.tweens.add({
      targets: this.axe,
      angle: this.axeHitAngle,
      x: this.axeRestX - 35,
      duration: CHOP_AXE_SWING_DURATION,
      yoyo: true,
      ease: "Cubic.easeOut",
    });
  }

  scheduleTreeShake() {
    if (this.shakeDelayedCall) this.shakeDelayedCall.remove(false);

    // O tronco so treme quando o machado realmente chega no ponto de impacto
    // (fim da primeira perna do swing), nao no instante do clique.
    this.shakeDelayedCall = this.time.delayedCall(CHOP_AXE_SWING_DURATION, () => this.playTreeShake(), [], this);
  }

  playTreeShake() {
    this.tweens.killTweensOf(this.tree);
    this.tree.x = this.treeX;

    this.tweens.add({
      targets: this.tree,
      x: this.treeX + CHOP_TREE_SHAKE_OFFSET,
      duration: CHOP_TREE_SHAKE_LEG_DURATION,
      yoyo: true,
      repeat: 2,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.tree.x = this.treeX;
      },
    });
  }

  advanceStage() {
    this.stageIndex++;
    this.tree.setTexture(CHOP_STAGES[this.stageIndex]);

    const isFinalStage = this.stageIndex >= CHOP_STAGES.length - 1;

    if (isFinalStage) {
      this.choppingDone = true;
      this.hideTimingBar();
      this.progressText.setVisible(false);
      this.promptText.setText("Pressione E para voltar ao mapa");
      this.promptText.setVisible(true);
      this.registry.set("woodCount", this.registry.get("woodCount") + CHOP_WOOD_REWARD);

      if (this.treeId !== null) {
        const cutTrees = this.registry.get("cutTrees") || [];
        if (!cutTrees.includes(this.treeId)) {
          this.registry.set("cutTrees", [...cutTrees, this.treeId]);
        }
      }
    } else {
      this.updateProgressText();
    }
  }

  updateProgressText() {
    this.progressText.setText(`Golpes parciais: ${this.yellowHitCount}/${CHOP_YELLOW_HITS_NEEDED}`);
  }
}
