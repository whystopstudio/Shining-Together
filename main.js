
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
resizeCanvas();

window.addEventListener('resize', resizeCanvas);
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// --- Firebase setup ---
const firebaseConfig = {
  apiKey: "AIzaSyDsWLFW4QQUaRGgyqB7KnoCXKfqiuGhW8M",
  authDomain: "shining-together.firebaseapp.com",
  projectId: "shining-together",
  storageBucket: "shining-together.appspot.com",
  messagingSenderId: "322280033754",
  appId: "1:322280033754:web:cc2137fbcf38226d7704e3",
  databaseURL: "https://shining-together-default-rtdb.asia-southeast1.firebasedatabase.app/"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const userId = Math.random().toString(36).substring(2);
const pointerRadius = 30;
const DOT_SHOW_MS = 300;
const TRACE_MAX_AGE = 1000; // ms, 軌跡持續時間
const TRACE_MAX_LEN = 30;   // 最多保留多少點
const activeTouchIds = new Set();

function sendTrace(pointerId, trace) {
  db.ref("pointers/" + userId + "_" + pointerId).set({
    trace: trace.map(p => ({ x: p.x / canvas.width, y: p.y / canvas.height, t: p.t })),
    t: Date.now()
  });
}

function clearTrace(pointerId) {
  db.ref("pointers/" + userId + "_" + pointerId).remove();
}

// --- 本地保存自己的 trace ---
const localTraces = {}; // pointerId: [{x, y, t}, ...]

// --- 其他人的 trace 來自 firebase ---
let activePointers = {};

// --- 讀取 pointers (trace) ---
db.ref("pointers").on("value", snapshot => {
  activePointers = snapshot.val() || {};
});

// --- 畫軌跡 ---
function drawTrace(trace, fadeOut = false) {
  if (!trace || trace.length < 2) return;
  for (let i = 1; i < trace.length; ++i) {
    const p1 = trace[i - 1];
    const p2 = trace[i];
    const now = Date.now();
    let alpha = 1;
    if (fadeOut) {
      alpha = Math.max(0, 1 - (now - p2.t) / TRACE_MAX_AGE);
    }
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = pointerRadius * 2 * alpha;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}

// --- 畫圓點 ---
function drawDot(x, y, alpha = 1) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, pointerRadius);
  gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
  gradient.addColorStop(1, `rgba(255,255,255,0)`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, pointerRadius, 0, 2 * Math.PI);
  ctx.fill();
}

// --- 讓畫布慢慢淡出 ---
function fadeCanvas() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// --- 本地離線的 trace 也要淡出 ---
let fadingTraces = []; // [{trace: [...], tEnd: time}]

// --- 本地點下產生的圓點 ---
let activeDots = []; // {x, y, t}

function animate() {
  fadeCanvas();

  // 1. 畫所有來自 firebase 的 trace
  for (const id in activePointers) {
    const pointer = activePointers[id];
    if (!pointer.trace) continue;
    const trace = pointer.trace
      .filter(p => Date.now() - p.t < TRACE_MAX_AGE)
      .map(p => ({
        x: p.x * canvas.width,
        y: p.y * canvas.height,
        t: p.t
      }));
    drawTrace(trace, true);
  }

  // 2. 畫自己本地 fading traces
  fadingTraces = fadingTraces.filter(ft => Date.now() - ft.endTime < TRACE_MAX_AGE);
  for (const ft of fadingTraces) {
    drawTrace(ft.trace, true);
  }

  // 3. 畫自己本地圓點
  const now = Date.now();
  activeDots = activeDots.filter(dot => now - dot.t < DOT_SHOW_MS);
  for (const dot of activeDots) {
    const alpha = 1 - (now - dot.t) / DOT_SHOW_MS;
    drawDot(dot.x, dot.y, alpha);
  }

  requestAnimationFrame(animate);
}
animate();

// --- 觸控（多指） ---
function handleTouchMove(e) {
  const touches = e.touches ? Array.from(e.touches) : [];
  const seen = new Set();
  const now = Date.now();

  touches.forEach(t => {
    const id = t.identifier;
    seen.add(id);
    activeTouchIds.add(id);

    // push to localTraces
    if (!localTraces[id]) localTraces[id] = [];
    localTraces[id].push({ x: t.clientX, y: t.clientY, t: now });
    localTraces[id] = localTraces[id].filter(p => now - p.t < TRACE_MAX_AGE);
    if (localTraces[id].length > TRACE_MAX_LEN) localTraces[id].shift();

    sendTrace(id, localTraces[id]);
  });

  // 清掉不在上的指頭
  activeTouchIds.forEach(id => {
    if (!seen.has(id)) {
      if (localTraces[id]) {
        fadingTraces.push({
          trace: localTraces[id].map(p => ({...p})),
          endTime: now
        });
      }
      clearTrace(id);
      delete localTraces[id];
      activeTouchIds.delete(id);
    }
  });
}

// 在 touchstart 加入圓點
canvas.addEventListener("touchstart", function(e) {
  const touches = e.touches ? Array.from(e.touches) : [];
  const now = Date.now();
  touches.forEach(t => {
    activeDots.push({ x: t.clientX, y: t.clientY, t: now });
  });
  handleTouchMove(e);
});
canvas.addEventListener("touchmove", handleTouchMove);
canvas.addEventListener("touchend", handleTouchMove);
canvas.addEventListener("touchcancel", handleTouchMove);

// 滑鼠單點邏輯
let mouseDown = false;
canvas.addEventListener("pointerdown", e => {
  mouseDown = true;
  const id = "mouse";
  const now = Date.now();
  // 新增圓點
  activeDots.push({ x: e.clientX, y: e.clientY, t: now });
  if (!localTraces[id]) localTraces[id] = [];
  localTraces[id].push({ x: e.clientX, y: e.clientY, t: now });
  localTraces[id] = localTraces[id].filter(p => now - p.t < TRACE_MAX_AGE);
  sendTrace(id, localTraces[id]);
});
canvas.addEventListener("pointermove", e => {
  if (!mouseDown) return;
  const id = "mouse";
  const now = Date.now();
  if (!localTraces[id]) localTraces[id] = [];
  localTraces[id].push({ x: e.clientX, y: e.clientY, t: now });
  localTraces[id] = localTraces[id].filter(p => now - p.t < TRACE_MAX_AGE);
  sendTrace(id, localTraces[id]);
});
canvas.addEventListener("pointerup", () => {
  mouseDown = false;
  const id = "mouse";
  const now = Date.now();
  if (localTraces[id]) {
    fadingTraces.push({
      trace: localTraces[id].map(p => ({...p})),
      endTime: now
    });
  }
  clearTrace(id);
  delete localTraces[id];
});
canvas.addEventListener("pointerleave", () => {
  mouseDown = false;
  const id = "mouse";
  const now = Date.now();
  if (localTraces[id]) {
    fadingTraces.push({
      trace: localTraces[id].map(p => ({...p})),
      endTime: now
    });
  }
  clearTrace(id);
  delete localTraces[id];
});
