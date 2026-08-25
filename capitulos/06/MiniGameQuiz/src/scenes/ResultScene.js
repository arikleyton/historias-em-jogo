/**
 * ResultScene — o fechamento da partida.
 *
 * Recebe o resumo pronto do QuizManager (`{ summary }`) e só apresenta: não
 * recalcula ponto nem classificação. Se a cena for aberta sem dados, monta um
 * resumo zerado em vez de quebrar — a tela nunca fica em branco.
 *
 * A altura do painel vem dos textos já medidos, então uma classificação com
 * frase longa empurra o painel para baixo em vez de vazar dele.
 */
class ResultScene extends Phaser.Scene {

  /**
   * Para onde vai o botão do capítulo 7. Ainda não existe: preencher com o
   * caminho do arquivo (ex.: 'minigame_Cap7.html') quando ele for criado.
   */
  static PROXIMO_CAPITULO = null;

  PANEL_W = 900;
  MARGEM = 32;
  BTN_H = 64;
  STAR_R = 27;

  constructor() {
    super({ key: 'ResultScene' });
  }

  /** Partida sem dados (cena aberta direto) continua exibível. */
  init(data) {
    this.summary = (data && data.summary) || ResultScene.emptySummary();
  }

  static emptySummary() {
    return {
      correct: 0, wrong: 0, total: 0, answered: 0, score: 0,
      bestStreak: 0, endReason: 'empty',
      rank: GameConfig.rankFor(0, 0),
    };
  }

  create() {
    const { width: W, height: H } = GameConfig;
    const P = GameConfig.palette;
    this.P = P;

    this.sfx = SoundKit.get();
    this.input.once('pointerdown', () => this.sfx.unlock());
    UIKit.fadeIn(this);
    UIKit.background(this);

    const s = this.summary;
    const rank = s.rank || GameConfig.rankFor(s.correct, s.total);

    /* Estrelas: a faixa de classificação virada em nota visual. A melhor
       faixa enche as três; a última deixa as três vazias, sem mentir. */
    const idx = Math.max(0, GameConfig.ranks.indexOf(rank));
    const estrelas = Math.max(0, GameConfig.ranks.length - 1 - idx);

    /* ------ Textos antes do painel, para medir e só depois posicionar ---- */
    const tituloTxt = UIKit.text(this, 0, 0, 'QUIZ CONCLUÍDO', {
      size: '46px', weight: 'bold', color: '#6b4423',
      wrap: this.PANEL_W - 90,
    });

    const rankTxt = UIKit.text(this, 0, 0, rank.title, {
      size: '34px', weight: 'bold', color: '#8b5a2b',
      wrap: this.PANEL_W - 120,
    });

    const blurbTxt = UIKit.text(this, 0, 0, rank.blurb, {
      size: '22px', color: P.inkHex, wrap: this.PANEL_W - 160, lineSpacing: 6,
    });

    /* ----------------------- Layout de cima para baixo ------------------ */
    const alturas = {
      titulo: tituloTxt.height,
      estrelas: this.STAR_R * 2 + 8,
      rank: rankTxt.height,
      blurb: blurbTxt.height,
      stats: 96,
    };

    const conteudoH = alturas.titulo + 14 + 18 + alturas.estrelas + 10
      + alturas.rank + 8 + alturas.blurb + 22 + alturas.stats + 22 + this.BTN_H;

    const pw = this.PANEL_W;
    const ph = Math.ceil(conteudoH + 2 * this.MARGEM);

    let cursor = -ph / 2 + this.MARGEM;
    const tituloY = cursor + alturas.titulo / 2;
    cursor += alturas.titulo + 14;
    const divisorY = cursor;                        cursor += 18;
    const estrelasY = cursor + alturas.estrelas / 2;
    cursor += alturas.estrelas + 10;
    const rankY = cursor + alturas.rank / 2;        cursor += alturas.rank + 8;
    const blurbY = cursor + alturas.blurb / 2;      cursor += alturas.blurb + 22;
    const statsY = cursor + alturas.stats / 2;      cursor += alturas.stats + 22;
    const btnY = cursor + this.BTN_H / 2;

    /* ----------------------------- O painel ----------------------------- */
    const panel = UIKit.panel(this, W / 2, H / 2, pw, ph).setDepth(10);
    this.panel = panel;

    tituloTxt.y = tituloY;
    panel.add(tituloTxt);
    panel.add(UIKit.divider(this, 0, divisorY, 420));

    rankTxt.y = rankY;
    panel.add(rankTxt);

    blurbTxt.y = blurbY;
    panel.add(blurbTxt);

    this.buildStars(panel, estrelasY, estrelas);
    this.buildStats(panel, statsY, s);
    this.buildButtons(panel, btnY);

    UIKit.muteButton(this, 1232, 668);

    this.playEntrance(panel, estrelas);
  }

