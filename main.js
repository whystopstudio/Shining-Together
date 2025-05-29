const firebaseConfig = {
  apiKey: "AIzaSyDsWLFW4QQUaRGgyqB7KnoCXKfqiuGhW8M",
  authDomain: "shining-together.firebaseapp.com",
  databaseURL: "https://shining-together-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "shining-together",
  storageBucket: "shining-together.appspot.com",
  messagingSenderId: "322280033754",
  appId: "1:322280033754:web:cc2137fbcf38226d7704e3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let points = {};
const pointLife = 1000;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function drawPoints() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const now = Date.now();
  for (const id in points) {
    const trail = points[id];
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      const age = now - p.time;
      const alpha = 1 - age / pointLife;
      if (alpha <= 0) continue;
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }
  }
}

function updatePoint(id, x, y) {
  const now = Date.now();
  if (!points[id]) points[id] = [];
  points[id].push({ x, y, time: now });
  points[id] = points[id].filter(p => now - p.time <= pointLife);
  drawPoints();
}

function handleInput(evt) {
  const touches = evt.touches || [evt];
  for (let t of touches) {
    const x = t.clientX / window.innerWidth;
    const y = t.clientY / window.innerHeight;
    db.ref("points/" + id).set({ x, y, t: Date.now() });
  }
}
canvas.addEventListener("mousemove", handleInput);
canvas.addEventListener("touchmove", handleInput);

const id = Math.random().toString(36).substring(2);
db.ref("points").on("value", snapshot => {
  const data = snapshot.val();
  if (!data) return;
  for (const key in data) {
    if (data[key].t) updatePoint(key, data[key].x, data[key].y);
  }
});
setInterval(drawPoints, 30);
