/**
 * BootScene — o primeiro passo: garante que as fontes estão prontas antes
 * de qualquer medida de texto e valida o banco de perguntas.
 *
 * Fica separada da PreloadScene de propósito: fonte é uma espera assíncrona
 * do navegador, imagem é fila do loader do Phaser. Misturar as duas na mesma
 * cena foi o que, na versão anterior, exigiu um token de build para impedir
 * que um callback atrasado montasse a tela duas vezes.
 */
class BootScene extends Phaser.Scene {

  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    const { width: W, height: H } = GameConfig;

    this.cameras.main.setBackgroundColor('#1a0e06');
    UIKit.text(this, W / 2, H / 2, 'Preparando a pena e o tinteiro...', {
      size: '30px', color: GameConfig.palette.creamHex, outline: 4,
    });

    // O banco é validado uma vez, aqui, e o aviso aparece cedo no console.
    QuizManager.usable(QUESTIONS);

    UIKit.fontsReady().then(() => {
      if (this.scene.isActive()) this.scene.start('PreloadScene');
    });
  }
}

if (typeof window !== 'undefined') {
  window.BootScene = BootScene;
}
