document.addEventListener("DOMContentLoaded", function () {


    const BackButton = document.getElementById("buck_btn");
    BackButton.addEventListener("click", function () {
        const savedUrl = localStorage.getItem("backToLogin");
        window.location.href =savedUrl 
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


    function joinRoom(roomId, otherUserName,mbti) {
        window.location.href = `chat?room_id=${roomId}&username=${encodeURIComponent(otherUserName)}&mbti=${mbti}`;
    }

})