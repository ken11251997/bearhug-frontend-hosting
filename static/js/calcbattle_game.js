document.addEventListener("DOMContentLoaded", () => {


  const loadingOverlay = document.getElementById("loading-overlay");
  
  // if (loadingOverlay) {
  //   loadingOverlay.classList.add("hidden");
  //   loadingOverlay.style.display = "none";
  //   console.log("✅ 初期にローディングを消しました");
  // }

  alert("a")
  alert("🧭 [calc] calcbattle_game.js loaded");

// ★修正: BRIDGED_◯◯ を受ける（ブリッジ経由で確実に1回だけ来る）
  window.addEventListener("BRIDGED_AD_WATCHED", (event) => {
    alert("✅ [calc] AD_WATCHED 受信: " + JSON.stringify(event.detail));

    const user_id = new URLSearchParams(location.search).get("user_id");
    fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/adresets/limit/recover", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ user_id, type: event.detail?.type || "unknown" })
    })
    .catch(err => alert("🚨 recover API error: " + (err?.message || err)))
    .finally(() => {
      const el = document.getElementById("loading-overlay");
      if (el) { el.classList.add("hidden"); el.style.display = "none"; }

      if (typeof window.beginGameFlow === "function") {
        alert("▶️ [calc] beginGameFlow after AD_WATCHED");
        window.beginGameFlow();
      } else {
        window.__beginAfterAd = true;
        alert("⏳ [calc] beginGameFlow未定義 → 遅延実行フラグON");
      }
    });
  });

  // ★推奨: 失敗/クローズもBRIDGED名で受信
  window.addEventListener("BRIDGED_AD_FAILED", (event) => {
    alert("❌ [calc] AD_FAILED: " + JSON.stringify(event.detail));
    const el = document.getElementById("loading-overlay");
    if (el) { el.classList.add("hidden"); el.style.display = "none"; }
  });

  window.addEventListener("BRIDGED_AD_CLOSED", (event) => {
    alert("ℹ️ [calc] AD_CLOSED: " + JSON.stringify(event.detail));
    const el = document.getElementById("loading-overlay");
    if (el) { el.classList.add("hidden"); el.style.display = "none"; }
  });

  const successSound = new Audio("static/sound/success.mp3");
  const failSound = new Audio("static/sound/fail.mp3");
  const decisionSound = new Audio("static/sound/decision.mp3");

  const startScreen = document.getElementById("start-screen");
  const gameScreen = document.getElementById("game-screen");
  const endScreen = document.getElementById("end-screen");

  const startBtn = document.getElementById("start-btn");
  const retryBtn = document.getElementById("retry-btn");
  const backBtn = document.getElementById("back-btn");
  const rankingBtn = document.getElementById("ranking-btn");
  const rankingAgainBtn = document.getElementById("ranking-again-btn"); // ✅ HTMLと一致させる
  const rankingBtns = document.querySelectorAll("#ranking-btn, #ranking-again-btn");

  const timerDisplay = document.getElementById("timer");
  const feedbackDisplay = document.getElementById("feedback");
  const finalTimeDisplay = document.getElementById("final-time");

  const user_id = new URLSearchParams(window.location.search).get("user_id");
  const mbti = new URLSearchParams(window.location.search).get("mbti");

  const bgImage = new Image();
  bgImage.src = "static/img/calc.jpg";  // あなたの背景画像のパスに合わせてください

  bgImage.onload = () => {
    loadingOverlay.style.display = "none";
    console.log("✅ 背景画像の読み込み完了");
  };

  bgImage.onerror = () => {
    loadingOverlay.style.display = "none";
    console.warn("⚠️ 背景画像の読み込みに失敗");
  };


  document.getElementById("back-button").onclick = () => {
    location.href = "minigame_list.html";
  };

  let currentQuestionIndex = 0;
  let startTime = 0;
  let elapsed = 0;
  let penaltyTime = 0;
  let timerInterval = null;
  const totalQuestions = 5;
  let questions = [];

  function generateQuestions() {
    const q = [];
    for (let i = 0; i < totalQuestions; i++) {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      const ops = ['+', '-', '×'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      let answer, questionText;

      switch (op) {
        case '+':
          answer = a + b;
          questionText = `${a} + ${b} = ?`;
          break;
        case '-':
          answer = a - b;
          questionText = `${a} - ${b} = ?`;
          break;
        case '×':
          answer = a * b;
          questionText = `${a} × ${b} = ?`;
          break;
      }

      const choices = new Set();
      choices.add(answer);
      while (choices.size < 4) {
        choices.add(answer + Math.floor(Math.random() * 10) - 5);
      }

      q.push({
        questionText,
        answer,
        choices: Array.from(choices).sort(() => Math.random() - 0.5),
      });
    }
    return q;
  }


  function showScreen(target) {
    [startScreen, gameScreen, endScreen].forEach(screen => {
      screen.classList.add("hidden");
      screen.classList.remove("active"); // ← 必須
    });
    target.classList.remove("hidden");
    target.classList.add("active");      // ← 必須
    console.log("🎬 表示画面:", target.id);
  }


  startBtn.addEventListener("click", () => {
    // ✅ ネイティブにBGM切替を依頼（mode: "calc"）
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "SWITCH_BGM",
        mode: "calc"
      }));
    }

    startBtn.disabled = true;
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
            // alert("無料プレイ回数が上限に達しました。\n広告を見ると続行できます。");
            showPopup("広告を見て\nあそぶ!", () => {
              onWatchAd("game");
                    });
            // onWatchAd("game"); 
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
        // alert("通信エラー:")
        });
    });


  function beginGameFlow() {
    console.log("▶️ beginGameFlow 実行");
    showScreen(gameScreen); // ← 修正！画面切り替えはこの関数で統一
    questions = generateQuestions();
    console.log("🎯 生成された問題：", questions);
    currentQuestionIndex = 0;
    penaltyTime = 0;
    startTime = performance.now();
    startTimer();
    showQuestion();  // ← ここで表示
  }

  function startTimer() {
    timerInterval = setInterval(() => {
      const now = performance.now();
      elapsed = (now - startTime) / 1000 + penaltyTime;
      timerDisplay.textContent = `タイム: ${elapsed.toFixed(3)}秒`;
    }, 50);
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }

  function showQuestion() {
    console.log("📢 showQuestion() 開始");

    if (questions.length === 0) {
      console.error("❌ 問題が1つも生成されていません！");
      return;
    }

    const q = questions[currentQuestionIndex];
    console.log("▶️ 表示する問題:", q);
    document.getElementById("question").textContent = q.questionText;

    const choicesContainer = document.getElementById("choices");
    choicesContainer.innerHTML = "";
    q.choices.forEach(choice => {
      const btn = document.createElement("button");
      btn.className = "choice-button";
      btn.textContent = choice;
      console.log("✅ ボタン追加:", btn); // ← 追加
      btn.addEventListener("click", () => handleAnswer(Number(choice)));
      choicesContainer.appendChild(btn);
    });
  }

  function handleAnswer(choice) {
    const q = questions[currentQuestionIndex];
    console.log("🧠 ユーザー回答:", choice, "正解:", q.answer);
    if (choice === q.answer) {
      successSound.play();
      console.log("✅ 正解");
      showMarker("⭕");  // ✅ 正解マーク
      currentQuestionIndex++;
      if (currentQuestionIndex >= questions.length) {
        endGame();
      } else {
        showQuestion();
      }
    } else {
      console.warn("❌ 不正解！10秒加算！");
      failSound.play();
      showMarker("×");  // ✅ 不正解マーク
      penaltyTime += 5;
      // ✅ ＋5秒の赤文字アニメーション表示
      const penaltyText = document.getElementById("penalty-text");
      penaltyText.classList.remove("hidden");
      penaltyText.classList.remove("fadePenalty"); // リセット
      void penaltyText.offsetWidth; // 再アニメーション用
      penaltyText.classList.add("penalty-text");
      setTimeout(() => {
        penaltyText.classList.add("hidden");
      }, 1000);
        }
}

  function showMarker(symbol) {
    const marker = document.getElementById("marker");
    marker.textContent = symbol;
    marker.classList.remove("hidden");
    setTimeout(() => {
      marker.classList.add("hidden");
    }, 600);
  }

  function endGame() {
    stopTimer();
    showScreen(endScreen);
    finalTimeDisplay.textContent = `記録：${elapsed.toFixed(3)}秒！`;
    
    // ✅ スコア送信処理
    fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/game/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id,
        game_name: "calcbattle_game",
        score: parseFloat(elapsed.toFixed(3)),
      }),
    })
      .then(res => res.json())
      .then(data => {
        console.log("スコア送信成功:", data);
        if (data.best !== undefined) {
            startConfetti()
          // 🎉 ここでエフェクトや音を鳴らす処理を入れてもOK
        }
      })
      .catch(err => {
        console.error("スコア送信エラー:", err);
      });
  }

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

  // 🎯 ランキング表示処理（モーダル）
  
  rankingBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("ranking-modal").classList.remove("hidden");
      // loadRanking("mbti_median");
      loadRanking("mbti_median", "calcbattle")
    });
  });

  // 🎮 イベント登録
