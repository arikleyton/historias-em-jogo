/**
 * SoundKit — Efeitos sonoros sintetizados via Web Audio API.
 *
 * Não usa nenhum arquivo de áudio: todos os sons são gerados em tempo real
 * com osciladores e ruído filtrado. Isso mantém o jogo com zero assets de
 * som e sem requisições de rede.
 *
 * Política de autoplay: navegadores só permitem áudio após um gesto do
 * usuário, por isso o AudioContext é criado/retomado em unlock(), chamado
 * no primeiro pointerdown da cena.
 *
 * Instância única (SoundKit.get()) para que o contexto e o estado de mudo
 * sobrevivam ao scene.restart().
 */
class SoundKit {

  static get() {
    if (!SoundKit._instance) SoundKit._instance = new SoundKit();
    return SoundKit._instance;
  }

  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  /** Cria ou retoma o AudioContext. Deve partir de um gesto do usuário. */
  unlock() {
    if (!this.ctx) {
      const AC = (typeof window !== 'undefined') &&
        (window.AudioContext || window.webkitAudioContext);
      if (!AC) return null;                       // navegador sem Web Audio
      try { this.ctx = new AC(); } catch (e) { return null; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  /* ------------------------------------------------------------------ */
  /*  Blocos de síntese                                                  */
  /* ------------------------------------------------------------------ */

  /** Uma nota com envelope suave. slideTo faz um glissando até a frequência. */
  tone({ freq, dur = 0.18, type = 'sine', gain = 0.13, delay = 0, slideTo = null }) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;

    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);

    // exponentialRamp exige valores > 0, daí o 0.0001 em vez de zero
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(amp).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /** Ruído filtrado — base para o arranhar da pena no papel. */
  noise({ dur = 0.14, gain = 0.05, freq = 1600, delay = 0 }) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;

    const t0 = ctx.currentTime + delay;
    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, t0);
    filter.Q.setValueAtTime(0.8, t0);

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(filter).connect(amp).connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  /* ------------------------------------------------------------------ */
  /*  Sons do jogo                                                       */
  /* ------------------------------------------------------------------ */

  /** Pena encostando no papel ao iniciar o traço. */
  pen() {
    this.noise({ dur: 0.13, gain: 0.045, freq: 1900 });
  }

  /** Acerto: duas notas ascendentes, limpas. */
  correct() {
    this.tone({ freq: 660, dur: 0.13, type: 'triangle', gain: 0.13 });
    this.tone({ freq: 990, dur: 0.20, type: 'triangle', gain: 0.12, delay: 0.10 });
  }

  /** Erro: nota grave e curta, descendente — sinaliza sem ser agressiva. */
  wrong() {
    this.tone({ freq: 200, dur: 0.22, type: 'sawtooth', gain: 0.09, slideTo: 120 });
    this.noise({ dur: 0.09, gain: 0.03, freq: 420, delay: 0.02 });
  }

  /** Clique de botão. */
  click() {
    this.tone({ freq: 520, dur: 0.07, type: 'square', gain: 0.05 });
  }

  /** Fanfarra final — quanto mais estrelas, mais longa a subida. */
  victory(stars = 3) {
    const scales = {
      1: [392.0, 523.25],
      2: [392.0, 523.25, 659.25],
      3: [392.0, 523.25, 659.25, 783.99, 1046.5],
    };
    const notes = scales[stars] || scales[3];
    notes.forEach((f, i) => {
      this.tone({ freq: f, dur: 0.28, type: 'triangle', gain: 0.12, delay: i * 0.11 });
    });
    // Acorde de sustentação ao final da subida
    const tail = notes.length * 0.11;
    this.tone({ freq: notes[0] * 2, dur: 0.6, type: 'sine', gain: 0.07, delay: tail });
  }

  /** Estrela aparecendo no modal de vitória. */
  star(index = 0) {
    this.tone({ freq: 880 + index * 220, dur: 0.16, type: 'sine', gain: 0.10 });
  }

  /** Virada de página entre cenas — sopro curto, sem melodia. */
  transition() {
    this.noise({ dur: 0.22, gain: 0.04, freq: 900 });
  }

  /**
   * Partida encerrada sem nenhuma estrela. Desce onde a victory() sobe, para
   * que o resultado se anuncie antes de o jogador ler o painel.
   */
  defeat() {
    const notes = [523.25, 440.0, 349.23, 261.63];
    notes.forEach((f, i) => {
      this.tone({ freq: f, dur: 0.3, type: 'triangle', gain: 0.10, delay: i * 0.13 });
    });
  }
}

if (typeof window !== 'undefined') {
  window.SoundKit = SoundKit;
}
