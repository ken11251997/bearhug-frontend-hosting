// 🎮 エンドレスブロック崩し：ゲームロジック（スコア＆タイムボーナス対応）
document.addEventListener("DOMContentLoaded", () => {
  const openingScreen = document.getElementById("opening-screen");
  const countdownText = document.getElementById("countdown-text");
  const gameCanvasWrapper = document.getElementById("game-canvas");
  const scoreEl = document.getElementById("score");
  const timerEl = document.getElementById("timer");
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const canvasRect = canvas.getBoundingClientRect();

  const paddleWidth = canvas.width * 0.25;
  const paddleHeight = 10;
  let paddleX = (canvas.width - paddleWidth) / 2;

  canvas.addEventListener("touchstart", handleTouch);
  canvas.addEventListener("touchmove", handleTouch);

  function handleTouch(e) {
    const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    paddleX = touchX - paddleWidth / 2;
    if (paddleX < 0) paddleX = 0;
    if (paddleX + paddleWidth > canvas.width) paddleX = canvas.width - paddleWidth;
  }

  const bonusEl = document.createElement("div");
  bonusEl.style.position = "absolute";
  bonusEl.style.top = "10px";
  bonusEl.style.left = "50%";
  bonusEl.style.transform = "translateX(-50%)";
  bonusEl.style.fontSize = "1.2rem";
  bonusEl.style.fontWeight = "bold";
  bonusEl.style.color = "green";
  bonusEl.style.textShadow = "1px 1px 0 white";
  bonusEl.style.display = "none";
  document.body.appendChild(bonusEl);


  const ballRadius = 8;
  let balls = [{ x: canvas.width / 2, y: canvas.height - 30, dx: 2, dy: -2 }];

  let rightPressed = false;
  let leftPressed = false;

  const brickColumnCount = 6;
  const brickPadding = 4;
  const brickOffsetTop = 30;
  const brickOffsetLeft = 10;

  const brickWidth = (canvas.width - brickOffsetLeft * 2 - brickPadding * (brickColumnCount - 1)) / brickColumnCount;
  const brickHeight = 15;

  let score = 0;
  let stage = 1;
  let timer = 180;
  let timerInterval = null;
  let bricks = [];

  let itemBricks = [];

  document.addEventListener("keydown", (e) => {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
  });

  document.getElementById("start-button").addEventListener("click", () => {
    openingScreen.classList.add("hidden");
    countdownText.classList.remove("hidden");
    setTimeout(() => {
      countdownText.classList.add("hidden");
      gameCanvasWrapper.classList.remove("hidden");
      initGame();
    }, 1500);
  });

  function initGame() {
    createBricks();
    timerInterval = setInterval(() => {
      timer--;
      timerEl.textContent = timer;
      if (timer <= 0) {
        clearInterval(timerInterval);
        alert("時間切れ！ゲームオーバー");
        document.location.reload();
      }
    }, 1000);
    draw();
  }

  function createBricks() {
    bricks = [];
    itemBricks = [];

    const hardnessMap = [];
    const mode = (stage - 1) % 4 + 1;
    for (let i = 0; i < brickColumnCount * brickRowCount; i++) {
      if (mode === 1) hardnessMap.push(1);
      else if (mode === 2) hardnessMap.push(i < 25 ? 1 : 2);
      else if (mode === 3) hardnessMap.push(2);
      else if (mode === 4) hardnessMap.push(i < 25 ? 2 : 3);
    }
    hardnessMap.sort(() => Math.random() - 0.5);

    const itemIndices = new Set();
    while (itemIndices.size < 3) {
      itemIndices.add(Math.floor(Math.random() * hardnessMap.length));
    }

    let index = 0;
    for (let c = 0; c < brickColumnCount; c++) {
      bricks[c] = [];
      for (let r = 0; r < brickRowCount; r++) {
        const hardness = hardnessMap[index];
        const isItem = itemIndices.has(index);
        bricks[c][r] = {
          x: 0, y: 0,
          status: 1,
          hardness,
          isItem
        };
        index++;
      }
    }
  }

  function createExplosion(x, y) {
    const exp = document.createElement("div");
    exp.className = "explosion";
    exp.style.left = `${canvasRect.left + x - 5}px`;
    exp.style.top = `${canvasRect.top + y - 5}px`;
    document.body.appendChild(exp);
    setTimeout(() => exp.remove(), 400);
  }

  function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        const b = bricks[c][r];
        if (b.status > 0) {
          const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
          const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
          b.x = brickX;
          b.y = brickY;
          ctx.beginPath();
          ctx.rect(brickX, brickY, brickWidth, brickHeight);
          ctx.fillStyle = b.isItem ? "gold" : ["#66ccff", "#3399ff", "#003366"][b.hardness - 1];
          ctx.fill();
          ctx.closePath();
        }
      }
    }
  }

  function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.closePath();
  }

  function drawBalls() {
    for (const ball of balls) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.closePath();
    }
  }

  function collisionDetection() {
    for (const ball of balls) {
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          const b = bricks[c][r];
          if (b.status > 0) {
            if (
              ball.x > b.x &&
              ball.x < b.x + brickWidth &&
              ball.y > b.y &&
              ball.y < b.y + brickHeight
            ) {
              ball.dy = -ball.dy;
              b.hardness--;
              score += 100; // 💯 1回当てるごとに100点
              scoreEl.textContent = score;

              if (b.hardness <= 0) {
                b.status = 0;
                createExplosion(b.x + brickWidth / 2, b.y + brickHeight / 2);
              }

              if (b.isItem) {
                balls.push({ x: ball.x, y: ball.y, dx: -2, dy: -2 });
              }
            }
          }
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBalls();
    drawPaddle();
    collisionDetection();

    for (let i = balls.length - 1; i >= 0; i--) {
      const ball = balls[i];
      if (ball.x + ball.dx > canvas.width - ballRadius || ball.x + ball.dx < ballRadius) ball.dx = -ball.dx;
      if (ball.y + ball.dy < ballRadius) ball.dy = -ball.dy;
      else if (ball.y + ball.dy > canvas.height - ballRadius) {
        if (ball.x > paddleX && ball.x < paddleX + paddleWidth) {
          ball.dy = -ball.dy;
        } else {
          balls.splice(i, 1);
        }
      }

      ball.x += ball.dx;
      ball.y += ball.dy;
    }

    if (balls.length === 0) {
      clearInterval(timerInterval);
      alert("すべてのボールを落としました。ゲームオーバー");
      document.location.reload();
      return;
    }

    if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 5;
    else if (leftPressed && paddleX > 0) paddleX -= 5;

    const allCleared = bricks.flat().every(b => b.status === 0);
    if (allCleared) {
      const bonus = timer * 100; // ⏳ タイムボーナス
      score += bonus;
      scoreEl.textContent = score;
      bonusEl.textContent = `タイムボーナス +${bonus}点！`;
      bonusEl.style.display = "block";
      setTimeout(() => {
        bonusEl.style.display = "none";
      }, 3000);

      stage++;
      timer = 180;
      timerEl.textContent = timer;
      createBricks();
    }

    requestAnimationFrame(draw);
  }
});
