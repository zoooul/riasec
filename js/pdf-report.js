/**
 * Client-side PDF export for RIASEC results (A4, print-ready).
 * Requires jsPDF loaded from js/lib/jspdf.umd.min.js.
 */

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function buildHexagonChartDataUrl(totals, pixelSize) {
  const canvas = document.createElement('canvas');
  canvas.width = pixelSize;
  canvas.height = pixelSize;
  const ctx = canvas.getContext('2d');
  const cx = pixelSize / 2;
  const cy = pixelSize / 2;
  const radius = pixelSize * 0.35;

  const hexOrder = ['E', 'C', 'R', 'I', 'A', 'S'];
  const maxVal = Math.max(...Object.values(totals), 1);
  const angles = hexOrder.map((_, i) => Math.PI / 2 + (i * Math.PI) / 3);

  function point(angle, r) {
    return [cx + r * Math.cos(angle), cy - r * Math.sin(angle)];
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, pixelSize, pixelSize);

  [0.25, 0.5, 0.75, 1].forEach((level) => {
    ctx.beginPath();
    angles.forEach((a, i) => {
      const [x, y] = point(a, radius * level);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = '#e2ddd4';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  angles.forEach((a) => {
    const [x, y] = point(a, radius);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#e2ddd4';
    ctx.stroke();
  });

  ctx.beginPath();
  angles.forEach((a, i) => {
    const letter = hexOrder[i];
    const r = (totals[letter] / maxVal) * radius;
    const [x, y] = point(a, r);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(45, 106, 79, 0.25)';
  ctx.fill();
  ctx.strokeStyle = '#2d6a4f';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  hexOrder.forEach((letter, i) => {
    const [x, y] = point(angles[i], radius + pixelSize * 0.07);
    ctx.font = `bold ${Math.round(pixelSize * 0.035)}px Segoe UI, sans-serif`;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillText(letter, x, y - 6);
    ctx.font = `${Math.round(pixelSize * 0.028)}px Segoe UI, sans-serif`;
    ctx.fillStyle = '#5c5c6e';
    ctx.fillText(String(totals[letter]), x, y + 10);
  });

  return canvas.toDataURL('image/png');
}

function buildInterpretationParagraphs(topThree, totals) {
  const pdf = getLocaleData().pdf;
  const typeInfo = getTypeInfo();
  const hollandCode = topThree.join('');
  const top1 = topThree[0];
  const top2 = topThree[1] ?? topThree[0];
  const top3 = topThree[2] ?? topThree[1] ?? topThree[0];
  const gap = totals[top1] - (totals[top3] ?? 0);

  function applyPdfPlaceholders(text) {
    if (typeof text !== 'string') return text;
    return text
      .replace('{hollandCode}', hollandCode)
      .replace('{top1Letter}', top1)
      .replace('{top2Letter}', top2)
      .replace('{top3Letter}', top3)
      .replace('{gap}', String(gap));
  }

  const paragraphs = [describeCombination(topThree)];
  paragraphs.push(applyPdfPlaceholders(pdf.theoryParagraph));

  topThree.forEach((letter, i) => {
    const info = typeInfo[letter];
    paragraphs.push(
      `${i + 1}. ${info.letter} — ${info.nameLocal} (${totals[letter]} ${t('ui.points')}): ${info.description} ` +
        `${pdf.exampleJobs} ${info.examples.slice(0, 4).join(', ')}.`
    );
  });

  if (gap <= 5) {
    paragraphs.push(applyPdfPlaceholders(pdf.gapNote));
  }

  paragraphs.push(applyPdfPlaceholders(pdf.discussNote));
  return paragraphs;
}

function addPdfFooters(doc, pageWidth, pageHeight, margin) {
  const pdf = getLocaleData().pdf;
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(pdf.footer, pageWidth / 2, pageHeight - margin / 2, { align: 'center' });
    doc.text(
      pdf.pageOf.replace('{current}', i).replace('{total}', pageCount),
      pageWidth - margin,
      pageHeight - margin / 2,
      { align: 'right' }
    );
  }
}

function downloadRiasecPdf(scores) {
  if (!window.jspdf?.jsPDF) {
    alert(t('ui.pdfNotLoaded'));
    return;
  }

  const pdf = getLocaleData().pdf;
  const typeInfo = getTypeInfo();
  const { breakdown, totals, hollandCode, topThree } = scores;
  const maxScores = getMaxPossibleScores();
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  function ensureSpace(needed) {
    if (y + needed > pageHeight - margin - 12) {
      doc.addPage();
      y = margin;
    }
  }

  function heading(text, size) {
    ensureSpace(size * 0.5 + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(26, 26, 46);
    doc.text(text, margin, y);
    y += size * 0.4 + 5;
  }

  function bodyText(text, size) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(60, 60, 80);
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line) => {
      ensureSpace(5.5);
      doc.text(line, margin, y);
      y += 5;
    });
    y += 3;
  }

  doc.setFillColor(45, 106, 79);
  doc.rect(0, 0, pageWidth, 38, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(pdf.title, margin, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(pdf.subtitle, margin, 28);
  doc.text(pdf.createdOn.replace('{date}', formatDate(new Date())), pageWidth - margin, 28, { align: 'right' });

  y = 48;

  heading(pdf.hollandCode, 16);
  ensureSpace(16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  let codeX = margin;
  hollandCode.split('').forEach((letter) => {
    doc.setTextColor(...hexToRgb(typeInfo[letter].color));
    doc.text(letter, codeX, y);
    codeX += 14;
  });
  y += 12;
  bodyText(describeCombination(topThree), 10);

  heading(pdf.preferenceProfile, 14);
  const chartDataUrl = buildHexagonChartDataUrl(totals, 400);
  const chartSize = 85;
  ensureSpace(chartSize + 12);
  doc.addImage(chartDataUrl, 'PNG', (pageWidth - chartSize) / 2, y, chartSize, chartSize);
  y += chartSize + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`${t('ui.chartLegendIdeas')}          ${t('ui.chartLegendPeople')}`, pageWidth / 2, y, { align: 'center' });
  y += 12;

  heading(pdf.detailTitle, 14);

  const colWidths = [44, 22, 22, 22, 22, 22];
  const tableWidth = colWidths.reduce((sum, w) => sum + w, 0);
  const headerHeight = 11;
  const rowHeight = 8;

  ensureSpace(headerHeight + rowHeight * TYPES.length + 4);
  const tableTop = y;

  doc.setFillColor(244, 241, 236);
  doc.setDrawColor(226, 221, 212);
  doc.rect(margin, tableTop, tableWidth, headerHeight, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(92, 92, 110);

  let colX = margin;
  const headerLabels = [
    pdf.tableHeaders.category,
    pdf.tableHeaders.activities,
    pdf.tableHeaders.abilities,
    pdf.tableHeaders.occupations,
    pdf.tableHeaders.self,
    pdf.tableHeaders.total,
  ];
  const maxLabels = [
    '',
    t('ui.tableMax', { n: maxScores.taetigkeiten }),
    t('ui.tableMax', { n: maxScores.faehigkeiten }),
    t('ui.tableMax', { n: maxScores.berufe }),
    t('ui.tableMax', { n: maxScores.selbst }),
    t('ui.tableMax', { n: maxScores.total }),
  ];

  headerLabels.forEach((label, i) => {
    if (i === 0) {
      doc.text(label, colX + 2, tableTop + 6);
    } else {
      doc.text(label, colX + colWidths[i] / 2, tableTop + 4, { align: 'center' });
      doc.setFontSize(6);
      doc.text(maxLabels[i], colX + colWidths[i] / 2, tableTop + 8, { align: 'center' });
      doc.setFontSize(7);
    }
    colX += colWidths[i];
  });

  y = tableTop + headerHeight;

  TYPES.forEach((letter) => {
    const b = breakdown[letter];
    const info = typeInfo[letter];
    const isTop = topThree.includes(letter);
    const [r, g, blue] = isTop ? hexToRgb(info.color) : [226, 221, 212];
    if (isTop) {
      // Soft highlight for the top 3 rows (near-white tinted with the type color).
      const tint = 0.9;
      doc.setFillColor(
        Math.round(r * tint + 255 * (1 - tint)),
        Math.round(g * tint + 255 * (1 - tint)),
        Math.round(blue * tint + 255 * (1 - tint))
      );
      doc.setDrawColor(r, g, blue);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 221, 212);
    }
    doc.rect(margin, y, tableWidth, rowHeight, 'FD');

    colX = margin;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    if (isTop) doc.setTextColor(r, g, blue);
    else doc.setTextColor(26, 26, 46);
    doc.text(`${letter} — ${info.nameLocal}`, colX + 2, y + 5.5);

    const values = [b.taetigkeiten, b.faehigkeiten, b.berufe, b.selbst, totals[letter]];
    values.forEach((val, i) => {
      colX += colWidths[i];
      doc.setFont('helvetica', i === 4 ? 'bold' : 'normal');
      if (isTop && i === 4) doc.setTextColor(r, g, blue);
      else doc.setTextColor(26, 26, 46);
      doc.text(String(val), colX + colWidths[i + 1] / 2, y + 5.5, { align: 'center' });
    });

    y += rowHeight;
  });

  y += 8;

  heading(pdf.interpretation, 14);
  buildInterpretationParagraphs(topThree, totals).forEach((paragraph) => bodyText(paragraph, 10));

  addPdfFooters(doc, pageWidth, pageHeight, margin);

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`${pdf.filename}-${dateStr}.pdf`);
}
