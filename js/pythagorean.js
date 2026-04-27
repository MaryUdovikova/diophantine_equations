const getPythCanvasColors = () => {
  const style = getComputedStyle(document.body);
  const pick = (name, fallback) => {
    const v = style.getPropertyValue(name).trim();
    return v || fallback;
  };
  return {
    bg: pick('--pyth-canvas-bg', '#0b172e'),
    stroke: pick('--pyth-canvas-stroke', '#38bdf8'),
    fill: pick('--pyth-canvas-fill', 'rgba(56, 189, 248, 0.12)'),
    label: pick('--pyth-canvas-label', '#e5e7eb'),
  };
};

const triangleCanvas = qs('#triangleCanvas');
const triplesList = qs('#triplesList');

//малювання прямокутного трикутника на canvas
const drawTriangle = (canvas, ctx, a, b, c) => {
  if (!ctx || !canvas) return;
  const col = getPythCanvasColors();
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = col.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const marginLeft = 24;
  const marginRight = 60; 
  const marginTop = 24;
  const marginBottom = 24;
  
  const availableWidth = canvas.width - marginLeft - marginRight;
  const availableHeight = canvas.height - marginTop - marginBottom;
  
  const scaleX = availableWidth / a;
  const scaleY = availableHeight / b;
  const scale = Math.min(scaleX, scaleY);
  
  const aScaled = a * scale;
  const bScaled = b * scale;

  ctx.strokeStyle = col.stroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(marginLeft, canvas.height - marginBottom);
  ctx.lineTo(marginLeft + aScaled, canvas.height - marginBottom);
  ctx.lineTo(marginLeft + aScaled, canvas.height - marginBottom - bScaled);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = col.fill;
  ctx.fill();

  ctx.fillStyle = col.label;
  ctx.font = '14px Inter';
  
  const textA = `a = ${a}`;
  const textAWidth = ctx.measureText(textA).width;
  ctx.fillText(textA, marginLeft + aScaled / 2 - textAWidth / 2, canvas.height - marginBottom + 18);
  
  ctx.fillText(`b = ${b}`, marginLeft + aScaled + 8, canvas.height - marginBottom - bScaled / 2);
  
  const textC = `c = ${c}`;
  const textCWidth = ctx.measureText(textC).width;
  const cX = Math.max(marginLeft, marginLeft + aScaled / 2 - textCWidth - 8);
  const cY = canvas.height - marginBottom - bScaled / 2;
  ctx.fillText(textC, cX, cY);
};

//генерація списку всіх трійок до заданого ліміту
const generateTriples = () => {
  const maxRangeInput = qs('#maxRange');
  if (!triplesList || !maxRangeInput) return;
  
  const max = Number(maxRangeInput.value);
  qs('#rangeValue').textContent = max;
  const triples = [];
  
  for (let m = 2; m * m <= max * 2; m += 1) {
    for (let n = 1; n < m; n += 1) {
      if ((m - n) % 2 === 0 || gcd(m, n) !== 1) continue;
      const a = m * m - n * n;
      const b = 2 * m * n;
      const c = m * m + n * n;
      if (c <= max) {
        triples.push([a, b, c].sort((x, y) => x - y));
      }
    }
  }
  
  triples.sort((t1, t2) => t1[2] - t2[2]);
  
  triplesList.innerHTML = triples
    .map((t, idx) => `
      <div class="item">
        <span>#${idx + 1}</span>
        <math>
          <msup><mn>${t[0]}</mn><mn>2</mn></msup><mo>+</mo>
          <msup><mn>${t[1]}</mn><mn>2</mn></msup><mo>=</mo>
          <msup><mn>${t[2]}</mn><mn>2</mn></msup>
        </math>
      </div>
    `).join('');
    
  const first = triples[0] || [3, 4, 5];
  if (triangleCanvas) drawTriangle(triangleCanvas, triangleCanvas.getContext('2d'), first[0], first[1], first[2]);
};

