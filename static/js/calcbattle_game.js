
document.addEventListener("DOMContentLoaded", () => {

  // const loadingOverlay = document.getElementById("loading-overlay");
  // if (loadingOverlay) {
  //   loadingOverlay.classList.add("hidden");
  //   loadingOverlay.style.display = "none";
  // }
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.classList.add("hidden");
    loadingOverlay.style.display = "none";
    console.log("✅ 初期にローディングを消しました");
  }

  alert("a")
  
  

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
    // const bgmWin = window.open('', 'bgmWindow'); // すでに存在していれば参照される
    // if (bgmWin && !bgmWin.closed) {
    //   bgmWin.close();
    // }

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
              openLoadingOverlay("🎬 広告読み込み中…");
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

  // function beginGameFlow() {
  //   console.log("▶️ beginGameFlow 実行");
  //   document.getElementById("start-screen").classList.add("hidden");
  //   document.getElementById("end-screen").classList.add("hidden");
  //   document.getElementById("game-screen").classList.remove("hidden");

  //   questions = generateQuestions();
  //   console.log("🎯 生成された問題：", questions);
  //   currentQuestionIndex = 0;
  //   penaltyTime = 0;
  //   startTime = performance.now();
  //   startTimer();
  //   showQuestion();
  // }

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

  function showFeedback(text, type) {
    feedbackDisplay.textContent = text;
    feedbackDisplay.className = "feedback " + type;
    setTimeout(() => {
      feedbackDisplay.textContent = "";
      feedbackDisplay.className = "feedback";
    }, 800);
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

  // 📲 アプリ内通知から受け取り（広告完了）
//   window.addEventListener("AD_WATCHED", (event) => {
//     const adType = event.detail?.type || "unknown";
//     fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/adresets/limit/recover", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ user_id, type: adType })
//     }).finally(() => {
//       const loadingOverlay = document.getElementById("loading-overlay");
//       loadingOverlay.classList.add("hidden");
//       loadingOverlay.style.display = "none";
//       beginGameFlow();
//     });
//   });

    // window.addEventListener("AD_WATCHED", (event) => {
    //   const adType = event.detail?.type || "unknown";
    //   console.log("📩 AD_WATCHED 受信:", adType);

    //   // ✅ まず即時に隠す（forceRemove=false）
    //   // closeLoadingOverlay(false);
    //   //   const el = document.getElementById("loading-overlay");
    //   // if (!el) return;
    //   // if (!el.classList.contains("hidden")) {
    //   //   el.classList.add("hidden");
    //   // }
    //   // el.style.display = "none";
    //   // console.log("✅ CLOSE LoadingOverlay");

    //   // ⏱ 遅延でもう一度（描画タイミング差異対策）
    //   setTimeout(() => closeLoadingOverlay(false), 150);

    //   fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/adresets/limit/recover", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ user_id, type: adType })
    //   })
    //   .catch(err => {
    //     console.log("⚠️ recover API エラー:", err);
    //   })
    //   .finally(() => {
    //     // ✅ finallyでもう一度畳みかける
    //     const el = document.getElementById("loading-overlay");
    //     if (!el) return;
    //     if (!el.classList.contains("hidden")) {
    //       el.classList.add("hidden");
    //     }
    //     el.style.display = "none";
    //     console.log("🏁 recover 完了 → ゲーム開始");
    //     beginGameFlow();
    //   });
    // });

    // window.addEventListener("AD_FAILED", (event) => {
    //     // alert("❌ AD_FAILED カスタムイベントを受信しました");
    //     const msg = event.detail?.message || "不明なエラー";
    //     closeLoadingOverlay();
    //     // showPopup(`❌ 広告の視聴に失敗しました: ${msg}`);
    // });
    


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
// function disableStart() {
//   if (!startBtn) return;
//   startBtn.disabled = true;
//   startBtn.style.pointerEvents = 'none';
//   startBtn.style.opacity = '0.6';
// }

// 重複登録を避けるため一度 remove → add
// window.removeEventListener('AD_WATCHED', window.__CALC_AD_WATCHED || (()=>{}));
// window.__CALC_AD_WATCHED = async (event) => {
//   // 広告完了 → UI復帰
//   closeLoadingOverlay();
//   enableStart();

//   // （任意）サーバ側で上限回数を復活
//   try {
//     const user_id = sessionStorage.getItem('user_id');
//     const adType = event?.detail?.type || 'calcbattle';
//     if (user_id) {
//       await fetch('https://bearhug-6c58c8d5bd0e.herokuapp.com/adresets/limit/recover', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ user_id, target: adType })
//       });
//     }
//   } catch (e) { /* ネットワーク失敗は無視してUIだけ復帰 */ }
// };
// window.addEventListener('AD_WATCHED', window.__CALC_AD_WATCHED);

// window.removeEventListener('AD_FAILED', window.__CALC_AD_FAILED || (()=>{}));
// window.__CALC_AD_FAILED = (event) => {
//   // 広告失敗でも固まらないよう必ず復帰
//   closeLoadingOverlay();
//   enableStart();
// };
// window.addEventListener('AD_FAILED', window.__CALC_AD_FAILED);

// // タブ復帰時の保険（実機で稀に取りこぼす対策）
// document.addEventListener('visibilitychange', () => {
//   if (document.visibilityState === 'visible') {
//     closeLoadingOverlay();
//     enableStart();
//   }
// });


// ✅ 広告視聴イベント受信時の処理（ReactNativeWebViewからのイベント）
// window.addEventListener("AD_WATCHED", async (event) => {
//   const adType = event.detail?.type || "unknown";
//   const user_id = sessionStorage.getItem("user_id");

//   showLoadingOverlay();  // ✅ 広告視聴完了時に一度ローディング（回復通信の間）

//   try {
//     const res = await fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/adresets/limit/recover", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ user_id: user_id, type: adType })
//     });

//     const result = await res.json();
//     console.log("✅ AD_WATCHED result:", result);

//     // ✅ 成功したらローディングを外す
//     hideLoadingOverlay();

//     // ✅ 必要に応じてポップアップ表示など追加
//     alert("✅ 広告視聴が完了し、プレイ回数が回復しました！");
//   } catch (err) {
//     console.error("❌ AD_WATCHED error:", err);
//     hideLoadingOverlay(); // 念のためエラー時も非表示
//     alert("❌ 広告視聴後の通信に失敗しました");
//   }
// });



  // window.addEventListener("AD_WATCHED", (event) => {
  //   const adType = event.detail?.type || "unknown";
  //   console.log("✅ AD_WATCHED 受信:", adType);
  //   alert(`(1/5) AD_WATCHED 受信: type=${adType}`);
  //   alert(`(2/5) 閉じる前の可視状態: ${isOverlayVisible()}`);

  //   fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/adresets/limit/recover", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ user_id, type: adType })
  //   })
  //   .then(res => {
  //     if (!res.ok) throw new Error("リミット解除失敗");
  //     return res.json();
  //   })
  //   .then(() => {
  //     console.log("✅ リミット回復成功 → ゲーム開始");
  //     // closeLoadingOverlay();      
  //     // beginGameFlow();            
  //     openLoadingOverlay("✅ 回復完了！ゲーム開始…");
  //     setTimeout(() => {
  //       closeLoadingOverlay();    // ✨ 演出しつつ確実に解除
  //       // beginGameFlow();          // ▶ スタート
  //     }, 300);
  //   })
  //   .catch(err => {
  //     console.error("広告解除エラー:", err);
  //     closeLoadingOverlay();      // ✅ 念のためここでも解除
  //   });
  // });

  function isOverlayVisible() {
    const el = document.getElementById("loading-overlay");
    if (!el) return false;
    const cs = getComputedStyle(el);
    return cs.display !== "none" && !el.classList.contains("hidden");
  }

  // ★ AD_WATCHED: 報酬獲得 → 回復API → ローディングを閉じる
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
        // showPopup(`✅ ${adType === 'chat' ? 'チャット' : 'マッチ'}回数が回復しました！`);
    });
  

  window.addEventListener("AD_CLOSED", (event) => {
    console.log("[WEB] AD_CLOSED", event?.detail);
    closeLoadingOverlay();
    // 必要ならここで beginGameFlow() を呼ぶ
    // beginGameFlow();
  });

