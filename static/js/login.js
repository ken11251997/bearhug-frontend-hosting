document.addEventListener("DOMContentLoaded",function(){
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
    const restartBtn = document.getElementById("bearspage-btn");
    const SubsBtn = document.getElementById("subscribe-btn");
    const ConBtn = document.getElementById("contact-btn");
    
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
                showPoyonMatch(mbti, data.matched_users.mbti, data.matched_users.username);
            } else if (data.status === "error" && data.message === "matching limit exceeded") {
                showPopup("マッチング回数の上限（5回）に達しました。\nもっと探したい方は、アップグレードをご検討ください。\n※回数は毎日4時・16時にリセットされます。");
            } else if (data.status === "error" && data.message === "Nobudy") {
                showPopup("マッチング相手がいません。");
            } else {
                showPopup("予期せぬエラーが発生しました。");
            }
        })
        .catch(error => {
            console.error("マッチングエラー:", error);
            // document.getElementById("match-result").innerHTML = `<p>エラーが発生しました。</p>`;
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

    // function markAsRead(room_id) {
    //     const userItem = document.querySelector(`[data-room-id="${room_id}"]`);
    //     if (userItem) {
    //         userItem.classList.remove("unread");  // 👈 太字解除
    //     }
    // }

    document.getElementById("match_list_reload").addEventListener("click", fetchMatchedUsers);


    function joinRoom(roomId, otherUserName,mbti) {
        window.location.href = `chat?room_id=${roomId}&username=${encodeURIComponent(otherUserName)}&mbti=${mbti}`;
    }

    restartBtn.addEventListener("click", function () {
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



    function showPoyonMatch(myMBTI, partnerMBTI, partnerName) {
        const popup = document.getElementById("match-animation");
        const leftBear = document.getElementById("left-bear");
        const rightBear = document.getElementById("right-bear");
        const text = document.getElementById("encounter-text");
      
        leftBear.src = `static/img/${partnerMBTI}.png`;
        rightBear.src = `static/img/${myMBTI}.png`;
        text.textContent = `${partnerName}さんと遭遇しました！`;
      
        // 表示＆初期化
        popup.classList.remove("hidden");
        text.style.opacity = 0;
      
        // アニメーション終了後に表示しっぱなし
        setTimeout(() => {
            // そのまま並んで残す（チャットへ遷移 or ボタン表示も追加可）
          }, 3000);
        }
        
       
});