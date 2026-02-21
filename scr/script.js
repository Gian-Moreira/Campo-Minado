/* -----------------------
configuracoes e constantes 
----------------------- */
// modo debug
const DEBUG = true;

// constantes e variaveis
const boardElement = document.querySelector(".game-board");
const initiateGame = document.getElementById("beginGame");
const gamemode = document.getElementById("gamemode");
var currentDifficulty = "easy";

// status de mina
const TILE_STATUSES = {
    HIDDEN: "hidden",
    MINE: "mine",
    NUMBER: "number",
    MARKED: "marked",
}

// objetos de dificuldade
const DIFFICULTIES = {
    easy: { WIDTH: 8, HEIGHT: 8, MINE_AMOUNT: 10 },
    normal: { WIDTH: 16, HEIGHT: 16, MINE_AMOUNT: 40 },
    hard: { WIDTH: 31, HEIGHT: 16, MINE_AMOUNT: 99 }
}

// direcoes a partir de tile specifica.
const directions = [
    [-1, -1], [0, -1], [1, -1],
    [-1,  0],          [1,  0],
    [-1,  1], [0,  1], [1,  1],
];

/* -----------------------
    estado de jogo
----------------------- */

// definicoes de jogo
const game = {
    width: 0,
    height: 0,
    minesLeft: 0,
    totalTiles: 0,
    safeTiles: 0,
    revealedSafeTiles: 0,
    board: [],
    running: false
};

/* -----------------------
    logica de dificuldade
----------------------- */

// le quando a dificuldade e modificada
gamemode.addEventListener('input', getDifficulty); 

// da os parametros de dificuldade.
initiateGame.addEventListener("click", setDifficulty);

// getter de dificuldade customizada
function getCustomMode() {
    const custom_width = document.getElementById("widthInput").value;
    const custom_height = document.getElementById("heightInput").value;
    const custom_mines = document.getElementById("mineAmount").value;
    return {
        WIDTH: Number(custom_width),
        HEIGHT: Number(custom_height),
        MINE_AMOUNT: Number(custom_mines)
    }
}

// tranca de input para jogos nao customizados
function getDifficulty() {
    currentDifficulty = gamemode.value;
    if (DEBUG) {
        console.log("dificuldade: " + currentDifficulty);
    }

    if (currentDifficulty != "custom") {
        document.getElementById("widthInput").disabled = true;
        document.getElementById("heightInput").disabled = true;
        document.getElementById("mineAmount").disabled = true;
    } else {
        document.getElementById("widthInput").disabled = false;
        document.getElementById("heightInput").disabled = false;
        document.getElementById("mineAmount").disabled = false;
    }
}

/* -----------------------
    logica de jogo
----------------------- */

// inicia ou reinicia jogo.
function setDifficulty() {
    let customObject;
    if (currentDifficulty === "custom") {
        customObject = getCustomMode()    
    } else {
        customObject = DIFFICULTIES[currentDifficulty];
    }
    const width = customObject.WIDTH;
    const height = customObject.HEIGHT;
    const mineAmount = customObject.MINE_AMOUNT;
    game.minesLeft = mineAmount;
    return createBoard(width, height, mineAmount)
};

// colocador de minas
function placeMines(board, width, height, mineAmount) {
    let minesPlaced = 0;
    if (mineAmount < width * height) {
        while (minesPlaced < mineAmount) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);

            const tile = board[y][x];

            if (tile.mine === false) {
                tile.mine = true;
                minesPlaced++;
            }
        }
    } else {
        if (DEBUG) {
            console.log("quantidade de minas maior que espaco disponivel!")
        }
        document.getElementById("warning").innerText = "quantidade de minas maior que espaco disponivel!";
    }
    if (DEBUG) {
        console.log("minas colocadas: ");
        console.log(board);
    }
}

// coloca os numeros onde nao tem bomba
function placeNumbers(board, width, height) {
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {

            const currentTile = board[y][x]

            if (currentTile.mine) continue;

            // conta as minas
            let count = 0;

            // dx e dy sao a direcao que esta sendo aplicada no momento
            for (const [dx, dy] of directions) {

                // nx e ny sao a posicao relativa da tile
                const nx = x + dx;
                const ny = y + dy;

                if (nx >= 0 && nx < width && ny >= 0 && ny < height && board[ny][nx].mine) {
                    count++;
                }
            }
            currentTile.number = count;

            const color = getTileNumber(currentTile.number);
            currentTile.color = color;
        } 
    }
    
    if (DEBUG) {
    console.log("numeros colocados: ");
    console.log(board);
    }
}   

/* -----------------------
    display
----------------------- */

