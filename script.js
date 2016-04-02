
window.onload = function() {

    (function() {

        var board = document.getElementById("board");

        for(var i = 0; i < 6 * 7; i++) {
            var cell = document.createElement("div");
            cell.className = "cell";
            cell.style.backgroundColor = "#000";
            board.appendChild(cell);
        }
    })();

};
