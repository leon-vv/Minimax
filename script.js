
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
        throw message || new Error().stack;
    }
}

// Keeps track of amount of consecutive colors.
var Ticker = function Ticker() {
    var consecutive = 0;

    var last = null;
    this.redThree = 0;
    this.yellowThree = 0;
    this.redFour = 0;
    this.yellowFour = 0;

    var tryGet = function(disks, x, y) {
        return disks[x][y];
    }
 
    var hitColor = function(ticker, c) {
        if(c == undefined) return;
        else if(c == last) consecutive += 1;
        else {
            ticker.reset();
            last = c;
            consecutive = 1;    
        }
    };

    this.reset = function() {
        if(consecutive >= 4) {
            if(last == red) this.redFour += 1;
            else if(last == yellow) this.yellowFour += 1;
        }
        else if(consecutive == 3) {
            if(last == red) this.redThree += 1;
            else if(last == yellow) this.yellowThree += 1;
        }
        consecutive = 0;
    }

    this.hit = function(disks, x, y) { hitColor(this, tryGet(disks, x, y)); };

}


var Board = function(disks) {
    this.disks = disks || [[], [], [], [], [], [], []];

    this.play = function(column, color) {
        assert(color == yellow || color == red);
        assert(0 <= color && color <= 6);
        assert(this.disks.length == 7);
        
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
    

    this.numberOfConsecutive = function() {

        var ticker = new Ticker();

        // Horizontal
        for(var y = 0; y < 6; y++) {
            for(var x = 0; x < 7; x++) {
                ticker.hit(this.disks,x, y);
            }
            ticker.reset();
        }

        // Vertical
        for(var x = 0; x < 7; x++) {
            var l = this.disks[x].length;
            for(var y = 0; y < l; y++) {
                ticker.hit(this.disks,x, y);
            }
            ticker.reset();
        }
        
        // Oblique right
        for(var y = 3; y >= 0; y--) {
            for(var s = 0; s < 6 - y; s++) {
                ticker.hit(this.disks,s, y+s);
            }
            ticker.reset();
        }
        for(var x = 1; x < 4; x++) {
            for(var s = 0; s < 7 - x; s++) {
                ticker.hit(this.disks,x+s, s);
            }
            ticker.reset();
        }
        // Oblique left
        for(var y = 3; y >= 0; y--) {
            for(var s = 0; s < 6 - y; s++) {
                ticker.hit(this.disks,6 - s, y + s);
            }
            ticker.reset();
        }
        for(var x = 5; x >= 2; x--) {
            for(var s = 0; s < x + 1; s++) {
                ticker.hit(this.disks,x - s, s);
            }
            ticker.reset();
        }

        return {
            redThree: ticker.redThree,
            yellowThree: ticker.yellowThree,
            redFour: ticker.redFour,
            yellowFour: ticker.yellowFour
        };
    };

    // Positive is good for red.
    // Negative is good for yellow.
    this.evaluate = function() {
        var cons = this.numberOfConsecutive();

        return 1000 * (cons.redFour - cons.yellowFour) + cons.redThree - cons.yellowThree;
    };

    this.hasWinner = function() {
        var cons = this.numberOfConsecutive(4);
        if(cons.redFour >= 1) return "red";
        if(cons.yellowFour >= 1) return "yellow";

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

        this.play(bestIndex, color);
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

var mouseClick = function(message, boardElem) {
    var board = new Board();
    var userHasTurn = true;
    var gameEnded = false;

    function checkWinner() {
        var winner = board.hasWinner();

        if(winner) {
            board.render();
            message.textContent = "We have a winner! Congratulations " + (winner == "yellow" ? "user." : "computer.");
            boardElem.style.borderColor = winner;
            gameEnded = true;
            return true;
        }
        return false;
    }

    return function(e) {

        if(gameEnded || !userHasTurn) return;
        userHasTurn = false;

        var hit = clientCoordToBoard({
            x: e.clientX, y: e.clientY});

        var played = board.play(Math.floor(hit.x / 100), yellow);

        if(!played) return;

        message.innerHTML = "Turn: computer";

        if(!checkWinner(message))  {
                
            board.render();
            board.autoPlay(red, 6);
            message.innerHTML = "Turn: user";

            if(!checkWinner(message)) board.render();
        }

        // Give the queued event time to fire (and be ignored).
        setTimeout(function() {
            userHasTurn = true;
        }, 100);
    };
    
};


window.onload = function() {

    (function() {

        var board = document.getElementById("board");

        for(var i = 0; i < 6 * 7; i++) {
            var cell = document.createElement("div");
            cell.className = "cell";
            cell.style.backgroundColor = "#000";
            board.appendChild(cell);
        }

        var message = document.getElementById("message");
        board.addEventListener("click", mouseClick(message, board));
    })();
};
