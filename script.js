
var yellow = true;
var red = false;

function colorToString(color) {
    return color ? "yellow" : "red";
}


function coordToNodeIndex(coord) {
    return coord.x + (5 - coord.y)*7;
}

function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
}

var Board = function(disks) {
    this.disks = disks || [[], [], [], [], [], [], []];

    this.play = function(column, color) {
        var c = this.disks[column];

        if(c.length >= 6) {
            return false;
        }

        c.push(color);
        return true;
    };
    
    this.unplay = function(column) {
        assert(column >= 0 && column <= 6);
        assert(this.disks[column].length > 0);

        this.disks[column].pop();
    };

    this.render = function() {
        
        var board = document.getElementById("board");

        for(var x = 0; x < 7; x++) {
            var column = this.disks[x];
            var l = column.length;

            for(var y = 0; y < 6; y++) {
                var coord = {x : x, y : y};
                var index = coordToNodeIndex(coord);
                var node = board.childNodes[index];
                if(l > y) node.style.backgroundColor = colorToString(column[y]);
                else node.style.backgroundColor = "black";
            }
        }
    };
    
    this.numberOfNConsecutive = function(n, color) {
        assert(n > 0);
        assert(color == red || color == yellow);

        var rows = 0;
        var consecutive = 0;

        var reset = function() {
            assert(n > 2);

            if(consecutive >= n) {
                rows += 1;
            }
            consecutive = 0;
        };
        
        var hitColor = function(c) {
            if(c == color) consecutive += 1;
            else reset();
        };

        var tryGet = (function(board) {
            return function(x, y) {

                var column = board.disks[x];

                if(column.length > y) {
                    return column[y];
                }
                else {
                    return null;
                }
            };
        })(this);
        
        var tryHit = function(x, y) { hitColor(tryGet(x, y)); };

        // Horizontal
        for(var y = 0; y < 6; y++) {
            for(var x = 0; x < 7; x++) {
                tryHit(x, y);
            }
            reset();
        }

        // Vertical
        for(var x = 0; x < 7; x++) {
            for(var y = 0; y < 6; y++) {
                tryHit(x, y);
            }
            reset();
        }
        
        // Oblique right
        for(var y = 5; y >= 0; y--) {
            for(var s = 0; s < 6 - y; s++) {
                tryHit(s, y+s);
            }
            reset();
        }
        for(var x = 1; x < 7; x++) {
            for(var s = 0; s < 7 - x; s++) {
                tryHit(x+s, s);
            }
            reset();
        }
        // Oblique left
        for(var y = 5; y >= 0; y--) {
            for(var s = 0; s < 6 - y; s++) {
                tryHit(6 - s, y + s);
            }
            reset();
        }
        for(var x = 5; x >= 0; x--) {
            for(var s = 0; s < x + 1; s++) {
                tryHit(x - s, s);
            }
            reset();
        }

        return rows;
    };

    // Positive is good for red.
    // Negative is good for yellow.
    this.evaluate = function() {
        var redFour = this.numberOfNConsecutive(4, red);
        var yellowFour = this.numberOfNConsecutive(4, yellow);
        var redThree = this.numberOfNConsecutive(3, red);
        var yellowThree = this.numberOfNConsecutive(3, yellow);

        return 1000 * (redFour - yellowFour) + redThree - yellowThree;
    };

    this.hasWinner = function() {
        if(this.numberOfNConsecutive(4, yellow)) return "yellow";
        if(this.numberOfNConsecutive(4, red)) return "red";

        return false;
    }

    this.miniMax = function(color, depth) {

        if(depth == 0 || this.hasWinner()) {
            var score = this.evaluate();
            return score;
        }

        // Computer plays, maximize!
        if(color == red) {
            var bestScore = null;

            for(var i = 0; i < 7; i++) {
                var played = this.play(i, color);

                if(played) {
                    var score = this.miniMax(!color, depth - 1);
                    if(bestScore == null || score > bestScore) bestScore = score;
                    this.unplay(i);
                }
            }
            return bestScore;
        }
        // User plays, minimize!
        else {
            var minScore = null;

            for(var i = 0; i < 7; i++) {
                var played = this.play(i, color);

                if(played) {
                    var score = this.miniMax(!color, depth - 1);
                    if(minScore == null || score < minScore) minScore = score;
                    this.unplay(i);
                }
            }
            return minScore;
        }
    }

    this.autoPlay = function(color, depth) {
        var bestIndex = null;
        var bestScore = null;

        for(var i = 0; i < 7; i++) {
            var played = this.play(i, color);

            if(played) {
                var score = this.miniMax(!color, depth);
                if(bestScore == null || score > bestScore)  {
                    bestScore = score;
                    bestIndex = i;
                }

               this.unplay(i);
            }
        }

        this.play(bestIndex);
    };
}

function clientCoordToBoard(coord) {
    var width = document.body.clientWidth;
    var height = document.body.clientHeight;
    return Object.freeze({
        x : coord.x - ((width - 700) / 2),
        y : coord.y - 15
    });
}
var mouseClick = (function() {
    var board = new Board();
    var userHasTurn = true;
    var gameEnded = false;

    function checkWinner(message) {
        var winner = board.hasWinner();

        if(winner) {
            board.render();
            message.textContent = "We have a winner! Congratulations " + (winner == "yellow" ? "user." : "computer.");
            console.log(message.innerHTML);
            gameEnded = true;
            return true;
        }
        return false;
    }

    return function(e) {

        if(gameEnded) return;

        var message = document.getElementById("message");

        var hit = clientCoordToBoard({
            x: e.clientX, y: e.clientY});

        var played = board.play(Math.floor(hit.x / 100), yellow);

        if(!played) return;

        message.innerHTML = "Turn: computer";

        if(!checkWinner(message))  {
                
            board.render();
            board.autoPlay(red, 5);
            message.innerHTML = "Turn: user";

            if(!checkWinner(message)) board.render();
        }
    };
})();


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