// cria o campo de jogo
function createBoard(width, height, mineAmount) {
    // limpeza
    boardElement.innerHTML = "";
    document.getElementById("warning").innerText = "Tenha um bom jogo!";
    game.running = true;
    game.minesLeft = mineAmount;
    game.revealedSafeTiles = 0;

    updateMineCounter();
    
    const board = [];
    boardElement.style.setProperty("--sizeColumn", width)
    boardElement.style.setProperty("--sizeRow", height)

    // loop para criacao do campo
    for (let y = 0; y < height; y++) {
        const row = []

        for (let x = 0; x < width; x++) {
            const element = document.createElement("div");
            element.dataset.status = TILE_STATUSES.HIDDEN;

            const tile = {
                element,
                x,
                y,
                mine: false,
                number: 0,
                color: "#ffffffff",
                get status() {
                    return this.element.dataset.status;
                },
                set status(value) {
                    this.element.dataset.status = value;
                }
            }

            row.push(tile);
            boardElement.append(tile.element)

            tile.element.addEventListener("mousedown", (event) => {
                if (event.button === 0) {
                    // left click
                    tileLeftClick(tile)
                } else if (event.button === 2) {
                    // right click
                    tileRightClick(tile)
                }
            });
        }
        board.push(row);
    }
    if (DEBUG) {
        console.log(board);
        console.log("largura: " + width + " altura: " + height+ " quantidade de minas: " + mineAmount);
    };
    game.board = board;
    game.width = width;
    game.height = height;
    game.totalTiles = width * height;
    game.safeTiles = game.totalTiles - mineAmount;


    placeMines(board, width, height, mineAmount)
    placeNumbers(board, width, height)
};

// coloca bandeira
function tileRightClick(tile) {
    if (DEBUG) {
        console.log("right click on board")
        console.log("x: " + tile.x + " y: " + tile.y);
    }
    if (!game.running) return;
    if (tile.status === TILE_STATUSES.MARKED) {
        tile.status = TILE_STATUSES.HIDDEN;
        game.minesLeft++
        updateMineCounter()
        return;
    };
    if (tile.status !== TILE_STATUSES.HIDDEN) return;
    if (game.minesLeft === 0) return;
    tile.status = TILE_STATUSES.MARKED;
    game.minesLeft--
    updateMineCounter()
}


// releva tile
function tileLeftClick(tile) {
    if (DEBUG) {
    console.log("left click on board")
    console.log("x: " + tile.x + " y: " +tile.y);
    }

    if (!game.running) return;
    if (tile.status !== TILE_STATUSES.HIDDEN) return;

    if (tile.mine) {
        tile.status = TILE_STATUSES.MINE;
        revealAllMines()
        document.getElementById("warning").innerText = "voce perdeu!";
        game.running = false
        return;
    } 
    revealTile(tile)
}

// reveala tile e marca numero
function revealTile(tile) {
    if (!game.running  || tile.status !== TILE_STATUSES.HIDDEN || tile.mine) return;

    tile.status = TILE_STATUSES.NUMBER;
    game.revealedSafeTiles++;

    if (DEBUG) {
    console.log(game.revealedSafeTiles)
    }

    if (game.revealedSafeTiles === game.safeTiles) {
        checkWin();
    }

    if (tile.number > 0) {
        tile.element.textContent = tile.number;
        tile.element.style.color = tile.color;
        return;
    }

    tile.element.textContent = "";

    for (const [dx, dy] of directions) {
        const nx = tile.x + dx;
        const ny = tile.y + dy;

        if (
            nx < 0 || nx >= game.width ||
            ny < 0 || ny >= game.height
        ) continue;

        const neighbor = game.board[ny][nx];
        revealTile(neighbor);
    }
}

// colorir bandeira
function getTileNumber(tileNumber) {
    let color;
    switch (tileNumber) {
        case 1:
           color = "#0000FF";
           break;
        case 2:
           color = "#018001";
           break;
        case 3:
           color = "#FE0000";
           break;
        case 4:
           color = "#00007D";
           break;
        case 5:
           color = "#800000";
           break;
        case 6:
           color = "#027F7E";
           break;
        case 7:
           color = "#000000";
           break;
        case 8:
           color = "#808080";
           break;
    }

    if (DEBUG) {
        console.log("cor: " + color)
    }

    return color;
}

/* -----------------------
    UI
----------------------- */

// update de contador de mina
function updateMineCounter() {
    document.getElementById("currentMineAmount").innerText = game.minesLeft;
}

// revela minas ao terminar jogo
function revealAllMines() {
    for (let y = 0; y < game.height; y++) {
        for (let x = 0; x < game.width; x++) {
            const currentTile = game.board[y][x];
            if (currentTile.mine) {
                currentTile.status = TILE_STATUSES.MINE;
            }
        }
    }
}

// checa se ganhou
function checkWin() {
    if (game.revealedSafeTiles === game.safeTiles) {
        game.running = false;
        document.getElementById("warning").innerText = "Você ganhou!";
    }
}