//   startBtn.addEventListener("click", startGame);
  retryBtn.addEventListener("click", beginGameFlow);
  backBtn.addEventListener("click", () => {
    showScreen(startScreen);
    openDefaultBGMWindow(); // ✅ default BGM 再起動
  });
//   rankingBtn.addEventListener("click", showRanking);


  function onWatchAd(type) {
    // const loadingOverlay = document.getElementById("loading-overlay");
    // loadingOverlay.classList.remove("hidden");
    // loadingOverlay.style.display = "flex";
    openLoadingOverlay("ロード中…"); 
    alert("AD1: " + type)

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
        // alert("通信エラー（広告）: " + err.message);
        })
        .finally(() => {
        closeLoadingOverlay(); // ✅ 統一
        // alert("gameflow"); // ✅ 確実に表示される
        beginGameFlow();
        });
    }
    }


  function showPopup(message, callback) {
    // 既存ポップアップを削除
    document.querySelectorAll(".popup-message").forEach(p => p.remove());
    console.log(message);

    const popup = document.createElement("div");
    popup.className = "popup-message";

    // ✅ ここを innerText → innerHTML に変更
    // ✅ ついでに \n を <br> に変換（"広告を見て\nあそぶ！" もOK）
    popup.innerHTML = String(message).replace(/\n/g, "<br>");

    document.body.appendChild(popup);

    setTimeout(() => {
      popup.classList.add("fade-out");
      setTimeout(() => {
        popup.remove();
        if (callback) callback();
      }, 100);
    }, 750);
  }

  function openLoadingOverlay(msg) {
    const el = document.getElementById("loading-overlay");
    if (!el) { console.warn("⚠️ #loading-overlay が見つかりません"); return; }
    // オーバーレイ内にメッセージ欄があれば更新（任意）
    const textEl = el.querySelector(".loading-text");
    if (textEl && msg) textEl.textContent = msg;
    el.classList.remove("hidden");
    el.style.display = "flex";
    console.log("🌀 OPEN LoadingOverlay:", msg || "");
  }

  function closeLoadingOverlay() {
    const el = document.getElementById("loading-overlay");
    if (!el) return;
    if (!el.classList.contains("hidden")) {
      el.classList.add("hidden");
    }
    el.style.display = "none";
    console.log("✅ CLOSE LoadingOverlay");
  }

  // 開始ボタン制御
  function enableStart() {
    if (!startBtn) return;
    startBtn.disabled = false;
    startBtn.style.pointerEvents = 'auto';
    startBtn.style.opacity = '1';
  }

  window.addEventListener("AD_WATCHED", (event) => {
    // alert("🎉 AD_WATCHED カスタムイベントを受信しました");
    const adType = event.detail?.type || "unknown";
    alert("AD1: " + adType); // ← これで実際の adType の中身が見える

    fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/adresets/limit/recover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, type: adType }) // ✅ 修正
  })
  .finally(() => {
    alert("AD2",adType)
    loadingOverlay.classList.add("hidden");
    loadingOverlay.style.display = "none";
    // startGame();
  })
    closeLoadingOverlay();
});

  window.addEventListener("AD_FAILED", (event) => {
      alert("❌ AD_FAILED カスタムイベントを受信しました");
      const msg = event.detail?.message || "不明なエラー";
      closeLoadingOverlay();
      // showPopup(`❌ 広告の視聴に失敗しました: ${msg}`);
  });

  // 初期状態でクリック可能にしておく
  closeLoadingOverlay();
  enableStart();
});