//перевірка введених трійок
const checkTriple = () => {
  const a = Number(qs('#checkA').value);
  const b = Number(qs('#checkB').value);
  
  if ([a, b].some((n) => Number.isNaN(n) || n <= 0)) {
    triplesList.innerHTML = '<div class="item">Введіть додатні цілі числа.</div>';
    return;
  }
  
  const c2 = a * a + b * b;
  const c = Math.round(Math.sqrt(c2));
  
  if (c * c === c2) {
    triplesList.innerHTML = `
      <div class="item">
        <span>${ICON_FB_OK}</span>
        <math>
          <msup><mn>${a}</mn><mn>2</mn></msup><mo>+</mo>
          <msup><mn>${b}</mn><mn>2</mn></msup><mo>=</mo>
          <msup><mn>${c}</mn><mn>2</mn></msup>
        </math>
      </div>`;
    if (triangleCanvas) drawTriangle(triangleCanvas, triangleCanvas.getContext('2d'), a, b, c);
  } else {
    triplesList.innerHTML = `
      <div class="item">
        <span>${ICON_FB_BAN}</span>
        <math>
          <msup><mn>${a}</mn><mn>2</mn></msup><mo>+</mo>
          <msup><mn>${b}</mn><mn>2</mn></msup><mo>&#x2260;</mo>
          <msup><mi>k</mi><mn>2</mn></msup>
        </math>
      </div>`;
    if (triangleCanvas) drawTriangle(triangleCanvas, triangleCanvas.getContext('2d'), a, b, Math.sqrt(c2).toFixed(2));
  }
};

const startTaskBtn = qs('#startTask');
const taskSection = qs('#taskSection');
const taskAInput = qs('#taskA');
const taskBInput = qs('#taskB');
const taskCInput = qs('#taskC');
const checkCurrentTaskBtn = qs('#checkCurrentTask');
const pythagoreanHintBtn = qs('#pythagoreanHintBtn');
const nextTaskBtn = qs('#nextTask');
const taskResult = qs('#taskResult');
const taskScore = qs('#taskScore');

let currentTask = null;
let taskScoreValue = 0;

const getPythagoreanDifficulty = () => {
  const r = document.querySelector('input[name="pythagoreanDifficulty"]:checked');
  return r ? r.value : 'medium';
};

//генерація випадкової трійки з пулу за складністтю
const generatePythagoreanTriple = (difficulty) => {
  const level = difficulty || getPythagoreanDifficulty();
  const allTriples = [
    [3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29],
    [12, 35, 37], [9, 40, 41], [28, 45, 53], [11, 60, 61], [16, 63, 65],
    [33, 56, 65], [48, 55, 73], [13, 84, 85], [36, 77, 85], [39, 80, 89]
  ];
  let pool;
  switch (level) {
    case 'easy': pool = allTriples.filter((t) => t[2] <= 25); break;
    case 'hard': pool = allTriples.filter((t) => t[2] > 55); break;
    case 'medium':
    default: pool = allTriples.filter((t) => t[2] > 25 && t[2] <= 55); break;
  }
  if (pool.length === 0) pool = allTriples;
  
  const randomTriple = pool[Math.floor(Math.random() * pool.length)];
  const [a, b, c] = randomTriple;
  return Math.random() > 0.5 ? [a, b, c] : [b, a, c];
};

//виконання завдання
const startTask = () => {
  if (!taskSection || !taskAInput || !taskBInput || !taskCInput) return;
  
  if (qs('#defaultContent')) qs('#defaultContent').style.display = 'none';
  if (qs('#defaultResultContent')) qs('#defaultResultContent').style.display = 'none';
  if (triangleCanvas) triangleCanvas.style.display = 'none';
  
  const taskCanvasWrapper = qs('#taskCanvasWrapper');
  if (taskCanvasWrapper) taskCanvasWrapper.style.display = 'block';

  currentTask = generatePythagoreanTriple(getPythagoreanDifficulty());
  const [, , c] = currentTask;

  taskAInput.value = '';
  taskBInput.value = '';
  taskCInput.value = c;
  taskAInput.focus();
  
  checkCurrentTaskBtn.style.display = 'block';
  checkCurrentTaskBtn.textContent = 'Перевірити';
  if (pythagoreanHintBtn) pythagoreanHintBtn.style.display = 'block';

  taskSection.style.display = 'block';
  startTaskBtn.style.display = 'none';
  nextTaskBtn.style.display = 'none';
  taskResult.innerHTML = '';
  
  taskScore.innerHTML = '';
  taskScore.style.display = 'none';
  
  const taskCanvas = qs('#taskTriangleCanvas');
  if (taskCanvas) {
    const taskCtx = taskCanvas.getContext('2d');
    if (taskCtx) {
      const col = getPythCanvasColors();
      taskCtx.clearRect(0, 0, taskCanvas.width, taskCanvas.height);
      taskCtx.fillStyle = col.bg;
      taskCtx.fillRect(0, 0, taskCanvas.width, taskCanvas.height);
    }
  }
};

