/**
 * Client-side PDF export for RIASEC results (A4, print-ready).
 * Requires jsPDF + embedded Unicode fonts (DejaVu / Vazirmatn).
 */

const HEX_CHART_SCALE_MAX = 50;
const HEX_ORDER = ['E', 'C', 'R', 'I', 'A', 'S'];

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

/**
 * Prepare Persian/Arabic for jsPDF.
 * Modern Unicode TTF embedding (Vazirmatn) lets PDF viewers apply OpenType shaping
 * and bidi on logical text. Manual presentation-form reshape + reverse breaks joining.
 */
function prepareRtlLine(text) {
  if (!text) return '';
  return text;
}

/**
 * High-contrast RIASEC hexagon for PDF (fixed 0–50 scale).
 * @param {Record<string, number>} totals
 * @param {number} pixelSize
 * @param {{ typeInfo?: object, legendIdeas?: string, legendPeople?: string }} [opts]
 */
function buildHexagonChartDataUrl(totals, pixelSize, opts) {
  const options = opts || {};
  const typeInfo = options.typeInfo || (typeof getTypeInfo === 'function' ? getTypeInfo() : null);
  const canvas = document.createElement('canvas');
  canvas.width = pixelSize;
  canvas.height = pixelSize;
  const ctx = canvas.getContext('2d');
  const cx = pixelSize / 2;
  const cy = pixelSize / 2;
  const radius = pixelSize * 0.32;
  const scaleMax = HEX_CHART_SCALE_MAX;
  const angles = HEX_ORDER.map((_, i) => Math.PI / 2 + (i * Math.PI) / 3);

  function point(angle, r) {
    return [cx + r * Math.cos(angle), cy - r * Math.sin(angle)];
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, pixelSize, pixelSize);

  // Soft outer plate
  ctx.beginPath();
  angles.forEach((a, i) => {
    const [x, y] = point(a, radius * 1.02);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = Math.max(2, pixelSize * 0.004);
  ctx.stroke();

  [0.25, 0.5, 0.75, 1].forEach((level, idx) => {
    ctx.beginPath();
    angles.forEach((a, i) => {
      const [x, y] = point(a, radius * level);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = idx === 3 ? '#94a3b8' : '#cbd5e1';
    ctx.lineWidth = idx === 3 ? Math.max(2, pixelSize * 0.0035) : Math.max(1.25, pixelSize * 0.0025);
    ctx.stroke();
  });

  angles.forEach((a) => {
    const [x, y] = point(a, radius);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = Math.max(1.25, pixelSize * 0.0025);
    ctx.stroke();
  });

  const dataPoints = HEX_ORDER.map((letter, i) => {
    const score = Number(totals[letter]) || 0;
    const r = Math.min(1, Math.max(0, score / scaleMax)) * radius;
    return point(angles[i], r);
  });

  ctx.beginPath();
  dataPoints.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(13, 148, 136, 0.32)';
  ctx.fill();
  ctx.strokeStyle = '#0f766e';
  ctx.lineWidth = Math.max(3, pixelSize * 0.0055);
  ctx.stroke();

  // Vertices
  dataPoints.forEach(([x, y], i) => {
    const letter = HEX_ORDER[i];
    const color = typeInfo?.[letter]?.color || '#0d9488';
    ctx.beginPath();
    ctx.arc(x, y, Math.max(4.5, pixelSize * 0.012), 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2.5, pixelSize * 0.004);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, Math.max(2.2, pixelSize * 0.006), 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  HEX_ORDER.forEach((letter, i) => {
    const [x, y] = point(angles[i], radius + pixelSize * 0.085);
    const color = typeInfo?.[letter]?.color || '#0f172a';
    const letterSize = Math.round(pixelSize * 0.048);
    const scoreSize = Math.round(pixelSize * 0.034);
    ctx.font = `700 ${letterSize}px "Segoe UI", "Helvetica Neue", sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(letter, x, y - scoreSize * 0.55);
    ctx.font = `600 ${scoreSize}px "Segoe UI", "Helvetica Neue", sans-serif`;
    ctx.fillStyle = '#334155';
    ctx.fillText(String(totals[letter] ?? 0), x, y + letterSize * 0.55);
  });

  // Axis legends (compact)
  const legendIdeas = options.legendIdeas || '';
  const legendPeople = options.legendPeople || '';
  if (legendIdeas || legendPeople) {
    const legendSize = Math.max(11, Math.round(pixelSize * 0.022));
    ctx.font = `500 ${legendSize}px "Segoe UI", "Helvetica Neue", sans-serif`;
    ctx.fillStyle = '#64748b';
    if (legendIdeas) {
      ctx.textAlign = 'center';
      ctx.fillText(legendIdeas, cx, pixelSize * 0.045);
    }
    if (legendPeople) {
      ctx.save();
      ctx.translate(pixelSize * 0.04, cy);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText(legendPeople, 0, 0);
      ctx.restore();
    }
  }

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
    const opts = { ...(options || {}) };
    const draw = isRtl ? prepareRtlLine(text) : text;
    if (!isRtl) {
      doc.text(draw, x, yy, opts);
      return;
    }
    if (opts.align === 'center') {
      doc.text(draw, x, yy, opts);
      return;
    }
    if (opts.cell) {
      delete opts.cell;
      doc.text(draw, x, yy, { ...opts, align: 'left' });
      return;
    }
    const edge = opts.rtlEdge != null ? opts.rtlEdge : rightX;
    delete opts.rtlEdge;
    doc.text(draw, edge, yy, { ...opts, align: 'right' });
  }

  function ensureSpace(needed) {
    if (y + needed > pageHeight - footerReserve) {
      doc.addPage();
      y = margin;
    }
  }

  function sectionGap(extra) {
    y += extra == null ? 6 : extra;
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

  function labeledList(label, items, size, contentLeft, contentRight, opts) {
    if (!items || !items.length) return;
    const options = opts || {};
    const cLeft = contentLeft == null ? leftX : contentLeft;
    const cRight = contentRight == null ? rightX : contentRight;
    const width = cRight - cLeft;
    setFace('bold', size, [30, 41, 59]);
    if (!options.noEnsure) ensureSpace(8);
    if (isRtl) drawText(label, cLeft, y, { rtlEdge: cRight });
    else drawText(label, cLeft, y);
    y += 5;
    setFace('normal', size, [51, 65, 85]);
    const bullet = '• ';
    items.forEach((item) => {
      const line = `${bullet}${item}`;
      const wrapped = doc.splitTextToSize(line, Math.max(20, width - 2));
      wrapped.forEach((w) => {
        if (!options.noEnsure) ensureSpace(6);
        if (isRtl) drawText(w, cLeft, y, { rtlEdge: cRight });
        else drawText(w, cLeft + 2, y);
        y += 4.8;
      });
    });
    y += 2.5;
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
    const descLines = doc.splitTextToSize(info.description || '', contentWidth - 12);
    const listLines = (items) => items.reduce((n, item) => {
      return n + doc.splitTextToSize(`• ${item}`, contentWidth - 14).length;
    }, 0);
    const industriesLabel = pdf.industriesLabel || t('ui.industriesLabel') || 'Industries:';
    const jobsLabel = pdf.jobsLabel || pdf.exampleJobs || t('ui.exampleJobs') || 'Example occupations:';
    const blockH = 14
      + descLines.length * 5 + 3
      + (industries.length ? 5 + listLines(industries) * 4.8 + 2.5 : 0)
      + (examples.length ? 5 + listLines(examples) * 4.8 + 2.5 : 0)
      + 6;

    ensureSpace(Math.min(blockH + 4, 70));
    const blockTop = y;
    const pad = 4;
    const innerLeft = leftX + pad + 2;
    const innerRight = rightX - pad;

    // Background first so text paints on top
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.35);
    doc.roundedRect(leftX, blockTop, contentWidth, blockH, 1.5, 1.5, 'FD');
    doc.setFillColor(241, 245, 249);
    doc.rect(leftX + 0.35, blockTop + 0.35, contentWidth - 0.7, 11, 'F');
    doc.setFillColor(r, g, blue);
    doc.rect(isRtl ? rightX - 2.2 : leftX, blockTop + 1.2, 2.2, 9, 'F');

    y = blockTop + 8;
    setFace('bold', 12, [15, 23, 42]);
    if (isRtl) drawText(typeHeading, innerLeft, y, { rtlEdge: innerRight });
    else drawText(typeHeading, innerLeft, y);
    y += 8;

    setFace('normal', 10, [51, 65, 85]);
    descLines.forEach((line) => {
      if (isRtl) drawText(line, innerLeft, y, { rtlEdge: innerRight });
      else drawText(line, innerLeft, y);
      y += 5;
    });
    y += 2.5;

    labeledList(industriesLabel, industries, 9.5, innerLeft, innerRight, { noEnsure: true });
    labeledList(jobsLabel, examples, 9.5, innerLeft, innerRight, { noEnsure: true });

    y = Math.max(y, blockTop + blockH) + 7;
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
    if (isRtl) {
      drawText(created, leftX, 34, { cell: true });
    } else {
      doc.text(created, rightX, 34, { align: 'right' });
    }
  } else {
    const created = pdf.createdOn.replace('{date}', formatDate(new Date()));
    if (isRtl) {
      drawText(created, leftX, 24, { cell: true });
    } else {
      doc.text(created, rightX, 24, { align: 'right' });
    }
  }

  y = headerH + 14;

  // --- Section 1: Holland code ---
  heading(pdf.hollandCode, 15, 30);
  setFace('bold', 28);
  if (isRtl) {
    let codeX = rightX;
    hollandCode.split('').forEach((letter) => {
      doc.setTextColor(...hexToRgb(typeInfo[letter].color));
      doc.text(letter, codeX, y, { align: 'right' });
      codeX -= 14;
    });
  } else {
    let codeX = leftX;
    hollandCode.split('').forEach((letter) => {
      doc.setTextColor(...hexToRgb(typeInfo[letter].color));
      doc.text(letter, codeX, y);
      codeX += 14;
    });
  }
  y += 11;
  const codeNames = topThree
    .map((letter) => `${letter} (${typeInfo[letter].nameLocal}, ${totals[letter]} ${t('ui.points')})`)
    .join('  ·  ');
  bodyText(codeNames, 10);
  bodyText(describeCombination(topThree), 10);
  sectionGap(4);

  // --- Section 2: Preference profile chart ---
  const chartSize = 105;
  heading(pdf.preferenceProfile, 14, chartSize + 22);
  const chartDataUrl = buildHexagonChartDataUrl(totals, 640, {
    typeInfo,
    legendIdeas: t('ui.chartLegendIdeas'),
    legendPeople: t('ui.chartLegendPeople'),
  });
  doc.addImage(chartDataUrl, 'PNG', (pageWidth - chartSize) / 2, y, chartSize, chartSize);
  y += chartSize + 5;
  setFace('normal', 8, [100, 116, 139]);
  const captionLines = doc.splitTextToSize(t('ui.chartCaption'), contentWidth);
  captionLines.forEach((line) => {
    ensureSpace(5);
    drawText(line, pageWidth / 2, y, { align: 'center' });
    y += 4.2;
  });
  sectionGap(10);

  // --- Section 3: Detail table ---
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
      const accentX = isRtl ? margin + colWidths[0] - 1.6 : margin;
      doc.rect(accentX, y, 1.6, rowHeight, 'F');
    }

    colX = margin;
    setFace(isTop ? 'bold' : 'normal', 8.5, [15, 23, 42]);
    const catLabel = `${letter} — ${info.nameLocal}`;
    drawText(catLabel, colX + 3.2, y + 5.5, { cell: true });

    const values = [b.taetigkeiten, b.faehigkeiten, b.berufe, b.selbst, totals[letter]];
    values.forEach((val, i) => {
      colX += colWidths[i];
      setFace(i === 4 ? 'bold' : 'normal', 8.5, [15, 23, 42]);
      doc.text(String(val), colX + colWidths[i + 1] / 2, y + 5.5, { align: 'center' });
    });

    y += rowHeight;
  });

  sectionGap(12);

  // --- Section 4: Interpretation ---
  const howToRead = applyPdfPlaceholders(pdf.howToRead || pdf.theoryParagraph, placeholders);
  heading(pdf.interpretation, 14, 48);
  subheading(pdf.howToReadTitle);
  bodyText(howToRead, 10);
  if (gap <= 5) {
    bodyText(applyPdfPlaceholders(pdf.gapNote, placeholders), 10);
  }

  sectionGap(4);
  topThree.forEach((letter, i) => {
    typeBlock(letter, i + 1);
  });

  sectionGap(2);
  heading(pdf.nextStepsTitle || pdf.interpretation, 13, 18);
  bodyText(applyPdfPlaceholders(pdf.discussNote, placeholders), 10);

  addPdfFooters(doc, pageWidth, pageHeight, margin, fontFamily, isRtl);

  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = name ? `-${name.replace(/[\\/:*?"<>|]+/g, '').slice(0, 40)}` : '';
  doc.save(`${pdf.filename}${safeName}-${dateStr}.pdf`);
}
