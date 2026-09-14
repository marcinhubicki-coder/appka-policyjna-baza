const app = document.querySelector('#app');
if (!app) throw new Error('Missing #app root');

const SCENES = new Map([
  ['r_ża', 'rose'],
  ['kr_lik', 'bunny'],
  ['g_ry', 'mountains'],
  ['_mury', 'clouds'],
  ['_aba', 'frog'],
  ['samoch_d', 'car'],
  ['_uragan', 'storm'],
  ['leka_', 'doctor'],
  ['g_ebień', 'vanity'],
  ['kr_l', 'king'],
  ['sok_ł', 'falcon'],
]);

const RULES = {
  'u/ó': '<strong>U czy Ó?</strong> Spróbuj znaleźć wyraz pokrewny. <b>Ó</b> często wymienia się na <b>o, e</b> lub <b>a</b>. Gdy nie ma takiej podpowiedzi, zapis warto po prostu zapamiętać.',
  'rz/ż': '<strong>RZ czy Ż?</strong> <b>Rz</b> często wymienia się na <b>r</b> i bywa po spółgłoskach. <b>Ż</b> może wymieniać się m.in. na <b>g, z, s, dz</b>. Szukaj wyrazu z tej samej rodziny.',
  'ch/h': '<strong>CH czy H?</strong> <b>Ch</b> często wymienia się na <b>sz</b> i bardzo często występuje na końcu wyrazu. <b>H</b> spotkasz też w wielu wyrazach obcego pochodzenia.',
  'ć/ci': '<strong>Ć czy CI?</strong> Sprawdź, jaka głoska stoi dalej. Przed samogłoską miękkość często zapisujemy przez <b>ci</b>, a na końcu lub przed spółgłoską częściej przez <b>ć</b>.',
  'ś/si': '<strong>Ś czy SI?</strong> Przed samogłoską miękkość często zapisujemy przez <b>si</b>, a na końcu lub przed spółgłoską częściej przez <b>ś</b>.',
  'ź/zi': '<strong>Ź czy ZI?</strong> Przed samogłoską miękkość często zapisujemy przez <b>zi</b>, a na końcu lub przed spółgłoską częściej przez <b>ź</b>.',
  'ń/ni': '<strong>Ń czy NI?</strong> Przed samogłoską miękkość często zapisujemy przez <b>ni</b>, a na końcu lub przed spółgłoską częściej przez <b>ń</b>.',
};

const questionMemory = new Map();
const layoutMemory = new Map();
let scheduled = false;

function currentQuestionNumber() {
  const text = app.querySelector('.game-meta span')?.textContent || '';
  return Number(text.match(/\d+/)?.[0] || 0);
}

function maskedFromAria(word) {
  const aria = word?.getAttribute('aria-label') || '';
  if (!aria) return '';
  if (/luka/i.test(aria)) return aria.replace(/\s*[–—-]\s*luka\s*[–—-]\s*/i, '_').replace(/\s+/g, '');
  return '';
}

function chooseLayout(key, question) {
  const memoryKey = `${question}:${key}`;
  if (!layoutMemory.has(memoryKey)) layoutMemory.set(memoryKey, Math.random() < 0.5 ? 'full' : 'split');
  return layoutMemory.get(memoryKey);
}

function sceneFor(masked) {
  return SCENES.get(masked) || '';
}

function decorateWord(word, options, feedback) {
  if (!word || word.dataset.artWord === '1') return;
  const slot = word.querySelector('.gap,.filled');
  if (!slot) return;

  const before = slot.previousSibling?.textContent || '';
  const after = slot.nextSibling?.textContent || '';
  const revealed = slot.classList.contains('filled');
  const answer = revealed ? slot.textContent : '';
  const maxLen = Math.max(1, ...options.map(v => [...v.trim()].length));

  word.textContent = '';
  const beforeSpan = document.createElement('span');
  beforeSpan.className = 'word-part word-before';
  beforeSpan.textContent = before;
  const afterSpan = document.createElement('span');
  afterSpan.className = 'word-part word-after';
  afterSpan.textContent = after;

  slot.textContent = '';
  slot.dataset.maxLen = String(maxLen);
  slot.style.setProperty('--slot-len', String(maxLen));

  if (revealed) {
    const text = document.createElement('span');
    text.className = 'revealed-chunk';
    text.textContent = answer;
    slot.append(text);
    slot.classList.add('revealing');
    const baseEm = maxLen > 1 ? 1.72 : 1.08;
    slot.style.width = `${baseEm}em`;
    requestAnimationFrame(() => {
      const measure = document.createElement('span');
      measure.className = 'word-slot-measure';
      measure.textContent = answer;
      word.append(measure);
      const target = Math.max(0.72 * parseFloat(getComputedStyle(word).fontSize), measure.getBoundingClientRect().width + 4);
      measure.remove();
      requestAnimationFrame(() => { slot.style.width = `${target}px`; });
      setTimeout(() => { slot.style.width = ''; }, 480);
    });
  } else {
    const glass = document.createElement('span');
    glass.className = 'bubble-glass';
    glass.innerHTML = '<span class="bubble-reflect bubble-reflect-a"></span><span class="bubble-reflect bubble-reflect-b"></span>';
    slot.append(glass);
    for (let i = 0; i < 4; i += 1) {
      const sparkle = document.createElement('i');
      sparkle.className = `bubble-sparkle sparkle-${i + 1}`;
      sparkle.textContent = '✦';
      slot.append(sparkle);
    }
  }

  word.append(beforeSpan, slot, afterSpan);
  word.dataset.artWord = '1';
  if (feedback) word.classList.add('word-feedback');
}

