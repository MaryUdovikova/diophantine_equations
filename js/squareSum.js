let squareSumN = null;
let squareSumAllPairs = [];
let squareSumUserPairs = [];
let squareSumCanvas = null;
let squareSumCtx = null;
let squareSumTaskFinished = false;
let squareSumHintRevealed = false;

//перевірка чи належить введена пара до масиву розв'язків
const squareSumPairInSolution = (x, y) =>
  squareSumAllPairs.some(([a, b]) => a === x && b === y);

const refreshSquareSumPairsDisplay = () => {
  const pairsDisplay = qs('#pairsDisplay');
  if (!pairsDisplay) return;
  pairsDisplay.innerHTML = squareSumUserPairs
    .map((p, idx) => {
      const { x, y, onCircle } = p;
      const ok = onCircle && squareSumPairInSolution(x, y);
      const color = ok ? '#10b981' : '#ef4444';
      return `
        <div style="margin: 4px 0; padding: 4px; background: var(--card-bg); border-radius: 4px; color: ${color}; font-weight: 600; display: flex; gap: 8px;">
          <span>${idx + 1}.</span>
          <math><mo>(</mo><mn>${x}</mn><mo>,</mo><mn>${y}</mn><mo>)</mo></math>
        </div>`;
    })
    .join('');
};

//додавання пар до масиву користувача
const tryAppendSquareSumInputPair = () => {
  const userX = qs('#userX');
  const userY = qs('#userY');
  if (!userX || !userY || squareSumN === null) return false;
  if (userX.value.trim() === '' || userY.value.trim() === '') return false;

  const x = Number(userX.value);
  const y = Number(userY.value);

  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isInteger(x) || !Number.isInteger(y)) {
    return false;
  }

  if (squareSumUserPairs.some((p) => p.x === x && p.y === y)) {
    return false;
  }

  const onCircle = x * x + y * y === squareSumN;
  squareSumUserPairs.push({ x, y, onCircle });
  userX.value = '';
  userY.value = '';
  return true;
};

const getSquareSumDifficulty = () => {
  const r = document.querySelector('input[name="squareSumDifficulty"]:checked');
  return r ? r.value : 'medium';
};

//генерація n і знаходження розв'язків
const generateSquareSumTask = (difficulty) => {
  const level = difficulty || getSquareSumDifficulty();
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
  const n = x * x + y * y;

  const allPairs = findAllSquareSumPairs(n);
  return { n, allPairs };
};

//знаходження всіх пар (x,y) для суми квадратів яких буде ціле n
const findAllSquareSumPairs = (n) => {
  const pairs = [];
  const maxX = Math.floor(Math.sqrt(n));
  const seen = new Set();
  
  for (let x = 0; x <= maxX; x++) {
    const xSquared = x * x;
    const ySquared = n - xSquared;
    
    if (ySquared < 0) break;
    
    const y = Math.sqrt(ySquared);
    if (Number.isInteger(y) && y >= 0) {
      const variants = [];
      
      if (x === 0 && y === 0) {
        variants.push([0, 0]);
      } else if (x === 0) {
        variants.push([0, y], [0, -y]);
      } else if (y === 0) {
        variants.push([x, 0], [-x, 0]);
      } else {
        variants.push([x, y], [-x, y], [x, -y], [-x, -y]);
      }
      
      if (x !== y && x !== 0 && y !== 0) {
        variants.push([y, x], [-y, x], [y, -x], [-y, -x]);
      }
      
      variants.forEach(([a, b]) => {
        const key = `${a},${b}`;
        if (!seen.has(key)) {
          pairs.push([a, b]);
          seen.add(key);
        }
      });
    }
  }
  
  return pairs.sort((a, b) => {
    if (a[0] !== b[0]) return a[0] - b[0];
    return a[1] - b[1];
  });
};

//малювання точок
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

