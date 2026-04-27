let hiperK = null;
let hiperAllPairs = [];
let hiperUserPairs = [];
let hiperCanvas = null;
let hiperCtx = null;
let hiperTaskFinished = false;
let hiperHintRevealed = false;

//перевірка, чи є введена пара частиною множини розв'язків
const hiperPairInSolution = (x, y) =>
  hiperAllPairs.some(([a, b]) => a === x && b === y);

const refreshHiperPairsDisplay = () => {
  const pairsDisplay = qs('#hiperPairsDisplay');
  if (!pairsDisplay) return;
  pairsDisplay.innerHTML = hiperUserPairs
    .map((p, idx) => {
      const { x, y, onCurve } = p;
      const ok = onCurve && hiperPairInSolution(x, y);
      const color = ok ? '#10b981' : '#ef4444';
      return `
        <div style="margin: 4px 0; padding: 4px; background: var(--card-bg); border-radius: 4px; color: ${color}; font-weight: 600; display: flex; gap: 8px;">
          <span>${idx + 1}.</span>
          <math><mo>(</mo><mn>${x}</mn><mo>,</mo><mn>${y}</mn><mo>)</mo></math>
        </div>`;
    })
    .join('');
};

//перевірка пар і додавання їх до масиву користувача
const tryAppendHiperInputPair = () => {
  const userX = qs('#hiperUserX');
  const userY = qs('#hiperUserY');
  if (!userX || !userY || hiperK === null) return false;
  if (userX.value.trim() === '' || userY.value.trim() === '') return false;

  const x = Number(userX.value);
  const y = Number(userY.value);

  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isInteger(x) || !Number.isInteger(y)) {
    return false;
  }

  if (hiperUserPairs.some((p) => p.x === x && p.y === y)) {
    return false;
  }

  const onCurve = x * y === hiperK;
  hiperUserPairs.push({ x, y, onCurve });
  userX.value = '';
  userY.value = '';
  return true;
};

const getHiperDifficulty = () => {
  const r = document.querySelector('input[name="hiperDifficulty"]:checked');
  return r ? r.value : 'medium';
};

//генерація завдання 
const generateHiperTask = (difficulty) => {
  const level = difficulty || getHiperDifficulty();
  let minV, maxV;
  switch (level) {
    case 'easy': minV = 1; maxV = 5; break;
    case 'hard': minV = 9; maxV = 11; break;
    case 'medium':
    default: minV = 6; maxV = 8; break;
  }
  
  const span = maxV - minV + 1;
  const x = Math.floor(Math.random() * span) + minV;
  const y = Math.floor(Math.random() * span) + minV;
  const k = x * y;
  
  const allPairs = findAllHiperPairs(k);
  return { k, allPairs };
};

//знаходження всіх цілих дільників числа k для формування пар (x,y).
const findAllHiperPairs = (k) => {
  const pairs = [];
  const seen = new Set();

  if (k === 0) {
    for (let x = -15; x <= 15; x += 1) {
      if (x !== 0) {
        const key1 = `${x},0`;
        if (!seen.has(key1)) { pairs.push([x, 0]); seen.add(key1); }
      }
    }
    for (let y = -15; y <= 15; y += 1) {
      if (y !== 0) {
        const key2 = `0,${y}`;
        if (!seen.has(key2)) { pairs.push([0, y]); seen.add(key2); }
      }
    }
    pairs.push([0, 0]);
  } else {
    const absK = Math.abs(k);
    const divisors = new Set();

    for (let i = 1; i * i <= absK; i += 1) {
      if (absK % i === 0) {
        divisors.add(i);
        divisors.add(absK / i);
      }
    }

    divisors.forEach((d) => {
      const yVal = k / d;
      const variants = [[d, yVal], [-d, -yVal]];

      variants.forEach(([xv, yv]) => {
        const key = `${xv},${yv}`;
        if (!seen.has(key)) {
          pairs.push([xv, yv]);
          seen.add(key);
        }
      });
    });
  }

  return pairs.sort((a, b) => {
    if (a[0] !== b[0]) return a[0] - b[0];
    return a[1] - b[1];
  });
};