function lightbulbSvg() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M8.4 15.6c-1.6-1.1-2.7-3-2.7-5.1A6.3 6.3 0 0 1 12 4.2a6.3 6.3 0 0 1 6.3 6.3c0 2.1-1 4-2.7 5.1-.8.6-1.1 1.1-1.1 1.9h-5c0-.8-.3-1.3-1.1-1.9Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function openHint(category) {
  app.querySelector('.spelling-hint-sheet')?.remove();
  const sheet = document.createElement('div');
  sheet.className = 'spelling-hint-sheet';
  sheet.innerHTML = `<button class="hint-dismiss" type="button" aria-label="Zamknij podpowiedź">×</button><div class="hint-sheet-icon">${lightbulbSvg()}</div><div class="hint-sheet-copy"><span>Podpowiedź</span><p>${RULES[category] || '<strong>Spójrz na rodzinę wyrazów.</strong> Spróbuj przypomnieć sobie podobne słowo i porównać jego zapis. Jeśli reguła nie pomaga, skup się na wyglądzie poprawnej formy.'}</p></div>`;
  app.append(sheet);
  requestAnimationFrame(() => sheet.classList.add('show'));
  const close = () => {
    sheet.classList.remove('show');
    setTimeout(() => sheet.remove(), 220);
  };
  sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('.hint-dismiss')) close(); });
}

function addHintButton(answers, category) {
  if (!answers || app.querySelector('.spelling-hint')) return;
  const hint = document.createElement('button');
  hint.type = 'button';
  hint.className = 'spelling-hint';
  hint.innerHTML = `${lightbulbSvg()}<span>Potrzebujesz podpowiedzi?</span>`;
  hint.addEventListener('click', () => openHint(category));
  answers.insertAdjacentElement('afterend', hint);
}

function decorate() {
  scheduled = false;
  if (app.dataset.view !== 'game' || app.dataset.mode !== 'spelling') return;
  if (app.querySelector('.spelling-title')) return;

  const word = app.querySelector('.word');
  const card = app.querySelector('.question-card');
  const answers = app.querySelector('.answers');
  if (!word || !card || !answers) return;

  const question = currentQuestionNumber();
  let masked = maskedFromAria(word);
  if (masked) questionMemory.set(question, masked);
  else masked = questionMemory.get(question) || '';

  const scene = sceneFor(masked);
  const layout = scene ? chooseLayout(masked, question) : 'split';
  const category = app.querySelector('.badge')?.textContent?.trim() || '';
  const feedback = !!word.querySelector('.filled');
  const options = [...answers.querySelectorAll('.answer')].map(el => el.textContent.trim()).filter(Boolean);

  app.classList.add('spelling-art-ready');
  app.dataset.artLayout = layout;
  app.dataset.artScene = scene || 'calm';

  const sceneLayer = document.createElement('div');
  sceneLayer.className = `spelling-scene${scene ? '' : ' spelling-scene-calm'}`;
  sceneLayer.setAttribute('aria-hidden', 'true');
  if (scene) {
    const img = document.createElement('img');
    img.src = `assets/scenes/${scene}.webp`;
    img.alt = '';
    img.decoding = 'async';
    sceneLayer.append(img);
  }
  app.prepend(sceneLayer);

  const title = document.createElement('h2');
  title.className = 'spelling-title';
  title.innerHTML = '<span>Jak jest</span><span>poprawnie?</span><i aria-hidden="true"></i>';
  card.insertAdjacentElement('beforebegin', title);

  card.classList.add('spelling-question-card');
  app.querySelector('.badges')?.setAttribute('aria-hidden', 'true');
  app.querySelector('.prompt')?.setAttribute('aria-hidden', 'true');

  decorateWord(word, options, feedback);
  addHintButton(answers, category);

  const n = question || 1;
  const small = app.querySelector('.time-block small');
  if (small) small.textContent = `Przygoda · zadanie ${n}`;

  if (feedback) {
    app.classList.add('spelling-has-feedback');
    app.querySelector('.spelling-hint')?.setAttribute('hidden', '');
  } else {
    app.classList.remove('spelling-has-feedback');
  }
}

function scheduleDecorate() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(decorate);
}

new MutationObserver(scheduleDecorate).observe(app, { childList: true, subtree: true });
scheduleDecorate();
