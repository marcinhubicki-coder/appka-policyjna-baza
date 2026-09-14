const app = document.querySelector('#app');

const state = {
  screen: 'categories',
  question: null,
  locked: false,
  wrongAnswers: new Set(),
  hadMistake: false,
};

const categoryItems = [
  { key: 'add', symbol: '+', label: 'Dodawanie', enabled: false },
  { key: 'subtract', symbol: '−', label: 'Odejmowanie', enabled: false },
  { key: 'multiply', symbol: '×', label: 'Mnożenie', enabled: true },
  { key: 'divide', symbol: '÷', label: 'Dzielenie', enabled: false },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeQuestion() {
  const a = randomInt(2, 10);
  const b = randomInt(2, 10);
  const correct = a * b;
  const candidates = new Set([correct]);
  const nearby = [
    correct + a,
    correct - a,
    correct + b,
    correct - b,
    correct + 1,
    correct - 1,
    correct + 10,
    correct - 10,
  ].filter((value) => value > 0 && value !== correct);

  while (candidates.size < 4 && nearby.length) {
    const index = randomInt(0, nearby.length - 1);
    candidates.add(nearby.splice(index, 1)[0]);
  }
  while (candidates.size < 4) {
    candidates.add(randomInt(Math.max(1, correct - 12), correct + 12));
  }

  const answers = [...candidates]
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  return { a, b, correct, answers };
}

function topbar({ back = false } = {}) {
  return `
    <header class="topbar">
      <button class="icon-button" id="back" type="button" aria-label="Wróć" ${back ? '' : 'hidden'}>‹</button>
      <div class="brand">Mała Nauka</div>
      <div></div>
    </header>
  `;
}

function renderCategories() {
  state.screen = 'categories';
  state.locked = false;
  state.wrongAnswers.clear();
  state.hadMistake = false;

  app.innerHTML = `
    ${topbar()}
    <section class="screen">
      <div class="hero">
        <p class="eyebrow">Matematyka</p>
        <h1>Co dziś ćwiczymy?</h1>
        <p>Każdy rodzaj działania ma własny tryb. W tej pierwszej wersji sprawdzamy mnożenie i sposób tłumaczenia błędów.</p>
      </div>
      <div class="category-grid" aria-label="Kategorie matematyki">
        ${categoryItems.map((item) => `
          <button
            class="category-card ${item.enabled ? 'active' : ''}"
            type="button"
            data-category="${item.key}"
            ${item.enabled ? '' : 'disabled aria-disabled="true"'}
          >
            <span class="category-symbol" aria-hidden="true">${item.symbol}</span>
            <span class="category-name">${item.label}</span>
          </button>
        `).join('')}
      </div>
    </section>
  `;

  app.querySelector('[data-category="multiply"]')?.addEventListener('click', () => {
    state.screen = 'multiply';
    nextQuestion();
  });
}

function nextQuestion() {
  state.question = makeQuestion();
  state.locked = false;
  state.wrongAnswers = new Set();
  state.hadMistake = false;
  renderMultiply();
}

function renderMultiply({ feedback = '', feedbackType = '' } = {}) {
  const q = state.question;
  const showExplainer = state.hadMistake;

  app.innerHTML = `
    ${topbar({ back: true })}
    <section class="screen quiz-screen">
      <div class="quiz-stage ${showExplainer ? 'has-explainer' : ''}">
        <div class="question-block">
          <p class="question-label">Ile to jest?</p>
          <p class="equation" aria-label="${q.a} razy ${q.b}">${q.a} × ${q.b}</p>
        </div>

        <div class="answer-grid" aria-label="Wybierz wynik">
          ${q.answers.map((answer) => {
            const isWrong = state.wrongAnswers.has(answer);
            const isCorrectState = state.locked && answer === q.correct;
            const classes = ['answer'];
            if (isWrong) classes.push('wrong');
            if (isCorrectState) classes.push('correct');
            return `
              <button
                class="${classes.join(' ')}"
                type="button"
                data-answer="${answer}"
                ${state.locked || isWrong ? 'disabled' : ''}
              >${answer}</button>
            `;
          }).join('')}
        </div>

        <p class="feedback ${feedbackType}" role="status">${feedback}</p>

        ${showExplainer ? multiplicationExplainer(q.a, q.b) : ''}
      </div>
    </section>
  `;

  app.querySelector('#back')?.addEventListener('click', renderCategories);
  app.querySelectorAll('[data-answer]').forEach((button) => {
    button.addEventListener('click', () => chooseAnswer(Number(button.dataset.answer)));
  });
}

function chooseAnswer(answer) {
  if (state.locked) return;
  const q = state.question;

  if (answer === q.correct) {
    state.locked = true;
    renderMultiply({ feedback: 'Dobrze!', feedbackType: 'good' });

    // Nie renderujemy przycisku „Dalej”. Kolejne pytanie pojawia się automatycznie.
    const delay = state.hadMistake ? 950 : 720;
    window.setTimeout(() => {
      if (state.screen === 'multiply') nextQuestion();
    }, delay);
    return;
  }

  state.wrongAnswers.add(answer);
  state.hadMistake = true;
  renderMultiply({ feedback: 'Spójrz, jak można to zobaczyć.', feedbackType: 'bad' });
}

function getExplainerMetrics(rows, columns) {
  const largestSide = Math.max(rows, columns);

  if (largestSide >= 9) {
    return { cellWidth: 17, cellHeight: 10, gap: 2 };
  }
  if (largestSide >= 7) {
    return { cellWidth: 20, cellHeight: 12, gap: 3 };
  }
  return { cellWidth: 23, cellHeight: 14, gap: 3 };
}

function multiplicationExplainer(rows, columns) {
  const { cellWidth, cellHeight, gap } = getExplainerMetrics(rows, columns);
  const cells = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const classes = ['array-cell'];
      if (row === 0) classes.push('first-row');
      if (col === 0) classes.push('first-col');
      const delay = row * 38 + col * 6;
      cells.push(`
        <span
          class="${classes.join(' ')}"
          style="width:${cellWidth}px;height:${cellHeight}px;animation-delay:${delay}ms"
          aria-hidden="true"
        ></span>
      `);
    }
  }

  const totals = Array.from({ length: rows }, (_, index) => {
    const total = (index + 1) * columns;
    const delay = index * 38 + columns * 6 + 20;
    return `<span class="row-total" style="height:${cellHeight}px;animation-delay:${delay}ms">${total}</span>`;
  }).join('');

  return `
    <section class="explainer" aria-label="Wyjaśnienie mnożenia: ${rows} rzędów po ${columns}">
      <div class="explainer-copy">
        <span class="explainer-title">${rows} rzędów po ${columns}</span>
        <span class="explainer-note">dodajemy po ${columns}</span>
      </div>
      <div class="array-wrap">
        <div
          class="array"
          style="grid-template-columns:repeat(${columns}, ${cellWidth}px);grid-template-rows:repeat(${rows}, ${cellHeight}px);gap:${gap}px"
          aria-hidden="true"
        >${cells.join('')}</div>
        <div
          class="row-totals"
          style="grid-template-rows:repeat(${rows}, ${cellHeight}px);gap:${gap}px"
          aria-label="Sumy kolejnych rzędów"
        >${totals}</div>
      </div>
    </section>
  `;
}

renderCategories();
