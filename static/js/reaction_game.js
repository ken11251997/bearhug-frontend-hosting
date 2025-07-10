document.addEventListener("DOMContentLoaded", () => {
  const bear = document.getElementById("bear-face");
  const startBtn = document.getElementById("start-btn");
  const playAgainBtn = document.getElementById("play-again-btn");
  const endBtn = document.getElementById("end-btn");
  const reactionText = document.getElementById("reaction-text");
  const resultScore = document.getElementById("result-score");
  const liveTimer = document.getElementById("live-timer");
  const bestScoreEl = document.getElementById("best-score");

  const instruction = document.getElementById("instruction");
  const explanation = document.getElementById("explanation");
  const gameArea = document.getElementById("game-area");
  const resultArea = document.getElementById("result-area");
  const rankingBtns = document.querySelectorAll("#ranking-btn, #ranking-again-btn");

  const user_id = new URLSearchParams(window.location.search).get("user_id");
  const mbti = new URLSearchParams(window.location.search).get("mbti");

  const successSound = new Audio("static/sound/success.mp3");
  const failSound = new Audio("static/sound/fail.mp3");

  let startTime = 0;
  let isClickable = false;
  let timerInterval = null;
  let currentExpression = "";

  // 🧸 クマの表情セット
  const bearExpressions = {
    joy:    { label: "joy",    image: "static/img/expression_default.png" },
    anger:  { label: "anger",  image: "static/img/expression_angry.png" },
    sadness:{ label: "sadness",image: "static/img/expression_cry.png" },
    normal:    { label: "normal",    image: "static/img/expression_normal.png" },

  };
  const expressionKeys = Object.keys(bearExpressions);

  function transition(from, to) {
    from.classList.add("hidden");
    to.classList.remove("hidden");
  }

  startBtn.addEventListener("click", () => {
    startBtn.disabled = true; // 🔒 一時無効化（連打防止）
    fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/game/play_start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id })
    })
    .then(res => res.json())
    .then(data => {
      if (data.show_ad) {
        onWatchAd("game");
      } else {
        beginGameFlow();
      }
    })
    .catch(err => {
      console.error("ゲーム開始エラー:", err);
      beginGameFlow(); // 失敗しても続行
    });
  });

  function beginGameFlow() {
    document.getElementById("bear-face-first").classList.add("hidden");

    const bear = document.getElementById("bear-face");
    bear.style.display = "block";                  // 🆕 強制的に表示に切り替え
    bear.classList.remove("hidden");               // 🆕 hidden クラスを除去
    bear.src = bearExpressions.normal.image;

    const title = document.querySelector("h1");
    if (title) title.style.display = "none";

    transition(instruction, explanation);
    setTimeout(() => {
      transition(explanation, gameArea);

      reactionText.textContent = "よーい...スタート！";
      reactionText.style.display = "block"; // 念のため強制表示

      // 🆕 よーいスタートを1秒後に消す
      setTimeout(() => {
        reactionText.style.display = "none";
      }, 1000);

      setTimeout(showRandomFace, 2000);
    }, 2000);
  }


  function showRandomFace() {
    const randomKey = expressionKeys[Math.floor(Math.random() * expressionKeys.length)];
    const expression = bearExpressions[randomKey];
    bear.src = expression.image;
    currentExpression = expression.label;

    // ✅ 表情が joy なら反応計測
    if (currentExpression === "joy") {
      startTime = performance.now();
      isClickable = true;
      liveTimer.textContent = "0.000 秒";
      liveTimer.classList.remove("hidden");
      liveTimer.classList.add("visible");

      timerInterval = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        liveTimer.textContent = elapsed.toFixed(3) + " 秒";
      }, 30);

      setTimeout(() => {
        if (isClickable) {
          isClickable = false;
          clearInterval(timerInterval);
          liveTimer.classList.remove("visible");
          liveTimer.classList.add("hidden");
          reactionText.textContent = "おそい！😵";
          setTimeout(() => showResult(null), 1500);
        }
      }, 5000);
    } else {
      // ✅ joy以外の時もスタートタイムを記録しておく（タップ検出のため）
      startTime = performance.now();
      isClickable = true;

      // ⏳ 表情変更までの時間
      setTimeout(() => {
        if (isClickable) {
          isClickable = false;
          showRandomFace(); // 次の表情へ
        }
      }, 1500 + Math.random() * 1500);
    }
  }



  bear.addEventListener("click", () => {
    // スタートしてなければ無視
    if (!startTime) return;

    clearInterval(timerInterval);
    liveTimer.classList.add("hidden");

    if (currentExpression === "joy" && isClickable) {
      isClickable = false;
      const elapsed = (performance.now() - startTime) / 1000;
      showResult(elapsed);
    } else {
      isClickable = false;  // joy以外でも一度で終わるように
      reactionText.textContent = "ミス！😣";
      setTimeout(() => showResult(null), 1000);
    }
  });


  function startConfetti() {
    const colors = ["#ffb6c1", "#ffc0cb", "#ff69b4", "#ff1493", "#db7093"];
    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement("div");
      confetti.classList.add("confetti");
      confetti.style.left = Math.random() * 100 + "vw";
      confetti.style.animationDuration = (Math.random() * 2 + 2) + "s";
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 4000);
    }
  }

  function showResult(score) {
    gameArea.classList.add("hidden");
    resultArea.classList.remove("hidden");

    if (score) {
      const formatted = score.toFixed(3);
      resultScore.textContent = `スコア：${formatted} 秒！`;

      successSound.play(); // ✅ 成功音を再生

      fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/game/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user_id,
          game_name: "reaction_speed",
          score: parseFloat(formatted)
        }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.best !== undefined) {
          startConfetti();
          bestScoreEl.classList.remove("hidden");
          bestScoreEl.textContent = `自己ベスト：${parseFloat(data.best).toFixed(3)} 秒`;
        }
      });
    } else {
      resultScore.textContent = "スコア：無効（遅すぎた/ミス）";
      bestScoreEl.classList.add("hidden");
      failSound.play(); // ✅ 失敗音を再生
    }
  }

  playAgainBtn.addEventListener("click", () => {
    location.reload();
  });

  endBtn.addEventListener("click", () => {
    window.location.href = "minigame_list.html";
  });

  rankingBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("ranking-modal").classList.remove("hidden");
      loadRanking("mbti_median");
    });
  });




  // 📺 広告再生
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
      .finally(() => {
        loadingOverlay.classList.add("hidden");
        loadingOverlay.style.display = "none";
        beginGameFlow();
      });
    }
  }

  // 📲 アプリ内通知から受け取り（広告完了）
  window.addEventListener("AD_WATCHED", (event) => {
    const adType = event.detail?.type || "unknown";
    fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/adresets/limit/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, type: adType })
    }).finally(() => {
      const loadingOverlay = document.getElementById("loading-overlay");
      loadingOverlay.classList.add("hidden");
      loadingOverlay.style.display = "none";
      beginGameFlow();
    });
  });
});
