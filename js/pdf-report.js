/**
 * Client-side PDF export for RIASEC results (A4, print-ready).
 * Requires jsPDF + embedded Unicode fonts (DejaVu / Vazirmatn) and optional Persian reshaper.
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

function getPdfFontFamily(locale) {
  return locale === 'fa' ? 'Vazirmatn' : 'DejaVuSans';
}

function registerPdfFonts(doc, locale) {
  const family = getPdfFontFamily(locale);
  if (family === 'Vazirmatn') {
    if (!window.RIASEC_FONT_VAZIR_NORMAL || !window.RIASEC_FONT_VAZIR_BOLD) {
      throw new Error('Vazirmatn font data missing');
    }
    doc.addFileToVFS('Vazirmatn-Regular.ttf', window.RIASEC_FONT_VAZIR_NORMAL);
    doc.addFont('Vazirmatn-Regular.ttf', 'Vazirmatn', 'normal');
    doc.addFileToVFS('Vazirmatn-Bold.ttf', window.RIASEC_FONT_VAZIR_BOLD);
    doc.addFont('Vazirmatn-Bold.ttf', 'Vazirmatn', 'bold');
  } else {
    if (!window.RIASEC_FONT_DEJAVU_NORMAL || !window.RIASEC_FONT_DEJAVU_BOLD) {
      throw new Error('DejaVu font data missing');
    }
    doc.addFileToVFS('DejaVuSans.ttf', window.RIASEC_FONT_DEJAVU_NORMAL);
    doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
    doc.addFileToVFS('DejaVuSans-Bold.ttf', window.RIASEC_FONT_DEJAVU_BOLD);
    doc.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold');
  }
  return family;
}

/** Shape + reverse for jsPDF visual RTL (Persian/Arabic). */
function prepareRtlLine(text) {
  if (!text) return '';
  let shaped = text;
  if (window.PersianShaper && typeof window.PersianShaper.convertArabic === 'function') {
    shaped = window.PersianShaper.convertArabic(text);
  }
  return shaped.split('').reverse().join('');
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

function addPdfFooters(doc, pageWidth, pageHeight, margin, fontFamily, isRtl) {
  const pdf = getLocaleData().pdf;
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const label = pdf.pageOf.replace('{current}', String(i)).replace('{total}', String(pageCount));
    const draw = isRtl ? prepareRtlLine(label) : label;
    doc.text(draw, pageWidth / 2, pageHeight - margin / 2, { align: 'center' });
  }
}

