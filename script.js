
var yellow = 1;
var red = 0;

function colorToString(color) {
    assert(color == yellow || color == red);
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
    var redThree = 0;
    var yellowThree = 0;
    var redFour = 0;
    var yellowFour = 0;


    var tryGet = function(disks, x, y) {
        return disks[x][y];
    }
 
    this.hitColor = function(c) {
        if(c == 3) {
            this.check();
            return;
        }
        else if(c == last) consecutive += 1;
        else {
            this.check();
            last = c;
            consecutive = 1;    
        }
    };

    this.check = function() {
        if(consecutive >= 4) {
            if(last == red) redFour += 1;
            else if(last == yellow) yellowFour += 1;
        }
        else if(consecutive == 3) {
            if(last == red) redThree += 1;
            else if(last == yellow) yellowThree += 1;
        }
        consecutive = 0;
    };

    this.reset = function() {
        consecutive = 0;
        last = null;
        redThree = 0;
        yellowThree = 0;
        redFour = 0;
        yellowFour = 0;

    }

    this.hit = function(disks, x, y) { this.hitColor(tryGet(disks, x, y)); };

    this.result = function() {
        return {
            redThree: redThree,
            yellowThree: yellowThree,
            redFour: redFour,
            yellowFour: yellowFour
        };
    }
}


var Board = function() {
    this.disks = [
        new Uint8Array(6),
        new Uint8Array(6),
        new Uint8Array(6),
        new Uint8Array(6),
        new Uint8Array(6),
        new Uint8Array(6),
        new Uint8Array(6),
        new Uint8Array(6)
    ];

    for(var i = 0; i < 7; i++) this.disks[i].fill(3);

    this.lengths = new Uint8Array(7);
    this.lengths.fill(0);
}

Board.prototype.play = function(column, color) {

    var l = this.lengths[column];
    
    assert(l >= 0);

    if(l >= 6) return false;
    
    this.disks[column][l] = color;
    this.lengths[column] = l + 1;

    return true;
};

Board.prototype.unplay = function(column) {
    var l = this.lengths[column];

    this.disks[column][l-1] = 3;
    this.lengths[column] = l - 1;
};

Board.prototype.render = function() {
    
    var board = document.getElementById("board");

    for(var x = 0; x < 7; x++) {
        var column = this.disks[x];

        for(var y = 0; y < 6; y++) {
            var coord = {x : x, y : y};
            var index = coordToNodeIndex(coord);

            var node = board.childNodes[index];
            
            var l = this.lengths[x];
            assert(l >= 0 && l <= 6);

            if(this.lengths[x] > y) node.style.backgroundColor = colorToString(column[y]);
            else node.style.backgroundColor = "black";
        }
    }
};

var ticker = new Ticker();

Board.prototype.numberOfConsecutive = function() {

    ticker.reset();

    // Horizontal
    for(var y = 0; y < 6; y++) {
        for(var x = 0; x < 7; x++) {
            ticker.hit(this.disks,x, y);
        }
        ticker.check();
    }

    // Vertical
    for(var x = 0; x < 7; x++) {
        var l = this.lengths[x];
        for(var y = 0; y < l; y++) {
            ticker.hit(this.disks,x, y);
        }
        ticker.check();
    }
    
    // Oblique right
    for(var y = 3; y >= 0; y--) {
        for(var s = 0; s < 6 - y; s++) {
            ticker.hit(this.disks,s, y+s);
        }
        ticker.check();
    }
    for(var x = 1; x < 4; x++) {
        for(var s = 0; s < 7 - x; s++) {
            ticker.hit(this.disks,x+s, s);
        }
        ticker.check();
    }
    // Oblique left
    for(var y = 3; y >= 0; y--) {
        for(var s = 0; s < 6 - y; s++) {
            ticker.hit(this.disks,6 - s, y + s);
        }
        ticker.check();
    }
    for(var x = 5; x >= 2; x--) {
        for(var s = 0; s < x + 1; s++) {
            ticker.hit(this.disks,x - s, s);
        }
        ticker.check();
    }
    
    return ticker.result();
};

// Positive is good for red.
// Negative is good for yellow.
Board.prototype.evaluate = function() {
    var cons = this.numberOfConsecutive();

    return 1000 * (cons.redFour - cons.yellowFour) + cons.redThree - cons.yellowThree;
};

Board.prototype.hasWinner = function() {
    var cons = this.numberOfConsecutive();
    if(cons.redFour >= 1) return "red";
    if(cons.yellowFour >= 1) return "yellow";

    return false;
}

Board.prototype.miniMax = function(color, depth) {

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
                var score = this.miniMax(Number(!color), depth - 1);
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
                var score = this.miniMax(Number(!color), depth - 1);
                if(minScore == null || score < minScore) minScore = score;
                this.unplay(i);
            }
        }
        return minScore;
    }
}

Board.prototype.autoPlay = function(color, depth) {
    var bestIndex = null;
    var bestScore = null;

    for(var i = 0; i < 7; i++) {
        var played = this.play(i, color);

        if(played) {
            var score = this.miniMax(Number(!color), depth);
            if(bestScore == null || score > bestScore)  {
                bestScore = score;
                bestIndex = i;
            }

            this.unplay(i);
        }
    }

    this.play(bestIndex, color);
};


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

        setTimeout(function() {

            if(!checkWinner(message))  {
                    
                board.render();
                board.autoPlay(red, 6);
                message.innerHTML = "Turn: user";

                if(!checkWinner(message)) board.render();
            }

            // Give the queued event time to fire (and be ignored).
            setTimeout(function() {
                userHasTurn = true;
            }, 50);
        }, 50);
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
