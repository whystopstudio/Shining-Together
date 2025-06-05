
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
const pointerRadius = 30;
const activeTouchIds = new Set();
const touchIntervals = {};

function sendPosition(pointerId, x, y) {
  db.ref("pointers/" + userId + "_" + pointerId).set({
    x: x / canvas.width,
    y: y / canvas.height,
    t: Date.now()
  });
}

function clearPosition(pointerId) {
  db.ref("pointers/" + userId + "_" + pointerId).remove();
}

function drawCircle(x, y, alpha = 1) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, pointerRadius);
  gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
  gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, pointerRadius, 0, 2 * Math.PI);
  ctx.fill();
}

function fadeCanvas() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

let activePoints = {};

db.ref("pointers").on("value", snapshot => {
  activePoints = snapshot.val() || {};
});

function animate() {
  fadeCanvas();
  const now = Date.now();
  for (const id in activePoints) {
    const p = activePoints[id];
    const age = now - (p.t || 0);
    if (age < 300) {
      const x = p.x * canvas.width;
      const y = p.y * canvas.height;
      const alpha = 1 - age / 300;
      drawCircle(x, y, alpha);
    }
  }
  requestAnimationFrame(animate);
}
animate();

function handleTouchStart(e) {
  Array.from(e.changedTouches).forEach(t => {
    const id = t.identifier;
    sendPosition(id, t.clientX, t.clientY);
    activeTouchIds.add(id);

    if (!touchIntervals[id]) {
      touchIntervals[id] = setInterval(() => {
        sendPosition(id, t.clientX, t.clientY);
      }, 100);
    }
  });
}

function handleTouchMove(e) {
  Array.from(e.touches).forEach(t => {
    sendPosition(t.identifier, t.clientX, t.clientY);
  });
}

function handleTouchEnd(e) {
  Array.from(e.changedTouches).forEach(t => {
    const id = t.identifier;
    clearPosition(id);
    activeTouchIds.delete(id);
    clearInterval(touchIntervals[id]);
    delete touchIntervals[id];
  });
}

canvas.addEventListener("touchstart", handleTouchStart);
canvas.addEventListener("touchmove", handleTouchMove);
canvas.addEventListener("touchend", handleTouchEnd);
canvas.addEventListener("touchcancel", handleTouchEnd);

canvas.addEventListener("pointerdown", e => {
  sendPosition("mouse", e.clientX, e.clientY);
});
canvas.addEventListener("pointermove", e => {
  if (e.buttons > 0) sendPosition("mouse", e.clientX, e.clientY);
});
canvas.addEventListener("pointerup", () => clearPosition("mouse"));
canvas.addEventListener("pointerleave", () => clearPosition("mouse"));
