/**
 * PreloadScene — carrega as imagens de apoio e mostra o progresso.
 *
 * Nenhum asset aqui é obrigatório. Abrir o jogo por file:// faz o navegador
 * bloquear o XHR do Phaser e o load falha; em vez de travar numa tela de
 * erro, a cena registra a falha e segue. O UIKit desenha o fundo em código
 * e o IllustrationKit já gera todas as figuras das perguntas.
 */
class PreloadScene extends Phaser.Scene {

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    const { width: W, height: H } = GameConfig;
    this.cameras.main.setBackgroundColor('#1a0e06');

    UIKit.text(this, W / 2, H / 2 - 46, 'Desenrolando o pergaminho...', {
      size: '30px', color: GameConfig.palette.creamHex, outline: 4,
    });

    const bar = UIKit.progressBar(this, W / 2, H / 2 + 16, 460, 16);
    this.load.on('progress', (v) => bar.setProgress(v, false));

    // Falha de asset é anotada, não fatal.
    this.failed = [];
    this.load.on('loaderror', (file) => this.failed.push(file.key));

    this.load.image('fundo_claro', 'assets/fundo_claro.png');
    this.load.image('pergaminho_cartoon', 'assets/pergaminho_cartoon.png');
  }

  create() {
    if (this.failed.length) {
      console.warn(
        '[PreloadScene] Sem estas imagens, o jogo usa o desenho procedural:',
        this.failed.join(', '),
        location.protocol === 'file:'
          ? '— a página foi aberta por file://, que bloqueia o carregamento. ' +
            'Rode "python3 -m http.server 8000" na pasta do projeto para ver a arte completa.'
          : ''
      );
    }
    this.scene.start('MenuScene');
  }
}

if (typeof window !== 'undefined') {
  window.PreloadScene = PreloadScene;
}
