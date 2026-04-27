const qs = (sel) => document.querySelector(sel);

//іконки 
var ICON_FB_OK =
  '<i class="fa-solid fa-check fa-fw icon-feedback icon-feedback--ok" aria-hidden="true"></i>';
var ICON_FB_FAIL =
  '<i class="fa-solid fa-xmark fa-fw icon-feedback icon-feedback--fail" aria-hidden="true"></i>';
var ICON_FB_WARN =
  '<i class="fa-solid fa-triangle-exclamation fa-fw icon-feedback icon-feedback--warn" aria-hidden="true"></i>';
var ICON_FB_INFO =
  '<i class="fa-solid fa-circle-info fa-fw icon-feedback icon-feedback--info" aria-hidden="true"></i>';
var ICON_FB_BAN =
  '<i class="fa-solid fa-ban fa-fw icon-feedback icon-feedback--ban" aria-hidden="true"></i>';

// НСД за евклідом
const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
};

//розширений алгоритм евкліда
const extendedGcd = (a, b) => {
  if (b === 0) return { d: Math.abs(a), x: Math.sign(a), y: 0 };
  const { d, x: x1, y: y1 } = extendedGcd(b, a % b);
  return { d, x: y1, y: x1 - y1 * Math.floor(a / b) };
};

