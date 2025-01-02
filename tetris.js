const backgroundMusic = document.getElementById('background-music');
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

context.scale(20, 20); //increase size of shape

function arenaSweep() { //this function allows us to check whether or not a row is fully populated within the arena
    let rowCount = 1;
    outer: for (let y = arena.length -1; y > 0; --y) { //iterate from the bottom and up (looping over y here)
        for (let x = 0; x < arena[y].length; ++x) { //loop over x in the normal direction
            if (arena[y][x] === 0) { //check if any of the rows have a zero in them
                continue outer; //if the above if statement is true, then it means that a row (in the arena) is not fully populated (so just continue)
            }
        }

        const row = arena.splice(y, 1)[0].fill(0); //remove row from arena if populated (at index y) and fills it with 0's (row is saved in const row)
        arena.unshift(row); //put the row on top of the arena 
        ++y; // offset y because we removed an index

        player.score += rowCount * 10; //keeps track of the user's score based on the rowCount (when a row is "swept" only)
        rowCount *= 2; //double the score you get 
    }
}

function collide(arena, player) { 
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) { //iterating over the player
            if (m[y][x] !== 0 && //check if the matrix of the players y row and x column is not zero, and check if the arena is not zero
               (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true; //return true - because we know that we are going to collide if the above if statements are true (collision detected)
            }
        }
    }
    return false;
}

function createMatrix(w, h) { //need a matrix that "holds" all the stuck pieces - this function facilitates this
    const matrix = [];
    while (h--) { //while the height is not zero, we decrease height with 1 
        matrix.push(new Array(w).fill(0)); //fill the new array (new array of length, width) with 0's 
    }
    return matrix;
}

function createPiece(type) //this function allows different types of pieces to be created (so that the game is not limited to very few shapes for the user to play with)
{ //all the different pieces are represented within the matrix form (the piece is based on the type we are dealing with)
    // the matrices have different numbers within them because that value is mapped to the appropriate color name of the shape
    if (type === 'I') {  //representation of the "I" shape/piece within the tetris game in the matrix form
        return [
            [0, 1, 0, 0], //extra row so that it is much easier to anticipate the rotation of the shape (rotation occurs through the center of the shape when this is done) - extra row implemented for all the shapes for the same reason
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') { //representation of the "T" shape/piece within the tetris game in the matrix form
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}


function drawMatrix(matrix, offset) { //offset allows the piece to move
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) { //values of 0 within the tetris game are transparent
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x,
                                 y + offset.y,
                                 1, 1);
            }
        });
    });
}

function draw() { //use this function to draw this game continuously (used within the update function)
    // start by clearing the canvas (so that old position doesn't show up in next move on canvas)
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, {x: 0, y: 0}); // draw the matrix from x: 0 and y:0
    drawMatrix(player.matrix, player.pos);
}

function merge(arena, player) { // this function will copy all the values from the player into the arena at the correct position
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) { // values that are zero are ignored 
                arena[y + player.pos.y][x + player.pos.x] = value; // copy the value into arena at the correct offset
            }
        });
    });
}

function rotate(matrix, dir) { //allows the matrix to rotate 
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) { 
            [ // to let the matrix to be able to rotate we have the code below that does a tuple switch
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) { 
        matrix.forEach(row => row.reverse());  
    } else {
        matrix.reverse();
    }
}

function playerDrop() { //this function allows the shape to drop (both automatic and manual)
    player.pos.y++;
    if (collide(arena, player)) { //if the shape drops and collides, that means we are touching the ground or another piece
        player.pos.y--;
        merge(arena, player);
        playerReset(); 
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(offset) { //function that moves the player in the appropriate direction 
    player.pos.x += offset; 
    // allows the shape to stay within the arena (both from the left and right sides)
    if (collide(arena, player)) { //if the player moves and collides in the arena, then the player's position should move back
        player.pos.x -= offset;
    }
}

function playerReset() { //Randomizes the shape each time within the game
    const pieces = 'TJLOSZI';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) { //if the player is reset and a collision is detected immediately afterwards, the game mut be over
        arena.forEach(row => row.fill(0)); //clear arena if the the above if statement is true
        player.score = 0; //reset score to 0
        updateScore();
    }
}

function playerRotate(dir) { //this function allows the player (the shape) to be rotated
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir); //call rotate function (this only rotates the matrix)
    while (collide(arena, player)) { //avoids the player/shape to rotate "inside the wall" of the arena (it should "jump outisde the wall")
        player.pos.x += offset; //move player by offset if a collision is detected (starts off by moving to the right)
        offset = -(offset + (offset > 0 ? 1 : -1)); //move to the left the next time
        if (offset > player.matrix[0].length) { //ensures that the above code doesn't keep going forever
            rotate(player.matrix, -dir); //rotate the player back
            player.pos.x = pos; //reset the position
            return;
        }
    }
}

let dropCounter = 0;
let dropInterval = 1000; //every second we want to drop the piece (1000 ms)

let lastTime = 0;
function update(time = 0) { // this function allows shapes to "drop" and have the game keep going on continuously 
    if (!backgroundMusic.playing) { //check if music isn't already playing
        backgroundMusic.play();
        backgroundMusic.playing = true; // custom flag to prevent restarting
    }
    
    const deltaTime = time - lastTime;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    lastTime = time;

    draw();
    requestAnimationFrame(update); // allows the game to keep going continuously (through requestAnimationFrame)
}

function updateScore() { //helper function to count the user's score
    document.getElementById('score').innerText = player.score;
}

document.addEventListener('keydown', event => { //keyboard controls (this code is triggered every time a key is pushed on the user's keyboard)
    if (event.keyCode === 37) { // move shape to the left 
        playerMove(-1);
    } else if (event.keyCode === 39) { // move shape to the right 
        playerMove(1);
    } else if (event.keyCode === 40) { // move shape down 
        playerDrop();
    } else if (event.keyCode === 81) { //bind rotation of the shape with the key "Q"
        playerRotate(-1); //rotate the shape/player to the left 
    } else if (event.keyCode === 87) {  // bind rotation of the shape with the key "W"
        playerRotate(1); //rotate the shape/player to the right
    }
});

const colors = [
    null, // zero does not need a color
    // below are the hex colour codes for each of the different types (the first colour is for the type "I" shape, for example - this colour association is in order with the types seen in the createPiece function)
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

const arena = createMatrix(12, 20); // 12 by 20 - 20 units high and 12 numbers wide

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
};

document.getElementById('toggle-music').addEventListener('click', () => {
    if (backgroundMusic.paused) {
        backgroundMusic.play();
    } else {
        backgroundMusic.pause();
    }
});

playerReset();
updateScore();
update();