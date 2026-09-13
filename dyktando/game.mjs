export const CATEGORIES = ['u/ó', 'rz/ż', 'ch/h', 'ć/ci', 'ś/si', 'ź/zi', 'ń/ni', 'dź/dzi'];
export const DURATIONS = [60, 120, 180, 300];
export const DEFAULT_SETTINGS = { duration: 180, sound: true, difficulty: true };
export const accuracy = (correct, wrong) => correct + wrong ? Math.round(100 * correct / (correct + wrong)) : 0;
export const modeName = category => category === 'all' ? 'Wszystkie słowa' : category.replace('/', ' / ');
export const bestKey = (category, duration) => `${category}:${duration}`;
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function validateWords(words) {
  const counts = [130, 130, 90, 10, 10, 10, 10, 10];
  if (!Array.isArray(words) || words.length !== 400 || new Set(words.map(w => w.word)).size !== 400) throw Error('Niepełna baza słów.');
  for (const w of words) {
    if (typeof w.word !== 'string' || typeof w.masked !== 'string' || w.masked.split('_').length !== 2 ||
      !CATEGORIES.includes(w.category) || !Array.isArray(w.options) || w.options.length !== 2 || new Set(w.options).size !== 2 ||
      !w.options.every(o => w.category.split('/').includes(o)) || !w.options.includes(w.answer) ||
      w.masked.replace('_', w.answer) !== w.word || ![1, 2, 3].includes(w.difficulty)) throw Error('Nieprawidłowy rekord słowa.');
  }
  if (CATEGORIES.some((c, i) => words.filter(w => w.category === c).length !== counts[i]) ||
    [236, 132, 32].some((count, i) => words.filter(w => w.difficulty === i + 1).length !== count)) throw Error('Niepełne kategorie lub poziomy.');
  return words;
}
export function cleanSettings(value) {
  return { duration: DURATIONS.includes(value?.duration) ? value.duration : 180,
    sound: typeof value?.sound === 'boolean' ? value.sound : true,
    difficulty: typeof value?.difficulty === 'boolean' ? value.difficulty : true };
}
export function validResult(r) {
  return r && (r.category === 'all' || CATEGORIES.includes(r.category)) && DURATIONS.includes(r.duration) &&
    Number.isInteger(r.correct) && r.correct >= 0 && Number.isInteger(r.wrong) && r.wrong >= 0 &&
    typeof r.date === 'string' && Number.isFinite(Date.parse(r.date));
}
export class Game {
  constructor(words, category, duration, now = () => performance.now(), random = Math.random) {
    this.pool = words.filter(w => category === 'all' || w.category === category);
    if (!this.pool.length || !DURATIONS.includes(duration)) throw Error('Nieprawidłowy tryb gry.');
    Object.assign(this, { category, duration, now, random, remaining: duration * 1000, lastTime: now(),
      correct: 0, wrong: 0, question: 0, state: 'playing', queue: [], feedbackRemaining: 0 });
    this.next();
  }
  tick() {
    if (this.state === 'paused' || this.state === 'ended') return;
    const time = this.now();
    const elapsed = Math.max(0, time - this.lastTime);
    this.lastTime = time;
    this.remaining = Math.max(0, this.remaining - elapsed);
    if (this.remaining === 0) { this.state = 'ended'; return; }
    if (this.state.startsWith('feedback')) {
      this.feedbackRemaining -= elapsed;
      if (this.feedbackRemaining <= 0) this.next();
    }
  }
  next() {
    if (this.state === 'paused' || this.state === 'ended') return;
    if (!this.queue.length) {
      this.queue = shuffle(this.pool, this.random);
      if (this.queue.length > 1 && this.queue[0] === this.current) [this.queue[0], this.queue[1]] = [this.queue[1], this.queue[0]];
    }
    this.current = this.queue.shift();
    this.options = shuffle(this.current.options, this.random);
    this.question++;
    this.state = 'playing';
    this.selected = null;
  }
  answer(option) {
    // Account for time at the input boundary before accepting an answer.
    if (this.state !== 'playing') return false;
    this.tick();
    if (this.state !== 'playing' || !this.options.includes(option)) return false;
    this.selected = option;
    const correct = option === this.current.answer;
    this[correct ? 'correct' : 'wrong']++;
    this.state = correct ? 'feedback-correct' : 'feedback-wrong';
    this.feedbackRemaining = correct ? 700 : 1100;
    return true;
  }
  skipFeedback() {
    if (!this.state.startsWith('feedback')) return;
    const question = this.question;
    this.tick();
    if (this.state !== 'ended' && this.question === question) this.next();
  }
  pause() {
    if (this.state === 'paused' || this.state === 'ended') return;
    this.tick();
    if (this.state === 'ended') return;
    this.resumeState = this.state;
    this.state = 'paused';
  }
  resume() {
    if (this.state !== 'paused') return;
    this.state = this.resumeState;
    this.lastTime = this.now();
  }
  end() { this.tick(); this.state = 'ended'; }
}
