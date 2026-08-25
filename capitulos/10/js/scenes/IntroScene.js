// IntroScene: tela de titulo + instrucoes, exibida antes da MapScene.
// Duas telas em sequencia, avanca ao clicar em qualquer lugar.

const INTRO_TITLE_TEXT = "Escambo: A Troca Desigual";
const INTRO_BODY_TEXT =
  "Os portugueses querem pau-brasil, e oferecem objetos em troca do seu trabalho. " +
  "Corte árvores, entregue a madeira ao mercador e descubra: será que essa troca é mesmo justa?";

class IntroScene extends Phaser.Scene {
  constructor() {
    super("IntroScene");
  }

  preload() {
    this.load.image("fundo_floresta", "assets/fundo_floresta.png");
  }

  create() {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.add.image(centerX, centerY, "fundo_floresta").setDisplaySize(this.scale.width, this.scale.height).setDepth(0);
    this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x000000, 0.55).setDepth(1);

    this.mainText = this.add
      .text(centerX, centerY - 30, INTRO_TITLE_TEXT, {
        fontSize: "52px",
        color: "#ffffff",
        fontFamily: "monospace",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: 1080 },
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.hintText = this.add
      .text(centerX, centerY + 90, "Toque para continuar", {
        fontSize: "22px",
        color: "#dddddd",
        fontFamily: "monospace",
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.screenIndex = 0;

    this.input.on("pointerdown", () => this.advanceScreen());
  }

  advanceScreen() {
    if (this.screenIndex === 0) {
      this.screenIndex = 1;
      this.mainText.setText(INTRO_BODY_TEXT);
      this.mainText.setFontSize(28);
      this.mainText.setFontStyle("normal");
      this.hintText.setText("Toque para começar");
    } else {
      this.scene.start("MapScene");
    }
  }
}
