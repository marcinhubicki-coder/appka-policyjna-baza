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

function answerGrid(q) {
  return `
    <div class="answer-grid" aria-label="Wybierz wynik">
      ${q.answers.map((answer) => {
        const isCorrectState = state.locked && answer === q.correct;
        const classes = ['answer'];
        if (isCorrectState) classes.push('correct');
        return `
          <button
            class="${classes.join(' ')}"
            type="button"
            data-answer="${answer}"
            ${state.locked ? 'disabled' : ''}
          >${answer}</button>
        `;
      }).join('')}
    </div>
  `;
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

        ${showExplainer ? multiplicationExplainer(q.a, q.b) : `
          ${answerGrid(q)}
          <p class="feedback ${feedbackType}" role="status">${feedback}</p>
        `}
      </div>
    </section>
  `;

  app.querySelector('#back')?.addEventListener('click', renderCategories);

  app.querySelectorAll('[data-answer]').forEach((button) => {
    button.addEventListener('click', () => chooseAnswer(Number(button.dataset.answer)));
  });

  app.querySelector('[data-retry]')?.addEventListener('click', retryQuestion);
  bindExplainerInteractions();
}

function chooseAnswer(answer) {
  if (state.locked) return;
  const q = state.question;

  if (answer === q.correct) {
    state.locked = true;
    renderMultiply({ feedback: 'Dobrze!', feedbackType: 'good' });

    // Poprawna odpowiedź prowadzi automatycznie dalej — bez przycisku „Dalej”.
    window.setTimeout(() => {
      if (state.screen === 'multiply') nextQuestion();
    }, 720);
    return;
  }

  state.wrongAnswers.add(answer);
  state.hadMistake = true;
  renderMultiply();
}

function retryQuestion() {
  state.hadMistake = false;
  state.wrongAnswers = new Set();
  renderMultiply();
}

function getExplainerMetrics(rows, columns) {
  const largestSide = Math.max(rows, columns);

  if (largestSide >= 9) {
    return { cellWidth: 16, cellHeight: 18, gap: 2 };
  }
  if (largestSide >= 7) {
    return { cellWidth: 19, cellHeight: 20, gap: 3 };
  }
  return { cellWidth: 22, cellHeight: 23, gap: 3 };
}

function multiplicationExplainer(rows, columns) {
  const { cellWidth, cellHeight, gap } = getExplainerMetrics(rows, columns);
  const cells = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const classes = ['array-cell'];
      if (row === 0) classes.push('first-row');
      if (col === 0) classes.push('first-col');
      const delay = row * 28 + col * 4;
      cells.push(`
        <span
          class="${classes.join(' ')}"
          data-row="${row + 1}"
          style="width:${cellWidth}px;height:${cellHeight}px;animation-delay:${delay}ms"
          aria-hidden="true"
        ></span>
      `);
    }
  }

  const columnLabels = Array.from({ length: columns }, (_, index) => (
    `<span class="axis-label col-label" data-col-label>${index + 1}</span>`
  )).join('');

  const rowLabels = Array.from({ length: rows }, (_, index) => (
    `<span class="axis-label row-label" data-row-label="${index + 1}" style="height:${cellHeight}px">${index + 1}</span>`
  )).join('');

  const expressions = Array.from({ length: rows }, (_, index) => {
    const step = index + 1;
    const total = step * columns;
    const previous = (step - 1) * columns;
    const expression = step === 1 ? `${columns}` : `${previous} + ${columns} = ${total}`;
    return `
      <button
        class="row-expression"
        type="button"
        data-explain-step="${step}"
        aria-pressed="false"
        style="height:${cellHeight}px"
      >${expression}</button>
    `;
  }).join('');

  return `
    <section class="explainer" aria-label="Wyjaśnienie mnożenia: ${rows} rzędów po ${columns}">
      <div class="explainer-copy">
        <span class="explainer-title">${rows} rzędów po ${columns}</span>
      </div>

      <div class="explain-grid">
        <div
          class="column-labels"
          style="grid-template-columns:repeat(${columns}, ${cellWidth}px);gap:${gap}px"
          aria-label="Numery kolumn"
        >${columnLabels}</div>

        <div
          class="row-labels"
          style="grid-template-rows:repeat(${rows}, ${cellHeight}px);gap:${gap}px"
          aria-label="Numery rzędów"
        >${rowLabels}</div>

        <div
          class="array"
          style="grid-template-columns:repeat(${columns}, ${cellWidth}px);grid-template-rows:repeat(${rows}, ${cellHeight}px);gap:${gap}px"
          aria-hidden="true"
        >${cells.join('')}</div>

        <div
          class="row-expressions"
          style="grid-template-rows:repeat(${rows}, ${cellHeight}px);gap:${gap}px"
          aria-label="Kolejne dodawanie"
        >${expressions}</div>
      </div>

      <button class="retry-button" type="button" data-retry>Spróbuj ponownie</button>
    </section>
  `;
}

function bindExplainerInteractions() {
  const buttons = [...app.querySelectorAll('[data-explain-step]')];
  if (!buttons.length) return;

  let selectedStep = 0;

  const paint = (step) => {
    app.querySelectorAll('.array-cell').forEach((cell) => {
      cell.classList.toggle('is-active', step > 0 && Number(cell.dataset.row) <= step);
    });

    app.querySelectorAll('[data-row-label]').forEach((label) => {
      label.classList.toggle('is-active', step > 0 && Number(label.dataset.rowLabel) <= step);
    });

    app.querySelectorAll('[data-col-label]').forEach((label) => {
      label.classList.toggle('is-active', step > 0);
    });

    buttons.forEach((button) => {
      const isSelected = Number(button.dataset.explainStep) === selectedStep;
      const isPreview = Number(button.dataset.explainStep) === step;
      button.classList.toggle('is-active', isPreview);
      button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
  };

  const restoreSelected = () => paint(selectedStep);

  buttons.forEach((button) => {
    const step = Number(button.dataset.explainStep);

    button.addEventListener('pointerenter', () => paint(step));
    button.addEventListener('pointerleave', restoreSelected);
    button.addEventListener('focus', () => paint(step));
    button.addEventListener('blur', restoreSelected);
    button.addEventListener('click', () => {
      selectedStep = selectedStep === step ? 0 : step;
      paint(selectedStep);
    });
  });

  paint(0);
}

renderCategories();
