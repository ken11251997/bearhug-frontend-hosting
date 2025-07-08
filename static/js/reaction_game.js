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
    fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/game/play_start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id })
    })
    .then(res => res.json())
    .then(data => {
      if (data.show_ad) {
        onWatchAd("reaction");
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
    transition(instruction, explanation);
    setTimeout(() => {
      transition(explanation, gameArea);
      reactionText.textContent = "よーい...スタート！";
      setTimeout(showRandomFace, 2000);
    }, 2000);
  }

  function showRandomFace() {
    const randomKey = expressionKeys[Math.floor(Math.random() * expressionKeys.length)];
    const expression = bearExpressions[randomKey];
    bear.src = expression.image;
    currentExpression = expression.label;

    if (currentExpression === "joy") {
      startTime = performance.now();
      isClickable = true;
      liveTimer.textContent = "0.000 秒";
      liveTimer.classList.remove("hidden");

      timerInterval = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        liveTimer.textContent = elapsed.toFixed(3) + " 秒";
      }, 30);

      setTimeout(() => {
        if (isClickable) {
          isClickable = false;
          clearInterval(timerInterval);
          liveTimer.classList.add("hidden");
          reactionText.textContent = "おそい！😵";
          setTimeout(() => showResult(null), 1500);
        }
      }, 10000);
    } else {
      setTimeout(showRandomFace, 1000 + Math.random() * 2000);
    }
  }

  bear.addEventListener("click", () => {
    if (!isClickable || !startTime) return;

    const elapsed = (performance.now() - startTime) / 1000;
    isClickable = false;
    clearInterval(timerInterval);
    liveTimer.classList.add("hidden");

    if (currentExpression === "joy") {
      showResult(elapsed);
    } else {
      reactionText.textContent = "ミス！😣";
      setTimeout(() => showResult(null), 1000);
    }
  });

  function showResult(score) {
    gameArea.classList.add("hidden");
    resultArea.classList.remove("hidden");

    if (score) {
      const formatted = score.toFixed(3);
      resultScore.textContent = `スコア：${formatted} 秒！`;

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
          bestScoreEl.classList.remove("hidden");
          bestScoreEl.textContent = `自己ベスト：${parseFloat(data.best).toFixed(3)} 秒`;
        }
      });
    } else {
      resultScore.textContent = "スコア：無効（遅すぎた/ミス）";
      bestScoreEl.classList.add("hidden");
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
      fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/game/ad_finished", {
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
    fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/game/ad_finished", {
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
