// MapScene: mapa livre onde o jogador anda ate as arvores (corte de pau-brasil)
// ou ate a barraca do mercador (escambo).

const MAP_PLAYER_SPEED = 220;
const MAP_INTERACT_RADIUS = 90;
const MAP_PLAYER_DISPLAY_SIZE = 80;
const MAP_TREE_DISPLAY_SIZE = 130;
const MAP_MERCHANT_DISPLAY_SIZE = 170;
const MAP_TREE_CUT_TINT = 0x808080;
const MAP_SQUASH_STRETCH_AMOUNT = 0.08; // variacao de escala (8%)
const MAP_SQUASH_STRETCH_LEG_DURATION = 130; // ida; com yoyo, ciclo completo ~260ms
const MAP_SQUASH_STRETCH_RESET_DURATION = 120; // volta suave a escala normal ao parar

const MAP_TREE_POSITIONS = [
  { x: 250, y: 200 },
  { x: 1050, y: 550 },
  { x: 640, y: 600 },
  { x: 150, y: 580 },
  { x: 1050, y: 350 },
];

class MapScene extends Phaser.Scene {
  constructor() {
    super("MapScene");
  }

  preload() {
    this.load.image("indigena_baixo", "assets/indigena_baixo.png");
    this.load.image("indigena_cima", "assets/indigena_cima.png");
    this.load.image("indigena_lado", "assets/indigena_lado.png");
    this.load.image("arvore", "assets/arvore.png");
    this.load.image("barraca", "assets/barraca.png");
    this.load.image("chao", "assets/chao.png");
    this.load.image("madeira_icone", "assets/madeira_icone.png");
  }

