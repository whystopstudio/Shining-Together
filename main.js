
// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDsWLFW4QQUaRGgyqB7KnoCXKfqiuGhW8M",
  authDomain: "shining-together.firebaseapp.com",
  projectId: "shining-together",
  storageBucket: "shining-together.firebasestorage.app",
  messagingSenderId: "322280033754",
  appId: "1:322280033754:web:cc2137fbcf38226d7704e3",
  databaseURL: "https://shining-together-default-rtdb.asia-southeast1.firebasedatabase.app"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function drawCircle(x, y, opacity) {
  ctx.beginPath();
  ctx.arc(x * canvas.width, y * canvas.height, 10, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(255, 255, 255, " + opacity + ")";
  ctx.shadowColor = "white";
  ctx.shadowBlur = 10 * opacity;
  ctx.fill();
}

canvas.addEventListener("pointermove", (e) => {
  sendPoint(e.clientX, e.clientY);
});
canvas.addEventListener("pointerdown", (e) => {
  sendPoint(e.clientX, e.clientY);
});

function sendPoint(x, y) {
  const pt = {
    x: x / window.innerWidth,
    y: y / window.innerHeight,
    t: Date.now()
  };
  db.ref("points").push(pt);
}

let points = [];

db.ref("points").on("child_added", (snap) => {
  const pt = snap.val();
  points.push(pt);
});

function animate() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const now = Date.now();
  points = points.filter(pt => now - pt.t < 1000);
  for (let pt of points) {
    const opacity = 1 - (now - pt.t) / 1000;
    drawCircle(pt.x, pt.y, opacity);
  }

  requestAnimationFrame(animate);
}
animate();
