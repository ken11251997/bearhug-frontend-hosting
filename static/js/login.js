document.addEventListener("DOMContentLoaded",function(){
    const user_id = new URLSearchParams(window.location.search).get("user_id");
    const mbti = new URLSearchParams(window.location.search).get("mbti");
    const user_name = new URLSearchParams(window.location.search).get("user_name");
    const data ={user_id : user_id }
    console.log("mbti:", mbti);
    console.log("user_id:", user_id);

    document.getElementById("user-name").innerText = `${user_name}`;
    document.getElementById("user-mbti").innerText = `${mbti}`;
    document.getElementById("user-icon").src = `/static/img/${mbti}.png`;

    const mbtiElement = document.getElementById("user-mbti");
    const mbtiColorClasses = {
        "INTJ": "mbti-purple", "INFJ": "mbti-purple", "ENTJ": "mbti-purple", "ENFJ": "mbti-purple",
        "INTP": "mbti-green", "INFP": "mbti-green", "ENTP": "mbti-green", "ENFP": "mbti-green",
        "ISTP": "mbti-blue", "ISFP": "mbti-blue", "ESTP": "mbti-blue", "ESFP": "mbti-blue",
        "ISTJ": "mbti-yellow", "ISFJ": "mbti-yellow", "ESTJ": "mbti-yellow", "ESFJ": "mbti-yellow"
    };
    
    if (mbti in mbtiColorClasses) {
        mbtiElement.classList.add(mbtiColorClasses[mbti]);
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
                // ✅ マッチング結果を表示
                // document.getElementById("match-result").innerHTML = `
                //         <p>マッチングしました！</p>
                //         <p>相手: ${data.matched_users.username}</p>
                //         <p>MBTI: ${data.matched_users.mbti}</p>
                //         <p>年齢: ${data.matched_users.age}</p>
                //         <p>性別: ${data.matched_users.gender}</p>
                //     `;
                showPopup(
                    `マッチングしました！\n相手: ${data.matched_users.username}\nMBTI: ${data.matched_users.mbti}\n年齢: ${data.matched_users.age}\n性別: ${data.matched_users.gender}`
                );
            } else {
                showPopup("マッチング相手がいません。");
                // setTimeout(() => {
                //     document.getElementById("match-result").innerHTML = `<p>マッチング相手がいません。</p>`;
                    
                // }, 100);
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


    function fetchMatchedUsers(){
        fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/match/matched_list",{
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
                    listItem.onclick = () => joinRoom(user.room_id, user.username,user.mbti);
                    if (user.mbti in mbtiColorClasses) {
                        listItem.classList.add(mbtiColorClasses[user.mbti]);
                    }
                    listContainer.appendChild(listItem);
                });
            } else {
                alert("マッチングリストの取得に失敗しました。");
            }
        })
        .catch(error => console.error("リスト更新エラー:", error));
    };
    document.getElementById("match_list_reload").addEventListener("click", fetchMatchedUsers);
});


// function joinRoom(otherUserId, otherUserName) {
//     fetch(`/chat/get_room/${otherUserId}`)
//         .then(response => response.json())
//         .then(data => {
//             if (data.status === "success") {
//                 const roomId = data.room_id;

//                 // ✅ クリック後、チャットページに遷移
//                 window.location.href = `/chat.html?room_id=${roomId}&user_id=${otherUserId}&username=${encodeURIComponent(otherUserName)}`;
//             } else {
//                 alert("チャットルームの取得に失敗しました。");
//             }
//         });
// }


function joinRoom(roomId, otherUserName,mbti) {
    window.location.href = `chat?room_id=${roomId}&username=${encodeURIComponent(otherUserName)}&mbti=${mbti}`;
}