//перевірка з оцінкою
const checkCurrentTask = () => {
  if (!currentTask || !taskResult || !taskScore || !taskAInput || !taskBInput || !taskCInput) return;
  
  const userA = Number(taskAInput.value);
  const userB = Number(taskBInput.value);
  const [, , correctC] = currentTask;
  
  if ([userA, userB].some((n) => Number.isNaN(n) || n <= 0)) {
    taskResult.textContent = 'Введіть додатні числа для катетів.';
    taskResult.style.color = '#ef4444';
    return;
  }
  
  const isPythagorean = (userA * userA + userB * userB === correctC * correctC);
  const [a, b] = currentTask;
  const matchesOriginal = (userA === a && userB === b) || (userA === b && userB === a);

  taskScoreValue = 0;
  if (isPythagorean && matchesOriginal) {
    taskResult.innerHTML = `${ICON_FB_OK} Правильно! Катети підібрані вірно.`;
    taskResult.style.color = '#10b981';
    taskScoreValue = 6;
  } else if (isPythagorean) {
    taskResult.innerHTML = `${ICON_FB_INFO} Катети утворюють правильну Піфагорову трійку з цією гіпотенузою, але не збігаються з очікуваною.`;
    taskResult.style.color = '#f59e0b';
  } else {
    taskResult.innerHTML = `
      ${ICON_FB_FAIL} Неправильно. Відповідь: 
      <math>
        <mi>a</mi><mo>=</mo><mn>${a}</mn><mo>,</mo>
        <mi>b</mi><mo>=</mo><mn>${b}</mn><mo>,</mo>
        <mi>c</mi><mo>=</mo><mn>${correctC}</mn>
      </math>
    `;
    taskResult.style.color = '#ef4444';
  }

  const grade12 = Math.round((taskScoreValue / 6) * 12);
  taskScore.textContent = `Оцінка: ${grade12} / 12`;
  taskScore.style.display = 'block';

  checkCurrentTaskBtn.style.display = 'none';
  if (pythagoreanHintBtn) pythagoreanHintBtn.style.display = 'none';
  nextTaskBtn.style.display = 'block';

  const taskCanvas = qs('#taskTriangleCanvas');
  if (taskCanvas) drawTriangle(taskCanvas, taskCanvas.getContext('2d'), a, b, correctC);
};

//підказка
const applyPythagoreanHint = () => {
  if (!currentTask || !taskAInput || !taskBInput || !checkCurrentTaskBtn) return;
  const [a, b, c] = currentTask;
  taskAInput.value = String(a);
  taskBInput.value = String(b);
  checkCurrentTaskBtn.textContent = 'Повторити';

  const taskCanvas = qs('#taskTriangleCanvas');
  if (taskCanvas) drawTriangle(taskCanvas, taskCanvas.getContext('2d'), a, b, c);
};

const handlePythagoreanCheckOrRepeat = () => {
  if (!checkCurrentTaskBtn) return;
  if (checkCurrentTaskBtn.textContent === 'Повторити') {
    startTask();
    return;
  }
  checkCurrentTask();
};


//ініціалізація подій
if (qs('#generateTriples')) {
  qs('#generateTriples').addEventListener('click', generateTriples);
  qs('#maxRange')?.addEventListener('input', (e) => {
    qs('#rangeValue').textContent = e.target.value;
  });
  generateTriples();
}

qs('#checkTriple')?.addEventListener('click', checkTriple);
if (startTaskBtn) startTaskBtn.addEventListener('click', startTask);
if (checkCurrentTaskBtn) checkCurrentTaskBtn.addEventListener('click', handlePythagoreanCheckOrRepeat);
if (pythagoreanHintBtn) pythagoreanHintBtn.addEventListener('click', applyPythagoreanHint);
if (nextTaskBtn) nextTaskBtn.addEventListener('click', startTask);

document.querySelectorAll('input[name="pythagoreanDifficulty"]').forEach((input) => {
  input.addEventListener('change', () => {
    if (taskSection && taskSection.style.display !== 'none') {
      startTask();
    }
  });
});