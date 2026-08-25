/**
 * QuizManager — o estado da partida, sem nada de desenho.
 *
 * Sorteia as perguntas da rodada, embaralha as alternativas, valida a
 * resposta, contabiliza pontos e diz quando a partida acabou. A QuizScene só
 * pergunta e mostra; quem decide é esta classe.
 *
 * Regra central: a resposta certa é identificada pelo `id` da alternativa,
 * nunca pela posição. Por isso o embaralhamento é seguro.
 */
class QuizManager {

  /**
   * @param {Array}  pool  banco de perguntas (ver src/data/questions.js)
   * @param {Object} cfg   regras do jogo (ver src/config/gameConfig.js)
   */
  constructor(pool, cfg = GameConfig) {
    this.cfg = cfg;
    this.pool = QuizManager.usable(pool);
    this.reset();
  }

  /* ------------------------------------------------------------------ */
  /*  Validação do banco                                                */
  /* ------------------------------------------------------------------ */

  /**
   * Problemas que tornam uma pergunta injogável. Rodar isto na carga troca
   * um bug silencioso (pergunta sem resposta correta possível) por um aviso
   * claro no console de quem editou o banco.
   */
  static problems(q, i) {
    const found = [];
    const where = q && q.id ? `"${q.id}"` : `índice ${i}`;

    if (!q || typeof q !== 'object') return [`Pergunta ${where}: não é um objeto.`];
    if (!q.question) found.push(`Pergunta ${where}: falta o enunciado.`);
    if (!Array.isArray(q.answers) || q.answers.length < 2) {
      found.push(`Pergunta ${where}: precisa de pelo menos 2 alternativas.`);
      return found;
    }
    if (q.answers.length > 3) {
      found.push(`Pergunta ${where}: o layout suporta no máximo 3 alternativas.`);
    }

    const ids = q.answers.map((a) => a && a.id);
    if (ids.some((id) => !id)) found.push(`Pergunta ${where}: alternativa sem id.`);
    if (new Set(ids).size !== ids.length) found.push(`Pergunta ${where}: ids repetidos.`);
    if (!ids.includes(q.correctAnswer)) {
      found.push(`Pergunta ${where}: correctAnswer "${q.correctAnswer}" não existe nas alternativas.`);
    }
    return found;
  }

  /** Filtra o banco, avisando no console o que foi descartado e por quê. */
  static usable(pool) {
    if (!Array.isArray(pool) || pool.length === 0) {
      console.error('[QuizManager] Banco de perguntas vazio ou inválido.');
      return [];
    }
    const ok = [];
    pool.forEach((q, i) => {
      const problems = QuizManager.problems(q, i);
      if (problems.length) problems.forEach((p) => console.warn('[QuizManager]', p));
      else ok.push(q);
    });
    return ok;
  }

  /* ------------------------------------------------------------------ */
  /*  Ciclo da partida                                                   */
  /* ------------------------------------------------------------------ */

  reset() {
    const n = this.cfg.questionsPerRun;
    const draw = Phaser.Utils.Array.Shuffle(this.pool.slice());
    const chosen = (n && n > 0) ? draw.slice(0, n) : draw;

    this.questions = chosen.map((q) => this.constructor.shuffled(q));
    this.index = 0;
    this.correct = 0;
    this.wrong = 0;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.answered = false;
    this.finished = this.questions.length === 0;
    this.endReason = this.finished ? 'empty' : null;
  }

  /**
   * Cópia da pergunta com as alternativas em ordem aleatória. O original em
   * questions.js não é tocado — a cada partida a ordem muda de novo.
   */
  static shuffled(q) {
    return { ...q, answers: Phaser.Utils.Array.Shuffle(q.answers.slice()) };
  }

  get current() {
    return this.questions[this.index] || null;
  }

  get total() {
    return this.questions.length;
  }

  /** Fração já respondida — alimenta a barra de progresso. */
  get progress() {
    return this.total ? (this.correct + this.wrong) / this.total : 0;
  }

  get answeredCount() {
    return this.correct + this.wrong;
  }

  /**
   * Registra a resposta e devolve o que a cena precisa para dar o feedback.
   * Chamadas repetidas na mesma pergunta devolvem null — é essa trava que
   * impede o duplo clique de pontuar duas vezes.
   */
  answer(answerId) {
    if (this.answered || this.finished || !this.current) return null;
    this.answered = true;

    const q = this.current;
    const isCorrect = answerId === q.correctAnswer;
    let gained = 0;

    if (isCorrect) {
      this.correct++;
      this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      const bonus = Math.min(
        this.cfg.maxStreakBonus,
        Math.max(0, this.streak - 1) * this.cfg.streakBonus
      );
      gained = this.cfg.pointsPerCorrect + bonus;
      this.score += gained;
    } else {
      this.wrong++;
      this.streak = 0;
    }

    return {
      correct: isCorrect,
      gained,
      streak: this.streak,
      chosen: q.answers.find((a) => a.id === answerId) || null,
      correctOption: q.answers.find((a) => a.id === q.correctAnswer),
      explanation: q.explanation || '',
      curiosity: q.curiosity || '',
      lastQuestion: this.index >= this.total - 1,
    };
  }

  /**
   * Avança para a próxima pergunta.
   * @returns {boolean} true se há próxima; false se a partida terminou.
   */
  next() {
    if (this.finished) return false;

    this.index++;
    this.answered = false;

    if (this.index >= this.total) {
      this.finished = true;
      this.endReason = 'completed';
      return false;
    }
    return true;
  }

  /** Resumo final, já com a classificação resolvida. */
  get summary() {
    const rank = this.cfg.rankFor(this.correct, this.total);
    return {
      correct: this.correct,
      wrong: this.wrong,
      total: this.total,
      answered: this.answeredCount,
      score: this.score,
      bestStreak: this.bestStreak,
      endReason: this.endReason,
      rank,
    };
  }
}

if (typeof window !== 'undefined') {
  window.QuizManager = QuizManager;
}
