document.addEventListener("DOMContentLoaded",function(){

    const footer=document.getElementById("footer")
    document.getElementById("mbti-test-btn").addEventListener("click", function () {
        window.location.href = 'mbti_test';
    });
    
    // Register to buckend
    document.getElementById("register-form").addEventListener("submit",function(event){
        event.preventDefault();
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

        const data ={
            username : username,
            password : password,
            mbti : mbti,
            prefecture : prefecture,
            age : age,
            gender : gender
        }
        
        fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/auth/register",{
            method:"POST",
            mode: "cors",
            credentials: "include",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result =>{
            showPopup(result.message, () => {
                location.reload();
            });
        })
        .catch(error => console.error("reg-Error",error));

    });

    // Login to buckend
    document.getElementById("login-form").addEventListener("submit",function(event){
        event.preventDefault();
        // if (footer) {
        //     document.body.classList.add("hide-footer"); // ✅ footerを削除
        // }
        console.log("✅ Login form submitted!");

        const username = document.getElementById("log-username").value
        const password = document.getElementById("log-password").value

        const data = {
            username : username,
            password : password
        }

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
                        user_id: result.user_id
                    }));
                    console.log("✅ user_id sent to React Native via postMessage");
                }

                setTimeout(() => {
                    window.location.href = `login?user_id=${result.user_id}&user_name=${result.user_name}&mbti=${result.mbti}`;
                    localStorage.setItem("subs", result.subs);
                    console.log("✅ 遷移コード実行完了");
                }, 100);
                // 勝手にリロードされるためチェック完了後に実施
                console.log("✅ 遷移コード実行完了2");
                // alert("Login success");
                showPopup("Login success");
            }
            else{
                // alert("Error!:"+ result.message);
                showPopup("Error!:"+ result.message);
            }
        })
        .catch(error => console.error("Error",error));
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