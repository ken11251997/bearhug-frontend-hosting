document.addEventListener("DOMContentLoaded", function () {
    const socket = io()
    const urlParams = new URLSearchParams(window.location.search);
    const room_id = urlParams.get("room_id");
    const Partnername = decodeURIComponent(urlParams.get("username"));
    const user_id = sessionStorage.getItem("user_id")

    console.log(room_id)
    console.log(Partnername)
    console.log(user_id)


    const leaveButton = document.getElementById("leave-btn");
    const sendButton = document.getElementById("send-btn");
    const chatBox = document.getElementById("chat-box");
    const messageInput = document.getElementById("message-input");
    const BackButton = document.getElementById("back-btn");
    const fileInput = document.getElementById("file-input");
    const sendFileButton = document.getElementById("send-file-btn");


    document.addEventListener("DOMContentLoaded", function() {
        const chatTitle = document.getElementById("chat-title");
        if (chatTitle) {
            chatTitle.innerText = `チャット相手: ${Partnername}`;
        } else {
            console.log("⚠️ `chat-title` の要素が見つかりません！");
        }
    });

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

    
    // ログインページへ
    BackButton.addEventListener("click", function () {
        if (user_id && room_id) {
            window.location.href = `/login?user_id=${user_id}`;
        }
    });

    // ルームを退出
    leaveButton.addEventListener("click", function () {
        console.log("leave")
        if (user_id && room_id) {
            socket.emit("leave", { user_id , room_id });
        }
    });

    socket.on("lev-message", function (msg) {
        let newMessage = document.createElement("p");
        console.log("ttukalev")
        newMessage.classList.add("system-message");  // 新しいCSSクラス
        newMessage.textContent = `${msg.sendername}: ${msg.message}`;
        chatBox.appendChild(newMessage);
        if(msg.sender_id==user_id){
            window.location.href = `/login?user_id=${user_id}`};
    });



    // ✅ ジョインあたり
    socket.emit("join", {room: room_id, user_id: user_id });
    console.log("join")

    socket.on("load_messages", function (messages) {
        // console.log(messages)
        chatBox.innerHTML = "";  // 既存のメッセージをクリア
        messages.forEach(msg => {
            let newMessage = document.createElement("p");
            if (msg.sender_id == user_id) {
                newMessage.classList.add("my-message");
            } else {
                newMessage.classList.add("partner-message");
            }
            newMessage.textContent = `${msg.sendername}: ${msg.message}`;
            chatBox.appendChild(newMessage);
        });
    });

    // send,recieveあたり
    sendButton.addEventListener("click", function () {
        let message = messageInput.value.trim();
        if (message && room_id) {
            // socket.emit("message", { username, room, message });
            socket.emit("message",{room : room_id,message :message, sender_id: user_id});
            messageInput.value = "";
        }
    });

    socket.on("message", function (msg) {
        let newMessage = document.createElement("p");
        console.log("ttuka")
        console.log(msg.sender_id ,user_id)
        if (msg.sender_id == user_id) {
            newMessage.classList.add("my-message");
        } else if (!msg.sender_id) {  // 退出メッセージなどIDがない場合
            newMessage.classList.add("system-message");  // 新しいCSSクラス
        } else {
            newMessage.classList.add("partner-message");
        }
        newMessage.textContent = `${msg.sendername}: ${msg.message}`;
        chatBox.appendChild(newMessage);
    });

    

    sendFileButton.addEventListener("click", function () {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                console.log("FileReader initialized:", reader); // ✅ デバッグ
                socket.emit("file_message", {
                    room: room_id,
                    sender_id: user_id,
                    file: event.target.result,
                    fileName: file.name,
                    fileType: file.type
                });
            };
            reader.onerror = function (event) {
                console.error("FileReader error:", event.target.error); // ✅ エラーチェック
            };
            reader.readAsDataURL(file);
        }
    });


    // socket.on("file_message", function (data) {
    //     let newMessage = document.createElement("div");
        
    //     let imageUrl = decodeURIComponent(data.file_url); // ✅ URLデコードを追加
    //     // if (!imageUrl.startsWith("/files/uploads/")) {
    //     //     console.log("tuuka")
    //     //     imageUrl = "/files/uploads/" + data.file_url;  // ✅ URLを正しく補正
    //     // }
    
    //     if (data.file_type.startsWith("image")) {
    //         // newMessage.innerHTML = `<p>${data.sendername}:</p>
    //         // <img src="${imageUrl}" style="max-width:100%;">`;
    //         // console.log(newMessage,"img")

    //         img = document.createElement('img');
    //         img.src = imageUrl ;
    //         console.log(img)
    //         chatBox.appendChild(img);
    //     } else if (data.file_type.startsWith("video")) {
    //         newMessage.innerHTML = `<p>${data.sendername}:</p>
    //         <video src="${imageUrl}" controls style="max-width:100%;"></video>`;
    //         console.log(newMessage,"video")
    //     }
    
    //     // chatBox.appendChild(newMessage);

    socket.on("file_message", function (data) {
        let newMessage = document.createElement("div");
        let fileName = decodeURIComponent(data.file_url.split('/').pop());
        let fileUrl = `/file/uploads/${encodeURIComponent(fileName)}`;

    
        if (data.file_type.startsWith("image")) {
            let img = document.createElement('img');
            img.src = fileUrl;
            img.style.maxWidth = "100%";
            newMessage.appendChild(img);
        } else if (data.file_type.startsWith("video")) {
            let video = document.createElement('video');
            video.src = fileUrl;
            video.controls = True;
            video.style.maxWidth = "100%";
            newMessage.appendChild(video);
        }
    
        chatBox.appendChild(newMessage);
    });
    
});
        



    




 

   
    // window.addEventListener("load", function() {
    //     if (performance.navigation.type === 1) {
    //         console.log("🔄 ページがリロードされました");
    //     } else {
    //         console.log("✅ ページがリロードされていません");
    //     }
    // });


    


    // function joinRoom(room_id){
    //     alert(room_id)
    //     socket.emit("join", {room: room_id });
    //     console.log("join room")
    //     alert("join room")

    //     fetch(`http://127.0.0.1:5000/chat/history/${room_id}`,{
    //         method:"GET",
    //         credentials: "include"
    //     })
    //     .then(response => response.json)
    //     .then(message_history =>{
    //         console.log(message_history)
    //         const chatbox =document.getElementById("chat-box");
    //         chatbox.innerHTML = "";
    //         message_history.forEach(
    //             msg=>{
    //                 appendmessage(msg.message,msg.sender_id)
    //             }
    //         );
    //     }
    //     );
    //     console.log("appendmessage");
    //     alert("fin join")
    // };

    // message,sender_id
