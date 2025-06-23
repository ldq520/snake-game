let speed = 120;
let gameLoopTimer = null;
let gameStatus = 'ready'; // ready, running, paused, over
let gridSize = 20;
let canvas = document.getElementById('game');
let ctx = canvas.getContext('2d');
let tileCount = canvas.width / gridSize;
let obstacles = [];

let snake = [{ x: 10, y: 10 }];
let direction = { x: 0, y: 0 };
let food = { x: 5, y: 5 };
let gameOver = false;
let score = 0;

function getObstacleCount() {
  const size = document.getElementById('gameSize').value;
  if (size === '400x400') return 3;
  if (size === '600x400') return 5;
  if (size === '600x600') return 8;
  return 3;
}

function generateObstacles() {
  obstacles = [];
  const count = getObstacleCount();
  // 先保证每行每列至少有一个障碍
  let used = new Set();
  // 行障碍
  for (let y = 0; y < tileCount; y++) {
    let tries = 0;
    while (tries < 100) {
      tries++;
      let x = Math.floor(Math.random() * tileCount);
      let key = x + ',' + y;
      if (
        !snake.some(seg => seg.x === x && seg.y === y) &&
        (typeof food === 'undefined' || !(food.x === x && food.y === y)) &&
        !used.has(key)
      ) {
        obstacles.push({ x, y });
        used.add(key);
        break;
      }
    }
  }
  // 列障碍
  for (let x = 0; x < tileCount; x++) {
    let tries = 0;
    while (tries < 100) {
      tries++;
      let y = Math.floor(Math.random() * tileCount);
      let key = x + ',' + y;
      if (
        !snake.some(seg => seg.x === x && seg.y === y) &&
        (typeof food === 'undefined' || !(food.x === x && food.y === y)) &&
        !used.has(key)
      ) {
        obstacles.push({ x, y });
        used.add(key);
        break;
      }
    }
  }
  // 如果还不够，再随机补充
  let tries = 0;
  while (obstacles.length < count && tries < 1000) {
    tries++;
    const obs = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
    let key = obs.x + ',' + obs.y;
    if (
      snake.some(seg => seg.x === obs.x && seg.y === obs.y) ||
      (typeof food !== 'undefined' && food.x === obs.x && food.y === obs.y) ||
      used.has(key)
    ) continue;
    obstacles.push(obs);
    used.add(key);
  }
}

function updateCanvasSize() {
  const size = document.getElementById('gameSize').value;
  const [w, h] = size.split('x').map(Number);
  canvas.width = w;
  canvas.height = h;
  tileCount = Math.floor(Math.min(w, h) / gridSize);
  ctx = canvas.getContext('2d');
}

function drawTile(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * gridSize, y * gridSize, gridSize - 2, gridSize - 2);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // 画障碍
  obstacles.forEach(obs => drawTile(obs.x, obs.y, '#888'));
  // 画蛇
  snake.forEach((segment, i) => {
    drawTile(segment.x, segment.y, i === 0 ? '#0f0' : '#3f3');
  });
  // 画食物
  drawTile(food.x, food.y, '#f00');
  // 画分数
  ctx.fillStyle = '#fff';
  ctx.font = '18px Arial';
  ctx.fillText('分数: ' + score, 10, 20);
  if (gameStatus === 'ready') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);
    ctx.fillStyle = '#fff';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('按空格或点击开始', canvas.width / 2, canvas.height / 2);
    ctx.textAlign = 'left';
  }
  if (gameStatus === 'paused') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);
    ctx.fillStyle = '#fff';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('已暂停', canvas.width / 2, canvas.height / 2);
    ctx.font = '20px Arial';
    ctx.fillText('点击暂停/继续 或 按空格继续', canvas.width / 2, canvas.height / 2 + 30);
    ctx.textAlign = 'left';
  }
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);
    ctx.fillStyle = '#fff';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2);
    ctx.font = '20px Arial';
    ctx.fillText('按空格或点击开始', canvas.width / 2, canvas.height / 2 + 30);
    ctx.textAlign = 'left';
  }
}

function randomFood() {
  let newFood;
  let tries = 0;
  while (true && tries < 1000) {
    tries++;
    newFood = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
    // 食物不能出现在蛇身上或障碍上
    if (
      !snake.some(seg => seg.x === newFood.x && seg.y === newFood.y) &&
      !obstacles.some(obs => obs.x === newFood.x && obs.y === newFood.y)
    ) break;
  }
  food = newFood;
}