  /* ------------------------------------------------------------------ */
  /*  Peças do painel                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Fileira de estrelas. Cada uma é um Graphics próprio, posicionado no
   * centro e desenhado em coordenadas relativas — é isso que faz a entrada
   * escalar em torno da estrela, e não da origem do painel.
   */
  buildStars(panel, y, conquistadas) {
    const total = GameConfig.ranks.length - 1;
    const gap = this.STAR_R * 2 + 22;
    this.stars = [];

    for (let i = 0; i < total; i++) {
      const g = this.add.graphics();
      UIKit.drawStar(g, 0, 0, this.STAR_R, i < conquistadas);
      g.setPosition((i - (total - 1) / 2) * gap, y);
      panel.add(g);
      this.stars.push({ g, filled: i < conquistadas });
    }
  }

  /**
   * Três colunas de números: acertos, pontos e melhor sequência. Rótulo
   * pequeno em cima, valor grande embaixo — lê-se de relance.
   */
  buildStats(panel, y, s) {
    const P = this.P;
    const colunas = [
      { rotulo: 'ACERTOS', valor: `${s.correct}/${s.total}`, cor: '#15803d' },
      { rotulo: 'PONTOS', valor: String(s.score), cor: '#b8860b' },
      { rotulo: 'MELHOR SEQUÊNCIA', valor: String(s.bestStreak), cor: P.inkHex },
    ];

    const largura = 246;
    panel.add(UIKit.divider(this, 0, y - 50, 560));

    colunas.forEach(({ rotulo, valor, cor }, i) => {
      const x = (i - 1) * largura;

      panel.add(UIKit.text(this, x, y - 22, rotulo, {
        size: '17px', weight: 'bold', color: '#8b5a2b', wrap: largura - 16,
      }));
      panel.add(UIKit.text(this, x, y + 22, valor, {
        size: '40px', weight: 'bold', color: cor,
      }));
    });
  }

  /**
   * Três saídas, na ordem em que fazem sentido depois do resumo: repetir a
   * partida, seguir para o capítulo 7 ou voltar para a capa. As larguras saem
   * dos rótulos medidos e a fileira é distribuída a partir do centro do painel,
   * então trocar um texto não desalinha o conjunto.
   *
   * O destino do capítulo 7 ainda não existe: enquanto `PROXIMO_CAPITULO` for
   * null o botão fica desabilitado, em vez de prometer uma navegação que não
   * acontece.
   */
  buildButtons(panel, y) {
    const gap = 24;
    const defs = [
      { key: 'againButton', w: 300, label: 'JOGAR NOVAMENTE',
        onClick: () => this.go('QuizScene') },
      { key: 'nextButton', w: 235, label: 'CAPÍTULO 7 →', variant: 'secondary',
        onClick: () => this.goNextChapter() },
      { key: 'menuButton', w: 150, label: 'MENU', variant: 'secondary',
        onClick: () => this.go('MenuScene') },
    ];

    const total = defs.reduce((s, d) => s + d.w, 0) + gap * (defs.length - 1);
    let cursor = -total / 2;

    defs.forEach((d) => {
      const btn = UIKit.button(this, {
        x: cursor + d.w / 2, y, w: d.w, h: this.BTN_H,
        label: d.label, fontSize: '25px', variant: d.variant,
        onClick: d.onClick,
      });
      cursor += d.w + gap;
      this[d.key] = btn;
      panel.add(btn);
    });

    if (!ResultScene.PROXIMO_CAPITULO) {
      this.nextButton.setEnabled(false);
      this.nextButton.setAlpha(0.8);
    }
  }

  /** Nenhum clique vale depois que a saída já foi escolhida. */
  lockButtons() {
    this.againButton.setEnabled(false);
    this.nextButton.setEnabled(false);
    this.menuButton.setEnabled(false);
  }

  /** Único ponto a ligar quando o capítulo 7 existir. */
  goNextChapter() {
    const destino = ResultScene.PROXIMO_CAPITULO;
    if (!destino) return;

    if (this.leaving) return;
    this.leaving = true;
    this.lockButtons();
    this.sfx.transition();
    window.location.href = destino;
  }

  /** Uma saída só, para o clique duplo não disparar duas transições. */
  go(key) {
    if (this.leaving) return;
    this.leaving = true;
    this.lockButtons();
    this.sfx.transition();
    UIKit.transition(this, key);
  }

  /* ------------------------------------------------------------------ */
  /*  Entrada                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * O painel chega, as estrelas conquistadas pipocam uma a uma e a fanfarra
   * acompanha. As vazias já nascem no lugar: piscar o que não foi ganho
   * daria uma falsa sensação de conquista.
   */
  playEntrance(panel, conquistadas) {
    panel.setScale(0.9).setAlpha(0);
    this.tweens.add({
      targets: panel, scale: 1, alpha: 1, duration: 520, ease: 'Back.easeOut',
    });

    this.stars.forEach((star, i) => {
      if (!star.filled) return;
      star.g.setScale(0);
      this.tweens.add({
        targets: star.g, scale: 1,
        duration: 420, delay: 480 + i * 200, ease: 'Back.easeOut',
      });
      this.time.delayedCall(480 + i * 200, () => this.sfx.star(i));
    });

    const fim = 480 + Math.max(1, conquistadas) * 200;
    this.time.delayedCall(fim + 120, () => {
      if (conquistadas === 0) this.sfx.defeat();
      else this.sfx.victory(conquistadas);
    });
  }
}

if (typeof window !== 'undefined') {
  window.ResultScene = ResultScene;
}
