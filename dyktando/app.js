import { CATEGORIES, DURATIONS, Game, validateWords, cleanSettings, validResult, accuracy, modeName, bestKey } from './game.mjs';
const root = document.querySelector('#app');
const modal = document.querySelector('#modal');
const keys = { settings: 'maleDyktando.settings.v1', history: 'maleDyktando.history.v1', best: 'maleDyktando.best.v1' };
let storageFailed = false;
function storageNotice() { storageFailed = true; document.querySelector('#storage-notice').hidden = false; }
function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(keys[key])) ?? fallback; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(keys[key], JSON.stringify(value)); } catch { storageNotice(); }
}
let settings = cleanSettings(read('settings', {}));
const storedHistory = read('history', []);
let history = Array.isArray(storedHistory) ? storedHistory.filter(validResult).slice(0, 10) : [];
const storedBest = read('best', {});
let best = {};
if (storedBest && typeof storedBest === 'object' && !Array.isArray(storedBest)) {
  for (const c of ['all', ...CATEGORIES]) for (const d of DURATIONS) {
    const k = bestKey(c, d), v = storedBest[k];
    if (Number.isInteger(v) && v >= 0) best[k] = v;
  }
}
let words = [], game = null, view = 'home', lastResult = null, audio = null, renderedState = '', renderedQuestion = 0;
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const btn = (text, action, cls = 'secondary', extra = '') => `<button class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
const minutes = seconds => `${seconds / 60} ${seconds === 60 ? 'minuta' : seconds === 300 ? 'minut' : 'minuty'}`;
function pageHead(title) { return `<header class="page-head">${btn('←', 'home', 'icon', 'aria-label="Powrót do menu"')}<h1 tabindex="-1">${title}</h1></header>`; }
function navigate(nextView) {
  view = nextView;
  if (view === 'home') home();
  if (view === 'categories') categories();
  if (view === 'settings') settingsPage();
  if (view === 'history') historyPage();
  window.scrollTo(0, 0);
  (root.querySelector('h1') || root).focus({ preventScroll: true });
}
function home() {
  root.innerHTML = `<header class="brand"><span class="pencil" aria-hidden="true">✎</span> Małe Dyktando</header>
    <section class="hero"><span class="eyebrow">Przygoda z ortografią</span><h1 tabindex="-1">Ćwicz pisownię.</h1><p class="muted">Małe kroki,<br>wielkie postępy!</p><img class="lion" src="assets/lion.svg" alt="Uśmiechnięty lew z ołówkiem" width="200" height="184"></section>
    ${btn('Rozpocznij grę →', 'start', 'primary')}<p class="caption muted">${minutes(settings.duration)} · 400 słów</p>
    <nav class="menu" aria-label="Menu główne">${[['categories','Aa','Kategorie','Wybierz, co dziś poćwiczysz'],['history','☆','Moje wyniki','Zobacz swoje postępy'],['settings','⚙','Ustawienia','Graj po swojemu']].map(([a,i,t,s]) => btn(`<span class="chip" aria-hidden="true">${i}</span><span><strong>${t}</strong><small>${s}</small></span><span class="tail" aria-hidden="true">›</span>`,a,'row')).join('')}</nav>`;
}
function categories() {
  root.innerHTML = pageHead('Kategorie') + '<p class="muted">Co dziś poćwiczymy?</p><div class="stack">' + ['all', ...CATEGORIES].map(c => {
    const pool = words.filter(w => c === 'all' || w.category === c);
    return btn(`<span class="chip">${c === 'all' ? 'Aa' : escape(modeName(c))}</span><span><strong>${escape(modeName(c))}</strong><small>${pool.slice(0, 2).map(w => escape(w.word)).join(', ')}</small></span><span class="tail">${pool.length} <span aria-hidden="true">›</span></span>`, 'category', 'row', `data-category="${escape(c)}"`);
  }).join('') + '</div>';
}
function settingsPage() {
  root.innerHTML = pageHead('Ustawienia') + `<div class="card"><label class="setting" for="duration">Czas gry<select id="duration">${DURATIONS.map(d => `<option value="${d}" ${settings.duration === d ? 'selected' : ''}>${minutes(d)}</option>`).join('')}</select></label>
    <label class="setting" for="sound">Dźwięki<input id="sound" type="checkbox" ${settings.sound ? 'checked' : ''}></label>
    <label class="setting" for="difficulty">Pokaż poziom trudności<input id="difficulty" type="checkbox" ${settings.difficulty ? 'checked' : ''}></label></div>
    <div class="space-top">${btn('Wyczyść wyniki', 'clear', 'danger')}</div><p class="caption muted">Ustawienia i wyniki są zapisane tylko na tym urządzeniu.</p>`;
}
function historyPage() {
  const record = best[bestKey('all', settings.duration)];
  root.innerHTML = pageHead('Moje wyniki') + `<section class="card"><span class="eyebrow">Najlepszy wynik</span><div class="best">${record ?? '—'}</div><small>Wszystkie słowa · ${minutes(settings.duration)}</small></section><h2 class="space-top">Ostatnie gry</h2>` +
    (history.length ? history.map(r => `<article class="history-item"><strong>${escape(modeName(r.category))}</strong><p>${r.correct} poprawnych · ${r.wrong} błędnych · ${accuracy(r.correct, r.wrong)}%</p><small>${escape(new Date(r.date).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' }))} · ${minutes(r.duration)}${r.early ? ' · zakończona wcześniej' : ''}</small></article>`).join('') + `<div class="space-top">${btn('Wyczyść wyniki', 'clear', 'danger')}</div>` : '<p class="muted">Tu pojawią się Twoje gry. Zaczynamy?</p>' + btn('Rozpocznij grę', 'start', 'primary'));
}
function unlockAudio() {
  if (!settings.sound) return;
  try { const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) return; audio ||= new Audio(); if (audio.state === 'suspended') audio.resume().catch(() => {}); } catch { /* Sound is optional. */ }
}
function beep(correct) {
  if (!settings.sound) return;
  try {
    unlockAudio(); if (!audio || audio.state !== 'running') return;
    const tone = audio.createOscillator(), gain = audio.createGain(), t = audio.currentTime;
    tone.type = 'sine'; tone.frequency.setValueAtTime(correct ? 660 : 220, t);
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(.045, t + .015); gain.gain.exponentialRampToValueAtTime(.001, t + .14);
    tone.connect(gain); gain.connect(audio.destination); tone.start(t); tone.stop(t + .15);
    tone.onended = () => { tone.disconnect(); gain.disconnect(); };
  } catch { /* Never interrupt a game for audio. */ }
}
function start(category = 'all') {
  unlockAudio(); game = new Game(words, category, settings.duration); lastResult = null; view = 'game';
  renderedState = ''; renderedQuestion = 0; window.scrollTo(0, 0); renderGame();
}
function renderGame() {
  if (!game || view !== 'game') return;
  if (game.state === 'ended') { finish(); return; }
  if (game.state === 'paused') return;
  const feedback = game.state.startsWith('feedback'), correct = game.state === 'feedback-correct', w = game.current;
  const color = feedback ? (correct ? 'correct' : 'wrong') : '';
  const [before, after] = w.masked.split('_');
  root.innerHTML = `<header class="game-bar">${btn('×', 'exit', 'icon', 'aria-label="Zakończ grę"')}<span class="timer" aria-label="Pozostały czas"></span>${btn('Ⅱ', 'pause', 'icon', 'aria-label="Pauza"')}</header>
    <progress max="${game.duration * 1000}" value="${game.remaining}" aria-label="Pozostały czas gry"></progress><div class="game-meta"><span>Pytanie ${game.question}</span><strong>Wynik: ${game.correct}</strong></div>
    <section class="card question-card ${color}" aria-label="Słowo"><div class="badges"><span class="badge">${escape(modeName(w.category))}</span>${settings.difficulty ? `<span class="badge difficulty-${w.difficulty}">${['','Łatwe','Średnie','Trudne'][w.difficulty]}</span>` : ''}</div>
    <div class="word" aria-label="${escape(feedback ? w.word : w.masked.replace('_', ' – luka – '))}">${escape(before)}<span class="${feedback ? 'filled' : 'gap'}">${feedback ? escape(w.answer) : '_'}</span>${escape(after)}</div></section>
    <p class="prompt">Wybierz brakującą literę:</p><div class="answers">${game.options.map((o, i) => btn(escape(o), 'answer', `answer ${feedback && o === w.answer ? 'correct' : feedback && o === game.selected ? 'wrong' : ''}`, `data-index="${i}" ${feedback ? 'disabled' : ''}`)).join('')}</div>
    <div class="feedback" aria-live="polite" aria-atomic="true"></div><p class="game-footer">${escape(modeName(game.category))} · ${minutes(game.duration)}</p>`;
  renderedState = game.state; renderedQuestion = game.question;
  if (feedback) {
    root.querySelector('.feedback').innerHTML = `<p><span class="feedback-symbol" aria-hidden="true">${correct ? '✓' : '×'}</span><strong>${correct ? 'Świetnie!' : 'To nie ta litera.'}</strong></p>${correct ? '' : `<p>Poprawna odpowiedź: <b>${escape(w.answer)}</b></p>`}${btn('Dalej →', 'next')}`;
    root.querySelector('[data-action="next"]').focus({ preventScroll: true });
  } else root.querySelector('.answer').focus({ preventScroll: true });
  updateClock();
}
function updateClock() {
  const timer = root.querySelector('.timer'); if (!timer || !game) return;
  const seconds = Math.ceil(game.remaining / 1000);
  timer.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  timer.classList.toggle('urgent', seconds <= 15);
  root.querySelector('progress').value = game.remaining;
}
function syncGame() {
  if (view !== 'game' || !game) return;
  if (game.state === 'ended') { finish(); return; }
  if (game.state !== 'paused' && (game.state !== renderedState || game.question !== renderedQuestion)) renderGame();
  updateClock();
}
function showModal(title, content) {
  modal.innerHTML = `<h2 id="modal-title">${title}</h2>${content}`;
  if (!modal.open) modal.showModal();
  modal.querySelector('button')?.focus();
}
function pause(confirmExit = false) {
  if (!game || view !== 'game') return;
  game.pause(); syncGame(); if (game.state === 'ended') return;
  showModal(confirmExit ? 'Zakończyć tę grę?' : 'Pauza', `<p>${confirmExit ? 'Możesz zapisać obecny wynik lub grać dalej.' : 'Odpocznij chwilę. Czas na Ciebie czeka.'}</p><div class="stack">${btn(confirmExit ? 'Graj dalej' : 'Wznów', 'resume', 'primary')}${btn('Zakończ grę', confirmExit ? 'end' : 'exit')}</div>`);
}
function resume() { modal.close(); game?.resume(); syncGame(); root.querySelector(game?.state === 'playing' ? '.answer' : '[data-action="next"]')?.focus({ preventScroll: true }); }
function finish(early = false) {
  if (!game || lastResult) return;
  game.end(); if (modal.open) modal.close();
  const result = { category: game.category, duration: game.duration, correct: game.correct, wrong: game.wrong, date: new Date().toISOString(), early };
  const k = bestKey(result.category, result.duration);
  const record = result.correct > (best[k] ?? 0);
  best[k] = Math.max(best[k] ?? 0, result.correct);
  history = [result, ...history].slice(0, 10); save('history', history); save('best', best);
  lastResult = result; view = 'results';
  root.innerHTML = `<section class="result"><span class="trophy" aria-hidden="true">🏆</span><h1 tabindex="-1">Koniec gry!</h1><p class="muted">Świetna robota!</p><small>${escape(modeName(result.category))} · ${minutes(result.duration)}${early ? ' · zakończona wcześniej' : ''}</small>
    <div class="stats">${[['Poprawne',result.correct],['Błędne',result.wrong],['Razem',result.correct + result.wrong]].map(([label,n]) => `<div class="stat"><b>${n}</b><span>${label}</span></div>`).join('')}</div><p class="accuracy"><strong>${accuracy(result.correct, result.wrong)}%</strong> poprawnych odpowiedzi</p>${record ? '<div class="record">☆ Nowy rekord!</div>' : ''}<div class="stack">${btn('Zagraj jeszcze raz', 'again', 'primary')}${btn('Powrót do menu', 'home')}</div></section>`;
  root.querySelector('h1').focus({ preventScroll: true }); window.scrollTo(0, 0);
}
function clearPrompt() { showModal('Wyczyścić wyniki?', `<p>Usuniesz historię i rekordy. Ustawienia zostaną zachowane.</p><div class="stack">${btn('Zachowaj wyniki', 'cancel-clear', 'primary')}${btn('Wyczyść wyniki', 'confirm-clear', 'danger')}</div>`); }
function dispatch(event) {
  const button = event.target.closest('button[data-action]'); if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (['home', 'categories', 'settings', 'history'].includes(action)) navigate(action);
  if (action === 'start') start();
  if (action === 'category') start(button.dataset.category);
  if (action === 'again') start(lastResult.category);
  if (action === 'answer' && game && view === 'game' && !modal.open) { if (game.answer(game.options[Number(button.dataset.index)])) beep(game.state === 'feedback-correct'); syncGame(); }
  if (action === 'next' && !modal.open) { game.skipFeedback(); syncGame(); }
  if (action === 'pause') pause();
  if (action === 'exit') pause(true);
  if (action === 'resume') resume();
  if (action === 'end') finish(true);
  if (action === 'clear') clearPrompt();
  if (action === 'cancel-clear') modal.close();
  if (action === 'confirm-clear') { history = []; best = {}; save('history', history); save('best', best); modal.close(); navigate(view); }
  if (action === 'retry') load();
}
root.addEventListener('click', dispatch); modal.addEventListener('click', dispatch);
modal.addEventListener('cancel', e => { e.preventDefault(); if (view === 'game') resume(); else modal.close(); });
root.addEventListener('change', e => {
  if (view !== 'settings') return;
  if (e.target.id === 'duration') settings.duration = Number(e.target.value);
  if (e.target.id === 'sound') { settings.sound = e.target.checked; unlockAudio(); }
  if (e.target.id === 'difficulty') settings.difficulty = e.target.checked;
  save('settings', settings);
});
document.addEventListener('keydown', e => {
  if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || modal.open || view !== 'game') return;
  if (['1','2'].includes(e.key) && game.state === 'playing') { e.preventDefault(); root.querySelectorAll('.answer')[Number(e.key) - 1]?.click(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && view === 'game') pause(); });
window.addEventListener('pagehide', () => { if (view === 'game') pause(); });
setInterval(() => { if (view === 'game' && game) { game.tick(); syncGame(); } }, 50);
async function load() {
  root.innerHTML = '<p class="loading" role="status">Przygotowujemy słowa…</p>';
  try {
    const parts = await Promise.all(Array.from({ length: 8 }, async (_, i) => {
      const response = await fetch(`data/words-0${i + 1}.json`);
      if (!response.ok) throw Error('Błąd pobierania słów.'); return response.json();
    }));
    words = validateWords(parts.flat()); navigate('home');
  } catch {
    root.innerHTML = `<section class="hero"><h1>Nie udało się wczytać słów</h1><p class="muted">Sprawdź połączenie i spróbuj ponownie.</p><div class="space-top">${btn('Spróbuj ponownie', 'retry', 'primary')}</div></section>`;
  }
}
load();
document.addEventListener('keydown', e => { if (e.key === 'Tab') document.body.classList.add('keyboard'); });
document.addEventListener('pointerdown', () => document.body.classList.remove('keyboard'));