function downloadRiasecPdf(scores, personName) {
  if (!window.jspdf?.jsPDF) {
    alert(t('ui.pdfNotLoaded'));
    return;
  }

  const locale = typeof getLocale === 'function' ? getLocale() : 'en';
  const localeData = getLocaleData();
  const pdf = localeData.pdf;
  const typeInfo = getTypeInfo();
  const isRtl = localeData.meta?.dir === 'rtl' || locale === 'fa';
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
  let fontFamily;
  try {
    fontFamily = registerPdfFonts(doc, locale);
  } catch (err) {
    console.error(err);
    alert(t('ui.pdfNotLoaded'));
    return;
  }

  const margin = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - 2 * margin;
  const footerReserve = 14;
  const leftX = margin;
  const rightX = pageWidth - margin;
  let y = margin;

  function setFace(style, size, color) {
    doc.setFont(fontFamily, style);
    doc.setFontSize(size);
    if (color) doc.setTextColor(...color);
  }

  function drawText(text, x, yy, options) {
    const opts = options || {};
    const draw = isRtl ? prepareRtlLine(text) : text;
    if (isRtl && !opts.align) {
      doc.text(draw, rightX, yy, { ...opts, align: 'right' });
    } else if (isRtl && opts.align === 'center') {
      doc.text(draw, x, yy, opts);
    } else if (isRtl && opts.align === 'left') {
      doc.text(draw, x, yy, { ...opts, align: 'left' });
    } else {
      doc.text(draw, x, yy, opts);
    }
  }

  function ensureSpace(needed) {
    if (y + needed > pageHeight - footerReserve) {
      doc.addPage();
      y = margin;
    }
  }

  function heading(text, size, extraNeeded) {
    const headingH = size * 0.45 + 6;
    ensureSpace(headingH + (extraNeeded || 0));
    setFace('bold', size, [15, 23, 42]);
    drawText(text, leftX, y);
    y += headingH;
  }

  function subheading(text) {
    heading(text, 12, 16);
  }

  function bodyText(text, size) {
    if (!text) return;
    setFace('normal', size, [51, 65, 85]);
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line) => {
      ensureSpace(6);
      drawText(line, leftX, y);
      y += 5;
    });
    y += 3.5;
  }

  function labeledList(label, items, size) {
    if (!items || !items.length) return;
    setFace('bold', size, [30, 41, 59]);
    ensureSpace(8);
    drawText(label, leftX, y);
    y += 5;
    setFace('normal', size, [51, 65, 85]);
    const bullet = isRtl ? ' •' : '• ';
    items.forEach((item) => {
      const line = isRtl ? `${item}${bullet}` : `${bullet}${item}`;
      const wrapped = doc.splitTextToSize(line, contentWidth - 2);
      wrapped.forEach((w) => {
        ensureSpace(6);
        drawText(w, leftX + (isRtl ? 0 : 2), y);
        y += 4.8;
      });
    });
    y += 3;
  }

  function typeBlock(letter, rank) {
    const info = typeInfo[letter];
    const [r, g, blue] = hexToRgb(info.color);
    const typeHeading = (pdf.typeHeading || '{rank}. {letter} — {name} ({score})')
      .replaceAll('{rank}', String(rank))
      .replaceAll('{letter}', info.letter)
      .replaceAll('{name}', info.nameLocal)
      .replaceAll('{score}', `${totals[letter]} ${t('ui.points')}`);

    const industries = Array.isArray(info.industries) ? info.industries : [];
    const examples = Array.isArray(info.examples) ? info.examples : [];
    const estHeight = 28 + Math.ceil((info.description || '').length / 90) * 5
      + industries.length * 5 + examples.length * 5;
    ensureSpace(Math.min(estHeight, 55));

    const blockTop = y - 2;
    const pad = 4;
    // Soft background + accent bar; height filled after measuring content start
    const contentStartY = y;

    setFace('bold', 12, [15, 23, 42]);
    drawText(typeHeading, leftX + 3, y + 4);
    y += 10;

    doc.setFillColor(r, g, blue);
    doc.rect(leftX, contentStartY, 1.8, 8, 'F');

    bodyText(info.description, 10);

    const industriesLabel = pdf.industriesLabel || t('ui.industriesLabel') || 'Industries:';
    const jobsLabel = pdf.jobsLabel || pdf.exampleJobs || t('ui.exampleJobs') || 'Example occupations:';
    labeledList(industriesLabel, industries, 9.5);
    labeledList(jobsLabel, examples, 9.5);

    const blockBottom = y + 1;
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    // Draw background behind by re-drawing a light rect is awkward after text;
    // use a bottom rule and spacing instead for clear separation.
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(leftX, blockBottom, rightX, blockBottom);
    y = blockBottom + 8;

    void blockTop;
    void pad;
  }

  const headerH = name ? 44 : 38;
  doc.setFillColor(13, 148, 136);
  doc.rect(0, 0, pageWidth, headerH, 'F');
  doc.setTextColor(255, 255, 255);
  setFace('bold', 20);
  drawText(pdf.title, leftX, 16);
  setFace('normal', 10);
  drawText(pdf.subtitle, leftX, 24);
  if (name) {
    const prepared = (pdf.preparedFor || '{name}').replaceAll('{name}', name);
    setFace('bold', 11);
    drawText(prepared, leftX, 34);
    setFace('normal', 9);
    const created = pdf.createdOn.replace('{date}', formatDate(new Date()));
    const createdDraw = isRtl ? prepareRtlLine(created) : created;
    doc.text(createdDraw, isRtl ? leftX : rightX, 34, { align: isRtl ? 'left' : 'right' });
  } else {
    const created = pdf.createdOn.replace('{date}', formatDate(new Date()));
    const createdDraw = isRtl ? prepareRtlLine(created) : created;
    doc.text(createdDraw, isRtl ? leftX : rightX, 24, { align: isRtl ? 'left' : 'right' });
  }

  y = headerH + 12;

  heading(pdf.hollandCode, 15, 28);
  setFace('bold', 26);
  if (isRtl) {
    let codeX = rightX;
    hollandCode.split('').reverse().forEach((letter) => {
      doc.setTextColor(...hexToRgb(typeInfo[letter].color));
      doc.text(letter, codeX, y, { align: 'right' });
      codeX -= 13;
    });
  } else {
    let codeX = leftX;
    hollandCode.split('').forEach((letter) => {
      doc.setTextColor(...hexToRgb(typeInfo[letter].color));
      doc.text(letter, codeX, y);
      codeX += 13;
    });
  }
  y += 10;
  const codeNames = topThree
    .map((letter) => `${letter} (${typeInfo[letter].nameLocal}, ${totals[letter]} ${t('ui.points')})`)
    .join(isRtl ? '  ·  ' : '  ·  ');
  bodyText(codeNames, 10);
  bodyText(describeCombination(topThree), 10);

  const chartSize = 82;
  heading(pdf.preferenceProfile, 14, chartSize + 16);
  const chartDataUrl = buildHexagonChartDataUrl(totals, 400);
  doc.addImage(chartDataUrl, 'PNG', (pageWidth - chartSize) / 2, y, chartSize, chartSize);
  y += chartSize + 6;
  setFace('normal', 8, [100, 116, 139]);
  const captionLines = doc.splitTextToSize(t('ui.chartCaption'), contentWidth);
  captionLines.forEach((line) => {
    ensureSpace(5);
    drawText(line, pageWidth / 2, y, { align: 'center' });
    y += 4.2;
  });
  y += 10;

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

  setFace('bold', 7, [71, 85, 105]);

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
    const draw = isRtl ? prepareRtlLine(label) : label;
    if (i === 0) {
      doc.text(draw, colX + 2, tableTop + 6);
    } else {
      doc.text(draw, colX + colWidths[i] / 2, tableTop + 4, { align: 'center' });
      doc.setFontSize(6);
      const maxDraw = isRtl ? prepareRtlLine(maxLabels[i]) : maxLabels[i];
      doc.text(maxDraw, colX + colWidths[i] / 2, tableTop + 8, { align: 'center' });
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
    setFace(isTop ? 'bold' : 'normal', 8.5, [15, 23, 42]);
    const catLabel = `${letter} — ${info.nameLocal}`;
    drawText(catLabel, colX + 3.2, y + 5.5);

    const values = [b.taetigkeiten, b.faehigkeiten, b.berufe, b.selbst, totals[letter]];
    values.forEach((val, i) => {
      colX += colWidths[i];
      setFace(i === 4 ? 'bold' : 'normal', 8.5, [15, 23, 42]);
      doc.text(String(val), colX + colWidths[i + 1] / 2, y + 5.5, { align: 'center' });
    });

    y += rowHeight;
  });

  y += 12;

  const howToRead = applyPdfPlaceholders(pdf.howToRead || pdf.theoryParagraph, placeholders);
  heading(pdf.interpretation, 14, 48);
  subheading(pdf.howToReadTitle);
  bodyText(howToRead, 10);
  if (gap <= 5) {
    bodyText(applyPdfPlaceholders(pdf.gapNote, placeholders), 10);
  }

  y += 2;
  topThree.forEach((letter, i) => {
    typeBlock(letter, i + 1);
  });

  y += 2;
  heading(pdf.nextStepsTitle || pdf.interpretation, 13, 18);
  bodyText(applyPdfPlaceholders(pdf.discussNote, placeholders), 10);

  addPdfFooters(doc, pageWidth, pageHeight, margin, fontFamily, isRtl);

  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = name ? `-${name.replace(/[\\/:*?"<>|]+/g, '').slice(0, 40)}` : '';
  doc.save(`${pdf.filename}${safeName}-${dateStr}.pdf`);
}
