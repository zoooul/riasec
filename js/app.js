const STORAGE_KEY = 'riasec-test-answers-v1';
const AUTO_ADVANCE_MS = 250;

const state = {
  screen: 'welcome',
  stepIndex: 0,
  answers: loadAnswers(),
  flow: buildQuestionFlow(),
  infoOpen: false,
  resultsTab: 'profile',
};

let advanceTimer = null;
let isAdvancing = false;

const els = {
  app: document.getElementById('app'),
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text'),
  siteTitle: document.getElementById('site-title'),
  main: document.getElementById('main'),
  footer: document.getElementById('footer'),
};

function loadAnswers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return createEmptyAnswers();
}

function saveAnswers() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.answers));
}

function rebuildFlow() {
  state.flow = buildQuestionFlow();
}

function getAnswerableSteps() {
  return state.flow.filter((s) => s.kind === 'binary' || s.kind === 'self');
}

function getProgress() {
  const answerable = getAnswerableSteps();
  if (state.screen === 'welcome') return 0;
  if (state.screen === 'results') return 100;
  const answered = countAnswered();
  return Math.round((answered / answerable.length) * 100);
}

function countAnswered() {
  let n = 0;
  for (const sectionId of ['taetigkeiten', 'faehigkeiten', 'berufe']) {
    for (const type of TYPES) {
      n += state.answers[sectionId][type].filter((v) => v != null).length;
    }
  }
  n += state.answers.selbsteinschaetzung.filter((v) => v != null).length;
  return n;
}

function sectionById(id) {
  return getSections().find((s) => s.id === id);
}

function setBinaryAnswer(step, value) {
  const arr = state.answers[step.sectionId][step.type];
  arr[step.index] = value;
  saveAnswers();
}

function getBinaryAnswer(step) {
  return state.answers[step.sectionId][step.type][step.index] ?? null;
}

function setSelfAnswer(index, value) {
  state.answers.selbsteinschaetzung[index] = value;
  saveAnswers();
}

function clearAdvanceTimer() {
  if (advanceTimer) {
    clearTimeout(advanceTimer);
    advanceTimer = null;
  }
  isAdvancing = false;
}

function scheduleAutoAdvance() {
  clearAdvanceTimer();
  isAdvancing = true;
  advanceTimer = setTimeout(() => {
    isAdvancing = false;
    advanceTimer = null;
    advance();
  }, AUTO_ADVANCE_MS);
}

function advance() {
  clearAdvanceTimer();
  if (state.stepIndex < state.flow.length - 1) {
    state.stepIndex += 1;
    const prev = state.flow[state.stepIndex - 1];
    const current = state.flow[state.stepIndex];
    if (
      prev?.kind === 'section-break' &&
      current?.kind === 'section-intro' &&
      current.sectionId !== 'selbsteinschaetzung'
    ) {
      state.stepIndex += 1;
    }
    state.screen = 'question';
    render();
    return;
  }
  state.screen = 'results';
  render();
}

function goBack() {
  clearAdvanceTimer();
  if (state.infoOpen) {
    state.infoOpen = false;
    render();
    return;
  }
  if (state.screen === 'results') {
    state.screen = 'question';
    state.stepIndex = state.flow.length - 1;
    render();
    return;
  }
  if (state.stepIndex > 0) {
    state.stepIndex -= 1;
    const step = state.flow[state.stepIndex];
    if (step?.kind === 'section-intro' && state.stepIndex >= 2) {
      const beforeIntro = state.flow[state.stepIndex - 1];
      if (beforeIntro?.kind === 'section-break' && step.sectionId !== 'selbsteinschaetzung') {
        state.stepIndex -= 2;
      }
    }
    state.screen = 'question';
    render();
  } else {
    state.screen = 'welcome';
    render();
  }
}

function startTest() {
  if (countAnswered() > 0 && !confirm(t('ui.startConfirm'))) return;
  if (countAnswered() > 0) {
    localStorage.removeItem(STORAGE_KEY);
    state.answers = createEmptyAnswers();
  }
  state.infoOpen = false;
  state.screen = 'question';
  state.stepIndex = 0;
  render();
}

