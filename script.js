
var userHasTurn = true;

var yellow = true;
var red = false;

function colorToString(color) {
    return color ? "yellow" : "red";
}


function coordToNodeIndex(coord) {
    return coord.x + (6 - coord.y)*7;
}

var Board = function(disks) {
    this.disks = disks || (new Array(7).map(function() {
        return [];
    }));
    
    this.play = function(column, color) {
        var newColumn = this.disks[column].slice(0);

        if(newColumn.length > 6) {
            throw "Illegal play";
        }
        var newDisks = this.disks.slice(0);
        newDisks[column] = newColumn;

        return new Board(newDisks);
    };

    this.render = function() {
        
        var board = document.getElementById("board");

        for(var x = 0; x < 6; x++) {
            var column = this.disks[x];
            var l = column.length;

            for(var y = 0; y < 7; y++) {
                var coord = {x : x, y : y};
                var node = board.childNodes[coordToNodeIndex(coord)];
                if(l > y) node.style.backgroundColor = colorToString(column[y]);
                else node.style.backgroundColor = "black";
            }
        }
    };
}

function clientCoordToBoard(coord) {
    var width = document.body.clientWidth;
    var height = document.body.clientHeight;

    return Object.freeze({
        x : coord.x - (width / 2),
        y : coord.y - 15
    });
}

var board = new Board();

function mouseClick(e) {
    if(userHasTurn) {
        userHasTurn = false; 

        var hit = clientCoordToBoard({
            x: e.clientX, y: e.clientY});
        
        board = board.play(Math.ceil(hit.x / 100), yellow);
        board = board.autoPlay(red);
        board.render();
    }
}


window.onload = function() {

    (function() {

        var board = document.getElementById("board");

        for(var i = 0; i < 6 * 7; i++) {
            var cell = document.createElement("div");
            cell.className = "cell";
            cell.style.backgroundColor = "#000";
            board.appendChild(cell);
        }

        board.addEventListener("click", mouseClick);
    })();
};
