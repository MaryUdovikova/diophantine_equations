let currentLinearTask = null;
let linearScore = 0;

const getLinearDifficulty = () => {
  const r = document.querySelector('input[name="linearDifficulty"]:checked');
  return r ? r.value : 'medium';
};

//генерація випадкового цілого
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

//генерація випадкового знаку 1 або -1
const randomSign = () => (Math.random() < 0.5 ? 1 : -1);

//форматування
const formatLinearEquationDisplay = (a, b, c) => {
  let xPart;
  if (a === 1) xPart = 'x';
  else if (a === -1) xPart = '-x';
  else xPart = `${a}x`;

  let yPart;
  if (b >= 0) {
    if (b === 1) yPart = ' + y';
    else yPart = ` + ${b}y`;
  } else {
    const ab = Math.abs(b);
    if (ab === 1) yPart = ' - y';
    else yPart = ` - ${ab}y`;
  }

  return `${xPart}${yPart} = ${c}`;
};

//генерація завдання на основі складності, обчислення всіх відповідей (НСД, умова, приватні розв'язки)
const generateLinearTask = (difficulty) => {
  const level = difficulty || getLinearDifficulty();
  let absA, absB, multMin, multMax;

  switch (level) {
    case 'easy':
      absA = randInt(1, 9);
      absB = randInt(1, 9);
      multMin = 3;
      multMax = 12;
      break;
    case 'hard':
      absA = randInt(10, 99);
      absB = randInt(10, 99);
      multMin = 8;
      multMax = 40;
      break;
    case 'medium':
    default:
      const small = randInt(1, 9);
      const big = randInt(10, 99);
      if (Math.random() < 0.5) {
        absA = small;
        absB = big;
      } else {
        absA = big;
        absB = small;
      }
      multMin = 5;
      multMax = 24;
      break;
  }

  const sa = randomSign();
  const sb = randomSign();
  const a = sa * absA;
  const b = sb * absB;

  const { d, x, y } = extendedGcd(absA, absB);

  const multRange = multMax - multMin + 1;
  const multiplier = Math.floor(Math.random() * multRange) + multMin;
  const c = d * multiplier;

  const factor = c / d;
  const x0 = x * factor * sa;
  const y0 = y * factor * sb;
  const condition = c % d;

  return { a, b, c, gcd: d, condition, x0, y0 };
};

const updateConditionDisplay = () => {
  const dynamicText = qs('#dynamicConditionText');
  const userGcd = qs('#userGcd');
  
  if (!dynamicText || !userGcd || !currentLinearTask) return;
  
  const userGcdVal = userGcd.value.trim();
  
  if (userGcdVal === '' || isNaN(Number(userGcdVal))) {
    dynamicText.innerHTML = `
      <math>
        <mtext>(</mtext><mi>c</mi><mo>%</mo><mi>НСД</mi><mo>=</mo><mo>?</mo><mtext>)</mtext>
      </math>`;
    return;
  }
  
  const gcdNum = Number(userGcdVal);
  dynamicText.innerHTML = `
    <math>
      <mtext>(</mtext><mn>${currentLinearTask.c}</mn><mo>%</mo><mn>${gcdNum}</mn><mo>=</mo><mo>?</mo><mtext>)</mtext>
    </math>`;
};

//ініціалізація завдання
const initLinearTask = () => {
  const equationText = qs('#equationText');
  const userGcd = qs('#userGcd');
  const userCondition = qs('#userCondition');
  const userX0 = qs('#userX0');
  const userY0 = qs('#userY0');
  const taskSection = qs('#taskSection');
  const resultSection = qs('#resultSection');
  
  if (!equationText || !userGcd || !userCondition || !userX0 || !userY0) return;
  
  currentLinearTask = generateLinearTask(getLinearDifficulty());
  
  equationText.textContent = formatLinearEquationDisplay(
    currentLinearTask.a,
    currentLinearTask.b,
    currentLinearTask.c
  );
  
  userGcd.value = '';
  userCondition.value = '';
  userX0.value = '';
  userY0.value = '';
  
  updateConditionDisplay();
  
  if (taskSection) taskSection.style.display = 'block';
  if (resultSection) resultSection.style.display = 'none';
  
  const checkBtn = qs('#checkBtn');
  if (checkBtn) checkBtn.textContent = 'Перевірити';
};

//підказка
const applyLinearHint = () => {
  if (!currentLinearTask) return;
  const userGcd = qs('#userGcd');
  const userCondition = qs('#userCondition');
  const userX0 = qs('#userX0');
  const userY0 = qs('#userY0');
  const checkBtn = qs('#checkBtn');
  
  if (!userGcd || !userCondition || !userX0 || !userY0 || !checkBtn) return;
  
  userGcd.value = String(currentLinearTask.gcd);
  userCondition.value = String(currentLinearTask.condition);
  userX0.value = String(currentLinearTask.x0);
  userY0.value = String(currentLinearTask.y0);
  
  updateConditionDisplay();
  checkBtn.textContent = 'Повторити';
};

