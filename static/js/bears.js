document.addEventListener("DOMContentLoaded",function(){

    const BackButton = document.getElementById("buck_btn");
    BackButton.addEventListener("click", function () {
        const savedUrl = localStorage.getItem("backToLogin");
        window.location.href =savedUrl 
        // history.back()
    });
})