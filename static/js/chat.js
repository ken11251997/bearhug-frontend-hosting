document.addEventListener("DOMContentLoaded", function () {
    window.socket = io("https://bearhug-6c58c8d5bd0e.herokuapp.com");
    const urlParams = new URLSearchParams(window.location.search);
    const room_id = urlParams.get("room_id");
    const Partnername = decodeURIComponent(urlParams.get("username"));
    const user_id = sessionStorage.getItem("user_id")
    const other_mbti = urlParams.get("mbti");

    console.log(room_id)
    console.log(Partnername)
    console.log(user_id)
    console.log(other_mbti)

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
        // chatTitle.innerText = `${Partnername}`;
        // chatMbti.innerText = ` ${other_mbti}`;
        chatTitle.innerHTML = `<span class='chat-name'>${Partnername}</span> <span class='chat-mbti'>(${other_mbti})</span>`;
    } else {
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

    socket.on("ad_message", (data) => {
        if (data.type == "chat") {
            showAdPopup({
                message: "広告を見ればチャット回数が回復します！",
                onWatchAd: () => onWatchAd("chat")  // ✅ type指定
            });
        }
        if (data.type == "match") { 
            showAdPopup({
                message: "広告を見ればマッチ検索が回復します！",
                onWatchAd: () => onWatchAd("match")  // ✅ type指定
            });
        }
    });
    
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
    leaveButton.addEventListener("click", function () {
        console.log("leave")
        if (user_id && room_id) {
            socket.emit("leave", { user_id , room_id });
        }
    });

    socket.on("lev-message", function (msg) {
        let newMessage = document.createElement("p");
        newMessage.classList.add("system-message");  // 新しいCSSクラス
        newMessage.textContent = `${msg.sendername}: ${msg.message}`;
        chatBox.appendChild(newMessage);
        if(msg.sender_id==user_id){
            window.location.href = `login?user_id=${msg.sender_id}&user_name=${msg.sendername}&mbti=${msg.mbti}`};
    });



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

            fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/token/chat_notification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  receiver_name: Partnername, // 相手のユーザーネーム
                  sender_id: user_id,
                  message: message
                })
            })
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
            return;
        }

        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        const maxSizeMB = isImage ? MAX_IMAGE_SIZE_MB : isVideo ? MAX_VIDEO_SIZE_MB : 0;

        if (file.size > maxSizeMB * 1024 * 1024) {
            console.log(file.size)
            alert(`${isImage ? '画像' : '動画'}のサイズは${maxSizeMB}MB以下にしてください`);
            fileInput.value = ""; // クリア
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
        }, 1000);
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

    window.addEventListener("message", (event) => {
    try {
        const data = JSON.parse(event.data);
        console.log("[DEBUG] chat.js メッセージ受信:", data);

        if (data.type === "AD_WATCHED") {
        showPopup(`✅ ${data.adType === 'chat' ? 'チャット' : 'マッチ'}回数が回復しました！`);
        closeLoadingOverlay();
        }
    } catch (e) {
        console.error("[ERROR] AD_WATCHED parse失敗:", e);
    }
    });

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

    ad.addAdEventListener('closed', () => {
    alert('📴 広告が閉じられました');
    if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "AD_WATCHED",
        adType: type
        }));
    }
    setTimeout(() => {
        closeLoadingOverlay();
        showPopup(`✅ ${type === 'chat' ? 'チャット' : 'マッチ'}回数が回復しました！`);
        }, 2000);
    });
})