function resetTest() {
  if (!confirm(t('ui.resetConfirm'))) return;
  localStorage.removeItem(STORAGE_KEY);
  state.answers = loadAnswers();
  state.stepIndex = 0;
  state.screen = 'welcome';
  state.infoOpen = false;
  state.resultsTab = 'profile';
  render();
}

function selectBinaryAnswer(step, value) {
  if (isAdvancing) return;
  setBinaryAnswer(step, value);

  els.main.querySelectorAll('.choice-btn').forEach((btn) => {
    const isSelected = btn.dataset.value === value;
    btn.classList.toggle('selected', isSelected);
    btn.classList.toggle('advancing', isSelected);
  });

  scheduleAutoAdvance();
}

function selectSelfAnswer(step, value) {
  if (isAdvancing) return;
  setSelfAnswer(step.index, value);

  els.main.querySelectorAll('.likert-btn').forEach((btn) => {
    const isSelected = Number(btn.dataset.value) === value;
    btn.classList.toggle('selected', isSelected);
    btn.classList.toggle('advancing', isSelected);
  });

  scheduleAutoAdvance();
}

function handleKeyboard(e) {
  if (state.screen !== 'question' || isAdvancing) return;
  if (e.target.matches('input, textarea, select')) return;

  const step = state.flow[state.stepIndex];
  if (!step) return;

  if (step.kind === 'section-intro' || step.kind === 'section-break') {
    if (e.key === 'Enter') {
      e.preventDefault();
      advance();
    }
    return;
  }

  if (step.kind === 'binary') {
    if (e.key === '1' || e.key === 'ArrowLeft') {
      e.preventDefault();
      selectBinaryAnswer(step, 'positive');
    } else if (e.key === '2' || e.key === 'ArrowRight') {
      e.preventDefault();
      selectBinaryAnswer(step, 'negative');
    }
    return;
  }

  if (step.kind === 'self') {
    const n = Number(e.key);
    if (n >= 1 && n <= 7) {
      e.preventDefault();
      selectSelfAnswer(step, n);
    }
  }
}

document.addEventListener('keydown', handleKeyboard);

function renderWelcomeInfo() {
  const introText = getIntroText();
  els.main.innerHTML = `
    <section class="card">
      <p class="eyebrow">${t('ui.welcomeEyebrow')}</p>
      <h2>${t('ui.welcomeTitle')}</h2>
      <div class="info-body">${introText.split('\n\n').map((p) => `<p>${p}</p>`).join('')}</div>
      <div class="card-actions">
        <button class="btn btn-primary btn-large" id="btn-close-info">${t('ui.closeInfo')}</button>
      </div>
    </section>
  `;
  document.getElementById('btn-close-info')?.addEventListener('click', () => {
    state.infoOpen = false;
    render();
  });
}

function renderWelcome() {
  if (state.infoOpen) {
    renderWelcomeInfo();
    return;
  }

  const preview = getIntroText().split('\n\n')[0];
  els.main.innerHTML = `
    <section class="card welcome-card">
      <p class="eyebrow">${t('ui.welcomeEyebrow')}</p>
      <h1>${t('ui.welcomeTitle')}</h1>
      <p class="intro-preview">${preview}</p>
      <button type="button" class="btn-link" id="btn-more">${t('ui.readMore')}</button>
      <div class="info-grid">
        <div class="info-box">
          <span class="info-num">228</span>
          <span class="info-label">${t('ui.questionsLabel')}</span>
        </div>
        <div class="info-box">
          <span class="info-num">6</span>
          <span class="info-label">${t('ui.categoriesLabel')}</span>
        </div>
        <div class="info-box">
          <span class="info-num">~25</span>
          <span class="info-label">${t('ui.minutesLabel')}</span>
        </div>
      </div>
      <div class="type-preview">
        ${TYPES.map((type) => {
          const info = getTypeInfo()[type];
          return `<span class="type-chip" style="--type-color:${info.color}">${info.letter}</span>`;
        }).join('')}
      </div>
      <p class="hint">${t('ui.copyright')}</p>
      <div class="welcome-actions">
        <button class="btn btn-primary btn-large" id="btn-start">${t('ui.startTest')}</button>
        ${countAnswered() > 0 ? `<button class="btn btn-secondary" id="btn-continue">${t('ui.continueTest')}</button>` : ''}
      </div>
    </section>
  `;
  document.getElementById('btn-more')?.addEventListener('click', () => {
    state.infoOpen = true;
    render();
  });
  document.getElementById('btn-start')?.addEventListener('click', startTest);
  document.getElementById('btn-continue')?.addEventListener('click', () => {
    const answerable = getAnswerableSteps();
    if (countAnswered() >= answerable.length) {
      state.screen = 'results';
      render();
      return;
    }
    state.screen = 'question';
    for (let i = 0; i < answerable.length; i++) {
      const s = answerable[i];
      if (s.kind === 'binary' && getBinaryAnswer(s) == null) {
        state.stepIndex = state.flow.indexOf(s);
        break;
      }
      if (s.kind === 'self' && state.answers.selbsteinschaetzung[s.index] == null) {
        state.stepIndex = state.flow.indexOf(s);
        break;
      }
      if (i === answerable.length - 1) state.stepIndex = state.flow.length - 1;
    }
    render();
  });
  els.footer.innerHTML = '';
}

