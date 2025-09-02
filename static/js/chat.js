document.addEventListener("DOMContentLoaded", function () {
    // window.socket = io("https://bearhug-6c58c8d5bd0e.herokuapp.com");
    window.socket = io("https://bearhug-6c58c8d5bd0e.herokuapp.com", {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
    });
    const urlParams = new URLSearchParams(window.location.search);
    const room_id = urlParams.get("room_id");
    const Partnername = decodeURIComponent(urlParams.get("username"));
    const user_id = sessionStorage.getItem("user_id")
    const other_mbti = urlParams.get("mbti");
    const myId = Number(user_id);
    const other_user_id = (() => {
    // room_id から “数字” だけを全部抜く（例: ["166","267"]）
    const nums = (room_id && room_id.match(/\d+/g)) ? room_id.match(/\d+/g).map(Number) : [];
    if (!nums.length || Number.isNaN(myId)) return null;

    // 一般ケース: 最後の2つがユーザID（room_A_B想定）
    if (nums.length >= 2) {
        const [a, b] = nums.slice(-2);
        if (a === myId) return b;
        if (b === myId) return a;
        }
    })


    console.log(room_id)
    console.log(Partnername)
    console.log(user_id)
    console.log(other_mbti)
    console.log("other_user_id:", other_user_id);
    const mbtiNames = {
        "INTJ": "建築家",
        "INTP": "論理学者",
        "ENTJ": "指揮官",
        "ENTP": "討論者",
        "INFJ": "提唱者",
        "INFP": "仲介者",
        "ENFJ": "主人公",
        "ENFP": "運動家",
        "ISTJ": "管理者",
        "ISFJ": "擁護者",
        "ESTJ": "幹部",
        "ESFJ": "領事",
        "ISTP": "巨匠",
        "ISFP": "冒険家",
        "ESTP": "起業家",
        "ESFP": "エンターテイナー"
        };


    function getMbtiColorClass(mbti) {
    const purple = ["INTJ", "INFJ", "ENTJ", "ENFJ"];
    const green = ["INTP", "INFP", "ENTP", "ENFP"];
    const blue = ["ISTP", "ISFP", "ESTP", "ESFP"];
    const yellow = ["ISTJ", "ISFJ", "ESTJ", "ESFJ"];

    if (purple.includes(mbti)) return "mbti-purple";
    if (green.includes(mbti)) return "mbti-green";
    if (blue.includes(mbti)) return "mbti-blue";
    if (yellow.includes(mbti)) return "mbti-yellow";
    return "";
    }

    const loadingOverlay = document.getElementById("loading-overlay");
    loadingOverlay.classList.remove("hidden");
    loadingOverlay.style.display = "flex";
    
    const leaveButton = document.getElementById("leave-btn");
    const sendButton = document.getElementById("send-btn");
    const chatBox = document.getElementById("chat-box");
    const messageInput = document.getElementById("message-input");
    if (chatBox && messageInput) {
        chatBox.addEventListener("click", function () {
            if (window.innerWidth <= 768) { // スマホ判定
                messageInput.focus();
            }
        });
    }


    const ListBtn = document.getElementById("back-btn");
    const sendFileButton = document.getElementById("send-file-btn");

    const fileInput = document.getElementById("file-input");
    document.getElementById("media-btn").addEventListener("click", function() {
        fileInput.click();
      });

      fileInput.addEventListener("change", function () {
        if (fileInput.files.length > 0) {
            sendFileButton.style.color = "yellow";  //  変更：ファイルが選択されたらボタンの色を赤に
        } else {
            sendFileButton.style.color = "";  // 🔄 変更：ファイル未選択なら元の色に戻す
        }
    });

    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    const chatTitle = document.getElementById("chat-title");
    const chatMbti = document.getElementById("chat-mbti");
    console.log("if")
    if (chatTitle && chatMbti) {
        const mbtiLabel = mbtiNames[other_mbti] || "";
        const colorClass = getMbtiColorClass(other_mbti);
        chatTitle.innerHTML = `
        <span class='chat-name'>${Partnername}</span>
        `;
        chatMbti.className = `chat-mbti ${colorClass}`;
        chatMbti.textContent = `(${other_mbti} - ${mbtiLabel})`;
    }
    else {
        console.log("⚠️ `chat-title` または `chat-mbti` の要素が見つかりません！");
    }


    if (other_mbti && chatBox) {
        let imgPath = `static/img/${other_mbti}.png`;  // MBTIタイプの画像に変更
        chatBox.style.backgroundImage = `url('${imgPath}')`;
        chatBox.style.backgroundPosition = "center";
        chatBox.style.backgroundRepeat = "no-repeat";
        chatBox.style.backgroundAttachment = "fixed"; // 背景を固定
        chatBox.style.backgroundSize = "80%"; 
        console.log("適用された背景画像:", chatBox.style.backgroundImage); 
    }
   

    // ✅ サーバー接続,確認メッセージを受け取る
    socket.on("connect", function () {
        console.log("サーバーに接続しました");
    });

    socket.on("disconnect", function () {
        console.log("サーバーとの接続が切れました");
    });

    socket.on("connect_ack", function (data) {
        console.log(data.message);  // "接続しました！" が表示される
    });

    socket.onAny((event, data) => {
        console.log(`📩 イベント受信: ${event}`, data);
    });
    socket.on("error_message", (data) => {
        showPopup(data.message); // or 任意のUI表示
    });

    // socket.on("ad_message", (data) => {
    //     if (data.type == "chat") {
    //         showAdPopup({
    //             message: "広告を見てチャット開始！",
    //             onWatchAd: () => onWatchAd("chat")  // ✅ type指定
    //         });
    //     }
    //     if (data.type == "match") { 
    //         showAdPopup({
    //             message: "広告を見てマッチング開始！",
    //             onWatchAd: () => onWatchAd("match")  // ✅ type指定
    //         });
    //     }
    // });

    socket.on("ad_message", (data) => {
        let attempts = 0;

        const tryShowPopup = () => {
            const overlay = document.getElementById("loading-overlay");
            if (!overlay.classList.contains("hidden") && attempts < 30) {
                attempts++;
                setTimeout(tryShowPopup, 100);  // 最大3秒まで待機
            } else {
                closeLoadingOverlay(); // 念のため
                showAdPopup({
                    message: data.type === "chat" ? "広告を見てチャット開始！" : "広告を見てマッチング開始！",
                    onWatchAd: () => onWatchAd(data.type)
                });
            }
        };

        tryShowPopup();
    });

//     socket.on("ad_message", (data) => {
//         console.log("[ad_message] received:", data); // ★デバッグ
//         if (!data || Number(data.sender_id) !== myId) {
//             console.log("[ad_message] ignore (not mine)"); // ★デバッグ
//             return;
//         }

//         // ここから先は自分宛てのみ
//         const overlay = document.getElementById("loading-overlay");
//         if (overlay) overlay.classList.add("hidden"); // 念のため
//         showAdPopup({
//             message: data.type === "chat" ? "広告を見てチャット開始！" : "広告を見てマッチング開始！",
//             onWatchAd: () => onWatchAd(data.type),
//         });
// });
    
    // ログインページへ
    // BackButton.addEventListener("click", function () {
    //     if (user_id && room_id) {
    //         // window.location.href =`/login?user_id=${result.user_id}&user_name=${result.user_name}&mbti=${result.mbti}`;
            // socket.emit("back", { user_id , room_id });
    //     }
    // });

    // const ListBtn = document.getElementById("match_list_reload");
    ListBtn.addEventListener("click", function () {
        localStorage.setItem("user_id", user_id);
        console.log("List")
        socket.emit("back", { user_id , room_id });
        window.location.href = `list`;
    });

    // socket.on("back", function (msg) {
    //     if(msg.user_id==user_id){
    //         window.location.href = `login?user_id=${msg.user_id}&user_name=${msg.user_name}&mbti=${msg.mbti}`;
    //         }
    // });

    // ルームを退出
    // leaveButton.addEventListener("click", function () {
    //     console.log("leave")
    //     if (user_id && room_id) {
    //         socket.emit("leave", { user_id , room_id });
    //     }
    // });

    // socket.on("lev-message", function (msg) {
    //     let newMessage = document.createElement("p");
    //     newMessage.classList.add("system-message");  // 新しいCSSクラス
    //     newMessage.textContent = `${msg.sendername}: ${msg.message}`;
    //     chatBox.appendChild(newMessage);
    //     if(msg.sender_id==user_id){
    //         window.location.href = `login?user_id=${msg.sender_id}&user_name=${msg.sendername}&mbti=${msg.mbti}`};
    // });
   


    // ✅ ジョインあたり
    socket.emit("join", {room_id: room_id, user_id: user_id });
    console.log("join")

    // socket.on("load_messages", function (messages) {
    //     console.log(messages)
    //     chatBox.innerHTML = "";  // 既存のメッセージをクリア
    //     messages.forEach(msg => {
    //         let newMessage = document.createElement("p");
    //         if (msg.sender_id == user_id) {
    //             newMessage.classList.add("my-message");
    //         } else {
    //             newMessage.classList.add("partner-message");
    //         }
    //         newMessage.textContent = `${msg.sendername}: ${msg.message}`;
    //         chatBox.appendChild(newMessage);
    //     });
    // });

    socket.on("load_messages", function (messages) {

        console.log("📩 メッセージ履歴をロード:", messages);
        chatBox.innerHTML = "";  
    
        messages.forEach(msg => {
            let messageDiv = document.createElement("div");
            messageDiv.classList.add("message");
    
            // let senderLabel = document.createElement("p");
            // senderLabel.textContent = `${msg.sendername}`;
            // senderLabel.classList.add("sender-label");
            // messageDiv.appendChild(senderLabel);
    
            if (msg.sender_id == user_id) {
                messageDiv.classList.add("my-message");
            } else {
                messageDiv.classList.add("partner-message");
            }
    
            if (msg.message) {
                // let textMessage = document.createElement("p");
                // textMessage.textContent = msg.message;
                // messageDiv.appendChild(textMessage);
                messageDiv.textContent = msg.message;
            } else if (msg.file_url) {
                let mediaElement = null;
    
                if (msg.file_url.endsWith(".jpg") || msg.file_url.endsWith(".png") || msg.file_url.endsWith(".jpeg") || msg.file_url.endsWith(".gif")) {
                    mediaElement = document.createElement("img");
                    mediaElement.src = msg.file_url;
                } else if (msg.file_url.endsWith(".mp4") || msg.file_url.endsWith(".webm") || msg.file_url.endsWith(".mov")) {
                    mediaElement = document.createElement("video");
                    mediaElement.controls = true;
                    let source = document.createElement("source");
                    source.src = msg.file_url;
                    source.type = "video/mp4";
                    mediaElement.appendChild(source);
                } else {
                    mediaElement = document.createElement("a");
                    mediaElement.href = msg.file_url;
                    mediaElement.innerText = "ダウンロード: " + msg.file_url;
                }
    
                if (mediaElement) {
                    mediaElement.classList.add("message-media");
                    messageDiv.appendChild(mediaElement);
                }
            }

            chatBox.appendChild(messageDiv);
            // chatBox.appendChild(document.createElement("br"));
             // 初回ロード時にスクロールを一番下に移動
            
        });
        scrollToBottom();
        loadingOverlay.classList.add("hidden");
        loadingOverlay.style.display = "none";
    });
    

    // send,recieveあたり
    sendButton.addEventListener("click", function () {
        let message = messageInput.value.trim();
        if (message && room_id) {
            // socket.emit("message", { username, room, message });
            socket.emit("message",{room : room_id,message :message, sender_id: user_id});
            console.log(message)
            messageInput.value = "";
            messageInput.focus();  // ✅ これを追加：再フォーカスしてキーボードを維持！

            // fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/token/chat_notification", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({
            //       receiver_name: Partnername, // 相手のユーザーネーム
            //       sender_id: user_id,
            //       message: message
            //     })
            // })
        }
    });

    socket.on("message", function (msg) {
        let newMessage = document.createElement("div");
        newMessage.classList.add("message");
        console.log("ttuka")
        console.log(msg.sender_id ,user_id)
        if (msg.sender_id == user_id) {
            newMessage.classList.add("my-message");
        } else if (!msg.sender_id) {  // 退出メッセージなどIDがない場合
            newMessage.classList.add("system-message");  // 新しいCSSクラス
        } else {
            newMessage.classList.add("partner-message");
        }
        // newMessage.textContent = `${msg.sendername}: ${msg.message}`;
        // showInAppNotification(msg.message);
        newMessage.textContent = `${msg.message}`;
        chatBox.appendChild(newMessage);
        scrollToBottom();
    });


    socket.on("new_file", function(data) {
        console.log("✅ receive new_file event:", data);
        closeLoadingOverlay(); 
        showPopup("🔔 画像/動画が送信されました");
    
        var chatBox = document.getElementById('chat-box');
        var messageDiv = document.createElement("div");
        messageDiv.classList.add("message");
    
        // ✅ 送信者によって左右の表示を変更
        if (data.sender_id == user_id) {
            console.log("📩 自分のメッセージ");
            messageDiv.classList.add("my-message");
        } else {
            console.log("📩 相手のメッセージ");
            messageDiv.classList.add("partner-message");
        }
    
        // ✅ 送信者の名前を表示（背景色つき）
        // var senderLabel = document.createElement("p");
        // senderLabel.textContent = `${data.sendername}`;
        // senderLabel.classList.add("sender-label");
        // messageDiv.appendChild(senderLabel);
    
        var mediaElement = null;  // ✅ `null` で初期化
    
        // ✅ 画像の場合
        if (data.file_url.endsWith('.jpg') || data.file_url.endsWith('.png') || data.file_url.endsWith('.jpeg') || data.file_url.endsWith('.gif')) {
            mediaElement = document.createElement('img');
            mediaElement.src = data.file_url;
        } 
        // ✅ 動画の場合
        else if (data.file_url.endsWith('.mp4') || data.file_url.endsWith('.webm') || data.file_url.endsWith('.mov')) {
            console.log("✅ Video received:", data.file_url);
            mediaElement = document.createElement('video');
            mediaElement.controls = true;
            var source = document.createElement('source');
            source.src = data.file_url;
            source.type = "video/mp4";
            mediaElement.appendChild(source);
        } 
        // ✅ その他のファイルの場合（ダウンロードリンク）
        else {
            mediaElement = document.createElement('a');
            mediaElement.href = data.file_url;
            mediaElement.innerText = 'ダウンロード: ' + data.fileName;
        }
    
        if (mediaElement) {  // ✅ `mediaElement` が `null` でない場合のみ追加
            mediaElement.classList.add("message-media");  // ✅ `classList` を適用
            messageDiv.appendChild(mediaElement);
        }
        // showInAppNotification(msg.message);
        chatBox.appendChild(messageDiv);
        // chatBox.appendChild(document.createElement('br'));
        scrollToBottom();

        loadingOverlay.classList.add("hidden");
        loadingOverlay.style.display = "none";
    });
    

    const MAX_IMAGE_SIZE_MB = 3;
    const MAX_VIDEO_SIZE_MB = 5;

    sendFileButton.addEventListener("click", function () {

        loadingOverlay.classList.remove("hidden");
        loadingOverlay.style.display = "flex";

        let file = fileInput.files[0];
        if (!file) {
            console.error("❌ ファイルが選択されていません！");
            showPopup("ファイルを選択してください！");
            closeLoadingOverlay(); 
            return;
        }

        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        const maxSizeMB = isImage ? MAX_IMAGE_SIZE_MB : isVideo ? MAX_VIDEO_SIZE_MB : 0;

        if (file.size > maxSizeMB * 1024 * 1024) {
            console.log(file.size)
            showPopup(`${isImage ? '画像' : '動画'}のサイズは${maxSizeMB}MB以下にしてください`);
            fileInput.value = ""; // クリア
            closeLoadingOverlay(); // ✅ サイズ超過時にもローディングを閉じる
            return;
          }

        let reader = new FileReader();
        reader.onload = function(event) {
            let fileData = event.target.result;  // ArrayBuffer 形式のデータ
            console.log("📤 ファイルデータを送信:", fileData);

            // ✅ ファイル情報を含めて送信
            socket.emit("new_file", {
                fileName: file.name,
                fileType: file.type,
                fileData: fileData,
                room: room_id,
                sender_id : user_id
            });
            sendFileButton.style.color = ""; // ✅ 送信後、元の色に戻す
            fileInput.value = ""; // ✅ 送信後にファイル入力をリセット
        };
        reader.readAsArrayBuffer(file);
    });  // ✅ バイナリデータに変換


    // function showInAppNotification(message) {
    //     // 既存通知があれば削除
    //     const existing = document.getElementById("in-app-banner");
    //     if (existing) existing.remove();
    
    //     const banner = document.createElement("div");
    //     banner.id = "in-app-banner";
    //     banner.className = "in-app-banner";
    //     banner.textContent = message;
    
    //     document.body.appendChild(banner);
    
    //     // 3秒後に消す
    //     setTimeout(() => {
    //         banner.classList.add("fade-out");
    //         setTimeout(() => banner.remove(), 500); // アニメ後に削除
    //     }, 3000);
    // }

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
        }, 1500);
    }

    function showAdPopup({message, onWatchAd}) {
        // 既存のポップアップとオーバーレイを削除
        document.querySelectorAll(".popup-message, .popup-overlay").forEach(e => e.remove());

        // ✅ オーバーレイを作成
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
                <button class="popup-watch-ad-btn">広告を見る</button>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(popup);

        // ✕ボタンで閉じる
        popup.querySelector(".popup-close-btn").addEventListener("click", () => {
            popup.remove();
            overlay.remove(); // ✅ オーバーレイも削除
        });

        // 広告視聴ボタン
        popup.querySelector(".popup-watch-ad-btn").addEventListener("click", () => {
            if (onWatchAd) onWatchAd();
            popup.remove();
            overlay.remove();
        });
    }  