// ✅ 広告失敗イベント（必要に応じて）
  window.addEventListener("AD_FAILED", (event) => {
        alert(`(F1) AD_FAILED 受信: ${msg} → ローディング閉じます`);
        const msg = event.detail?.message || "不明なエラー";
        closeLoadingOverlay();
        try { closeLoadingOverlay && closeLoadingOverlay(); } catch (e) {}
        alert(`(F2) 閉じ後の可視状態: ${isOverlayVisible()}`);
      }, { passive: true });
        // showPopup(`❌ 広告の視聴に失敗しました: ${msg}`);

  // === Debug alert bridge: Web → React Native (Androidでalertが出ない対策) ===
(function () {
  if (window.__DEBUG_ALERT_BRIDGE__) return;
  window.__DEBUG_ALERT_BRIDGE__ = true;

  function debugAlert(msg) {
    try {
      // React Native WebView なら RN 側へ postMessage
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ __debugAlert: true, msg: String(msg) })
        );
      } else {
        // ブラウザ(PC)等では通常の alert
        window.alert(String(msg));
      }
    } catch (e) {
      try { window.alert(String(msg)); } catch {}
      console.error("debugAlert error:", e);
    }
  }

  // 既存コードの alert() をそのまま生かすため、alert を差し替え（追記のみ）
  window.alert = debugAlert;
})();



  // 初期状態でクリック可能にしておく
  closeLoadingOverlay();
  enableStart();
});