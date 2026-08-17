/**
 * Client-side PDF export for RIASEC results (A4, print-ready).
 * Requires jsPDF loaded from js/lib/jspdf.umd.min.js.
 */

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function applyPdfPlaceholders(text, values) {
  if (typeof text !== 'string') return text;
  return text
    .replaceAll('{hollandCode}', values.hollandCode)
    .replaceAll('{top1Letter}', values.top1)
    .replaceAll('{top2Letter}', values.top2)
    .replaceAll('{top3Letter}', values.top3)
    .replaceAll('{gap}', String(values.gap));
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
  ctx.fillStyle = 'rgba(13, 148, 136, 0.22)';
  ctx.fill();
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  hexOrder.forEach((letter, i) => {
    const [x, y] = point(angles[i], radius + pixelSize * 0.07);
    ctx.font = `bold ${Math.round(pixelSize * 0.035)}px Segoe UI, sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.fillText(letter, x, y - 6);
    ctx.font = `${Math.round(pixelSize * 0.028)}px Segoe UI, sans-serif`;
    ctx.fillStyle = '#64748b';
    ctx.fillText(String(totals[letter]), x, y + 10);
  });

  return canvas.toDataURL('image/png');
}

function addPdfFooters(doc, pageWidth, pageHeight, margin) {
  const pdf = getLocaleData().pdf;
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      pdf.pageOf.replace('{current}', String(i)).replace('{total}', String(pageCount)),
      pageWidth / 2,
      pageHeight - margin / 2,
      { align: 'center' }
    );
  }
}

function downloadRiasecPdf(scores, personName) {
  if (!window.jspdf?.jsPDF) {
    alert(t('ui.pdfNotLoaded'));
    return;
  }

  const pdf = getLocaleData().pdf;
  const typeInfo = getTypeInfo();
  const { breakdown, totals, hollandCode, topThree } = scores;
  const maxScores = getMaxPossibleScores();
  const { jsPDF } = window.jspdf;
  const name = typeof personName === 'string' ? personName.trim() : '';

  const top1 = topThree[0];
  const top2 = topThree[1] ?? topThree[0];
  const top3 = topThree[2] ?? topThree[1] ?? topThree[0];
  const gap = totals[top1] - (totals[top3] ?? 0);
  const placeholders = { hollandCode, top1, top2, top3, gap };

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - 2 * margin;
  const footerReserve = 14;
  let y = margin;

  function ensureSpace(needed) {
    if (y + needed > pageHeight - footerReserve) {
      doc.addPage();
      y = margin;
    }
  }

  function heading(text, size, extraNeeded) {
    const headingH = size * 0.45 + 6;
    ensureSpace(headingH + (extraNeeded || 0));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(15, 23, 42);
    doc.text(text, margin, y);
    y += headingH;
  }

  function subheading(text) {
    heading(text, 12, 16);
  }

  function bodyText(text, size) {
    if (!text) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line) => {
      ensureSpace(6);
      doc.text(line, margin, y);
      y += 5;
    });
    y += 3.5;
  }

  const headerH = name ? 44 : 38;
  doc.setFillColor(13, 148, 136);
  doc.rect(0, 0, pageWidth, headerH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(pdf.title, margin, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(pdf.subtitle, margin, 24);
  if (name) {
    const prepared = (pdf.preparedFor || '{name}').replaceAll('{name}', name);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(prepared, margin, 34);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(pdf.createdOn.replace('{date}', formatDate(new Date())), pageWidth - margin, 34, { align: 'right' });
  } else {
    doc.text(pdf.createdOn.replace('{date}', formatDate(new Date())), pageWidth - margin, 24, { align: 'right' });
  }

  y = headerH + 12;

  heading(pdf.hollandCode, 15, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  let codeX = margin;
  hollandCode.split('').forEach((letter) => {
    doc.setTextColor(...hexToRgb(typeInfo[letter].color));
    doc.text(letter, codeX, y);
    codeX += 13;
  });
  y += 10;
  const codeNames = topThree
    .map((letter) => `${letter} (${typeInfo[letter].nameLocal}, ${totals[letter]} ${t('ui.points')})`)
    .join('  ·  ');
  bodyText(codeNames, 10);
  bodyText(describeCombination(topThree), 10);

  const chartSize = 82;
  heading(pdf.preferenceProfile, 14, chartSize + 16);
  const chartDataUrl = buildHexagonChartDataUrl(totals, 400);
  doc.addImage(chartDataUrl, 'PNG', (pageWidth - chartSize) / 2, y, chartSize, chartSize);
  y += chartSize + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const captionLines = doc.splitTextToSize(t('ui.chartCaption'), contentWidth);
  captionLines.forEach((line) => {
    ensureSpace(5);
    doc.text(line, pageWidth / 2, y, { align: 'center' });
    y += 4.2;
  });
  y += 8;

  const colWidths = [48, 22, 22, 22, 22, 22];
  const tableWidth = colWidths.reduce((sum, w) => sum + w, 0);
  const headerHeight = 11;
  const rowHeight = 8;
  const tableBlock = 10 + headerHeight + rowHeight * TYPES.length + 4;

  heading(pdf.detailTitle, 14, tableBlock);
  const tableTop = y;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, tableTop, tableWidth, headerHeight, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);

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
    const [r, g, blue] = hexToRgb(info.color);

    if (isTop) {
      const mix = 0.14;
      doc.setFillColor(
        Math.round(r * mix + 255 * (1 - mix)),
        Math.round(g * mix + 255 * (1 - mix)),
        Math.round(blue * mix + 255 * (1 - mix))
      );
      doc.setDrawColor(226, 232, 240);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
    }
    doc.rect(margin, y, tableWidth, rowHeight, 'FD');
    if (isTop) {
      doc.setFillColor(r, g, blue);
      doc.rect(margin, y, 1.6, rowHeight, 'F');
    }

    colX = margin;
    doc.setFont('helvetica', isTop ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${letter} — ${info.nameLocal}`, colX + 3.2, y + 5.5);

    const values = [b.taetigkeiten, b.faehigkeiten, b.berufe, b.selbst, totals[letter]];
    values.forEach((val, i) => {
      colX += colWidths[i];
      doc.setFont('helvetica', i === 4 ? 'bold' : 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(String(val), colX + colWidths[i + 1] / 2, y + 5.5, { align: 'center' });
    });

    y += rowHeight;
  });

  y += 10;

  const howToRead = applyPdfPlaceholders(pdf.howToRead || pdf.theoryParagraph, placeholders);
  heading(pdf.interpretation, 14, 48);
  subheading(pdf.howToReadTitle);
  bodyText(howToRead, 10);
  if (gap <= 5) {
    bodyText(applyPdfPlaceholders(pdf.gapNote, placeholders), 10);
  }

  topThree.forEach((letter, i) => {
    const info = typeInfo[letter];
    const typeHeading = (pdf.typeHeading || '{rank}. {letter} — {name} ({score})')
      .replaceAll('{rank}', String(i + 1))
      .replaceAll('{letter}', info.letter)
      .replaceAll('{name}', info.nameLocal)
      .replaceAll('{score}', `${totals[letter]} ${t('ui.points')}`);
    const typeBody = `${info.description} ${pdf.exampleJobs} ${info.examples.slice(0, 4).join(', ')}.`;
    heading(typeHeading, 12, 20);
    bodyText(typeBody, 10);
  });

  heading(pdf.nextStepsTitle || pdf.interpretation, 13, 18);
  bodyText(applyPdfPlaceholders(pdf.discussNote, placeholders), 10);

  addPdfFooters(doc, pageWidth, pageHeight, margin);

  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = name ? `-${name.replace(/[\\/:*?"<>|]+/g, '').slice(0, 40)}` : '';
  doc.save(`${pdf.filename}${safeName}-${dateStr}.pdf`);
}
