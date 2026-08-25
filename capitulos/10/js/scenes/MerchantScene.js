// MerchantScene: escambo com o mercador portugues. O jogador arrasta a madeira
// coletada ate o balcao para entregar; cada meta batida (1, 5, 10) da um item
// diferente, o ultimo (facao) encerra a fase.

// Metas progressivas de entrega parcial: cada entrega cobre so a meta atual,
// deixando o excedente guardado no inventario para a proxima.
const MERCHANT_TARGETS = [1, 5, 10];
const MERCHANT_TARGET_STAGE_1 = 5;
const MERCHANT_TARGET_STAGE_2 = 10;
const MERCHANT_MONTINHO_DISPLAY_SIZE = 110;
const MERCHANT_REWARD_DISPLAY_SIZE = 220;
const MERCHANT_TYPEWRITER_DELAY = 28; // ms por caractere
const MERCHANT_BOUNCE_OFFSET = 6; // px de deslocamento vertical do mercador ao falar
const MERCHANT_BOUNCE_DURATION = 90; // ida; com yoyo, ciclo completo ~180ms

// Item de recompensa dado em cada meta.
const MERCHANT_REWARD_ITEM_BY_TARGET = {
  1: "micanga",
  5: "espelho",
  10: "facao",
};

// ---- Roteiro de dialogos, alternando mercador e indigena ----
const DIALOGUE_INTRO = [
  { speaker: "merchant", text: "Como vai, meu caro amigo indígena?" },
  { speaker: "merchant", text: "Que tal trocar um tronco de madeira por miçangas?" },
  { speaker: "player", text: "Sem problemas. Essas miçangas parecem interessantes." },
];

const DIALOGUE_MILESTONE_1 = [
  {
    speaker: "merchant",
    text: "Aqui estão suas miçangas! Mas... vou precisar de mais madeira. Traga 5 no total, e lhe darei algo melhor: um espelho.",
  },
  { speaker: "player", text: "Mais? Acho que posso fazer isso." },
];

const DIALOGUE_MILESTONE_5 = [
  {
    speaker: "merchant",
    text: "Aqui está seu espelho! Ainda não é suficiente, porém. Preciso de 10 ao todo, e lhe darei um facão de verdade.",
  },
  { speaker: "player", text: "Isso está me parecendo injusto, mas tudo bem." },
];

const DIALOGUE_MILESTONE_10 = [{ speaker: "merchant", text: "Agora sim! Aqui está seu facão." }];

const SYSTEM_MESSAGE_FINAL = "Parabéns, você acabou de trocar 10 árvores por um facão!";

class MerchantScene extends Phaser.Scene {
  constructor() {
    super("MerchantScene");
  }

  preload() {
    this.load.image("barraca_interior", "assets/barraca_interior.png");
    this.load.image("balcao", "assets/balcao.png");
    this.load.image("mercador", "assets/mercador.png");
    this.load.image("madeira_montinho", "assets/madeira_montinho.png");
    this.load.image("madeira_icone", "assets/madeira_icone.png");
    this.load.image("espelho", "assets/espelho.png");
    this.load.image("micanga", "assets/micanga.png");
    this.load.image("facao", "assets/facao.png");
  }

  create() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // ---- Camadas (fundo pra frente): interior > mercador > balcao ----
    // O balcao fica na frente do mercador de proposito: ele cobre a parte de baixo
    // do corpo, deixando o mercador visivel so da cintura pra cima.
    this.add.image(centerX, centerY, "barraca_interior").setDisplaySize(this.scale.width, this.scale.height).setDepth(0);
    this.merchantSprite = this.add
      .image(centerX, centerY, "mercador")
      .setDisplaySize(this.scale.width, this.scale.height)
      .setDepth(2);
    this.merchantBaseY = centerY;
    this.add.image(centerX, centerY, "balcao").setDisplaySize(this.scale.width, this.scale.height).setDepth(3);

    this.phaseCompleted = false;
    this.montinho = null;

    this.createDialogueBox();
    this.createDeliveryZone();
    this.createRewardItem();
    this.createQuestProgressText();
    this.setupDragEvents();

    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.input.on("pointerdown", () => this.handleDialogueClick());

    addWoodHud(this);
    addMapButton(this);