//     function appendmessage(message,sender_id){
//         const chatbox =document.getElementById("chat-box");
//         if (!chatbox) {
//             console.error("⚠️ chat-box が見つかりません！");
//             alert("NO chatbox")
//             return;
//         }
//         const messagediv = document.createElement("div");
//         messagediv.classList.add("message");
//         if (sender_id ==user_id){
//             messagediv.classList.add("my-message");
//         } else{
//             messagediv.classList.add("Partner-message");
//         }
//         messagediv.textContent =message;
    
//         chatbox.appendChild(messagediv);
//         alert("fin appnd")
    
//         console.log("✅ メッセージを追加しました: ", message);
        
//     }



//     // function sendmessage(){
//     //     let message_input = document.getElementById("message-input");
//     //     let message = message_input.value;
//     //     message = message.trim()
//     //     if(!message || !room_id) {
//     //         console.log("message or room_id miss")
//     //         return
//     //     }
//     //     console.log(user_id)
//     //     console.log(message)
//     //     socket.emit("message",{room : room_id,message :message, sender_id: user_id});
//     //     message_input.value ="";

//     // }


//     // function sendmessage() {
//     //      // ✅ フォーム送信によるリロードを防ぐ

//     document.getElementById("send-btn").addEventListener("click", function(event) {
//         event.preventDefault(); 
//         console.log("✅ `event.preventDefault();` が実行されました");

//         let message_input = document.getElementById("message-input");
//         let message = message_input.value.trim();

//         if (!message || !room_id) {
//             console.log("message or room_id miss");
//             return;
//         }

//         console.log(user_id);
//         console.log(message);
//         socket.emit("message", { room: room_id, message: message, sender_id: user_id });
//         message_input.value = "";
//     })

//     // data.message, data.sender
//     socket.on("message", (data) => {
//         alert("aaaaaaaaaaa")
//         console.log("ressive")
//         console.log(data)
//         appendmessage(data.message, data.sender);
//         console.log("bbbbbbbbbbbbb")
//     });



//     function relase(){
//         socket.emit("leave",{room : room_id})
//         alert("match relase?")
        
//     };

//     function addParagraph() {
//         const chatbox =document.getElementById("chat-box");
//         var newParagraph = document.createElement("p");
//             newParagraph.textContent = "この新しいパラグラフはボタンをクリックすることによって追加されました。";
//             chatbox.appendChild(newParagraph);

//     }
// })