function update() {
  if (gameOver || gameStatus !== 'running') return;
  let head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  // 穿墙处理
  if (head.x < 0) head.x = tileCount - 1;
  if (head.x >= tileCount) head.x = 0;
  if (head.y < 0) head.y = tileCount - 1;
  if (head.y >= tileCount) head.y = 0;
  // 撞到自己
  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    gameOver = true;
    gameStatus = 'over';
    setDifficultyDisabled(false);
    setButtonStatus();
    draw();
    return;
  }
  // 撞到障碍
  if (obstacles.some(obs => obs.x === head.x && obs.y === head.y)) {
    gameOver = true;
    gameStatus = 'over';
    setDifficultyDisabled(false);
    setButtonStatus();
    draw();
    return;
  }
  snake.unshift(head);
  // 吃到食物
  if (head.x === food.x && head.y === food.y) {
    score++;
    if (score >= 100) {
      gameOver = true;
      gameStatus = 'over';
      setDifficultyDisabled(false);
      setButtonStatus();
      draw();
      setTimeout(() => { alert('游戏通关！'); }, 100);
      return;
    }
    randomFood();
  } else {
    snake.pop();
  }
  draw();
}

function getSpeedFromRadio() {
  const radios = document.getElementsByName('difficulty');
  for (let r of radios) {
    if (r.checked) return parseInt(r.value, 10);
  }
  return 120;
}

function setDifficultyDisabled(disabled) {
  const radios = document.getElementsByName('difficulty');
  for (let r of radios) r.disabled = disabled;
}

function setButtonStatus() {
  const pauseBtn = document.getElementById('pauseBtn');
  const endBtn = document.getElementById('endBtn');
  const startBtn = document.getElementById('startBtn');
  if (gameStatus === 'running') {
    pauseBtn.disabled = false;
    endBtn.disabled = false;
    startBtn.disabled = true;
    pauseBtn.textContent = '暂停';
  } else if (gameStatus === 'paused') {
    pauseBtn.disabled = false;
    endBtn.disabled = false;
    startBtn.disabled = true;
    pauseBtn.textContent = '继续';
  } else {
    pauseBtn.disabled = true;
    endBtn.disabled = true;
    startBtn.disabled = false;
    pauseBtn.textContent = '暂停';
  }
}

function startGameLoop() {
  if (gameLoopTimer) clearTimeout(gameLoopTimer);
  function loop() {
    if (gameStatus === 'running') {
      update();
      gameLoopTimer = setTimeout(loop, speed);
    }
  }
  loop();
}

function resetGame() {
  updateCanvasSize();
  snake = [{ x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) }];
  direction = { x: 1, y: 0 };
  score = 0;
  gameOver = false;
  speed = getSpeedFromRadio();
  gameStatus = 'ready';
  setDifficultyDisabled(false);
  setButtonStatus();
  randomFood();
  generateObstacles();
  draw();
}

function startGame() {
  if (gameStatus === 'running') return;
  gameStatus = 'running';
  setDifficultyDisabled(true);
  setButtonStatus();
  startGameLoop();
}

function pauseGame() {
  if (gameStatus === 'running') {
    gameStatus = 'paused';
    setButtonStatus();
  } else if (gameStatus === 'paused') {
    gameStatus = 'running';
    setButtonStatus();
    startGameLoop();
  }
}

function endGame() {
  if (gameStatus === 'running' || gameStatus === 'paused') {
    if (confirm('确定要结束本局游戏吗？')) {
      gameOver = true;
      gameStatus = 'over';
      setDifficultyDisabled(false);
      setButtonStatus();
      draw();
    }
  }
}

document.getElementById('startBtn').onclick = function() {
  if (gameStatus === 'ready' || gameStatus === 'over') {
    resetGame();
    startGame();
  }
};
document.getElementById('pauseBtn').onclick = function() {
  if (gameStatus === 'running' || gameStatus === 'paused') {
    pauseGame();
    draw();
  }
};
document.getElementById('endBtn').onclick = function() {
  endGame();
};
document.getElementById('gameSize').addEventListener('change', function() {
  resetGame();
});
document.getElementsByName('difficulty').forEach(radio => {
  radio.addEventListener('change', () => {
    if (gameStatus !== 'running' && gameStatus !== 'paused') {
      resetGame();
    }
  });
});

window.addEventListener('keydown', e => {
  if ((gameStatus === 'ready' || gameStatus === 'over') && e.code === 'Space') {
    resetGame();
    startGame();
    return;
  }
  if (gameStatus === 'paused' && e.code === 'Space') {
    pauseGame();
    draw();
    return;
  }
  if (gameStatus !== 'running') return;
  switch (e.code) {
    case 'ArrowUp':
      if (direction.y === 1) break;
      direction = { x: 0, y: -1 };
      break;
    case 'ArrowDown':
      if (direction.y === -1) break;
      direction = { x: 0, y: 1 };
      break;
    case 'ArrowLeft':
      if (direction.x === 1) break;
      direction = { x: -1, y: 0 };
      break;
    case 'ArrowRight':
      if (direction.x === -1) break;
      direction = { x: 1, y: 0 };
      break;
  }
});

// 初始化
resetGame(); 