    // ---- Estado inicial ----
    if (this.registry.get("totalDelivered") >= MERCHANT_TARGET_STAGE_2) {
      this.showRewardItem(MERCHANT_REWARD_ITEM_BY_TARGET[MERCHANT_TARGET_STAGE_2], true);
    } else {
      this.createMontinho();
    }

    if (this.registry.get("merchantFirstVisit")) {
      this.registry.set("merchantFirstVisit", false);
      this.registry.set("showMerchantHighlight", false);
      this.showDialogueSequence(DIALOGUE_INTRO);
    }
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.scene.start("MapScene");
    }
  }

  // ---- Dialogo (fala por fala, com typewriter e alternancia de personagem) ----

  createDialogueBox() {
    const boxWidth = 1160;
    const boxHeight = 130;
    const boxX = this.scale.width / 2;
    const boxY = this.scale.height - 90;

    this.dialogueBoxX = boxX;
    this.dialogueBoxY = boxY;
    this.dialogueBoxWidth = boxWidth;
    this.dialogueBoxHeight = boxHeight;

    this.dialogueBox = this.add.graphics().setDepth(50).setVisible(false);
    this.drawDialogueBox(0x1a1208, 0.92, 0xb98a4a);

    this.speakerNameText = this.add
      .text(boxX - boxWidth / 2 + 24, boxY - boxHeight / 2 + 10, "", {
        fontSize: "16px",
        color: "#ffd76a",
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      .setOrigin(0, 0)
      .setDepth(51)
      .setVisible(false);

    this.dialogueText = this.add
      .text(boxX, boxY - 5, "", {
        fontSize: "22px",
        color: "#ffffff",
        fontFamily: "monospace",
        wordWrap: { width: boxWidth - 60 },
        align: "center",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(51)
      .setVisible(false);

    this.dialogueHint = this.add
      .text(boxX, boxY + boxHeight / 2 - 14, "(clique para continuar)", {
        fontSize: "13px",
        color: "#cccccc",
        fontFamily: "monospace",
      })
      .setOrigin(0.5, 1)
      .setDepth(51)
      .setVisible(false);

    this.dialogueActive = false;
    this.typewriterActive = false;
    this.typewriterTimer = null;
    this.dialogueQueue = [];
    this.dialogueQueueOnComplete = null;
  }

  drawDialogueBox(fillColor, fillAlpha, borderColor) {
    const x = this.dialogueBoxX - this.dialogueBoxWidth / 2;
    const y = this.dialogueBoxY - this.dialogueBoxHeight / 2;

    this.dialogueBox.clear();
    this.dialogueBox.fillStyle(fillColor, fillAlpha);
    this.dialogueBox.fillRoundedRect(x, y, this.dialogueBoxWidth, this.dialogueBoxHeight, 16);
    this.dialogueBox.lineStyle(3, borderColor, 1);
    this.dialogueBox.strokeRoundedRect(x, y, this.dialogueBoxWidth, this.dialogueBoxHeight, 16);
  }

  showDialogueSequence(lines, onComplete) {
    this.dialogueQueue = lines.slice();
    this.dialogueQueueOnComplete = onComplete || null;
    this.dialogueBox.setVisible(true);
    this.dialogueHint.setVisible(true);
    this.dialogueActive = true;

    this.playNextDialogueLine();
  }

  playNextDialogueLine() {
    if (this.dialogueQueue.length === 0) {
      this.closeDialogueSequence();
      return;
    }

    const line = this.dialogueQueue.shift();
    this.applyLineStyle(line);
    this.startTypewriter(line.text);

    if (line.speaker === "merchant") {
      this.startMerchantBounce();
    } else {
      this.stopMerchantBounce();
    }
  }

  applyLineStyle(line) {
    if (line.speaker === "merchant") {
      this.speakerNameText.setText("Mercador:").setColor("#ffd76a").setVisible(true);
      this.drawDialogueBox(0x1a1208, 0.92, 0xb98a4a);
    } else if (line.speaker === "player") {
      this.speakerNameText.setText("Você:").setColor("#9be7ff").setVisible(true);
      this.drawDialogueBox(0x1a1208, 0.92, 0xb98a4a);
    } else {
      // Mensagem de sistema/narrador: sem nome de personagem, cor de fundo distinta.
      this.speakerNameText.setVisible(false);
      this.drawDialogueBox(0x0d2340, 0.95, 0xf3c969);
    }
  }

  closeDialogueSequence() {
    this.dialogueBox.setVisible(false);
    this.dialogueText.setVisible(false);
    this.dialogueHint.setVisible(false);
    this.speakerNameText.setVisible(false);
    this.dialogueActive = false;
    this.stopMerchantBounce();

    if (this.dialogueQueueOnComplete) {
      const callback = this.dialogueQueueOnComplete;
      this.dialogueQueueOnComplete = null;
      callback();
    }
  }

  handleDialogueClick() {
    if (!this.dialogueActive) return;

    if (this.typewriterActive) {
      this.completeTypewriterInstantly();
    } else {
      this.playNextDialogueLine();
    }
  }

  startTypewriter(text) {
    if (this.typewriterTimer) {
      this.typewriterTimer.remove(false);
      this.typewriterTimer = null;
    }

    this.dialogueText.setVisible(true);
    this.dialogueText.setText("");
    this.typewriterFullText = text;

    if (text.length === 0) {
      this.typewriterActive = false;
      return;
    }

    this.typewriterActive = true;
    this.typewriterTimer = this.time.addEvent({
      delay: MERCHANT_TYPEWRITER_DELAY,
      repeat: text.length - 1,
      callback: () => {
        const revealedLength = this.dialogueText.text.length + 1;
        this.dialogueText.setText(this.typewriterFullText.slice(0, revealedLength));
        if (revealedLength >= this.typewriterFullText.length) {
          this.onTypewriterComplete();
        }
      },
    });
  }

  completeTypewriterInstantly() {
    if (this.typewriterTimer) {
      this.typewriterTimer.remove(false);
      this.typewriterTimer = null;
    }
    this.dialogueText.setText(this.typewriterFullText);
    this.onTypewriterComplete();
  }

  onTypewriterComplete() {
    this.typewriterActive = false;
    this.stopMerchantBounce();
  }

  // ---- Bounce do mercador enquanto ele fala ----

  startMerchantBounce() {
    if (this.merchantBounceTween) return;

    this.merchantBounceTween = this.tweens.add({
      targets: this.merchantSprite,
      y: this.merchantBaseY - MERCHANT_BOUNCE_OFFSET,
      duration: MERCHANT_BOUNCE_DURATION,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  stopMerchantBounce() {
    if (this.merchantBounceTween) {
      this.merchantBounceTween.stop();
      this.merchantBounceTween = null;
    }
    this.merchantSprite.y = this.merchantBaseY;
  }

  // ---- Progresso da entrega ----

  createQuestProgressText() {
    this.questProgressText = createPanelText(this, 20, 92, "", {
      fontSize: "18px",
      bold: true,
      originX: 0,
      originY: 0,
      depth: 998,
    });

    this.updateQuestProgressText();
  }

  updateQuestProgressText() {
    const totalDelivered = this.registry.get("totalDelivered");
    const target = this.getCurrentTarget(totalDelivered) ?? MERCHANT_TARGETS[MERCHANT_TARGETS.length - 1];
    this.questProgressText.setText(`Entregue: ${totalDelivered}/${target}`);
  }

  getCurrentTarget(totalDelivered) {
    const next = MERCHANT_TARGETS.find((target) => target > totalDelivered);
    return next === undefined ? null : next;
  }

  // ---- Entrega por drag-and-drop ----

  createDeliveryZone() {
    this.deliveryZone = this.add.zone(this.scale.width / 2, 500, 420, 190).setRectangleDropZone(420, 190);
  }

  createMontinho() {
    if (this.montinho || this.registry.get("woodCount") <= 0) return;

    this.montinho = this.add
      .image(130, 620, "madeira_montinho")
      .setDisplaySize(MERCHANT_MONTINHO_DISPLAY_SIZE, MERCHANT_MONTINHO_DISPLAY_SIZE)
      .setDepth(20)
      .setInteractive({ useHandCursor: true });

    // Contorno branco fixo (mesmo FX de glow da barraca), sem pulso - so pra indicar
    // que da pra arrastar.
    this.montinho.postFX.addGlow(0xffffff, 2, 0, false, 0.1, 12);

    this.montinho.restX = this.montinho.x;
    this.montinho.restY = this.montinho.y;

    this.input.setDraggable(this.montinho);
  }

  setupDragEvents() {
    this.input.on("dragstart", (pointer, gameObject) => {
      if (this.dialogueActive) return;
      gameObject.setDepth(30);
    });

    this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
      if (this.dialogueActive) return;
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    this.input.on("dragend", (pointer, gameObject, dropped) => {
      if (!dropped && gameObject === this.montinho) {
        gameObject.setPosition(gameObject.restX, gameObject.restY);
        gameObject.setDepth(20);
      }
    });

    this.input.on("drop", (pointer, gameObject) => {
      if (gameObject === this.montinho) {
        this.handleDelivery();
      }
    });
  }

  handleDelivery() {
    const available = this.registry.get("woodCount");
    if (available <= 0) return;

    const totalDelivered = this.registry.get("totalDelivered");
    const currentTarget = this.getCurrentTarget(totalDelivered);
    if (currentTarget === null) return; // meta final ja atingida, nada mais a entregar

    // Entrega so o necessario para bater a meta atual; o excedente fica guardado.
    const remaining = currentTarget - totalDelivered;
    const delivered = Math.min(available, remaining);
    const newTotal = totalDelivered + delivered;
    const leftover = available - delivered;

    this.registry.set("totalDelivered", newTotal);
    this.registry.set("woodCount", leftover);
    this.updateQuestProgressText();

    if (this.montinho) {
      this.montinho.destroy();
      this.montinho = null;
    }

    // Se sobrou madeira e ainda ha meta pela frente, o montinho volta pra permitir nova entrega.
    if (leftover > 0 && this.getCurrentTarget(newTotal) !== null) {
      this.createMontinho();
    }

    // Entrega parcial (nao bateu a meta atual): so guarda o progresso, sem reacao do mercador.
    if (newTotal !== currentTarget) return;

    const rewardKey = MERCHANT_REWARD_ITEM_BY_TARGET[currentTarget];

    if (currentTarget === MERCHANT_TARGETS[0]) {
      this.showRewardItem(rewardKey);
      this.showDialogueSequence(DIALOGUE_MILESTONE_1);
    } else if (currentTarget === MERCHANT_TARGET_STAGE_1) {
      this.showRewardItem(rewardKey);
      this.showDialogueSequence(DIALOGUE_MILESTONE_5);
    } else if (currentTarget === MERCHANT_TARGET_STAGE_2) {
      this.showRewardItem(rewardKey, true);
      this.showDialogueSequence(DIALOGUE_MILESTONE_10, () => {
        this.showDialogueSequence([{ speaker: null, text: SYSTEM_MESSAGE_FINAL }], () => this.completePhase());
      });
    }
  }

  // ---- Item de recompensa (micanga / espelho / facao) / fim de fase ----

  createRewardItem() {
    this.rewardItem = this.add
      .image(this.scale.width / 2, this.scale.height / 2 - 40, "micanga")
      .setDisplaySize(MERCHANT_REWARD_DISPLAY_SIZE, MERCHANT_REWARD_DISPLAY_SIZE)
      .setDepth(15)
      .setVisible(false);
    this.rewardItemBaseScale = this.rewardItem.scale;
    this.rewardItemTween = null;
  }

  showRewardItem(textureKey, isFinalItem) {
    if (this.rewardItemTween) {
      this.rewardItemTween.stop();
      this.rewardItemTween = null;
    }

    this.rewardItem.removeAllListeners("pointerdown");
    this.rewardItem.disableInteractive();
    this.rewardItem.setTexture(textureKey);
    this.rewardItem.setScale(this.rewardItemBaseScale);
    this.rewardItem.setVisible(true);

    this.rewardItemTween = this.tweens.add({
      targets: this.rewardItem,
      scale: this.rewardItemBaseScale * 1.1,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // So o item final (facao) encerra a fase ao ser clicado.
    if (isFinalItem) {
      this.rewardItem.setInteractive({ useHandCursor: true });
      this.rewardItem.on("pointerdown", () => this.completePhase());
    }
  }

  completePhase() {
    if (this.phaseCompleted) return;
    this.phaseCompleted = true;

    console.log("Fim de fase: Capítulo 10 concluído.");
    this.registry.set("phaseComplete", true);

    createPanelText(this, this.scale.width / 2, this.scale.height / 2 + 160, "Fim de fase", {
      fontSize: "36px",
      bold: true,
      originX: 0.5,
      originY: 0.5,
      depth: 60,
      fillColor: 0x0d2340,
      borderColor: 0xf3c969,
    });

    this.nextChapterButton = addNextChapterButton(this, "../11/cap11.html");
  }
}