//малювання точки на canvas
const drawPointLabel = (ctx, px, py, x, y, width, height, minMargin, color) => {
  const labelText = `(${x}, ${y})`;
  ctx.font = '11px Inter';
  const textWidth = ctx.measureText(labelText).width;
  const textHeight = 11;
  const offset = 8;

  let labelX = (px > width - textWidth - offset - minMargin) ? px - textWidth - offset : px + offset;
  let labelY = (py < textHeight + offset + minMargin) ? py + offset + textHeight : py - offset;

  if (labelX >= minMargin && labelX + textWidth <= width - minMargin && labelY >= textHeight + minMargin && labelY <= height - minMargin) {
    ctx.fillStyle = color;
    ctx.fillText(labelText, labelX, labelY);
  }
};

//малювання системи координат, сітки, і асимптот гіперболи
const drawHiperPlane = () => {
  if (!hiperCanvas || !hiperCtx) return;

  const canvas = hiperCanvas;
  const ctx = hiperCtx;
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  
  let maxVal = 10;
  if (hiperAllPairs && hiperAllPairs.length > 0) {
    const maxPairVal = Math.max(...hiperAllPairs.map(([x, y]) => Math.max(Math.abs(x), Math.abs(y))));
    maxVal = Math.max(maxVal, maxPairVal);
  } else if (hiperK !== null && hiperK !== 0) {
    maxVal = Math.max(maxVal, Math.abs(hiperK));
  }
  
  //15% відступу від країв полотна
  maxVal = Math.ceil(maxVal * 1.15);
  
  const plotScale = (Math.min(centerX, centerY) - 10) / maxVal;

  let unitStep = 1;
  if (maxVal > 40) unitStep = 10;
  else if (maxVal > 20) unitStep = 5;
  else if (maxVal > 10) unitStep = 2;

  const gridStepPixels = unitStep * plotScale;
  const axisColor = getComputedStyle(document.body).getPropertyValue('--viz-axis-color').trim() || '#60a5fa';

  //очищення
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg') || '#0b172e';
  ctx.fillRect(0, 0, width, height);

  //сітка
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border') || '#334155';
  ctx.lineWidth = 0.5;

  //вертикальні лінії
  for (let i = 0; i <= Math.floor(centerX / gridStepPixels); i += 1) {
    const xRight = centerX + i * gridStepPixels;
    const xLeft = centerX - i * gridStepPixels;
    ctx.beginPath(); ctx.moveTo(xRight, 0); ctx.lineTo(xRight, height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xLeft, 0); ctx.lineTo(xLeft, height); ctx.stroke();
  }

  //горизонтальні лінії
  for (let i = 0; i <= Math.floor(centerY / gridStepPixels); i += 1) {
    const yBottom = centerY + i * gridStepPixels;
    const yTop = centerY - i * gridStepPixels;
    ctx.beginPath(); ctx.moveTo(0, yBottom); ctx.lineTo(width, yBottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, yTop); ctx.lineTo(width, yTop); ctx.stroke();
  }

  //осі x та y
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); ctx.stroke();

  ctx.fillStyle = 'black';
  ctx.font = '12px Inter';
  ctx.fillText('x', width - 20, centerY - 5);
  ctx.fillText('y', centerX + 5, 15);
  ctx.fillText('0', centerX - 15, centerY + 15);

  //малювання гіперболи
  if (hiperK !== null) {
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    if (hiperK !== 0) {
      const maxX = (width / 2) / plotScale;
      const step = Math.max(0.05, 1 / plotScale); 

      const drawBranch = (startX, endX) => {
        ctx.beginPath();
        let moved = false;
        for (let xv = startX; xv <= endX; xv += step) {
          if (Math.abs(xv) < 0.05) continue;
          
          const yv = hiperK / xv;
          const px = centerX + xv * plotScale;
          const py = centerY - yv * plotScale;
          
          if (py < -100 || py > height + 100) continue;

          if (!moved) {
            ctx.moveTo(px, py);
            moved = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      };

      drawBranch(-maxX, -0.05); //Від'ємна гілка по x
      drawBranch(0.05, maxX);   //Додатня гілка по x
    }
    ctx.setLineDash([]);
  }

  const viewMargin = 5;
  //малювання точок, які введені користувачем
  if (hiperUserPairs && hiperUserPairs.length > 0) {
    hiperUserPairs.forEach((p) => {
      const { x, y } = p;
      const isCorrect = p.onCurve && hiperPairInSolution(x, y);

      const px = centerX + x * plotScale;
      const py = centerY - y * plotScale;

      if (!isFinite(px) || !isFinite(py) || isNaN(px) || isNaN(py)) return;

      const color = isCorrect ? '#018257' : '#ef4444';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#0b172e';
      ctx.lineWidth = 1;
      ctx.stroke();
      drawPointLabel(ctx, px, py, x, y, width, height, viewMargin, color);
    });
  }

  //малювання правильних пропущених точок
  if (hiperTaskFinished && hiperAllPairs && hiperUserPairs) {
    hiperAllPairs.forEach(([x, y]) => {
      const wasEntered = hiperUserPairs.some((p) => p.x === x && p.y === y);

      if (!wasEntered) {
        const px = centerX + x * plotScale;
        const py = centerY - y * plotScale;

        if (!isFinite(px) || !isFinite(py) || isNaN(px) || isNaN(py)) return;

        ctx.fillStyle = 'rgba(249, 115, 22, 0.7)';
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        drawPointLabel(ctx, px, py, x, y, width, height, viewMargin, '#f97316');
      }
    });
  }
};

const showHiperVisualization = () => {
  const intro = qs('#hiperIntro');
  const viz = qs('#hiperVizWrapper');
  if (intro) intro.style.display = 'none';
  if (viz) viz.style.display = 'block';
  drawHiperPlane();
};

const hideHiperVisualization = () => {
  const intro = qs('#hiperIntro');
  const viz = qs('#hiperVizWrapper');
  if (intro) intro.style.display = 'block';
  if (viz) viz.style.display = 'none';
};

//ініціалізація
const initHiperTask = () => {
  const taskNumber = qs('#hiperTaskNumber');
  const userX = qs('#hiperUserX');
  const userY = qs('#hiperUserY');
  const inputSection = qs('#hiperInputSection');
  const resultSection = qs('#hiperResultSection');
  const pairsDisplay = qs('#hiperPairsDisplay');

  if (!taskNumber || !userX || !userY) return;

  const task = generateHiperTask(getHiperDifficulty());
  hiperK = task.k;
  hiperAllPairs = task.allPairs;
  hiperUserPairs = [];
  hiperTaskFinished = false;
  hiperHintRevealed = false;

  userX.disabled = false;
  userY.disabled = false;
  const nextBtn = qs('#hiperNextPairBtn');
  const hintBtnEl = qs('#hiperHintBtn');
  if (nextBtn) nextBtn.disabled = false;
  if (hintBtnEl) hintBtnEl.disabled = false;

  taskNumber.innerHTML = `<math><mi>k</mi><mo>=</mo><mn>${hiperK}</mn></math>`;

  userX.value = '';
  userY.value = '';

  if (inputSection) inputSection.style.display = 'block';
  if (resultSection) resultSection.style.display = 'none';
  if (pairsDisplay) pairsDisplay.innerHTML = '';

  hideHiperVisualization();

  const checkBtn = qs('#hiperCheckBtn');
  if (checkBtn) checkBtn.textContent = 'Перевірити';
};

//підказка
const applyHiperHint = () => {
  if (hiperK === null || hiperHintRevealed || hiperTaskFinished) return;
  const userX = qs('#hiperUserX');
  const userY = qs('#hiperUserY');
  const pairsDisplay = qs('#hiperPairsDisplay');
  const finishBtn = qs('#hiperCheckBtn');
  const nextBtn = qs('#hiperNextPairBtn');
  const hintBtn = qs('#hiperHintBtn');
  if (!userX || !userY || !pairsDisplay) return;

  hiperUserPairs = hiperAllPairs.map(([a, b]) => ({ x: a, y: b, onCurve: true }));
  hiperHintRevealed = true;
  hiperTaskFinished = true;

  pairsDisplay.innerHTML = `
    <p style="margin: 0 0 8px 0; font-weight: 600; color: var(--accent);">Відповідь:</p>
    ${hiperAllPairs.map(([x, y], idx) => `
      <div style="margin: 4px 0; padding: 4px; background: var(--card-bg); border-radius: 4px; display: flex; gap: 8px;">
        <span>${idx + 1}.</span>
        <math><mo>(</mo><mn>${x}</mn><mo>,</mo><mn>${y}</mn><mo>)</mo></math>
      </div>
    `).join('')}
  `;

  userX.value = '';
  userY.value = '';
  userX.disabled = true;
  userY.disabled = true;
  if (nextBtn) nextBtn.disabled = true;
  if (hintBtn) hintBtn.disabled = true;
  if (finishBtn) finishBtn.textContent = 'Повторити';

  showHiperVisualization();
};

const addHiperPair = () => {
  if (hiperHintRevealed) return;
  if (!hiperCanvas || hiperK === null) return;
  if (!tryAppendHiperInputPair()) return;
  
  refreshHiperPairsDisplay();
  const viz = qs('#hiperVizWrapper');
  if (viz && viz.style.display === 'block') {
    drawHiperPlane();
  }
};

//вивід результатів
const finishHiperTask = () => {
  if (hiperHintRevealed) return;
  const resultContent = qs('#hiperResultContent');
  const inputSection = qs('#hiperInputSection');
  const resultSection = qs('#hiperResultSection');

  if (!resultContent || hiperK === null) return;

  tryAppendHiperInputPair();

  const correctPairs = [];
  const incorrectPairs = [];
  const missedPairs = [];

  hiperUserPairs.forEach(({ x, y, onCurve }) => {
    const isCorrect = onCurve && hiperPairInSolution(x, y);
    if (isCorrect) correctPairs.push([x, y]);
    else incorrectPairs.push([x, y]);
  });

  hiperAllPairs.forEach(([a, b]) => {
    const wasFound = hiperUserPairs.some((p) => p.x === a && p.y === b);
    if (!wasFound) missedPairs.push([a, b]);
  });

  const totalPairs = hiperAllPairs.length;
  const foundPairs = correctPairs.length;
  const incorrectCount = incorrectPairs.length;

  let score = foundPairs - incorrectCount * 1;
  if (score < 0) score = 0;
  
  const percentage = totalPairs > 0 ? (score / totalPairs) * 100 : 0;
  const finalGrade = Math.max(0, Math.min(12, Math.round((percentage / 100) * 12)));

  const formatPairs = (pairsArr) => pairsArr.map(([x, y], i) => `<span><math><mtext>(</mtext><mn>${x}</mn><mo>,</mo><mn>${y}</mn><mtext>)</mtext></math>${i < pairsArr.length - 1 ? ',' : ''}</span>`).join('');

  let resultHTML = '<div style="margin-bottom: 12px;"><strong>Результати:</strong></div>';

  if (correctPairs.length > 0) {
    resultHTML += `<div style="margin: 8px 0; color: #10b981; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;">
      ${ICON_FB_OK} Правильні пари: ${formatPairs(correctPairs)}
    </div>`;
  }

  if (incorrectPairs.length > 0) {
    resultHTML += `<div style="margin: 8px 0; color: #ef4444; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;">
      ${ICON_FB_FAIL} Неправильні пари: ${formatPairs(incorrectPairs)}
    </div>`;
  }

  if (missedPairs.length > 0) {
    resultHTML += `<div style="margin: 8px 0; color: #f97316; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;">
      ${ICON_FB_WARN} Пропущені пари: ${formatPairs(missedPairs)}
    </div>`;
  }

  resultHTML += `<div class="score-result-block">Оцінка: ${finalGrade} / 12</div>`;

  resultHTML += `
    <div style="margin-top: 16px; padding: 12px; background: rgba(56, 189, 248, 0.1); border-radius: 8px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-weight: 600;">
        Всі можливі пари:
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        ${formatPairs(hiperAllPairs)}
      </div>
    </div>`;

  resultContent.innerHTML = resultHTML;

  refreshHiperPairsDisplay();

  hiperTaskFinished = true;
  showHiperVisualization();

  inputSection.style.display = 'none';
  resultSection.style.display = 'block';
};

const handleHiperCheckOrRepeat = () => {
  const btn = qs('#hiperCheckBtn');
  if (!btn) return;
  if (btn.textContent === 'Повторити') {
    initHiperTask();
    return;
  }
  finishHiperTask();
};


//ініціалізація подій
hiperCanvas = qs('#hiperCanvas');
const hiperNextPairBtn = qs('#hiperNextPairBtn');
const hiperCheckBtn = qs('#hiperCheckBtn');
const hiperHintBtn = qs('#hiperHintBtn');
const hiperNewTaskBtn = qs('#hiperNewTaskBtn');

if (hiperCanvas && qs('#hiperTaskNumber')) {
  hiperCtx = hiperCanvas.getContext('2d');

  if (hiperNextPairBtn) hiperNextPairBtn.addEventListener('click', addHiperPair);
  if (hiperCheckBtn) hiperCheckBtn.addEventListener('click', handleHiperCheckOrRepeat);
  if (hiperHintBtn) hiperHintBtn.addEventListener('click', applyHiperHint);
  if (hiperNewTaskBtn) hiperNewTaskBtn.addEventListener('click', initHiperTask);

  document.querySelectorAll('input[name="hiperDifficulty"]').forEach((input) => {
    input.addEventListener('change', () => initHiperTask());
  });

  initHiperTask();
}