function renderSectionIntro(step) {
  const section = sectionById(step.sectionId);
  const partNum = getSections().findIndex((s) => s.id === step.sectionId) + 1;
  els.main.innerHTML = `
    <section class="card section-intro-card">
      <p class="eyebrow">${t('ui.partOf', { part: partNum, total: getSections().length })}</p>
      <h2>${section.title}</h2>
      <p class="section-instruction">${section.instruction}</p>
      <div class="card-actions">
        <button class="btn btn-primary" id="btn-continue-section">${t('ui.letsGo')}</button>
      </div>
    </section>
  `;
  document.getElementById('btn-continue-section')?.addEventListener('click', advance);
}

function renderSectionBreak(step) {
  const breakInfo = getSectionBreakMessages()[step.sectionId];
  const answerable = getAnswerableSteps();
  const answered = countAnswered();
  const isLast = step.sectionId === 'selbsteinschaetzung';

  els.main.innerHTML = `
    <section class="card section-break-card">
      <div class="section-break-icon" aria-hidden="true">${breakInfo.icon}</div>
      <p class="eyebrow">${t('ui.pause')}</p>
      <h2>${breakInfo.title}</h2>
      <p>${breakInfo.message}</p>
      <p class="section-break-stats">${t('ui.questionsProgress', { answered, total: answerable.length })}</p>
      ${breakInfo.nextTitle ? `
        <div class="section-break-next">
          <p class="eyebrow">${t('ui.upNext')}</p>
          <h3>${breakInfo.nextTitle}</h3>
          <p class="muted">${breakInfo.nextHint}</p>
        </div>
      ` : ''}
      <div class="card-actions">
        <button class="btn btn-primary" id="btn-continue-break">${isLast ? t('ui.toResults') : t('ui.continueBtn')}</button>
      </div>
    </section>
  `;
  document.getElementById('btn-continue-break')?.addEventListener('click', advance);
}

function renderBinaryQuestion(step) {
  const section = sectionById(step.sectionId);
  const info = getTypeInfo()[step.type];
  const items = getQuestions()[step.sectionId][step.type];
  const current = getBinaryAnswer(step);

  els.main.innerHTML = `
    <section class="card question-card">
      <div class="question-meta">
        <span class="type-badge small" style="--type-color: ${info.color}">${info.letter}</span>
        <span>${section.title}</span>
        <span class="muted">${t('ui.questionLabel', { current: step.index + 1, total: items.length })}</span>
      </div>
      <h2 class="question-text">${step.text}</h2>
      <div class="choice-group" role="radiogroup" aria-label="${t('ui.answerAria')}">
        <button type="button" class="choice-btn positive ${current === 'positive' ? 'selected' : ''}" data-value="positive">
          <span class="choice-emoji" aria-hidden="true">👍</span>
          <span class="choice-label">${section.scale.positive}</span>
          <span class="choice-shortcut">${t('ui.shortcutLeft')}</span>
        </button>
        <button type="button" class="choice-btn negative ${current === 'negative' ? 'selected' : ''}" data-value="negative">
          <span class="choice-emoji" aria-hidden="true">👎</span>
          <span class="choice-label">${section.scale.negative}</span>
          <span class="choice-shortcut">${t('ui.shortcutRight')}</span>
        </button>
      </div>
      <p class="keyboard-hint">${t('ui.keyboardBinary')}</p>
    </section>
  `;

  els.main.querySelectorAll('.choice-btn').forEach((btn) => {
    btn.addEventListener('click', () => selectBinaryAnswer(step, btn.dataset.value));
  });
}

