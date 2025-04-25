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
                        showPopup("相手からマッチされています！\nアップグレードで相手の情報が見られます✨");
                    };
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
})