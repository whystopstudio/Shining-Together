
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
let fadingPoints = {}; // {id: {x, y, start, duration}}

db.ref("pointers").on("value", snapshot => {
  activePoints = snapshot.val() || {};
});

// 更新 fadingPoints：當 pointer 被 lift up，就開始記錄它淡出
function updateFadingPoints(current) {
  // 清除已經淡出結束的點
  const now = Date.now();
  for (const id in fadingPoints) {
    if (now - fadingPoints[id].start > fadingPoints[id].duration) {
      delete fadingPoints[id];
    }
  }
  // 對比 activePoints 與 current: current 裡有但 activePoints 沒有，就加入 fading
  for (const id in current) {
    if (!(id in activePoints) && !(id in fadingPoints)) {
      // 預設淡出 0.3 秒
      fadingPoints[id] = {
        x: current[id].x,
        y: current[id].y,
        start: Date.now(),
        duration: 300
      };
    }
  }
}

let lastAllPoints = {}; // 上一禎畫面所有點

function animate() {
  fadeCanvas();
  const now = Date.now();
  // 畫 activePoints（活著的都亮著）
  for (const id in activePoints) {
    const p = activePoints[id];
    const x = p.x * canvas.width;
    const y = p.y * canvas.height;
    drawCircle(x, y, 1);
  }
  // 畫 fadingPoints（逐漸淡出）
  for (const id in fadingPoints) {
    const f = fadingPoints[id];
    const progress = Math.min(1, (now - f.start) / f.duration);
    drawCircle(f.x * canvas.width, f.y * canvas.height, 1 - progress);
  }
  requestAnimationFrame(animate);
  lastAllPoints = {...activePoints}; // 儲存上一輪
}
animate();

// 監控 pointer 被 lift up 時記錄 fading
setInterval(() => {
  updateFadingPoints(lastAllPoints);
}, 50);

// --- 觸控事件 ---
function handleTouchMove(e) {
  const touches = e.touches ? Array.from(e.touches) : [];
  const seen = new Set();

  touches.forEach(t => {
    sendPosition(t.identifier, t.clientX, t.clientY);
    seen.add(t.identifier);
    activeTouchIds.add(t.identifier);
  });

  activeTouchIds.forEach(id => {
    if (!seen.has(id)) {
      clearPosition(id);
      activeTouchIds.delete(id);
    }
  });
}
canvas.addEventListener("touchstart", handleTouchMove);
canvas.addEventListener("touchmove", handleTouchMove);
canvas.addEventListener("touchend", handleTouchMove);
canvas.addEventListener("touchcancel", handleTouchMove);

// --- 滑鼠/觸控筆 ---
let mouseDown = false;
canvas.addEventListener("pointerdown", e => {
  mouseDown = true;
  sendPosition("mouse", e.clientX, e.clientY);
});
canvas.addEventListener("pointermove", e => {
  if (mouseDown || e.buttons > 0) sendPosition("mouse", e.clientX, e.clientY);
});
canvas.addEventListener("pointerup", () => {
  clearPosition("mouse");
  mouseDown = false;
});
canvas.addEventListener("pointerleave", () => {
  clearPosition("mouse");
  mouseDown = false;
});
