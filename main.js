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
const id = Math.random().toString(36).substring(2);

let points = {};
const pointLife = 3000; // 延長壽命容忍裝置時間差

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function drawPoints() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const now = Date.now();
  for (const userId in points) {
    const trail = points[userId];
    trail.forEach(p => {
      const age = now - p.time;
      const alpha = 1 - age / pointLife;
      if (alpha <= 0) return;
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    });
  }
}

function handleInput(evt) {
  const touches = evt.touches || [evt];
  for (let t of touches) {
    const x = t.clientX / window.innerWidth;
    const y = t.clientY / window.innerHeight;
    db.ref("points/" + id).push({ x, y, time: Date.now() });
  }
}
canvas.addEventListener("mousemove", handleInput);
canvas.addEventListener("touchmove", handleInput);

db.ref("points").on("value", snapshot => {
  const data = snapshot.val();
  if (!data) return;
  const now = Date.now();
  points = {};
  for (const userId in data) {
    const trail = data[userId];
    points[userId] = Object.values(trail).filter(p => now - p.time <= pointLife);
  }
  drawPoints();
});
setInterval(drawPoints, 30);
