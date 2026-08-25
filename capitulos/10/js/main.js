// Configuracao principal do jogo e boot.

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: "game-container",
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [IntroScene, MapScene, ChopScene, MerchantScene],
};

window.game = new Phaser.Game(config);

// ---- Estado global persistente entre cenas ----
window.game.registry.set("woodCount", 0); // madeira no inventario do jogador
window.game.registry.set("totalDelivered", 0); // total ja entregue ao mercador
window.game.registry.set("merchantFirstVisit", true);
window.game.registry.set("cutTrees", []); // ids das arvores ja cortadas na MapScene
window.game.registry.set("showMerchantHighlight", true); // brilho de destaque na barraca
window.game.registry.set("playerX", 640); // ultima posicao do jogador na MapScene
window.game.registry.set("playerY", 360);
