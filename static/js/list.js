document.addEventListener("DOMContentLoaded", function () {

    const loadingOverlay = document.getElementById("loading-overlay");
    // loadingOverlay.style.display = "none";
    // loadingOverlay.style.display = "flex";
    loadingOverlay.classList.remove("hidden");
    loadingOverlay.style.display = "flex";

    const BackButton = document.getElementById("buck_btn");
    const loginUrl = localStorage.getItem("backToLogin");
    BackButton.addEventListener("click", function () {
        window.location.href =loginUrl 
        // history.back()
    });

    const mbtiColorClasses = {
        "INTJ": "mbti-purple", "INFJ": "mbti-green", "ENTJ": "mbti-purple", "ENFJ": "mbti-green",
        "INTP": "mbti-purple", "INFP": "mbti-blue", "ENTP": "mbti-purple", "ENFP": "mbti-green",
        "ISTP": "mbti-yellow", "ISFP": "mbti-yellow", "ESTP": "mbti-yellow", "ESFP": "mbti-yellow",
        "ISTJ": "mbti-blue", "ISFJ": "mbti-yellow", "ESTJ": "mbti-blue", "ESFJ": "mbti-blue"
    };
    // if (mbti in mbtiColorClasses) {
    //     mbtiElement.classList.add(mbtiColorClasses[mbti]);
    // }

    const user_id = localStorage.getItem("user_id");
    const data ={user_id : user_id}
    console.log(data)

    
    fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/list/reload_list",{
        method:"POST",
        mode: "cors",
        credentials: "include",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data =>{
        if (data.status ==="success"){
            const listContainer = document.getElementById("matched-user-list");
            // listContainer.innerHTML = ""; //既存リストを空白に
            // data.matched_users_list.forEach(user => {
            //     const listItem = document.createElement("li");
            //     listItem.classList.add("chat-list-item");
            
            //     const mainRow = document.createElement("div");
            //     mainRow.classList.add("chat-main-row");
            //     mainRow.textContent = user.username;
            
            //     const subRow = document.createElement("div");
            //     subRow.classList.add("chat-sub-row");
            //     subRow.textContent = user.latest_message || "（メッセージはまだありません）";
            
            //     listItem.appendChild(mainRow);
            //     listItem.appendChild(subRow);
            
            //     listItem.setAttribute("data-user-id", user.id);
            //     listItem.setAttribute("data-room-id", user.room_id);

            listContainer.innerHTML = "";

            data.matched_users_list.sort((a, b) => {
                // ① 未読かどうか（true=1, false=0）
                const unreadA = a.unread ? 1 : 0;
                const unreadB = b.unread ? 1 : 0;
                if (unreadA !== unreadB) {
                    return unreadB - unreadA; // 未読を先に
                }
            
                // ② 最新メッセージのタイムスタンプ比較（降順）
                const timeA = new Date(a.latest_message_time || 0).getTime();
                const timeB = new Date(b.latest_message_time || 0).getTime();
                console.log("timeA",timeA,"timeB",timeB)
                return timeB - timeA;
            });

            data.matched_users_list.forEach(user => {
                const listItem = document.createElement("li");
                listItem.classList.add("chat-list-item");
            
                const leftGroup = document.createElement("div");
                leftGroup.classList.add("chat-left-group");
            
                // 🔵 未読マーク
                const blueDot = document.createElement("span");
                blueDot.classList.add("unread-indicator");
                if (!user.unread) blueDot.style.visibility = "hidden";
                leftGroup.appendChild(blueDot);
            
                // 🐻 MBTIアイコン
                const bearIcon = document.createElement("img");
                bearIcon.src = `static/img/${user.mbti}.png`;
                bearIcon.alt = `${user.mbti} icon`;
                bearIcon.classList.add("bear-icon");
                leftGroup.appendChild(bearIcon);
            
                // 👤 ユーザー名
                const mainRow = document.createElement("div");
                mainRow.classList.add("chat-main-row");
                mainRow.textContent = user.username;
                leftGroup.appendChild(mainRow);
            
                // 💬 最新メッセージ
                const subRow = document.createElement("div");
                subRow.classList.add("chat-sub-row");
                subRow.textContent = user.latest_message || "";
            
                listItem.appendChild(leftGroup);
                listItem.appendChild(subRow);
            
                listItem.setAttribute("data-user-id", user.id);
                listItem.setAttribute("data-room-id", user.room_id);
            
                if (user.username === "？？？") {
                    listItem.onclick = () => {
                        showPopup("相手からマッチされています！\n広告を見てチャット開始✨");
                        try {
                            // ✅ React Native 側の AsyncStorage に room_id を保存するよう命令
                            if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: "SET_STORAGE",
                                key: "current_room_id",
                                value: user.room_id
                            }));
                        }
                        setTimeout(() => onWatchAd("list", user.room_id, user_id), 1000);
                        } catch (e) {
                                console.error("room_id 保存エラー", e);
                        }
                    }
                } else {
                    listItem.onclick = () => {
                        joinRoom(user.room_id, user.username, user.mbti);
                    };
                }
            
                if (user.mbti in mbtiColorClasses) {
                    listItem.classList.add(mbtiColorClasses[user.mbti]);
                }

                if (user.unread) {
                    listItem.classList.add("has-unread");
                }
            
                listContainer.appendChild(listItem);
            });
            
        } else {
            alert("マッチングリストの取得に失敗しました。");
        }
    })
    .catch(error => {
        console.error("リスト更新エラー:", error);
        alert("エラーが発生しました");
      })
    .finally(() => {
        // ✅ fetch 成功・失敗問わず確実にローディングを非表示に
        loadingOverlay.classList.add("hidden");
        loadingOverlay.style.display = "none";
      });
    

    function refreshMatchedList() {
    // 例：再度 fetch して DOM 更新
    fetchMatchedUsers();
    }

    function joinRoom(roomId, otherUserName,mbti) {
        window.location.href = `chat?room_id=${roomId}&username=${encodeURIComponent(otherUserName)}&mbti=${mbti}`;
    }


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

    function onWatchAd(type, room_id, user_id) {
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

            // const user_id = sessionStorage.getItem("user_id");
            fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/adresets/chatroom/unlock_by_ad", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                room_id: room_id,
                user_id: user_id
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === "success") {
                showPopup("チャットが開放されました🎉");
                  // リスト再取得 or ページリロード
                } else {
                showPopup("⚠️ 開放に失敗：" + data.message);
                }
            })
            .catch(err => {
                console.error("開放エラー:", err);
                showPopup("❌ 通信エラーが発生しました");
            })
            .finally(() => {
                // ✅ 通信後は必ずロード画面を隠す
                // setTimeout(() => refreshMatchedList(), 1000);
                console.log("reload")
                loadingOverlay.classList.add("hidden");
                loadingOverlay.style.display = "none";
                location.reload();
            });
        }
    }

    window.addEventListener("AD_WATCHED", (event) => {
        // alert("🎉 AD_WATCHED カスタムイベントを受信しました");
        const adType = event.detail?.type || "unknown";
        closeLoadingOverlay();
        showPopup(`✅ チャット開始！`);
    });

    window.addEventListener("AD_FAILED", (event) => {
        // alert("❌ AD_FAILED カスタムイベントを受信しました");
        const msg = event.detail?.message || "不明なエラー";
        fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/adresets/chatroom/unlock_by_ad", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                room_id: room_id,
                user_id: user_id
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === "success") {
                showPopup("チャットが開放されました🎉");
                  // リスト再取得 or ページリロード
                } else {
                showPopup("⚠️ 開放に失敗：" + data.message);
                }
            })
            .catch(err => {
                console.error("開放エラー:", err);
                showPopup("❌ 通信エラーが発生しました");
            })
        closeLoadingOverlay();
        showPopup(`❌ 広告の視聴に失敗しました: ${msg}`);
    });

    function closeLoadingOverlay() {
        const loadingOverlay = document.getElementById("loading-overlay");
        if (loadingOverlay && !loadingOverlay.classList.contains("hidden")) {
            loadingOverlay.classList.add("hidden");
            loadingOverlay.style.display = "none";
        }
    }
})