const handleCheckOrRepeat = () => {
  const checkBtn = qs('#checkBtn');
  if (!checkBtn) return;
  if (checkBtn.textContent === 'Повторити') {
    initLinearTask();
    return;
  }
  checkLinearAnswers();
};

//перевірка відповідей і оцінка
const checkLinearAnswers = () => {
  const userGcd = qs('#userGcd');
  const userCondition = qs('#userCondition');
  const userX0 = qs('#userX0');
  const userY0 = qs('#userY0');
  const resultContent = qs('#resultContent');
  const taskSection = qs('#taskSection');
  const resultSection = qs('#resultSection');
  
  if (!currentLinearTask || !userGcd || !userCondition || !userX0 || !userY0 || !resultContent) return;
  
  const userGcdVal = Number(userGcd.value);
  const userConditionVal = Number(userCondition.value);
  const userX0Val = Number(userX0.value);
  const userY0Val = Number(userY0.value);
  
  const gcdCorrect = userGcdVal === currentLinearTask.gcd;
  const conditionCorrect = userConditionVal === currentLinearTask.condition;
  const x0Correct = userX0Val === currentLinearTask.x0;
  const y0Correct = userY0Val === currentLinearTask.y0;
  
  const allCorrect = gcdCorrect && conditionCorrect && x0Correct && y0Correct;
  
  linearScore = 0;
  if (gcdCorrect) linearScore += 2;
  if (conditionCorrect) linearScore += 2;
  if (x0Correct) linearScore += 4;
  if (y0Correct) linearScore += 4;
  
  let resultHTML = '<div style="margin-bottom: 12px;"><strong>Результат:</strong></div>';
  
  //НСД
  resultHTML += `<div style="margin: 8px 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
    <math>
      <mi>НСД</mi>
      <mrow><mtext>(</mtext><mn>${currentLinearTask.a}</mn><mo>,</mo><mn>${currentLinearTask.b}</mn><mtext>)</mtext></mrow>
      <mo>=</mo>
      <mn>${currentLinearTask.gcd}</mn>
    </math>
    ${gcdCorrect ? ICON_FB_OK : `${ICON_FB_FAIL} <span>(ваша відповідь: ${userGcdVal})</span>`}
  </div>`;
  
  //умова існування
  resultHTML += `<div style="margin: 8px 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
    <span>Умова існування:</span>
    <math>
      <mn>${currentLinearTask.c}</mn><mo>%</mo><mn>${userGcdVal}</mn><mo>=</mo><mn>${currentLinearTask.condition}</mn>
    </math>
    ${conditionCorrect ? ICON_FB_OK : `${ICON_FB_FAIL} <span>(ваша відповідь: ${userConditionVal})</span>`}
  </div>`;
  
  //x0
  resultHTML += `<div style="margin: 8px 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
    <span>Приватний розв'язок:</span>
    <math>
      <msub><mi>x</mi><mn>0</mn></msub><mo>=</mo><mn>${currentLinearTask.x0}</mn>
    </math>
    ${x0Correct ? ICON_FB_OK : `${ICON_FB_FAIL} <span>(ваша відповідь: ${userX0Val})</span>`}
  </div>`;
  
  //y0
  resultHTML += `<div style="margin: 8px 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
    <span>Приватний розв'язок:</span>
    <math>
      <msub><mi>y</mi><mn>0</mn></msub><mo>=</mo><mn>${currentLinearTask.y0}</mn>
    </math>
    ${y0Correct ? ICON_FB_OK : `${ICON_FB_FAIL} <span>(ваша відповідь: ${userY0Val})</span>`}
  </div>`;
  
  resultHTML += `<div class="score-result-block">Оцінка: ${linearScore} / 12</div>`;
  
  if (allCorrect) {
    resultHTML += `<div style="margin-top: 16px; padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; color: #10b981; font-weight: 600;">${ICON_FB_OK} Всі відповіді правильні!</div>`;
  }
  
  resultContent.innerHTML = resultHTML;
  taskSection.style.display = 'none';
  resultSection.style.display = 'block';
  
  const newTaskBtn = qs('#newTaskBtn');
  if (newTaskBtn) {
    newTaskBtn.style.display = 'block';
    newTaskBtn.textContent = 'Нове завдання';
  }
};

//ініціалізація подій 
const checkBtn = qs('#checkBtn');
const hintBtn = qs('#hintBtn');
const newTaskBtn = qs('#newTaskBtn');
const userGcd = qs('#userGcd');

if (checkBtn) checkBtn.addEventListener('click', handleCheckOrRepeat);
if (hintBtn) hintBtn.addEventListener('click', applyLinearHint);
if (newTaskBtn) newTaskBtn.addEventListener('click', () => initLinearTask());
if (userGcd) userGcd.addEventListener('input', updateConditionDisplay);

document.querySelectorAll('input[name="linearDifficulty"]').forEach((input) => {
  input.addEventListener('change', () => initLinearTask());
});

if (qs('#equationText')) {
  initLinearTask();
}