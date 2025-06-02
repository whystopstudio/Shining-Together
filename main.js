const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
resizeCanvas();

window.addEventListener('resize', resizeCanvas);
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Firebase init
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
const pointerRadius = 40;

function sendPosition(pointerId, x, y) {
  db.ref("pointers/" + userId + "_" + pointerId).set({
    x: x / canvas.width,
    y: y / canvas.height,
    t: Date.now()  // 改回本地時間以即時反應
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

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

let activePoints = {};

db.ref("pointers").on("value", snapshot => {
  const data = snapshot.val() || {};
  activePoints = data;
});

function animate() {
  clearCanvas();
  const now = Date.now();
  for (const id in activePoints) {
    const p = activePoints[id];
    const age = now - (p.t || 0);
    if (age < 2000) {
      const x = p.x * canvas.width;
      const y = p.y * canvas.height;
      const alpha = 1 - age / 2000;
      drawCircle(x, y, alpha);
    }
  }
  requestAnimationFrame(animate);
}
animate();

// 多指觸控處理
function handleTouchMove(e) {
  const touches = e.touches ? Array.from(e.touches) : [];
  touches.forEach(t => {
    sendPosition(t.identifier, t.clientX, t.clientY);
  });
}

function handleTouchEnd(e) {
  const changed = e.changedTouches ? Array.from(e.changedTouches) : [];
  changed.forEach(t => {
    clearPosition(t.identifier);
  });
}

canvas.addEventListener("touchstart", handleTouchMove);
canvas.addEventListener("touchmove", handleTouchMove);
canvas.addEventListener("touchend", handleTouchEnd);
canvas.addEventListener("touchcancel", handleTouchEnd);

// 滑鼠也支援（單一指標）
canvas.addEventListener("pointerdown", e => sendPosition("mouse", e.clientX, e.clientY));
canvas.addEventListener("pointermove", e => {
  if (e.buttons > 0) {
    sendPosition("mouse", e.clientX, e.clientY);
  }
});
canvas.addEventListener("pointerup", () => clearPosition("mouse"));
canvas.addEventListener("pointerleave", () => clearPosition("mouse"));
