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
  const user_id = new URLSearchParams(window.location.search).get("user_id");

  const loadingOverlay = document.getElementById("loading-overlay");
  
  const bgImage = new Image();
  bgImage.src = "static/img/block.jpg";  // あなたの背景画像のパスに合わせてください

  bgI
mage.onload = () => {
    loadingOverlay.style.display = "none";
    console.log("✅ 背景画像の読み込み完了");
  };
  bgImage.onerror = () => {
    loadingOverlay.style.display = "none";
    console.warn("⚠️ 背景画像の読み込みに失敗");
  };

  const wallHitSound = new Audio("static/sound/wall_hit.mp3");
  const blockHitSound = new Audio("static/sound/block_hit.mp3");
  const blastSound = new Audio("static/sound/blast.mp3");

  

  const paddleWidth = canvas.width * 0.25;
  const paddleHeight = 10;
  let paddleX = (canvas.width - paddleWidth) / 2;

  canvas.addEventListener("touchstart", handleTouch);
  canvas.addEventListener("touchmove", handleTouch);

  const rankingBtns = document.querySelectorAll("#ranking-btn, #ranking-again-btn");
  rankingBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("ranking-modal").classList.remove("hidden");
      loadRanking("mbti_median");
    });
  });

  function handleTouch(e) {
    const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    paddleX = touchX - paddleWidth / 2;
    if (paddleX < 0) paddleX = 0;
    if (paddleX + paddleWidth > canvas.width) paddleX = canvas.width - paddleWidth;
  }

  const bonusEl = document.createElement("div");
  bonusEl.className = "bonus-message"; // ← CSSで定義されたclassに変更
  bonusEl.style.display = "none"; // 表示非表示はJS側で制御


  canvas.width = Math.min(window.innerWidth * 0.9, 420);
  canvas.height = canvas.width * 1.3;  // ★縦を縮小（1.6 → 1.3）



  const ballRadius = 8;
  let balls = [{ x: canvas.width / 2, y: canvas.height - 30, dx: 3, dy: -3 }]; // ★速度アップ

  let fallingItems = [];

  // 🎁 追加：アイテムを生成（type: "ball" or "bomb"）
  function spawnItem(x, y, type) {
    fallingItems.push({ x, y, dy: 2, type });
  }


  let rightPressed = false;
  let leftPressed = false;

  const brickColumnCount = 6;
  const brickRowCount = 4; // ← ★これを追加！
  const brickPadding = 4;
  const brickOffsetTop = 30;
  const brickOffsetLeft = canvas.width * 0.08; 

  const brickWidth = (canvas.width - brickOffsetLeft * 2 - brickPadding * (brickColumnCount - 1)) / brickColumnCount;
  const brickHeight = 15;

  const basePath = "/bearhug-frontend-hosting";

  const blockImages = {
  1: new Image(),
  2: new Image(),
  3: new Image(),
  4: new Image(),
  5: new Image(),
  item: new Image()
  };

  blockImages[1].src = `${basePath}/static/img/block_1.png`;
  blockImages[2].src = `${basePath}/static/img/block_2.png`;
  blockImages[3].src = `${basePath}/static/img/block_3.png`;
  blockImages[4].src = `${basePath}/static/img/block_4.png`;
  blockImages[5].src = `${basePath}/static/img/block_5.png`;
  
  const itemImages = {
    ball: new Image(),
    blast: new Image()
  };
  itemImages.ball.src = `${basePath}/static/img/item_ball.png`;
  itemImages.blast.src = `${basePath}/static/img/item_blast.png`;
    
  // if (b.isItem) {
  //   ctx.drawImage(itemImages[b.itemType], brickX, brickY, brickWidth, brickHeight);
  // } else {
  //   ctx.drawImage(blockImages[b.hardness], brickX, brickY, brickWidth, brickHeight);
  // }


  let score = 0;
  let stage = 1;
  let timer = 180;
  let timerInterval = null;
  let bricks = [];


  document.addEventListener("keydown", (e) => {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
  });

  // document.getElementById("start-button").addEventListener("click", () => {
  //   openingScreen.classList.add("hidden");
  //   countdownText.classList.remove("hidden");
  //   setTimeout(() => {
  //     countdownText.classList.add("hidden");
  //     gameCanvasWrapper.classList.remove("hidden");
  //     initGame();
  //   }, 1500);
  // });


  const startBtn = document.getElementById("start-button"); // ✅ 追加

  startBtn.addEventListener("click", () => {
    startBtn.disabled = true;
    console.log("▶ start-button clicked");  // ✅ 追加
    console.log("🧪 user_id:", user_id);     // ✅ 追加

    if (!user_id) {
      console.warn("⚠️ user_id が見つかりません。ローカルモードで開始します。");
      beginGameFlow();  // ← ローカルモードでも開始
      return;
    }

    fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/game/play_start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id })
    })
    .then(async res => {
      if (res.status === 429) {
        alert("無料プレイ回数が上限に達しました。\n広告を見ると続行できます。");
        onWatchAd("game");
        return;
      }
      const data = await res.json();
      if (data.show_ad) {
        onWatchAd("game");
      } else {
        beginGameFlow();
      }
    })
    .catch(err => {
      console.error("通信エラー:", err);
      alert("通信エラー:");
      startBtn.disabled = false; // 復旧
    });
  });



  function beginGameFlow() {
    console.log("🚀 beginGameFlow 開始"); // ← 追加
    openingScreen.classList.add("hidden");
    countdownText.classList.remove("hidden");
    console.log("📺 countdownText 表示中");

    loadImages(() => {
      setTimeout(() => {
        console.log("✅ 画像読み込み完了。initGame呼び出し");
        countdownText.classList.add("hidden");
        gameCanvasWrapper.classList.remove("hidden");
        console.log("🕹️ gameCanvasWrapper 表示");
        initGame(); // ✅ 全画像読み込み後にゲーム開始
      }, 1500);
    });
  }


  function loadImages(callback) {
    let loaded = 0;
    const total = 5 + 2; // block[1〜5] + item[ball, blast]

    function check() {
      loaded++;
      console.log(`✅ 読み込み ${loaded} / ${total}`);
      if (loaded === total) callback();
    }

    console.log("🧪 画像読み込み開始");

    for (let i = 1; i <= 5; i++) {
      blockImages[i] = new Image();
      blockImages[i].onload = check;
      blockImages[i].onerror = () => console.warn(`❌ block_${i}.png 読み込み失敗`);
      blockImages[i].src = `${basePath}/static/img/block_${i}.png`;
    }

    ["ball", "blast"].forEach(k => {
      itemImages[k] = new Image();
      itemImages[k].onload = check;
      itemImages[k].onerror = () => console.warn(`❌ item_${k}.png 読み込み失敗`);
      itemImages[k].src = `${basePath}/static/img/item_${k}.png`;
    });
  }



  function initGame() {
    createBricks();
    timerInterval = setInterval(() => {
      timer--;
      timerEl.textContent = timer;
      if (timer <= 0) {
        clearInterval(timerInterval);
        alert("時間切れ！ゲームオーバー");
        showResult(score);
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
        const types = ["ball", "blast"];
        const itemType = types[Math.floor(Math.random() * types.length)];
        bricks[c][r] = {
          x: 0, y: 0,
          status: 1,
          hardness,
          // isItem: true,
          // itemType: itemIndices.has(index) ? types[Math.floor(Math.random() * types.length)] : null
          isItem: isItem,
          itemType: isItem ? itemType : null  // ← 破壊時にのみ落とす
        };
        index++;
      }
    }
  }


  function createExplosion(x, y) {
    const rect = canvas.getBoundingClientRect();  // ★リアルタイムで取得
    const exp = document.createElement("div");
    exp.className = "explosion";
    exp.style.left = `${rect.left + x - 5}px`;
    exp.style.top = `${rect.top + y - 5}px`;
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

          const image = b.itemType
            ? itemImages[b.itemType]
            : blockImages[b.hardness];

          // ✅ 安全に描画
          if (image && image.complete && image.naturalHeight !== 0) {
            ctx.drawImage(blockImages[b.hardness], brickX, brickY, brickWidth, brickHeight);
          } else {
            // 読み込み失敗時の予備描画
            ctx.fillStyle = "gray";
            ctx.fillRect(brickX, brickY, brickWidth, brickHeight);
          }
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
              blockHitSound.currentTime = 0;
              blockHitSound.play();
              b.hardness--;
              score += 100; // 💯 1回当てるごとに100点
              scoreEl.textContent = score;

              if (b.hardness <= 0) {
                b.status = 0;
                createExplosion(b.x + brickWidth / 2, b.y + brickHeight / 2);

                if (b.isItem) {
                  spawnItem(b.x + brickWidth / 2, b.y + brickHeight / 2, b.itemType);
                }
              }

              if (b.isItem) {
                const rand = Math.random();
                if (rand < 0.75) {
                  spawnItem(b.x + brickWidth / 2, b.y + brickHeight / 2, "ball");
                } else {
                  spawnItem(b.x + brickWidth / 2, b.y + brickHeight / 2, "blast");
                }
              }
            }
          }
        }
      }
    }
  }

  function triggerFullScreenExplosion() {
    const flash = document.createElement("div");
    flash.className = "fullscreen-explosion";
    blastSound.currentTime = 0;
    blastSound.play(); // ← ここ！
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 400);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBalls();
    drawPaddle();
    // 🎁 追加：アイテムの描画・当たり判定処理
    for (let i = fallingItems.length - 1; i >= 0; i--) {
      const item = fallingItems[i];
      item.y += item.dy;

      // 描画（アイテムの色はタイプで変化）
      // ctx.beginPath();
      // ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
      // ctx.fillStyle = item.type === "ball" ? "gold" : "red";
      // ctx.fill();
      // ctx.closePath();
      // ctx.drawImage(itemImages[item.type], item.x - 8, item.y - 8, 16, 16);
      // ctx.drawImage(
      //   itemImages[item.type],
      //   item.x - ballRadius,
      //   item.y - ballRadius,
      //   ballRadius * 2,
      //   ballRadius * 2
      // );
      let itemSize;
      switch (item.type) {
        case "ball":
          itemSize = 24;
          break;
        case "blast":
          itemSize = 28;
          break;
        default:
          itemSize = 20;
      }
      ctx.drawImage(itemImages[item.type], item.x - itemSize / 2, item.y - itemSize / 2, itemSize, itemSize);
      

      // パドルと当たったか判定
      if (
        item.y + 8 > canvas.height - paddleHeight &&
        item.x > paddleX &&
        item.x < paddleX + paddleWidth
      ) {
        if (item.type === "ball") {
          balls.push({ x: item.x, y: item.y, dx: 3, dy: -3 }); // ★ボール増加
        } else if (item.type === "blast") {
          // ★爆弾：全ブロックに1ダメージ
          triggerFullScreenExplosion();
          bricks.flat().forEach(b => {
            if (b.status > 0) {
              b.hardness--;
              if (b.hardness <= 0) {
                b.status = 0;
                createExplosion(b.x + brickWidth / 2, b.y + brickHeight / 2);
              }
            }
          });
        }
        fallingItems.splice(i, 1); // アイテムを削除
      } else if (item.y > canvas.height) {
        fallingItems.splice(i, 1); // 落下しきったら削除
      }
    }

    collisionDetection();

    for (let i = balls.length - 1; i >= 0; i--) {
      const ball = balls[i];
      if (ball.x + ball.dx > canvas.width - ballRadius || ball.x + ball.dx < ballRadius) {
        ball.dx = -ball.dx;
        wallHitSound.currentTime = 0;
        wallHitSound.play(); // ← ここ！
      }
      if (ball.y + ball.dy < ballRadius) {
        ball.dy = -ball.dy;
        wallHitSound.currentTime = 0;
        wallHitSound.play(); // ← ここ！
        
      }
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
      showResult(score);
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


  function showResult(score) {
    // 表示切り替え
    gameCanvasWrapper.classList.add("hidden");
    document.getElementById("result-screen").classList.remove("hidden");

    // スコアを表示
    const formatted = score.toLocaleString();
    document.getElementById("final-score").textContent = `スコア：${formatted} 点`;

    // スコア送信（任意）
    fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/game/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user_id,
        game_name: "block_game",
        score: score
      }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.best !== undefined) {
        const bestScoreEl = document.getElementById("best-score");
        bestScoreEl.classList.remove("hidden");
        bestScoreEl.textContent = `自己ベスト：${parseInt(data.best).toLocaleString()} 点`;
      }
    });
  }

  function onWatchAd(type) {
    const loadingOverlay = document.getElementById("loading-overlay");
    loadingOverlay.classList.remove("hidden");
    loadingOverlay.style.display = "flex";

    if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "SHOW_REWARD_AD",
        adType: type
        }));
    } else {
        alert("📺 広告（仮）を見ています...");
        fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/adresets/limit/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, type })
        })
        .then(res => {
        if (!res.ok) throw new Error("リミット解除失敗");
        })
        .catch(err => {
        console.error("広告解除エラー:", err);
        alert("通信エラー（広告）: " + err.message);
        })
        .finally(() => {
        loadingOverlay.classList.add("hidden");
        loadingOverlay.style.display = "none";
        alert("gameflow"); // ✅ 確実に表示される
        beginGameFlow();
        });
    }
    }

  window.addEventListener("AD_WATCHED", (event) => {
            // alert("🎉 AD_WATCHED カスタムイベントを受信しました");
            const adType = event.detail?.type || "unknown";
            closeLoadingOverlay();
            // showPopup(`✅ ${adType === 'chat' ? 'チャット' : 'マッチ'}回数が回復しました！`);
        });

    window.addEventListener("AD_FAILED", (event) => {
        // alert("❌ AD_FAILED カスタムイベントを受信しました");
        const msg = event.detail?.message || "不明なエラー";
        closeLoadingOverlay();
        // showPopup(`❌ 広告の視聴に失敗しました: ${msg}`);
    });


});
