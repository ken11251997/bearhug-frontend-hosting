document.addEventListener("DOMContentLoaded",function(){
    // const matchAni = document.getElementById("match-animation");
    // matchAni.style.display = "none"; 

    // const loadingOverlay = document.getElementById("loading-overlay");
    // loadingOverlay.style.display = "none";

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


    const mbtiJapaneseNames = {
        "INTJ": "建築家",
        "INFJ": "提唱者",
        "ENTJ": "指揮官",
        "ENFJ": "主人公",
        "INTP": "論理学者",
        "INFP": "仲介者",
        "ENTP": "討論者",
        "ENFP": "運動家",
        "ISTP": "巨匠",
        "ISFP": "冒険家",
        "ESTP": "起業家",
        "ESFP": "エンターテイナー",
        "ISTJ": "管理者",
        "ISFJ": "擁護者",
        "ESTJ": "幹部",
        "ESFJ": "領事官"
    };

    // MBTIの日本語名を表示（追加）
    const mbtiDescElement = document.getElementById("user-mbti-desc");
    if (mbtiDescElement && mbtiJapaneseNames[mbti]) {
        mbtiDescElement.innerText = mbtiJapaneseNames[mbti];
    }

    const bearsBtn = document.getElementById("bearspage-btn");
    const SubsBtn = document.getElementById("subscribe-btn");
    const ConBtn = document.getElementById("contact-btn");

    document.getElementById("logout-btn").addEventListener("click", function () {

        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: "APP_EXIT" }));
        }

    // セッションやローカルストレージのクリーンアップ
        // ✅ BGMウィンドウが存在する場合は閉じる（BGM停止）
        const bgmWin = window.open('', 'bgmWindow'); // すでに存在していれば参照される
        if (bgmWin && !bgmWin.closed) {
        bgmWin.close();
        }
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
        mbtiDescElement.classList.add(mbtiColorClasses[mbti]); // ✅ 日本語名にも同じ色クラス追加
    }

    // const planDisplay = document.getElementById("subscribe-type");
    // if (subscription_type) {
    //     // document.getElementById("subscribe-type").innerText = `現在のプラン：${subscription_type}`;
    //     let planText = "現在のプラン：";

    //     if (subscription_type === "free") {
    //         planText += "フリープラン";
    //     } else if (subscription_type === "light") {
    //         planText += "小グマプラン ";  // 絵文字もお好みで！
    //     } else if (subscription_type === "full") {
    //         planText += "大グマプラン ";
    //     } else {
    //         planText += subscription_type; // 予期しない値の保険
    //     }

    // planDisplay.innerText = planText;
    // }

    const badge = document.createElement("div");
    badge.id = "message-notification";
    badge.className = "unread-indicator hidden"; // list.cssと同じ

    const btn = document.querySelector("#match_list_reload");  // ✅ 対象ボタンのIDを修正
    if (btn) {
        btn.style.position = "relative";  // 念のため再指定
        btn.appendChild(badge);
    }
    checkUnreadMessages(user_id)
    // const storedUserId = localStorage.getItem("user_id");
    // if (storedUserId) {
    //     checkUnreadMessages(storedUserId);  // ✅ 引数に渡すよう変更
    // }

    document.getElementById("match-btn").addEventListener("click",function(event){
        event.preventDefault();
        const loadingOverlay = document.getElementById("loading-overlay");
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
                showPopup({
                    message: "広告を見て<br>マッチング開始！",
                    onWatchAd: () => onWatchAd("match")  // ✅ type指定
                });
            } else if (data.status === "error" && data.message === "Nobudy") {
                loadingOverlay.style.display = "none";
                showPopup("マッチング相手が\nいないよ");
            } else {
                loadingOverlay.style.display = "none";
                showPopup("予期せぬエラーが発生しました。");
            }
        })
        .catch(error => {
            console.error("マッチングエラー:", error);
            alert(error)
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
        // popup.innerText = message;
        popup.innerHTML = `
            <div class="popup-top-row">
                <button class="popup-close-btn">✕</button>
            </div>
            <div class="popup-middle-row">
                <span class="popup-message-text">${message}</span>
            </div>
            <div class="popup-bottom-row">
                <button class="popup-ok-btn">OK</button>
            </div>
            `;
        document.body.appendChild(popup);
        console.log("funshow")
        
        setTimeout(() => {
            popup.classList.add("fade-out");
            setTimeout(() => popup.remove(), 1500);
        }, 1000);
    }

    function checkUnreadMessages(user_id) {
        return fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/list/unread_status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user_id })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === "success" && data.has_unread) {
                const badge = document.getElementById("message-notification");
                if (badge) badge.classList.remove("hidden");
                console.log("midokuhyouzi");
            }
        });
    }

    checkUnreadMessages(user_id)
    .then(() => {
        const loadingOverlay = document.getElementById("loading-overlay");
        loadingOverlay.style.display = "none";
    })
    .catch(err => {
        console.error("未読チェック失敗:", err);
        const loadingOverlay = document.getElementById("loading-overlay");
        loadingOverlay.style.display = "none"; // エラー時もとりあえず非表示に
    });



    // function fetchMatchedUsers(){ fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/match/matched_list",{
    //         method:"POST",
    //         mode: "cors",
    //         credentials: "include",
    //         headers:{"Content-Type":"application/json"},
    //         body: JSON.stringify(data)
    //     })
    //     .then(response => response.json())
    //     .then(data =>{
    //         if (data.status ==="success"){
    //             const listContainer=document.getElementById("matched-user");
    //             listContainer.innerHTML = ""; //既存リストを空白に
    //             data.matched_users_list.forEach(user => {
    //                 const listItem = document.createElement("li");
    //                 listItem.textContent = user.username;
    //                 listItem.setAttribute("data-user-id", user.id);  // ✅ ユーザー ID を設定
    //                 listItem.setAttribute("data-room-id", user.room_id);
    //                 console.log(user.unread)
    //                 if (user.username === "？？？") {
    //                     listItem.onclick = () => {
    //                         showPopup("相手からマッチされています！\nアップグレードで相手の情報が見られます✨");
    //                     };
    //                 } else {
    //                     listItem.onclick = () => {
    //                         // markAsRead(user.room_id);
    //                         joinRoom(user.room_id, user.username, user.mbti);
    //                     };
    //                 }
    //                 if (user.mbti in mbtiColorClasses) {
    //                     listItem.classList.add(mbtiColorClasses[user.mbti]);
    //                 }
    //                 if (user.unread) {
    //                     listItem.classList.add("unread");
    //                     const blueDot = document.createElement("span");
    //                     blueDot.classList.add("unread-indicator");
    //                     listItem.appendChild(blueDot);
    //                 }
    //                 listContainer.appendChild(listItem);
    //             });
    //         } else {
    //             alert("マッチングリストの取得に失敗しました。");
    //         }
    //     })
    //     .catch(error => console.error("リスト更新エラー:", error));
    // };


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

    document.getElementById("minigame-btn").addEventListener("click", () => {
        localStorage.setItem("user_id", user_id);  // user_id, mbti を保存
        localStorage.setItem("user_mbti", mbti);
        localStorage.setItem("backToLogin", window.location.href);
        window.location.href = "minigame_list";
        });

    // SubsBtn.addEventListener("click", function () {
    //     localStorage.setItem("user_id", user_id);
    //     localStorage.setItem("backToLogin", window.location.href);
    //     console.log("kakin")
    //     window.location.href = `subscribe`;
    //     });

        
    const intro = document.querySelector('.intro-animation');
    if (intro) {
        setTimeout(() => {
            intro.style.animation = "";
            intro.classList.add('intro-exit'); // 上に戻るアニメーション開始

            // ✅ 上昇アニメーションが終わる2秒後に削除（見た目が完成する）
            setTimeout(() => {
            intro.remove();
            }, 2000);
        }, 4000);
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
                    

    function showPopup(message, callback = null) {
        // オブジェクトで渡された場合の対応を追加
        if (typeof message === "object" && message !== null) {
            const actualMessage = message.message || "メッセージがありません";
            const onWatchAd = message.onWatchAd || null;
            return showPopup(actualMessage, onWatchAd);
        }

        // 既存ポップアップ・オーバーレイを削除
        document.querySelectorAll(".popup-message, .popup-overlay").forEach(e => e.remove());

        // ✅ オーバーレイ
        const overlay = document.createElement("div");
        overlay.className = "popup-overlay";

        // ✅ ポップアップ本体
        const popup = document.createElement("div");
        popup.className = "popup-message persistent-popup";
        popup.innerHTML = `
            <div class="popup-header">
                <span>${message}</span>
                <button class="popup-close-btn">✕</button>
            </div>
            <div class="popup-actions">
                <button class="popup-ok-btn">OK</button>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(popup);

        // ✕ ボタンで閉じる
        popup.querySelector(".popup-close-btn").addEventListener("click", () => {
            popup.remove();
            overlay.remove();
        });

        // OKボタン
        popup.querySelector(".popup-ok-btn").addEventListener("click", () => {
            if (callback) callback();
            popup.remove();
            overlay.remove();
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

    // window.addEventListener("message", (event) => {
    //     alert("pop")
    //     try {
    //         const data = JSON.parse(event.data);
    //         console.log("[DEBUG] login.js メッセージ受信:", data);

    //         if (data.type === "AD_WATCHED") {
    //             if (data.adType === "chat") {
    //                 showPopup("✅ 広告を見てチャット回数が回復しました！");
    //             } else if (data.adType === "match") {
    //                 showPopup("✅ 広告を見てマッチング回数が回復しました！");
    //             }

    //             // ✅ 広告完了時にロード画面を閉じる
    //             const loadingOverlay = document.getElementById("loading-overlay");
    //             loadingOverlay.classList.add("hidden");
    //             loadingOverlay.style.display = "none";
    //         }
    //     } catch (e) {
    //         console.error("[ERROR] メッセージ処理失敗:", e);
    //     }
    // });

    // ✅ React Native WebView から送信される CustomEvent を受け取る
    // window.addEventListener("AD_WATCHED", (event) => {
    //     // alert("🎉 AD_WATCHED カスタムイベントを受信しました");
    //     const adType = event.detail?.type || "unknown";
    //     closeLoadingOverlay();
    //     showPopup(`✅ ${adType === 'chat' ? 'チャット' : 'マッチ'}回数が回復しました！`);
    // });


    window.addEventListener("AD_WATCHED", async (event) => {
        const adType = event.detail?.type || "unknown";
        const user_id = sessionStorage.getItem("user_id");
        closeLoadingOverlay();

        try {
            const res = await fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/adresets/limit/recover", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: user_id,
                    type: adType  // "match" や "chat"
                })
            });
            const json = await res.json();
            if (json.status === "success") {
                // showPopup(`✅ ${adType === 'chat' ? 'チャット' : 'マッチ検索'}回数が回復しました！`);
                showPopup(`マッチング回数が<br>回復しました！`);
                closeLoadingOverlay();
            } else {
                showPopup("⚠️ 回復に失敗しました：" );
                closeLoadingOverlay();
            }
        } catch (e) {
            console.error("❌ AD_WATCHED 回復通信エラー:", e);
            showPopup("❌ 回復通信に失敗しました");
        }
    });

    window.addEventListener("AD_FAILED", (event) => {
        // alert("❌ AD_FAILED カスタムイベントを受信しました");
        const msg = event.detail?.message || "不明なエラー";
        closeLoadingOverlay();
        showPopup(`❌ 広告の視聴に失敗しました: ${msg}`);
    });

    document.getElementById("test-match-animation").addEventListener("click", () => {
        // 例: 自分INTJ・相手ENTP・相手名テスト
        showPoyonMatch("INTJ", "ENTP", "テストさん");
        }
    );

    function closeLoadingOverlay() {
            const loadingOverlay = document.getElementById("loading-overlay");
            if (loadingOverlay) {
                loadingOverlay.classList.add("hidden");
                loadingOverlay.style.display = "none";
            }
        }

        function showWarnBanner(message) {
        const container = document.querySelector(".container") || document.body;
        const div = document.createElement("div");
        div.style.background = "#fff3cd";
        div.style.color = "#664d03";
        div.style.border = "1px solid #ffe69c";
        div.style.borderRadius = "12px";
        div.style.padding = "12px 14px";
        div.style.margin = "10px 0 14px";
        div.style.fontSize = "14px";
        div.style.lineHeight = "1.5";
        div.innerHTML = `⚠️ ${message}`;
        container.insertBefore(div, container.firstChild);
    }

    // サマリー取得
    fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/report/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_id: uid })
    })
    .then(r => r.json())
    .then(json => {
        console.log("通報されてる")
        if (json.status === "success" && json.warn) {
        const cnt = Number(json.total_reports || 0);
        showWarnBanner(`あなたに対する通報が ${cnt} 件あります。安心・安全なご利用をお願いします。`);
        }
    })
    .catch(err => {
        console.warn("report/summary failed", err);
    });

});