  create() {
    // ---- Fundo: textura de chao repetida cobrindo a area jogavel ----
    this.add.tileSprite(0, 0, this.scale.width, this.scale.height, "chao").setOrigin(0, 0).setDepth(0);

    // ---- Jogador (reaparece na ultima posicao salva no registry) ----
    const startX = this.registry.get("playerX") ?? 640;
    const startY = this.registry.get("playerY") ?? 360;
    this.player = this.physics.add.image(startX, startY, "indigena_baixo");
    this.player.setDisplaySize(MAP_PLAYER_DISPLAY_SIZE, MAP_PLAYER_DISPLAY_SIZE);
    this.player.body.setCollideWorldBounds(true);
    // Escala "normal" (pos-displaySize) usada como referencia pro squash and stretch,
    // que anima em torno dela em vez de valores absolutos.
    this.playerBaseScaleX = this.player.scaleX;
    this.playerBaseScaleY = this.player.scaleY;
    this.playerSquashTween = null;
    this.isPlayerMoving = false;
    // Corpo de colisao menor que o sprite (que tem bastante espaco transparente ao redor).
    this.player.body.setSize(this.player.width * 0.45, this.player.height * 0.5);
    this.player.body.setOffset(this.player.width * 0.275, this.player.height * 0.45);

    this.facingDirection = "baixo"; // baixo | cima | lado - mantido quando o jogador para

    // ---- Interativos fixos no mapa ----
    const cutTrees = this.registry.get("cutTrees") || [];

    // Grupo estatico pra colisao: o jogador nao consegue atravessar as arvores.
    this.treeGroup = this.physics.add.staticGroup();

    const treeInteractables = MAP_TREE_POSITIONS.map((pos, treeId) => {
      const tree = this.treeGroup.create(pos.x, pos.y, "arvore");
      tree.setDisplaySize(MAP_TREE_DISPLAY_SIZE, MAP_TREE_DISPLAY_SIZE);
      // Depth por Y (base do sprite): objetos mais "pra baixo" na tela ficam na
      // frente. Assim o jogador passa por baixo da folhagem quando esta mais
      // acima da arvore, e por cima quando esta mais abaixo/na frente dela.
      tree.setDepth(tree.y + tree.displayHeight / 2);

      // Hitbox menor que o sprite (representa o tronco/base, nao a copa inteira).
      // Corpos estaticos nao aplicam a escala do game object automaticamente (o
      // tamanho vem do displaySize ja escalado) nem recentralizam sozinhos, entao
      // a posicao do corpo e calculada e atribuida manualmente.
      const hitboxWidth = tree.displayWidth * 0.35;
      const hitboxHeight = tree.displayHeight * 0.32;
      tree.body.setSize(hitboxWidth, hitboxHeight);
      tree.body.x = tree.x - hitboxWidth / 2;
      tree.body.y = tree.y - hitboxHeight / 2;

      const isCut = cutTrees.includes(treeId);
      if (isCut) tree.setTint(MAP_TREE_CUT_TINT);

      return {
        gameObject: tree,
        type: "tree",
        treeId,
        isCut,
        targetScene: "ChopScene",
        label: "Pressione E para cortar a arvore",
      };
    });

    this.physics.add.collider(this.player, this.treeGroup);

    const merchantTent = this.add
      .image(1000, 150, "barraca")
      .setDisplaySize(MAP_MERCHANT_DISPLAY_SIZE, MAP_MERCHANT_DISPLAY_SIZE);
    merchantTent.setDepth(merchantTent.y + merchantTent.displayHeight / 2);

    // Colisao com a barraca: hitbox menor que o sprite, concentrada na base/frente
    // dela (balcao), nao no telhado inteiro.
    this.physics.add.existing(merchantTent, true);
    const tentHitboxWidth = merchantTent.displayWidth * 0.55;
    const tentHitboxHeight = merchantTent.displayHeight * 0.35;
    merchantTent.body.setSize(tentHitboxWidth, tentHitboxHeight);
    merchantTent.body.x = merchantTent.x - tentHitboxWidth / 2;
    merchantTent.body.y = merchantTent.y + merchantTent.displayHeight * 0.15 - tentHitboxHeight / 2;
    this.physics.add.collider(this.player, merchantTent);

    // Contorno branco pulsante ao redor da barraca (destaque ate a primeira visita
    // ao mercador). Usa o FX de glow nativo do Phaser em vez de duplicar o sprite,
    // entao so a borda pulsa - o preenchimento do sprite fica intacto.
    if (this.registry.get("showMerchantHighlight")) {
      const merchantGlowFx = merchantTent.postFX.addGlow(0xffffff, 1.2, 0, false, 0.1, 12);

      this.tweens.add({
        targets: merchantGlowFx,
        outerStrength: 3.5,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    this.interactables = [
      ...treeInteractables,
      { gameObject: merchantTent, type: "merchant", targetScene: "MerchantScene", label: "Pressione E para negociar" },
    ];

    // ---- Texto de prompt de interacao (escondido por padrao) ----
    this.promptText = createPanelText(this, 0, 0, "", {
      fontSize: "18px",
      bold: true,
      originX: 0.5,
      originY: 1,
      depth: 998,
      visible: false,
    });

    // ---- Controles ----
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.nearestInteractable = null;

    addWoodHud(this);
  }

  update() {
    this.handleMovement();
    this.handleProximity();
    this.handleInteractionInput();

    // Depth por Y: mesma referencia (base do sprite) usada pras arvores e a barraca,
    // pra ordenacao visual correta conforme o jogador anda pelo mapa.
    this.player.setDepth(this.player.y + this.player.displayHeight / 2);

    this.registry.set("playerX", this.player.x);
    this.registry.set("playerY", this.player.y);
  }

  handleMovement() {
    const body = this.player.body;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) vy += 1;

    // Movimento restrito a 4 direcoes (sem diagonal): mesma prioridade horizontal
    // ja usada pra escolher o sprite de direcao.
    if (vx !== 0) vy = 0;

    body.setVelocity(vx * MAP_PLAYER_SPEED, vy * MAP_PLAYER_SPEED);

    this.updateFacing(vx, vy);

    const isMoving = vx !== 0 || vy !== 0;
    if (isMoving && !this.isPlayerMoving) {
      this.startSquashStretch();
    } else if (!isMoving && this.isPlayerMoving) {
      this.stopSquashStretch();
    }
    this.isPlayerMoving = isMoving;
  }

  startSquashStretch() {
    if (this.playerSquashTween) return;

    this.playerSquashTween = this.tweens.add({
      targets: this.player,
      scaleX: this.playerBaseScaleX * (1 + MAP_SQUASH_STRETCH_AMOUNT),
      scaleY: this.playerBaseScaleY * (1 - MAP_SQUASH_STRETCH_AMOUNT),
      duration: MAP_SQUASH_STRETCH_LEG_DURATION,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  stopSquashStretch() {
    if (this.playerSquashTween) {
      this.playerSquashTween.stop();
      this.playerSquashTween = null;
    }

    this.tweens.add({
      targets: this.player,
      scaleX: this.playerBaseScaleX,
      scaleY: this.playerBaseScaleY,
      duration: MAP_SQUASH_STRETCH_RESET_DURATION,
      ease: "Sine.easeOut",
    });
  }

  updateFacing(vx, vy) {
    // Movimento horizontal tem prioridade visual sobre o vertical quando os dois
    // ocorrem juntos (diagonal). Se nao houver movimento, mantem o ultimo sprite usado.
    if (vx !== 0) {
      this.facingDirection = "lado";
      this.player.setFlipX(vx < 0);
    } else if (vy > 0) {
      this.facingDirection = "baixo";
      this.player.setFlipX(false);
    } else if (vy < 0) {
      this.facingDirection = "cima";
      this.player.setFlipX(false);
    }

    const textureKey = `indigena_${this.facingDirection}`;
    if (this.player.texture.key !== textureKey) {
      this.player.setTexture(textureKey);
    }
  }

  handleProximity() {
    let closest = null;
    let closestDistance = Infinity;

    for (const interactable of this.interactables) {
      if (interactable.isCut) continue;

      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        interactable.gameObject.x,
        interactable.gameObject.y
      );

      if (distance <= MAP_INTERACT_RADIUS && distance < closestDistance) {
        closest = interactable;
        closestDistance = distance;
      }
    }

    this.nearestInteractable = closest;

    if (closest) {
      this.promptText.setText(closest.label);
      this.promptText.setPosition(
        closest.gameObject.x,
        closest.gameObject.y - closest.gameObject.displayHeight / 2 - 15
      );
      this.promptText.setVisible(true);
    } else {
      this.promptText.setVisible(false);
    }
  }

  handleInteractionInput() {
    if (this.nearestInteractable && Phaser.Input.Keyboard.JustDown(this.eKey)) {
      const data = this.nearestInteractable.type === "tree" ? { treeId: this.nearestInteractable.treeId } : undefined;
      this.scene.start(this.nearestInteractable.targetScene, data);
    }
  }
}