function renderSelfQuestion(step) {
  const info = getTypeInfo()[step.type];
  const current = state.answers.selbsteinschaetzung[step.index];

  els.main.innerHTML = `
    <section class="card question-card">
      <div class="question-meta">
        <span class="type-badge small" style="--type-color: ${info.color}">${info.letter}</span>
        <span>${t('ui.selfAssessment')}</span>
        <span class="muted">${t('ui.traitLabel', { current: step.index + 1, total: 12 })}</span>
      </div>
      <h2 class="question-text">${step.text}</h2>
      <p class="scale-hint">${t('ui.scaleHint')}</p>
      <div class="likert-scale">
        <div class="likert-labels">
          <span>${t('ui.scaleLow')}</span>
          <span>${t('ui.scaleMid')}</span>
          <span>${t('ui.scaleHigh')}</span>
        </div>
        <div class="likert-buttons" role="radiogroup" aria-label="${t('ui.scaleAria')}">
          ${[1, 2, 3, 4, 5, 6, 7]
            .map(
              (n) => `
            <button type="button" class="likert-btn ${current === n ? 'selected' : ''}" data-value="${n}" aria-label="${t('ui.scaleValue', { n })}">
              <span class="likert-num">${n}</span>
            </button>`
            )
            .join('')}
        </div>
      </div>
      <p class="keyboard-hint">${t('ui.keyboardSelf')}</p>
    </section>
  `;

  els.main.querySelectorAll('.likert-btn').forEach((btn) => {
    btn.addEventListener('click', () => selectSelfAnswer(step, Number(btn.dataset.value)));
  });
}

