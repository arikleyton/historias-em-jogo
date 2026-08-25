/**
 * MenuScene — a capa do jogo.
 *
 * Título, subtítulo e as duas portas de entrada: JOGAR e COMO JOGAR. O fundo
 * ilustrado (mesa, mapa, bússola, tinteiro) já entrega a fantasia, então a
 * cena se limita a uma placa de pergaminho no centro.
 */
class MenuScene extends Phaser.Scene {

  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width: W } = GameConfig;
    const P = GameConfig.palette;

    this.sfx = SoundKit.get();
    this.input.once('pointerdown', () => this.sfx.unlock());
    UIKit.fadeIn(this);

    UIKit.background(this);

    /* ---------------------- Placa do título -------------------------- */
    const panel = UIKit.panel(this, W / 2, 268, 800, 268).setDepth(10);

    const title = UIKit.text(this, 0, -62, 'A CARTA DE CAMINHA', {
      size: '56px', weight: 'bold', color: '#6b4423', spacing: 1.5,
    });
    panel.add(title);

    panel.add(UIKit.divider(this, 0, -14, 420));

    panel.add(UIKit.text(this, 0, 24, 'Descubra os relatos de 1500', {
      size: '29px', color: P.inkHex,
    }));

    panel.add(UIKit.text(this, 0, 78,
      `contexto histórico  ·  ${GameConfig.questionsPerRun} perguntas  ·  o primeiro contato`, {
        size: '20px', color: '#8b5a2b',
      }));

    /* --------------------------- Botões ------------------------------ */
    const jogar = UIKit.button(this, {
      x: W / 2, y: 486, w: 340, h: 78, label: 'JOGAR', fontSize: '36px',
      onClick: () => UIKit.transition(this, 'ContextScene'),
    }).setDepth(10);

    const comoJogar = UIKit.button(this, {
      x: W / 2, y: 588, w: 296, h: 60, label: 'COMO JOGAR',
      fontSize: '25px', variant: 'secondary',
      onClick: () => this.showHelp(),
    }).setDepth(10);

    UIKit.muteButton(this, 1232, 668);

    /* ------------------------- Entrada suave -------------------------- */
    panel.setScale(0.9).setAlpha(0);
    this.tweens.add({
      targets: panel, scale: 1, alpha: 1, duration: 520, ease: 'Back.easeOut',
    });

    [jogar, comoJogar].forEach((b, i) => {
      b.setAlpha(0);
      b.y += 26;
      this.tweens.add({
        targets: b, alpha: 1, y: b.y - 26,
        duration: 380, delay: 320 + i * 110, ease: 'Cubic.easeOut',
      });
    });

    // Balanço lento no título: dá vida à tela parada sem distrair.
    this.tweens.add({
      targets: title, y: title.y - 5, duration: 2400,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Sobreposição de ajuda                                              */
  /* ------------------------------------------------------------------ */
  showHelp() {
    if (this.helpLayer) return;                 // já está aberta
    const { width: W, height: H } = GameConfig;
    const P = GameConfig.palette;

    const layer = this.add.container(0, 0).setDepth(60);
    this.helpLayer = layer;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x1a0e06, 0.78);
    overlay.fillRect(0, 0, W, H);
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, H),
      Phaser.Geom.Rectangle.Contains);
    layer.add(overlay);

    // 540 de altura: dá respiro entre o item 5 e o FECHAR e ainda cobre o
    // botão COMO JOGAR, que senão aparece como um fantasma sob o painel.
    const panel = UIKit.panel(this, W / 2, H / 2, 820, 540);
    layer.add(panel);

    panel.add(UIKit.text(this, 0, -216, 'COMO JOGAR', {
      size: '40px', weight: 'bold', color: '#6b4423', spacing: 1.5,
    }));
    panel.add(UIKit.divider(this, 0, -180, 380));

    const linhas = [
      ['1', 'Antes do quiz, uma breve viagem a 1500 apresenta a história da Carta.'],
      ['2', 'Depois, leia a pergunta e escolha uma das alternativas.'],
      ['3', `Cada acerto vale ${GameConfig.pointsPerCorrect} pontos. Acertos seguidos rendem bônus.`],
      ['4', 'Errar não elimina: a partida vai até a última pergunta.'],
      ['5', 'Ao responder, a Carta explica o porquê e conta uma curiosidade.'],
    ];

    linhas.forEach(([n, txt], i) => {
      const y = -126 + i * 62;
      const badge = this.add.graphics();
      badge.fillStyle(P.gold, 1);
      badge.fillCircle(-340, y, 20);
      badge.lineStyle(3, P.brown, 1);
      badge.strokeCircle(-340, y, 20);
      panel.add(badge);

      panel.add(UIKit.text(this, -340, y, n, {
        size: '22px', weight: 'bold', color: '#4b2e13',
      }));
      panel.add(UIKit.text(this, -306, y, txt, {
        size: '23px', align: 'left', originX: 0, wrap: 640, color: P.inkHex,
      }));
    });

    const fechar = UIKit.button(this, {
      x: 0, y: 216, w: 220, h: 56, label: 'FECHAR', fontSize: '24px',
      onClick: () => this.hideHelp(),
    });
    panel.add(fechar);

    panel.setScale(0.92).setAlpha(0);
    overlay.setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 200 });
    this.tweens.add({
      targets: panel, scale: 1, alpha: 1, duration: 340, ease: 'Back.easeOut',
    });
  }

  hideHelp() {
    if (!this.helpLayer) return;
    const layer = this.helpLayer;
    this.helpLayer = null;                      // libera reabertura na hora
    this.tweens.add({
      targets: layer, alpha: 0, duration: 200,
      onComplete: () => layer.destroy(),
    });
  }
}

if (typeof window !== 'undefined') {
  window.MenuScene = MenuScene;
}
