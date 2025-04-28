const gridContainer = document.getElementById('grid-container');
const scoreEl = document.getElementById('score');
const newGameBtn = document.getElementById('new-game-btn');
const messageOverlay = document.getElementById('message-overlay');
const messageText = document.getElementById('message-text');
const tryAgainBtn = document.getElementById('try-again');

let grid = [];
let score = 0;

function init() {
    grid = Array.from({ length: 4 }, () => Array(4).fill(0));
    score = 0;
    scoreEl.textContent = score;
    messageOverlay.classList.add('hidden');
    const first = spawnRandom();
    const second = spawnRandom();
    render([first, second]);
}

function spawnRandom() {
    const emptyCells = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (grid[r][c] === 0) emptyCells.push({ r, c });
        }
    }
    if (!emptyCells.length) return null;
    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    grid[r][c] = value;
    return { r, c };
}

// Store previous tile positions for sliding animation
let prevTiles = [];

function render(spawnPos = null, mergedPositions = []) {
    let spawnArr = [];
    if (Array.isArray(spawnPos)) spawnArr = spawnPos.filter(Boolean);
    else if (spawnPos) spawnArr = [spawnPos];
    gridContainer.innerHTML = '';
    // Draw background grid cells
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const bgCell = document.createElement('div');
            bgCell.classList.add('grid-cell');
            bgCell.style.gridRowStart = r + 1;
            bgCell.style.gridColumnStart = c + 1;
            gridContainer.appendChild(bgCell);
        }
    }
    // Prepare tiles array with unique ids
    let tiles = [];
    let idCounter = 1;
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const value = grid[r][c];
            if (value) {
                // Try to find matching tile from previous state
                let prev = prevTiles.find(t => t.value === value && !t.used && t.r === r && t.c === c);
                if (!prev) prev = prevTiles.find(t => t.value === value && !t.used);
                let id = prev ? prev.id : idCounter++;
                if (prev) prev.used = true;
                tiles.push({ id, value, r, c });
            }
        }
    }
    // Draw tiles absolutely for sliding
    for (const tileObj of tiles) {
        const { id, value, r, c } = tileObj;
        const tile = document.createElement('div');
        tile.classList.add('tile', `tile-${value}`);
        tile.textContent = value;
        tile.style.position = 'absolute';
        tile.style.width = '75px';
        tile.style.height = '75px';
        tile.style.left = `${c * 87.5}px`;
        tile.style.top = `${r * 87.5}px`;
        tile.style.zIndex = 2;
        tile.dataset.id = id;
        if (spawnArr.some(pos => pos.r === r && pos.c === c)) tile.classList.add('new');
        if (mergedPositions.some(p => p.r === r && p.c === c)) tile.classList.add('merged');
        gridContainer.appendChild(tile);
    }
    scoreEl.textContent = score;
    setTimeout(() => document.querySelectorAll('.tile').forEach(t => t.classList.remove('new', 'merged')), 200);
    // Save current tile positions for next render
    prevTiles = tiles.map(t => ({ ...t }));
}

function operate(row) {
    const newRow = row.filter(v => v);
    const mergedIdx = [];
    for (let i = 0; i < newRow.length - 1; i++) {
        if (newRow[i] === newRow[i + 1]) {
            newRow[i] *= 2;
            score += newRow[i];
            mergedIdx.push(i);
            newRow[i + 1] = 0;
        }
    }
    const result = newRow.filter(v => v);
    while (result.length < 4) result.push(0);
    const moved = !row.every((v, i) => v === result[i]);
    return { result, moved, mergedIdx };
}

function move(direction) {
    let moved = false;
    const mergedPositions = [];
    if (direction === 'ArrowLeft' || direction === 'ArrowRight') {
        for (let r = 0; r < 4; r++) {
            const row = [...grid[r]];
            if (direction === 'ArrowRight') row.reverse();
            const { result, moved: rowMoved, mergedIdx } = operate(row);
            if (direction === 'ArrowRight') result.reverse();
            grid[r] = result;
            if (rowMoved) moved = true;
            mergedIdx.forEach(i => mergedPositions.push({ r, c: direction === 'ArrowRight' ? 3 - i : i }));
        }
    } else {
        for (let c = 0; c < 4; c++) {
            const col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
            if (direction === 'ArrowDown') col.reverse();
            const { result, moved: colMoved, mergedIdx } = operate(col);
            if (direction === 'ArrowDown') result.reverse();
            for (let r = 0; r < 4; r++) grid[r][c] = result[r];
            if (colMoved) moved = true;
            mergedIdx.forEach(i => mergedPositions.push({ r: direction === 'ArrowDown' ? 3 - i : i, c }));
        }
    }
    return { moved, mergedPositions };
}

function canMove() {
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (grid[r][c] === 0) return true;
            if (c < 3 && grid[r][c] === grid[r][c + 1]) return true;
            if (r < 3 && grid[r][c] === grid[r + 1][c]) return true;
        }
    }
    return false;
}

function showGameOver() {
    messageText.textContent = 'Game Over!';
    messageOverlay.classList.remove('hidden');
}

window.addEventListener('keydown', e => {
    if (!messageOverlay.classList.contains('hidden')) return;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const { moved, mergedPositions } = move(e.key);
        if (moved) {
            const spawnPos = spawnRandom();
            render(spawnPos, mergedPositions);
            if (!canMove()) showGameOver();
        }
    }
});

newGameBtn.addEventListener('click', init);
tryAgainBtn.addEventListener('click', init);

init();