//малювання координатної площини, сітки, кола і точок
const drawSquareSumPlane = () => {
  if (!squareSumCanvas || !squareSumCtx) return;
  
  const canvas = squareSumCanvas;
  const ctx = squareSumCtx;
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  
  let maxVal = 5;
  if (squareSumN !== null) {
    maxVal = Math.max(maxVal, Math.sqrt(squareSumN));
  }
  
  //20% відступу від країв canvas
  maxVal = Math.ceil(maxVal * 1.2);
  
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
  
  //малювання сітки
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border') || '#334155';
  ctx.lineWidth = 0.5;
  
  //вертикальні лінії
  for (let i = 0; i <= Math.floor(centerX / gridStepPixels); i++) {
    const xRight = centerX + i * gridStepPixels;
    const xLeft = centerX - i * gridStepPixels;
    ctx.beginPath(); ctx.moveTo(xRight, 0); ctx.lineTo(xRight, height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(xLeft, 0); ctx.lineTo(xLeft, height); ctx.stroke();
  }
  
  //горизонтальні лінії
  for (let i = 0; i <= Math.floor(centerY / gridStepPixels); i++) {
    const yBottom = centerY + i * gridStepPixels;
    const yTop = centerY - i * gridStepPixels;
    ctx.beginPath(); ctx.moveTo(0, yBottom); ctx.lineTo(width, yBottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, yTop); ctx.lineTo(width, yTop); ctx.stroke();
  }
  
  //осі
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); ctx.stroke();
  
  ctx.fillStyle = 'black';
  ctx.font = '12px Inter';
  ctx.fillText('x', width - 20, centerY - 5);
  ctx.fillText('y', centerX + 5, 15);
  ctx.fillText('0', centerX - 15, centerY + 15);
  
  //коло
  if (squareSumN !== null) {
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    const radius = Math.sqrt(squareSumN) * plotScale;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const viewMargin = 5;

  //точки користувача
  if (squareSumUserPairs && squareSumUserPairs.length > 0) {
    squareSumUserPairs.forEach((p) => {
      const { x, y, onCircle } = p;
      const isCorrect = onCircle && squareSumPairInSolution(x, y);

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
  
  //пропущені правильні точки
  if (squareSumTaskFinished && squareSumAllPairs && squareSumUserPairs) {
    squareSumAllPairs.forEach(([x, y]) => {
      const wasEntered = squareSumUserPairs.some((p) => p.x === x && p.y === y);
      
      if (!wasEntered) {
        const px = centerX + x * plotScale;
        const py = centerY - y * plotScale;
        
        if (!isFinite(px) || !isFinite(py) || isNaN(px) || isNaN(py)) return;

        ctx.fillStyle = 'rgba(249, 115, 22, 0.5)';
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

const showSquareSumVisualization = () => {
  const intro = qs('#squareSumIntro');
  const viz = qs('#squareSumVizWrapper');
  if (intro) intro.style.display = 'none';
  if (viz) viz.style.display = 'block';
  drawSquareSumPlane();
};

const hideSquareSumVisualization = () => {
  const intro = qs('#squareSumIntro');
  const viz = qs('#squareSumVizWrapper');
  if (intro) intro.style.display = 'block';
  if (viz) viz.style.display = 'none';
};

//ініціалізація завдання
const initSquareSumTask = () => {
  const taskNumber = qs('#taskNumber');
  const userX = qs('#userX');
  const userY = qs('#userY');
  const inputSection = qs('#inputSection');
  const resultSection = qs('#resultSection');
  const pairsDisplay = qs('#pairsDisplay');
  
  if (!taskNumber || !userX || !userY) return;
  
  const task = generateSquareSumTask(getSquareSumDifficulty());
  squareSumN = task.n;
  squareSumAllPairs = task.allPairs;
  squareSumUserPairs = [];
  squareSumTaskFinished = false;
  squareSumHintRevealed = false;

  userX.disabled = false;
  userY.disabled = false;
  const nextBtn = qs('#nextPairBtn');
  const hintBtnEl = qs('#squareSumHintBtn');
  if (nextBtn) nextBtn.disabled = false;
  if (hintBtnEl) hintBtnEl.disabled = false;
  
  taskNumber.innerHTML = `
    <math>
      <mi>n</mi><mo>=</mo><mn>${squareSumN}</mn>
    </math>`;
  
  userX.value = '';
  userY.value = '';
  
  inputSection.style.display = 'block';
  resultSection.style.display = 'none';
  
  if (pairsDisplay) pairsDisplay.innerHTML = '';

  hideSquareSumVisualization();

  const finishBtnReset = qs('#finishBtn');
  if (finishBtnReset) finishBtnReset.textContent = 'Перевірити';
};

//підказка
const applySquareSumHint = () => {
  if (squareSumN === null || squareSumHintRevealed || squareSumTaskFinished) return;
  const userX = qs('#userX');
  const userY = qs('#userY');
  const pairsDisplay = qs('#pairsDisplay');
  const finishBtn = qs('#finishBtn');
  const nextBtn = qs('#nextPairBtn');
  
  if (!userX || !userY || !pairsDisplay) return;

  squareSumUserPairs = squareSumAllPairs.map(([a, b]) => ({ x: a, y: b, onCircle: true }));
  squareSumHintRevealed = true;
  squareSumTaskFinished = true;

  pairsDisplay.innerHTML = `
    <p style="margin: 0 0 8px 0; font-weight: 600; color: var(--accent);">Відповідь:</p>
    ${squareSumAllPairs.map(([x, y], idx) => `
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
  if (qs('#squareSumHintBtn')) qs('#squareSumHintBtn').disabled = true;
  if (finishBtn) finishBtn.textContent = 'Повторити';

  showSquareSumVisualization();
};

//обробка кнопки додавання пари до масиву користувача
const addSquareSumPair = () => {
  if (squareSumHintRevealed) return;
  if (!squareSumCanvas || squareSumN === null) return;

  if (!tryAppendSquareSumInputPair()) return;

  refreshSquareSumPairsDisplay();

  const viz = qs('#squareSumVizWrapper');
  if (viz && viz.style.display === 'block') {
    drawSquareSumPlane();
  }
};

//перевірка і оцінка
const finishSquareSumTask = () => {
  if (squareSumHintRevealed) return;
  const resultContent = qs('#resultContent');
  const inputSection = qs('#inputSection');
  const resultSection = qs('#resultSection');
  
  if (!resultContent || !squareSumN) return;

  tryAppendSquareSumInputPair();

  const correctPairs = [];
  const incorrectPairs = [];
  const missedPairs = [];
  
  squareSumUserPairs.forEach(({ x, y, onCircle }) => {
    const isCorrect = onCircle && squareSumPairInSolution(x, y);
    if (isCorrect) correctPairs.push([x, y]);
    else incorrectPairs.push([x, y]);
  });

  squareSumAllPairs.forEach(([a, b]) => {
    const wasFound = squareSumUserPairs.some((p) => p.x === a && p.y === b);
    if (!wasFound) missedPairs.push([a, b]);
  });

  const totalPairs = squareSumAllPairs.length;
  const foundPairs = correctPairs.length;
  const incorrectCount = incorrectPairs.length;

  let score = foundPairs - incorrectCount * 1;
  if (score < 0) score = 0;
  
  const percentage = totalPairs > 0 ? ((score / totalPairs) * 100) : 0;
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
        ${formatPairs(squareSumAllPairs)}
      </div>
    </div>`;
  
  resultContent.innerHTML = resultHTML;

  refreshSquareSumPairsDisplay();

  squareSumTaskFinished = true;
  showSquareSumVisualization();

  inputSection.style.display = 'none';
  resultSection.style.display = 'block';
};

const handleSquareSumCheckOrRepeat = () => {
  const finishBtn = qs('#finishBtn');
  if (!finishBtn) return;
  if (finishBtn.textContent === 'Повторити') {
    initSquareSumTask();
    return;
  }
  finishSquareSumTask();
};


//ініціалізація подій
squareSumCanvas = qs('#coordinateCanvas');
const squareSumNextPairBtn = qs('#nextPairBtn');
const squareSumFinishBtn = qs('#finishBtn');
const squareSumHintBtn = qs('#squareSumHintBtn');
const squareSumNewTaskBtn = qs('#newTaskBtn');

if (squareSumCanvas && qs('#taskNumber')) {
  squareSumCtx = squareSumCanvas.getContext('2d');
  
  if (squareSumNextPairBtn) squareSumNextPairBtn.addEventListener('click', addSquareSumPair);
  if (squareSumFinishBtn) squareSumFinishBtn.addEventListener('click', handleSquareSumCheckOrRepeat);
  if (squareSumHintBtn) squareSumHintBtn.addEventListener('click', applySquareSumHint);
  if (squareSumNewTaskBtn) squareSumNewTaskBtn.addEventListener('click', initSquareSumTask);
  
  document.querySelectorAll('input[name="squareSumDifficulty"]').forEach((input) => {
    input.addEventListener('change', () => initSquareSumTask());
  });

  initSquareSumTask();
}