
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
resizeCanvas();

window.addEventListener('resize', resizeCanvas);
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

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
const pointerRadius = 20;
const TRACE_MAX_AGE = 800;
const TRACE_MAX_LEN = 30;
const activeTouchIds = new Set();
const touchIntervals = {};

function sendTrace(pointerId, trace) {
  db.ref("pointers/" + userId + "_" + pointerId).set({
    trace: trace.map(p => ({ x: p.x / canvas.width, y: p.y / canvas.height, t: p.t })),
    t: Date.now()
  });
}

function clearTrace(pointerId) {
  db.ref("pointers/" + userId + "_" + pointerId).remove();
}

const localTraces = {};
let activePointers = {};
let fadingTraces = [];

db.ref("pointers").on("value", snapshot => {
  activePointers = snapshot.val() || {};
});

function drawTraceAsDots(trace) {
  const now = Date.now();
  trace.forEach(p => {
    const alpha = 1 - (now - p.t) / TRACE_MAX_AGE;
    if (alpha > 0) drawCircle(p.x, p.y, alpha);
  });
}

function drawCircle(x, y, alpha = 1) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, pointerRadius * 1.5);
  gradient.addColorStop(0, `rgba(255,255,255,${alpha * 1.2})`);
  gradient.addColorStop(1, `rgba(255,255,255,0)`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, pointerRadius * 1.5, 0, 2 * Math.PI);
  ctx.fill();
}

function fadeCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function animate() {
  fadeCanvas();
  const now = Date.now();

  for (const id in activePointers) {
    const pointer = activePointers[id];
    if (!pointer.trace) continue;
    const trace = pointer.trace
      .filter(p => now - p.t < TRACE_MAX_AGE)
      .map(p => ({
        x: p.x * canvas.width,
        y: p.y * canvas.height,
        t: p.t
      }));
    drawTraceAsDots(trace);
  }

  fadingTraces = fadingTraces.filter(ft => now - ft.endTime < TRACE_MAX_AGE);
  for (const ft of fadingTraces) {
    drawTraceAsDots(ft.trace);
  }

  requestAnimationFrame(animate);
}
animate();

function handleTouchMove(e) {
  const touches = e.touches ? Array.from(e.touches) : [];
  const seen = new Set();
  const now = Date.now();

  touches.forEach(t => {
    const pointerId = t.identifier;
    const now = Date.now();
    if (!touchIntervals[id]) {
      touchIntervals[id] = setInterval(() => {
        if (localTraces[id] && localTraces[id].length > 0) {
          const last = localTraces[id][localTraces[id].length - 1];
          const last = localTraces[id][localTraces[id].length - 1];
      localTraces[pointerId].push({ x: last.x, y: last.y, t: Date.now() });
      localTraces[pointerId] = localTraces[id].slice(-TRACE_MAX_LEN);
      sendTrace(pointerId, localTraces[pointerId]);
        }
      }, 100);
    }
    const id = t.identifier;
    seen.add(pointerId);
    activeTouchIds.add(pointerId);
    if (!localTraces[pointerId]) localTraces[pointerId] = [];
    localTraces[pointerId].push({ x: t.clientX, y: t.clientY, t: now });
    localTraces[pointerId] = localTraces[id].filter(p => now - p.t < TRACE_MAX_AGE);
    if (localTraces[id].length > TRACE_MAX_LEN) localTraces[id].shift();
    const last = localTraces[id][localTraces[id].length - 1];
      localTraces[pointerId].push({ x: last.x, y: last.y, t: Date.now() });
      localTraces[pointerId] = localTraces[id].slice(-TRACE_MAX_LEN);
      sendTrace(pointerId, localTraces[pointerId]);
  });

  activeTouchIds.forEach(id => {
    clearInterval(touchIntervals[id]);
    delete touchIntervals[id];
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

canvas.addEventListener("touchstart", handleTouchMove);
canvas.addEventListener("touchmove", handleTouchMove);
canvas.addEventListener("touchend", handleTouchMove);
canvas.addEventListener("touchcancel", handleTouchMove);

let mouseDown = false;
  clearInterval(mouseInterval);
let mouseInterval;
canvas.addEventListener("pointerdown", e => {
  mouseDown = true;
  const id = "mouse";
  const now = Date.now();
  if (!localTraces[pointerId]) localTraces[pointerId] = [];
  localTraces[pointerId].push({ x: e.clientX, y: e.clientY, t: now });
  localTraces[pointerId] = localTraces[id].filter(p => now - p.t < TRACE_MAX_AGE);
  const last = localTraces[id][localTraces[id].length - 1];
      localTraces[pointerId].push({ x: last.x, y: last.y, t: Date.now() });
      localTraces[pointerId] = localTraces[id].slice(-TRACE_MAX_LEN);
      sendTrace(pointerId, localTraces[pointerId]);
  mouseInterval = setInterval(() => {
    if (localTraces[id] && localTraces[id].length > 0) {
      const last = localTraces[id][localTraces[id].length - 1];
      localTraces[pointerId].push({ x: last.x, y: last.y, t: Date.now() });
      localTraces[pointerId] = localTraces[id].slice(-TRACE_MAX_LEN);
      sendTrace(pointerId, localTraces[pointerId]);
    }
  }, 100);

  mouseDown = true;
  const id = "mouse";
  const now = Date.now();
  if (!localTraces[pointerId]) localTraces[pointerId] = [];
  localTraces[pointerId].push({ x: e.clientX, y: e.clientY, t: now });
  localTraces[pointerId] = localTraces[id].filter(p => now - p.t < TRACE_MAX_AGE);
  const last = localTraces[id][localTraces[id].length - 1];
      localTraces[pointerId].push({ x: last.x, y: last.y, t: Date.now() });
      localTraces[pointerId] = localTraces[id].slice(-TRACE_MAX_LEN);
      sendTrace(pointerId, localTraces[pointerId]);
});
canvas.addEventListener("pointermove", e => {
  if (!mouseDown) return;
  const id = "mouse";
  const now = Date.now();
  if (!localTraces[pointerId]) localTraces[pointerId] = [];
  localTraces[pointerId].push({ x: e.clientX, y: e.clientY, t: now });
  localTraces[pointerId] = localTraces[id].filter(p => now - p.t < TRACE_MAX_AGE);
  const last = localTraces[id][localTraces[id].length - 1];
      localTraces[pointerId].push({ x: last.x, y: last.y, t: Date.now() });
      localTraces[pointerId] = localTraces[id].slice(-TRACE_MAX_LEN);
      sendTrace(pointerId, localTraces[pointerId]);
});
canvas.addEventListener("pointerup", () => {
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
  mouseDown = false;
  clearInterval(mouseInterval);
});
canvas.addEventListener("pointerleave", () => {
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
  mouseDown = false;
  clearInterval(mouseInterval);
});
