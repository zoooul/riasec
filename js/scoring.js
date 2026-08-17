function createEmptyAnswers() {
  return {
    taetigkeiten: Object.fromEntries(TYPES.map((t) => [t, []])),
    faehigkeiten: Object.fromEntries(TYPES.map((t) => [t, []])),
    berufe: Object.fromEntries(TYPES.map((t) => [t, []])),
    selbsteinschaetzung: Array(12).fill(null),
  };
}

function countPositive(values) {
  return values.filter((v) => v === 'positive').length;
}

function sumSelfForType(values, type, traits) {
  const indices = traits
    .map((trait, index) => (trait.type === type ? index : -1))
    .filter((i) => i >= 0);
  return indices.reduce((sum, i) => sum + (values[i] ?? 0), 0);
}

function calculateScores(answers, selfAssessmentTraits) {
  const breakdown = {};
  const totals = {};

  for (const type of TYPES) {
    const taetigkeiten = countPositive(answers.taetigkeiten[type]);
    const faehigkeiten = countPositive(answers.faehigkeiten[type]);
    const berufe = countPositive(answers.berufe[type]);
    const selbst = sumSelfForType(answers.selbsteinschaetzung, type, selfAssessmentTraits);

    breakdown[type] = { taetigkeiten, faehigkeiten, berufe, selbst };
    totals[type] = taetigkeiten + faehigkeiten + berufe + selbst;
  }

  const sorted = [...TYPES].sort((a, b) => {
    if (totals[b] !== totals[a]) return totals[b] - totals[a];
    return TYPES.indexOf(a) - TYPES.indexOf(b);
  });

  const hollandCode = sorted.slice(0, 3).join('');

  return { breakdown, totals, hollandCode, topThree: sorted.slice(0, 3) };
}

function getMaxPossibleScores() {
  return {
    taetigkeiten: 11,
    faehigkeiten: 11,
    berufe: 14,
    selbst: 14,
    total: 50,
  };
}
