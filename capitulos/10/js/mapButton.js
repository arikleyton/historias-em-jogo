// Botao "Voltar ao Mapa" com visual integrado ao jogo (cantos arredondados, tom
// de madeira, icone de seta, hover/press), presente em toda cena exceto a MapScene.

const MAP_BUTTON_WIDTH = 190;
const MAP_BUTTON_HEIGHT = 46;
const MAP_BUTTON_RADIUS = 10;
const MAP_BUTTON_FILL = 0x3d2b1f;
const MAP_BUTTON_FILL_ALPHA = 0.92;
const MAP_BUTTON_BORDER = 0xb98a4a;
const MAP_BUTTON_BORDER_HOVER = 0xf3c969;
const MAP_BUTTON_TEXT_COLOR = "#f3e6d3";
const MAP_BUTTON_ICON_COLOR = 0xf3e6d3;

function addMapButton(scene) {
  const padding = 16;
  const x = scene.scale.width - padding - MAP_BUTTON_WIDTH / 2;
  const y = padding + MAP_BUTTON_HEIGHT / 2;

  const background = scene.add.graphics();
  drawMapButtonBackground(background, MAP_BUTTON_BORDER);

  const icon = scene.add.triangle(
    -MAP_BUTTON_WIDTH / 2 + 24,
    0,
    9,
    -10,
    9,
    10,
    -9,
    0,
    MAP_BUTTON_ICON_COLOR
  );

  const label = scene.add
    .text(8, 0, "Voltar ao Mapa", {
      fontSize: "16px",
      color: MAP_BUTTON_TEXT_COLOR,
      fontFamily: "monospace",
      fontStyle: "bold",
    })
    .setOrigin(0.5);

  const container = scene.add.container(x, y, [background, icon, label]).setScrollFactor(0).setDepth(1000);

  // setInteractive com hit area customizada usa argumentos posicionais (forma, callback),
  // nao um objeto de config - por isso useHandCursor e ajustado depois, via container.input.
  const hitArea = new Phaser.Geom.Rectangle(
    -MAP_BUTTON_WIDTH / 2,
    -MAP_BUTTON_HEIGHT / 2,
    MAP_BUTTON_WIDTH,
    MAP_BUTTON_HEIGHT
  );
  container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
  container.input.cursor = "pointer";

  container.on("pointerover", () => {
    drawMapButtonBackground(background, MAP_BUTTON_BORDER_HOVER);
    scene.tweens.add({ targets: container, scale: 1.04, duration: 120, ease: "Sine.easeOut" });
  });

  container.on("pointerout", () => {
    drawMapButtonBackground(background, MAP_BUTTON_BORDER);
    scene.tweens.add({ targets: container, scale: 1, duration: 120, ease: "Sine.easeOut" });
  });

  container.on("pointerdown", () => {
    scene.tweens.add({
      targets: container,
      scale: 0.94,
      duration: 60,
      yoyo: true,
      onComplete: () => scene.scene.start("MapScene"),
    });
  });

  return container;
}

function addNextChapterButton(scene, destination) {
  const width = 300;
  const height = 58;
  const x = scene.scale.width / 2;
  const y = scene.scale.height / 2 + 235;

  const background = scene.add.graphics();
  background.fillStyle(0x3d2b1f, 0.96);
  background.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
  background.lineStyle(3, 0xf3c969, 1);
  background.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);

  const label = scene.add
    .text(0, 0, "PRÓXIMO CAPÍTULO  →", {
      fontSize: "22px",
      color: "#f3e6d3",
      fontFamily: "monospace",
      fontStyle: "bold",
    })
    .setOrigin(0.5);

  const container = scene.add
    .container(x, y, [background, label])
    .setScrollFactor(0)
    .setDepth(1200);

  const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
  container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
  container.input.cursor = "pointer";

  container.on("pointerover", () => {
    scene.tweens.add({ targets: container, scale: 1.04, duration: 120, ease: "Sine.easeOut" });
  });
  container.on("pointerout", () => {
    scene.tweens.add({ targets: container, scale: 1, duration: 120, ease: "Sine.easeOut" });
  });
  container.on("pointerdown", () => {
    if (container.navigating) return;
    container.navigating = true;
    container.disableInteractive();
    scene.tweens.add({
      targets: container,
      scale: 0.94,
      duration: 70,
      yoyo: true,
      onComplete: () => {
        window.location.href = destination;
      },
    });
  });

  return container;
}

function drawMapButtonBackground(graphics, borderColor) {
  graphics.clear();
  graphics.fillStyle(MAP_BUTTON_FILL, MAP_BUTTON_FILL_ALPHA);
  graphics.fillRoundedRect(-MAP_BUTTON_WIDTH / 2, -MAP_BUTTON_HEIGHT / 2, MAP_BUTTON_WIDTH, MAP_BUTTON_HEIGHT, MAP_BUTTON_RADIUS);
  graphics.lineStyle(2, borderColor, 1);
  graphics.strokeRoundedRect(-MAP_BUTTON_WIDTH / 2, -MAP_BUTTON_HEIGHT / 2, MAP_BUTTON_WIDTH, MAP_BUTTON_HEIGHT, MAP_BUTTON_RADIUS);
}
