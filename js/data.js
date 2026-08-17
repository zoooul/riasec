const TYPES = ['R', 'I', 'A', 'S', 'E', 'C'];

function buildQuestionFlow() {
  const sections = getSections();
  const questions = getQuestions();
  const selfAssessment = getSelfAssessment();
  const flow = [];

  for (const section of sections) {
    flow.push({ kind: 'section-intro', sectionId: section.id });

    if (section.id === 'selbsteinschaetzung') {
      selfAssessment.forEach((item, index) => {
        flow.push({
          kind: 'self',
          sectionId: section.id,
          type: item.type,
          index,
          text: item.label,
        });
      });
      flow.push({ kind: 'section-break', sectionId: section.id });
      continue;
    }

    for (const type of TYPES) {
      questions[section.id][type].forEach((text, index) => {
        flow.push({
          kind: 'binary',
          sectionId: section.id,
          type,
          index,
          text,
        });
      });
    }

    flow.push({ kind: 'section-break', sectionId: section.id });
  }

  return flow;
}