function renderHexagonChart(totals) {
  const typeInfo = getTypeInfo();
  const maxVal = Math.max(...Object.values(totals), 1);
  const cx = 200;
  const cy = 200;
  const radius = 140;

  const hexOrder = ['E', 'C', 'R', 'I', 'A', 'S'];
  const angles = hexOrder.map((_, i) => Math.PI / 2 + i * (Math.PI / 3));

  function point(angle, r) {
    return [cx + r * Math.cos(angle), cy - r * Math.sin(angle)];
  }

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const grids = gridLevels
    .map((level) => {
      const pts = angles.map((a) => point(a, radius * level).join(',')).join(' ');
      return `<polygon points="${pts}" class="chart-grid"/>`;
    })
    .join('');

  const dataPts = angles
    .map((a, i) => {
      const letter = hexOrder[i];
      const r = (totals[letter] / maxVal) * radius;
      return point(a, r).join(',');
    })
    .join(' ');

  const labels = hexOrder
    .map((letter, i) => {
      const [x, y] = point(angles[i], radius + 28);
      return `
        <g class="chart-label" transform="translate(${x}, ${y})">
          <text text-anchor="middle" dominant-baseline="middle" class="chart-letter">${letter}</text>
          <text text-anchor="middle" dy="14" class="chart-score">${totals[letter]}</text>
        </g>`;
    })
    .join('');

  const axes = angles
    .map((a) => {
      const [x, y] = point(a, radius);
      return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="chart-axis"/>`;
    })
    .join('');

  return `
    <div class="hex-wrap">
      <svg viewBox="0 0 400 400" class="hex-chart" aria-label="${t('ui.chartAria')}">
        ${grids}
        ${axes}
        <polygon points="${dataPts}" class="chart-data"/>
        ${labels}
      </svg>
    </div>
  `;
}

function renderResults() {
  const selfAssessment = getSelfAssessment();
  const typeInfo = getTypeInfo();
  const localeData = getLocaleData();
  const { breakdown, totals, hollandCode, topThree } = calculateScores(state.answers, selfAssessment);
  const maxScores = getMaxPossibleScores();
  const tab = state.resultsTab;

  const breakdownRows = TYPES.map((letter) => {
    const b = breakdown[letter];
    const info = typeInfo[letter];
    return `
      <tr>
        <td><span class="type-badge tiny" style="--type-color: ${info.color}">${letter}</span> ${info.nameLocal}</td>
        <td>${b.taetigkeiten}</td>
        <td>${b.faehigkeiten}</td>
        <td>${b.berufe}</td>
        <td>${b.selbst}</td>
        <td><strong>${totals[letter]}</strong></td>
      </tr>`;
  }).join('');

  const typeCards = topThree
    .map((letter, i) => {
      const info = typeInfo[letter];
      return `
        <div class="result-type-card" style="--type-color: ${info.color}">
          <span class="rank">#${i + 1}</span>
          <h3>${info.letter} — ${info.nameLocal}</h3>
          <p class="score-total">${totals[letter]} ${t('ui.points')}</p>
          <p>${info.description}</p>
          <p class="examples"><strong>${t('ui.exampleJobs')}</strong> ${info.examples.join(', ')}</p>
        </div>`;
    })
    .join('');

  const panels = {
    profile: `
      <div class="card results-hero">
        <p class="eyebrow">${t('ui.resultsEyebrow')}</p>
        <h1>${t('ui.hollandCodeTitle')}</h1>
        <div class="holland-code">${hollandCode.split('').map((l) => `<span style="color:${typeInfo[l].color}">${l}</span>`).join('')}</div>
        <p class="combination-note">${describeCombination(topThree)}</p>
        ${renderHexagonChart(totals)}
        <div class="chart-legend">
          <span>${t('ui.chartLegendIdeas')}</span>
          <span>${t('ui.chartLegendPeople')}</span>
        </div>
      </div>`,
    scores: `
      <div class="card">
        <h2>${t('ui.detailTitle')}</h2>
        <div class="table-wrap">
          <table class="score-table">
            <thead>
              <tr>
                <th>${t('ui.tableCategory')}</th>
                <th>${t('ui.tableActivities')}<br><small>${t('ui.tableMax', { n: maxScores.taetigkeiten })}</small></th>
                <th>${t('ui.tableAbilities')}<br><small>${t('ui.tableMax', { n: maxScores.faehigkeiten })}</small></th>
                <th>${t('ui.tableOccupations')}<br><small>${t('ui.tableMax', { n: maxScores.berufe })}</small></th>
                <th>${t('ui.tableSelf')}<br><small>${t('ui.tableMax', { n: maxScores.selbst })}</small></th>
                <th>${t('ui.tableTotal')}<br><small>${t('ui.tableMax', { n: maxScores.total })}</small></th>
              </tr>
            </thead>
            <tbody>${breakdownRows}</tbody>
          </table>
        </div>
      </div>`,
    types: `<div class="card"><div class="type-cards">${typeCards}</div></div>`,
    about: `
      <div class="card">
        <div class="about-scroll">
          <h2>${t('ui.howCalculated')}</h2>
          <ol class="scoring-steps">
            ${localeData.scoringSteps.map((step) => `<li>${step}</li>`).join('')}
          </ol>
          <p class="note">${localeData.scoringNote}</p>
          <h2>${t('ui.theoryTitle')}</h2>
          <p>${t('ui.theoryIntro')}</p>
          <div class="theory-grid">
            ${TYPES.map((letter) => {
              const info = typeInfo[letter];
              return `
                <div class="theory-item" style="border-color: ${info.color}">
                  <strong style="color: ${info.color}">${info.letter} — ${info.nameLocal}</strong>
                  <span>${info.name}</span>
                  <p>${info.description}</p>
                </div>`;
            }).join('')}
          </div>
          <p class="hint">${t('ui.theoryHint')}</p>
        </div>
      </div>`,
  };

  els.main.innerHTML = `
    <section class="results">
      <div class="results-tabs" role="tablist">
        <button type="button" class="results-tab ${tab === 'profile' ? 'active' : ''}" data-tab="profile">${t('ui.tabProfile')}</button>
        <button type="button" class="results-tab ${tab === 'scores' ? 'active' : ''}" data-tab="scores">${t('ui.tabScores')}</button>
        <button type="button" class="results-tab ${tab === 'types' ? 'active' : ''}" data-tab="types">${t('ui.tabTypes')}</button>
        <button type="button" class="results-tab ${tab === 'about' ? 'active' : ''}" data-tab="about">${t('ui.tabAbout')}</button>
      </div>
      <div class="results-panel">${panels[tab]}</div>
      <div class="results-actions">
        <button class="btn btn-secondary" id="btn-back-results">${t('ui.back')}</button>
        <button class="btn btn-outline" id="btn-reset">${t('ui.restart')}</button>
        <button class="btn btn-primary" id="btn-pdf">${t('ui.downloadPdf')}</button>
      </div>
    </section>
  `;

  els.main.querySelectorAll('.results-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.resultsTab = btn.dataset.tab;
      render();
    });
  });
  document.getElementById('btn-back-results')?.addEventListener('click', goBack);
  document.getElementById('btn-reset')?.addEventListener('click', resetTest);
  document.getElementById('btn-pdf')?.addEventListener('click', () => {
    const scores = calculateScores(state.answers, getSelfAssessment());
    downloadRiasecPdf(scores);
  });
}

function updateChrome() {
  document.body.dataset.screen = state.infoOpen ? 'info' : state.screen;
  const backBtn = document.getElementById('btn-header-back');
  const backLabel = document.getElementById('header-back-label');
  const showBack = state.screen === 'question' || state.screen === 'results' || state.infoOpen;
  if (backBtn) {
    backBtn.hidden = !showBack;
    backBtn.setAttribute('aria-label', t('ui.back'));
  }
  if (backLabel) backLabel.textContent = t('ui.back');
  els.footer.innerHTML = '';
}

function updateProgress() {
  const pct = getProgress();
  els.progressBar.style.width = `${pct}%`;
  const answerable = getAnswerableSteps();
  const answered = countAnswered();
  els.progressText.textContent =
    state.screen === 'welcome'
      ? t('ui.ready')
      : state.screen === 'results'
        ? t('ui.completed')
        : t('ui.progressAnswered', { answered, total: answerable.length });
}

function updateLanguageSwitcher() {
  const select = document.getElementById('lang-select');
  if (select && select.value !== getLocale()) {
    select.value = getLocale();
  }
  els.siteTitle.textContent = t('ui.siteTitle');
  const langLabel = document.getElementById('lang-label');
  if (langLabel) langLabel.textContent = t('ui.languageLabel');
}

function render() {
  clearAdvanceTimer();
  updateProgress();
  updateLanguageSwitcher();
  updateChrome();

  if (state.screen === 'welcome') {
    renderWelcome();
    return;
  }

  if (state.screen === 'results') {
    renderResults();
    return;
  }

  const step = state.flow[state.stepIndex];
  if (!step) {
    state.screen = 'results';
    renderResults();
    return;
  }

  switch (step.kind) {
    case 'section-intro':
      renderSectionIntro(step);
      break;
    case 'section-break':
      renderSectionBreak(step);
      break;
    case 'type-intro':
      advance();
      return;
    case 'binary':
      renderBinaryQuestion(step);
      break;
    case 'self':
      renderSelfQuestion(step);
      break;
    default:
      advance();
      return;
  }
}

function initLanguageSwitcher() {
  const select = document.getElementById('lang-select');
  if (!select) return;
  select.innerHTML = getAvailableLocales()
    .map((code) => {
      const meta = localeRegistry[code].meta;
      const short = meta.short || code.toUpperCase();
      return `<option value="${code}">${short} · ${meta.label}</option>`;
    })
    .join('');
  select.value = getLocale();
  select.addEventListener('change', (e) => switchLocale(e.target.value));
}

function init() {
  resolveInitialLocale();
  applyDocumentLocale();
  initLanguageSwitcher();
  document.getElementById('btn-header-back')?.addEventListener('click', goBack);
  onLocaleChange(() => {
    rebuildFlow();
    render();
  });
  render();
}

init();
