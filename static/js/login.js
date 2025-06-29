document.addEventListener("DOMContentLoaded",function(){
    // const matchAni = document.getElementById("match-animation");
    // matchAni.style.display = "none"; 

    const loadingOverlay = document.getElementById("loading-overlay");
    loadingOverlay.style.display = "none";

    const user_id = new URLSearchParams(window.location.search).get("user_id");
    const mbti = new URLSearchParams(window.location.search).get("mbti");
    const user_name = new URLSearchParams(window.location.search).get("user_name");
    const subscription_type = localStorage.getItem("subs")
    const data ={user_id : user_id }
    console.log("mbti:", mbti);
    console.log("user_id:", user_id);

    document.getElementById("user-name").innerText = `${user_name}`;
    document.getElementById("user-mbti").innerText = `${mbti}`;
    document.getElementById("user-icon").src = `static/img/${mbti}.png`;

    const mbtiElement = document.getElementById("user-mbti");
    const mbtiColorClasses = {
        "INTJ": "mbti-purple", "INFJ": "mbti-green", "ENTJ": "mbti-purple", "ENFJ": "mbti-green",
        "INTP": "mbti-purple", "INFP": "mbti-blue", "ENTP": "mbti-purple", "ENFP": "mbti-green",
        "ISTP": "mbti-yellow", "ISFP": "mbti-yellow", "ESTP": "mbti-yellow", "ESFP": "mbti-yellow",
        "ISTJ": "mbti-blue", "ISFJ": "mbti-yellow", "ESTJ": "mbti-blue", "ESFJ": "mbti-blue"
    };
    const bearsBtn = document.getElementById("bearspage-btn");
    const SubsBtn = document.getElementById("subscribe-btn");
    const ConBtn = document.getElementById("contact-btn");

    document.getElementById("logout-btn").addEventListener("click", function () {
    // セッションやローカルストレージのクリーンアップ
        sessionStorage.clear();
        localStorage.removeItem("subs");
        localStorage.removeItem("user_id");
        localStorage.removeItem("backToLogin");
        localStorage.setItem("logoutFlag", "true"); 
        // indexページへリダイレクト
        window.location.href = "index.html";}
    );
    
    if (mbti in mbtiColorClasses) {
        mbtiElement.classList.add(mbtiColorClasses[mbti]);
    }

    const planDisplay = document.getElementById("subscribe-type");
    if (subscription_type) {
        // document.getElementById("subscribe-type").innerText = `現在のプラン：${subscription_type}`;
        let planText = "現在のプラン：";

        if (subscription_type === "free") {
            planText += "フリープラン";
        } else if (subscription_type === "light") {
            planText += "小グマプラン ";  // 絵文字もお好みで！
        } else if (subscription_type === "full") {
            planText += "大グマプラン ";
        } else {
            planText += subscription_type; // 予期しない値の保険
        }

    planDisplay.innerText = planText;
    }

    document.getElementById("match-btn").addEventListener("click",function(event){
        event.preventDefault();
        loadingOverlay.style.display = "flex";
        fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/match/matching",{
            method:"POST",
            mode: "cors",
            credentials: "include",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            // console.group(data)
            // console.group(data.status)
            // console.group(data.matched_users)
            if (data.status === "success" && data.matched_users) {
                // showPopup(
                //     `マッチングしました！\n相手: ${data.matched_users.username}\nMBTI: ${data.matched_users.mbti}\n年齢: ${data.matched_users.age}\n性別: ${data.matched_users.gender}`
                // );
                loadingOverlay.style.display = "none";
                console.log(mbti, data.matched_users.mbti, data.matched_users.username)
                showPoyonMatch(mbti, data.matched_users.mbti, data.matched_users.username);
            } else if (data.status === "error" && data.message === "matching limit exceeded") {
                loadingOverlay.style.display = "none";
                showAdPopup({
                    message: "広告を見ればマッチ検索が回復します！",
                    onWatchAd: () => onWatchAd("match")  // ✅ type指定
                });
            } else if (data.status === "error" && data.message === "Nobudy") {
                loadingOverlay.style.display = "none";
                showPopup("マッチング相手がいません。");
            } else {
                loadingOverlay.style.display = "none";
                showPopup("予期せぬエラーが発生しました。");
            }
        })
        .catch(error => {
            console.error("マッチングエラー:", error);
            // document.getElementById("match-result").innerHTML = `<p>エラーが発生しました。</p>`;
            loadingOverlay.style.display = "none";
            showPopup("エラーが発生しました。");
        });
    });

    function showPopup(message) {
        // Remove existing popups
        document.querySelectorAll(".popup-message").forEach(p => p.remove());

        const popup = document.createElement("div");
        popup.className = "popup-message";
        popup.innerText = message;
        document.body.appendChild(popup);
        console.log("funshow")
        
        setTimeout(() => {
            popup.classList.add("fade-out");
            setTimeout(() => popup.remove(), 1500);
        }, 1000);
    }

    function checkUnreadMessages() {
    if (!user_id) return;
    console.log("midokutyekku")
    fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/list/unread_status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user_id })
    })
        .then(res => res.json())
        .then(data => {
        if (data.status === "success" && data.has_unread) {
            const badge = document.getElementById("message-notification");
            if (badge) badge.classList.remove("hidden");
        }
        })
        .catch(err => console.error("未読チェック失敗:", err));
    }

    document.addEventListener("DOMContentLoaded", () => {
    // 通知バッジ DOM 生成
    const badge = document.createElement("div");
    badge.id = "message-notification";
    badge.className = "notification-dot hidden";

    const btn = document.querySelector("#go-matching-list");
    if (btn) {
        btn.style.position = "relative";
        btn.appendChild(badge);
    }

    const storedUserId = localStorage.getItem("user_id");
    if (storedUserId) {
        user_id = storedUserId;
        checkUnreadMessages();
    }
    console.log("botannseisei")
    });


    function fetchMatchedUsers(){ fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/match/matched_list",{
            method:"POST",
            mode: "cors",
            credentials: "include",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data =>{
            if (data.status ==="success"){
                const listContainer=document.getElementById("matched-user");
                listContainer.innerHTML = ""; //既存リストを空白に
                data.matched_users_list.forEach(user => {
                    const listItem = document.createElement("li");
                    listItem.textContent = user.username;
                    listItem.setAttribute("data-user-id", user.id);  // ✅ ユーザー ID を設定
                    listItem.setAttribute("data-room-id", user.room_id);
                    console.log(user.unread)
                    if (user.username === "？？？") {
                        listItem.onclick = () => {
                            showPopup("相手からマッチされています！\nアップグレードで相手の情報が見られます✨");
                        };
                    } else {
                        listItem.onclick = () => {
                            // markAsRead(user.room_id);
                            joinRoom(user.room_id, user.username, user.mbti);
                        };
                    }
                    if (user.mbti in mbtiColorClasses) {
                        listItem.classList.add(mbtiColorClasses[user.mbti]);
                    }
                    if (user.unread) {
                        listItem.classList.add("unread");
                        const blueDot = document.createElement("span");
                        blueDot.classList.add("unread-indicator");
                        listItem.appendChild(blueDot);
                    }
                    listContainer.appendChild(listItem);
                });
            } else {
                alert("マッチングリストの取得に失敗しました。");
            }
        })
        .catch(error => console.error("リスト更新エラー:", error));
    };


    // document.getElementById("match_list_reload").addEventListener("click", fetchMatchedUsers);
    const ListBtn = document.getElementById("match_list_reload");
    ListBtn.addEventListener("click", function () {
        localStorage.setItem("user_id", user_id);
        localStorage.setItem("backToLogin", window.location.href);
        console.log("List")
        window.location.href = `list`;
    });


    function joinRoom(roomId, otherUserName,mbti) {
        window.location.href = `chat?room_id=${roomId}&username=${encodeURIComponent(otherUserName)}&mbti=${mbti}`;
    }

    bearsBtn.addEventListener("click", function () {
        localStorage.setItem("backToLogin", window.location.href);
        console.log("bears")
        window.location.href = `bears`;
    });

    ConBtn.addEventListener("click", function () {
        localStorage.setItem("user_id", user_id);
        localStorage.setItem("backToLogin", window.location.href);
        console.log("contact")
        window.location.href = `contact`;
    });

    SubsBtn.addEventListener("click", function () {
        localStorage.setItem("user_id", user_id);
        localStorage.setItem("backToLogin", window.location.href);
        console.log("kakin")
        window.location.href = `subscribe`;
        });

        
    const intro = document.querySelector('.intro-animation');
    if (intro) {
        setTimeout(() => {
            intro.classList.add('intro-exit'); // 上に戻るアニメーション開始
            setTimeout(() => {
                intro.remove(); // アニメーション終了後削除
            }, 2000); // slide-upのdurationと同じ
        }, 4000); // 表示から5秒待つ
    }


    // 🎉 マッチング演出
    function showPoyonMatch(mymbti, partnermbti, partnerName) {
        const popup = document.getElementById("match-animation");
        const leftBear = document.getElementById("left-bear");
        const rightBear = document.getElementById("right-bear");
        const text = document.getElementById("encounter-text");

        leftBear.src = `static/img/${mymbti}.png`;
        rightBear.src = `static/img/${partnermbti}.png`;
        text.textContent = `${partnerName}さんと遭遇しました！`;

        // 表示
        popup.classList.remove("hidden");
        popup.style.display = "flex";

        // 花吹雪スタート
        startConfetti();

        // クマを中央へ
        leftBear.classList.add("bear-left");
        rightBear.classList.add("bear-right");

        // 衝突タイミングで音符発生
        setTimeout(() => {
            spawnMusicNotes();
        }, 700);

        setTimeout(() => {
            text.style.opacity = 1;
        }, 800);

        setTimeout(() => {
            popup.classList.add("hidden");
            popup.style.display = "none";
            leftBear.classList.remove("bear-left");
            rightBear.classList.remove("bear-right");
            text.style.opacity = 0;
        }, 3500);
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

        function spawnMusicNotes() {
        for (let i = 0; i < 12; i++) {
            const note = document.createElement("div");
            note.className = "music-note";
            note.textContent = "🎵";
            // 中央を基準に ±20px ずらす
            const offsetX = (Math.random() - 0.5) * 40; 
            const offsetY = (Math.random() - 0.5) * 40;
            note.style.left = `calc(50% + ${offsetX}px)`;
            note.style.top = `calc(50% + ${offsetY}px)`;
            note.style.animationDuration = (Math.random() * 0.8 + 1.2) + "s";
            // アニメに渡すカスタム変数
            note.style.setProperty('--moveX', `${(Math.random() - 0.5) * 200}px`);
            note.style.setProperty('--moveY', `${-Math.random() * 200}px`);
            document.body.appendChild(note);
            setTimeout(() => note.remove(), 2000);
        }
        }
                    

    function showAdPopup({message,onWatchAd}) {
        // 既存ポップアップを削除
        document.querySelectorAll(".popup-message").forEach(p => p.remove());
      
        // ポップアップ要素作成
        const popup = document.createElement("div");
        popup.className = "popup-message persistent-popup"; // カスタムクラスで非フェード化
        popup.innerHTML = `
          <div class="popup-header">
            <span>${message}</span>
            <button class="popup-close-btn">✕</button>
          </div>
          <div class="popup-actions">
            <button class="popup-watch-ad-btn">広告を見て使えるようにする</button>
          </div>
        `;
      
        document.body.appendChild(popup);
      
        // ✕ボタンで閉じる
        popup.querySelector(".popup-close-btn").addEventListener("click", () => {
          popup.remove();
        });
      
        // 広告再生ボタン
        popup.querySelector(".popup-watch-ad-btn").addEventListener("click", () => {
          if (onWatchAd) onWatchAd();
          popup.remove(); // 再生後に閉じる
        });
    }


    function onWatchAd(type) {
        const loadingOverlay = document.getElementById("loading-overlay");
        // ✅ 広告開始前にロード画面を表示
        loadingOverlay.classList.remove("hidden");
        loadingOverlay.style.display = "flex";

        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: "SHOW_REWARD_AD",
                adType: type
            }));
        } else {
            // ✅ Webのみ仮動作
            alert("📺 広告（仮）を見ています...");

            const user_id = sessionStorage.getItem("user_id");

            fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/adresets/limit/recover", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user_id, type: type })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === "success") {
                    showPopup(`✅ ${type === 'chat' ? 'チャット' : 'マッチ検索'}回数が1回復しました！`);
                } else {
                    showPopup("⚠️ 回復に失敗しました：" + data.message);
                }
            })
            .catch(err => {
                console.error("回復通信エラー", err);
                showPopup("❌ 回復通信に失敗しました");
            })
            .finally(() => {
                // ✅ 通信後は必ずロード画面を隠す
                loadingOverlay.classList.add("hidden");
                loadingOverlay.style.display = "none";
            });
        }
    }

    window.addEventListener("message", (event) => {
        alert("pop")
        try {
            const data = JSON.parse(event.data);
            console.log("[DEBUG] login.js メッセージ受信:", data);

            if (data.type === "AD_WATCHED") {
                if (data.adType === "chat") {
                    showPopup("✅ 広告を見てチャット回数が回復しました！");
                } else if (data.adType === "match") {
                    showPopup("✅ 広告を見てマッチング回数が回復しました！");
                }

                // ✅ 広告完了時にロード画面を閉じる
                const loadingOverlay = document.getElementById("loading-overlay");
                loadingOverlay.classList.add("hidden");
                loadingOverlay.style.display = "none";
            }
        } catch (e) {
            console.error("[ERROR] メッセージ処理失敗:", e);
        }
    });
    document.getElementById("test-match-animation").addEventListener("click", () => {
        // 例: 自分INTJ・相手ENTP・相手名テスト
        showPoyonMatch("INTJ", "ENTP", "テストさん");
        }
    );

});

