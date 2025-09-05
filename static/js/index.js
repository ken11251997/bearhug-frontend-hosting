document.addEventListener("DOMContentLoaded",function(){

    let receivedFcmToken = null;
    // 🔽 App.js（ネイティブ）から FCM トークンを受け取る
    window.addEventListener("FCM_TOKEN_RECEIVED", (event) => {
    receivedFcmToken = event.detail;
    console.log("✅ Web側でFCMトークン受信:", receivedFcmToken);
    // alert("FCM TOKEN: " + receivedFcmToken);
    localStorage.setItem("fcmToken", receivedFcmToken);
    });

    const loadingOverlay = document.getElementById("loading-overlay");
    loadingOverlay.style.display = "none"; // ← 最初に絶対非表示にする
    document.getElementById("mbti-test-btn").addEventListener("click", function () {
        window.location.href = 'mbti_test';
    });

    // ✅ イントロオーバーレイ制御とBGM再生
    const overlay = document.getElementById("intro-overlay");
    const startBtn = document.getElementById("start-btn");
    
    // Register to buckend
    document.getElementById("register-form").addEventListener("submit",function(event){
        event.preventDefault();
        // loadingOverlay.classList.remove("hidden")
        loadingOverlay.style.display = "flex";
        console.log("✅ Login form submitted!");
        // if (footer) {
        //     document.body.classList.add("hide-footer");  // ✅ footerを削除
        // }
        // get Data from HTML
        const username = document.getElementById("reg-username").value
        const password = document.getElementById("reg-password").value
        const mbti = document.getElementById("mbti").value
        const prefecture = document.getElementById("prefecture").value
        const age = document.getElementById("age").value
        const gender = document.getElementById("gender").value
        const fcmToken = receivedFcmToken || localStorage.getItem("fcmToken");
        console.log(fcmToken)
   
        // ✅ パスワードの長さをチェック（5文字未満なら登録不可）
        // if (password.length < 5) {
        //     showPopup("パスワードは5文字以上に!");
        //     return;  
        // }
            // alert("fcm_token: " + fcmToken);

        const data ={
            username : username,
            password : password,
            mbti : mbti,
            prefecture : prefecture,
            age : age,
            gender : gender,
            fcm_token: fcmToken  // ← ここがポイント
        }
        
        
        fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/auth/register",{
            method:"POST",
            mode: "cors",
            credentials: "include",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
                loadingOverlay.style.display = "none";
                console.log("登録結果:", result);
                if (result.status === "success") {
                    showPopup("登録成功！", () => {
                        // location.reload();
                        sessionStorage.setItem("user_id", result.user_id);
                        window.location.href = `login?user_id=${result.user_id}&user_name=${result.user_name}&mbti=${result.mbti}`;
                        localStorage.setItem("subs", result.subs);
                        console.log("✅ 遷移コード実行完了");
                    });
                } else {
                    showPopup(`❌ 登録失敗: ${result.message}`);
                }
            })
        .catch(error => {
            // loadingOverlay.classList.add("hidden");
            loadingOverlay.style.display = "none";
            console.error("reg-Error",error)});

    });

    // Login to buckend
    document.getElementById("login-form").addEventListener("submit",function(event){
        event.preventDefault();
        // if (footer) {
        //     document.body.classList.add("hide-footer"); // ✅ footerを削除
        // }
        console.log("✅ Login form submitted!");
        // loadingOverlay.classList.remove("hidden")
        loadingOverlay.style.display = "flex";

        const username = document.getElementById("log-username").value
        const password = document.getElementById("log-password").value

        const data = {
            username : username,
            password : password
        }

        const fcmToken = receivedFcmToken || localStorage.getItem("fcmToken");
        if (fcmToken) {
          fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/auth/update-token", {
            method: "POST",
            mode: "cors",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_name: username,
              fcm_token: fcmToken
            })
          })
            .then(() => {
              console.log("✅ fcm_token 更新完了");
            //   alert("fcm_token1: " + fcmToken);
            })
            .catch(err => {
              console.error("❌ fcm_token 更新失敗:", err);
            //   alert("fcm_token2: " + fcmToken);
            });
        }
        // alert("fcm_token3: " + fcmToken);

        fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/auth/login",{
            method :"POST",
            mode: "cors",
            credentials: "include",
            headers : {"Content-Type":"application/json"},
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if(result.status === "success"&& result.user_id !== undefined){
                console.log("Login Response:", result);
                sessionStorage.setItem("user_id", result.user_id);
                console.log(sessionStorage.getItem("user_id"));

                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: "LOGIN_SUCCESS",
                        username: username,
                        password: password,
                        user_id: String(result.user_id) 
                    }));
                }

                // loadingOverlay.classList.add("hidden");
                loadingOverlay.style.display = "none";
                showPopup("ログイン成功！", () => {
                    window.location.href = `login?user_id=${result.user_id}&user_name=${result.user_name}&mbti=${result.mbti}`;
                    localStorage.setItem("subs", result.subs);
                    console.log("✅ 遷移コード実行完了");
                });
        

                // setTimeout(() => {
                //     window.location.href = `login?user_id=${result.user_id}&user_name=${result.user_name}&mbti=${result.mbti}`;
                //     localStorage.setItem("subs", result.subs);
                //     console.log("✅ 遷移コード実行完了");
                // }, 100);
                // // 勝手にリロードされるためチェック完了後に実施
                // console.log("✅ 遷移コード実行完了2");
                // // alert("Login success");
                // showPopup("Login success");
            }
            else{
                // alert("Error!:"+ result.message);
                // loadingOverlay.classList.add("hidden");
                loadingOverlay.style.display = "none";
            //     showPopup("Error!:"+ result.message);
            showPopup("ユーザ名・パスワードが異なります");
             }
        })
        .catch(error =>{
            loadingOverlay.classList.add("hidden");
            console.error("Error",error)});
    });

    // フッターを非表示にする関数
    function hideFooterIfFormVisible() {
        const loginForm = document.getElementById("login-form");
        const registerForm = document.getElementById("register-form");
        const footer = document.getElementById("footer");
    
        if (
        (loginForm && !loginForm.classList.contains("hidden")) ||
        (registerForm && !registerForm.classList.contains("hidden"))
        ) {
        footer.classList.add("hide");
        }
    }
    
    // 監視対象を設定
    const observer = new MutationObserver(hideFooterIfFormVisible);
    
    // 対象フォームに対して監視を設定
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    
    if (loginForm) {
        observer.observe(loginForm, { attributes: true, attributeFilter: ['class'] });
    }
    if (registerForm) {
        observer.observe(registerForm, { attributes: true, attributeFilter: ['class'] });
    }

    //WebView 側で準備完了通知を出す
    if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'WEB_READY' }));
    }

    
    window.addEventListener("AUTO_LOGIN_CREDENTIALS", (event) => {
    const isLogout = localStorage.getItem("logoutFlag");
    if (isLogout === "true") {
        console.log("⏹️ 自動ログイン抑制中（ログアウト直後）");
        localStorage.removeItem("logoutFlag"); // ✅ 1度だけ抑制
        return;
    }

    const { username, password } = event.detail;
    if (username && password) {
        document.getElementById("log-username").value = username;
        document.getElementById("log-password").value = password;
        document.getElementById("login-form").dispatchEvent(new Event("submit"));
    }
});

    // Function to show popup
    function showPopup(message,callback) {
        // Remove existing popups
        document.querySelectorAll(".popup-message").forEach(p => p.remove());
        console.log(message)
        const popup = document.createElement("div");
        popup.className = "popup-message";
        popup.innerText = message;
        console.log(popup)
        document.body.appendChild(popup);
        
        setTimeout(() => {
            popup.classList.add("fade-out");
            setTimeout(() => {
                popup.remove();
                if (callback) callback();
            }, 100);
        }, 750);
    }
});