//     window.addEventListener("message", (event) => {
//         alert("📩 message 受信しました");

//         let data;
//         try {
//             if (typeof event.data === "string") {
//                 alert("🔍 event.data は string です");
//                 data = JSON.parse(event.data);
//             } else if (typeof event.data === "object") {
//                 alert("🔍 event.data は object です");
//                 data = event.data;
//             } else {
//                 alert("⚠️ 未対応のメッセージ形式: " + typeof event.data);
//                 return;
//             }
//         } catch (e) {
//             alert("❌ JSON parse に失敗しました: " + e.message);
//             return;
//         }

//         alert("✅ 解析成功: type = " + data.type + ", adType = " + data.adType);

//         if (data.type === "AD_WATCHED") {
//             alert("🎉 AD_WATCHED を受信しました");
//             closeLoadingOverlay();
//             showPopup(`✅ ${data.adType === 'chat' ? 'チャット' : 'マッチ'}回数が回復しました！`);
//         } else if (data.type === "AD_FAILED") {
//             alert("❌ AD_FAILED を受信しました");
//             closeLoadingOverlay();
//             showPopup("❌ 広告の視聴に失敗しました");
//         } else {
//             alert("📭 未対応のメッセージタイプ: " + data.type);
//         }
// });

// ローディングを閉じる共通関数
    function closeLoadingOverlay() {
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay && !loadingOverlay.classList.contains("hidden")) {
        loadingOverlay.classList.add("hidden");
        loadingOverlay.style.display = "none";
    }
    }

    // ✅ 広告開始前に必ずロードを表示
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
        // Web fallback
        console.log("📺 (仮) 広告再生開始");
        setTimeout(() => {
        closeLoadingOverlay();
        showPopup(`✅ ${type === 'chat' ? 'チャット' : 'マッチ'}回数が回復しました！`);
        }, 2000);
    }
    }

    // ✅ React Native WebView から送信される CustomEvent を受け取る
    // window.addEventListener("AD_WATCHED", (event) => {
    //     // alert("🎉 AD_WATCHED カスタムイベントを受信しました");
    //     const adType = event.detail?.type || "unknown";
    //     closeLoadingOverlay();
    //     showPopup(`✅ ${adType === 'chat' ? 'チャット' : 'マッチ'}回数が回復しました！`);
    // });

    window.addEventListener("AD_WATCHED", async (event) => {
        const adType = event.detail?.type || "unknown";
        closeLoadingOverlay();
        // showPopup(`✅ ${adType === 'chat' ? 'チャット' : 'マッチ'}回数が回復しました！`);
        showPopup(`メッセージができるよ！`);
        // alert("🎯 API呼び出し開始: 回復タイプ =", adType, "ユーザーID =", user_id);
        // ✅ 実際のチャット回数のリセット
        if (adType === "chat") {
            try {
                const res = await fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/adresets/limit/recover", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        user_id: user_id,
                        type: adType
                    })
                });
                const json = await res.json();
                console.log("✅ チャット回数リセット結果:", json);
            } catch (err) {
                console.error("❌ チャット回数リセット失敗:", err);
            }
        }
    });

    window.addEventListener("AD_FAILED", (event) => {
        // alert("❌ AD_FAILED カスタムイベントを受信しました");
        const msg = event.detail?.message || "不明なエラー";
        closeLoadingOverlay();
        showPopup(`❌ 広告の視聴に失敗しました: ${msg}`);
    });

    messageInput.addEventListener("focus", () => {
        setTimeout(() => {
            messageInput.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
    });

  
  // ---------- 1) マッチ解除：#leave-btn の既存リスナーを無効化して差し替え ----------
    (function bindUnmatch() {

        leaveButton.addEventListener("click", async (e) => {
        e.preventDefault();
        if (!user_id || !room_id) {
            showPopup("処理に必要な情報が不足しています");
            return;
        }
        const ok = confirm(
            "この相手とのマッチを解除しますか？（相手の一覧からも非表示になります）"
        );
        if (!ok) return;

        try {
            loadingOverlay.classList.remove("hidden");
            loadingOverlay.style.display = "flex";
            const res = await fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/chat/unmatch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ user_id: myId, room_id: roomId }),
            });
            const json = await res.json();
            if (json.status === "success") {
            showPopup("マッチを解除しました");
            setTimeout(() => (window.location.href = "/list"), 700);
            } else {
            showPopup(json.message || "解除に失敗しました");
            }
        } catch (err) {
            console.error(err);
            showPopup("通信エラーが発生しました");
        } finally {
            closeLoadingOverlay();
        }
        });
    })();

    // ---------- 2) 通報：#report-btn があれば使い、無ければ作る ----------
    (function bindReport() {
        const header =
        document.querySelector(".chat-header") || document.body;
        let reportBtn = document.getElementById("report-btn");

        // if (!reportBtn) {
        // // HTML上に無い構成でも動くように保険で作成（あれば何もしない）
        // reportBtn = document.createElement("button");
        // reportBtn.id = "report-btn";
        // reportBtn.className = "btn";
        // reportBtn.type = "button";
        // reportBtn.textContent = "通報";
        // header.appendChild(reportBtn);
        // }

        reportBtn.addEventListener("click", () => openReportModal());
    })();

    function openReportModal() {
        const overlay = document.createElement("div");
        overlay.className = "popup-overlay";
        const modal = document.createElement("div");
        modal.className = "popup-message persistent-popup";
        modal.style.maxWidth = "92vw";
        modal.innerHTML = `
        <div class="popup-header" style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <span>通報の理由を選択してください</span>
            <button class="popup-close-btn">✕</button>
        </div>
        <div class="popup-actions" style="text-align:left;">
            <label style="display:block;margin:6px 0;"><input type="radio" name="rp_reason" value="harassment" checked> 迷惑・嫌がらせ</label>
            <label style="display:block;margin:6px 0;"><input type="radio" name="rp_reason" value="spam"> スパム／宣伝</label>
            <label style="display:block;margin:6px 0;"><input type="radio" name="rp_reason" value="scam"> 詐欺の可能性</label>
            <label style="display:block;margin:6px 0;"><input type="radio" name="rp_reason" value="inappropriate"> 不適切な内容</label>
            <label style="display:block;margin:6px 0;"><input type="radio" name="rp_reason" value="other"> その他</label>
            <textarea id="rp_details" rows="3" placeholder="詳細（任意）" style="width:100%;margin-top:8px;"></textarea>
            <button id="rp_submit" class="popup-watch-ad-btn" style="margin-top:10px;">送信</button>
        </div>
        `;
        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        modal.querySelector(".popup-close-btn").addEventListener("click", () => {
        modal.remove();
        overlay.remove();
        });

        modal.querySelector("#rp_submit").addEventListener("click", async () => {
        if (!user_id) {
            showPopup("ログイン情報が見つかりません");
            return;
        }
        if (!other_user_id) {
            showPopup("相手情報が取得できませんでした。リスト画面から入室し直してください。");
            return;
        }
        const reason =
            (modal.querySelector('input[name="rp_reason"]:checked') || {}).value ||
            "other";
        const details = modal.querySelector("#rp_details").value || "";

        try {
            // openLoadingOverlay();
            const res = await fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/chat/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                reporter_user_id: myId,
                reported_user_id: reportedUserId,
                room_id: roomId,
                reason,
                details,
            }),
            });
            const json = await res.json();
            if (json.status === "success") {
            const cnt = Number(json.total_reports || 0);
            showPopup(`通報を受け付けました（累計: ${cnt} 件）`);
            } else {
            showPopup(json.message || "通報に失敗しました");
            }
        } catch (err) {
            console.error(err);
            showPopup("通信エラーが発生しました");
        } finally {
            closeLoadingOverlay();
            modal.remove();
            overlay.remove();
        }
        });
    }

    (function attachOptionsMenu() {
    const btn  = document.getElementById("options-btn");
    const menu = document.getElementById("chat-actions-menu");
    if (!btn || !menu) {
        console.warn("[options] elements not found");
        return;
    }

    // 初期は閉じておく（CSS競合対策。!importantの競合を避ける）
    menu.classList.add("hidden");
    btn.setAttribute("aria-expanded", "false");

    // ︙ボタンで開閉
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const willOpen = menu.classList.contains("hidden"); // 開く前の状態を見ておく
        menu.classList.toggle("hidden");
        btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
        // デバッグ用ログ
        console.log("[options] toggled ->", willOpen ? "open" : "close");
    });

    // メニューの中は閉じない（項目クリックで閉じたい場合はここで閉じる）
    menu.addEventListener("click", (e) => {
        // e.stopPropagation(); // ← 中のボタン押下で即閉じたくないなら有効
    });

    // 画面の他の場所をクリックしたら閉じる
    document.addEventListener("click", (e) => {
        if (menu.classList.contains("hidden")) return;
        const clickedInside = menu.contains(e.target) || btn.contains(e.target);
        if (!clickedInside) {
        menu.classList.add("hidden");
        btn.setAttribute("aria-expanded", "false");
        console.log("[options] closed by outside click");
        }
    });

    // 画面が切り替わる・リサイズなどでも閉じる
    ["resize", "blur", "orientationchange"].forEach(ev =>
        window.addEventListener(ev, () => {
        if (!menu.classList.contains("hidden")) {
            menu.classList.add("hidden");
            btn.setAttribute("aria-expanded", "false");
            console.log("[options] closed by", ev);
        }
        })
    );
    })();
})