
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

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

const id = Math.random().toString(36).substring(2);

function draw(x, y, alpha = 1) {
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, 2 * Math.PI);
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.fill();
}

function fadeCanvas() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
setInterval(fadeCanvas, 50);

function writePoint(x, y) {
  db.ref("pointers/" + id).set({
    x: x / canvas.width,
    y: y / canvas.height,
    t: Date.now()
  });
}

function clearPoint() {
  db.ref("pointers/" + id).remove();
}

canvas.addEventListener("pointerdown", (e) => writePoint(e.clientX, e.clientY));
canvas.addEventListener("pointermove", (e) => {
  if (e.buttons > 0 || e.pressure > 0) writePoint(e.clientX, e.clientY);
});
canvas.addEventListener("pointerup", clearPoint);
canvas.addEventListener("pointercancel", clearPoint);
canvas.addEventListener("touchend", clearPoint);
canvas.addEventListener("touchcancel", clearPoint);
canvas.addEventListener("touchstart", (e) => {
  for (let t of e.touches) writePoint(t.clientX, t.clientY);
});
canvas.addEventListener("touchmove", (e) => {
  for (let t of e.touches) writePoint(t.clientX, t.clientY);
});

firebase.database().ref("pointers").on("value", (snap) => {
  const data = snap.val();
  if (!data) return;
  const now = Date.now();
  for (let key in data) {
    const { x, y, t } = data[key];
    const age = now - t;
    if (age < 2000) {
      draw(x * canvas.width, y * canvas.height, 1 - age / 2000);
    }
  }
});
