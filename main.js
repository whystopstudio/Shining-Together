
// Firebase 多人同步共閃畫布設定

const firebaseConfig = {
  apiKey: "AIzaSyDsWLFW4QQUaRGgyqB7KnoCXKfqiuGhW8M",
  authDomain: "shining-together.firebaseapp.com",
  databaseURL: "https://shining-together-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "shining-together",
  storageBucket: "shining-together.firebasestorage.app",
  messagingSenderId: "322280033754",
  appId: "1:322280033754:web:cc2137fbcf38226d7704e3"
};


firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

function drawCircle(x, y, opacity) {
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(255, 255, 255, " + opacity + ")";
  ctx.shadowColor = "white";
  ctx.shadowBlur = 20 * opacity;
  ctx.fill();
}

let points = [];

function draw() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const now = Date.now();
  points = points.filter(p => now - p.t < 1000);
  for (const p of points) {
    const life = (now - p.t) / 1000;
    drawCircle(p.x, p.y, 1 - life);
  }

  requestAnimationFrame(draw);
}
draw();

function sendPoint(x, y) {
  const pt = { x, y, t: Date.now() };
  db.ref("points").push(pt);
}

canvas.addEventListener("mousemove", e => {
  if (e.buttons) sendPoint(e.clientX, e.clientY);
});
canvas.addEventListener("mousedown", e => sendPoint(e.clientX, e.clientY));
canvas.addEventListener("touchmove", e => {
  for (let t of e.touches) sendPoint(t.clientX, t.clientY);
  e.preventDefault();
}, { passive: false });
canvas.addEventListener("touchstart", e => {
  for (let t of e.touches) sendPoint(t.clientX, t.clientY);
  e.preventDefault();
}, { passive: false });

db.ref("points").on("child_added", snapshot => {
  const pt = snapshot.val();
  points.push(pt);
});
