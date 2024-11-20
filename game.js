import { map1 } from './map1.js';
import { Player } from './player.js';
import { Platform } from './platform.js';
import { EasyBot } from './easyBot.js';
import { MediumBot } from './mediumBot.js';
import { HardBot } from './hardBot.js';
import { GAME_TIME, IMMUNITY_TIME } from './constants.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const startButton = document.getElementById('startButton');
const createMapButton = document.getElementById('createMapButton');
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score');
const characterSelect = document.getElementById('character-select');
const mainMenu = document.getElementById('main-menu');
const playButton = document.getElementById('playButton');
const backButton = document.getElementById('backButton');
const customMapOptions = document.getElementById('customMapOptions');

let playerCount = 2;
let players = [];
let bots = [];
let currentMap = map1;
const playerColors = ['#4169E1', '#DC143C', '#32CD32', '#FFD700'];
const playerControls = [
  { up: 'w', left: 'a', right: 'd', dash: 'e' },
  { up: 'ArrowUp', left: 'ArrowLeft', right: 'ArrowRight', dash: '/' },
  { up: 'i', left: 'j', right: 'l', dash: 'o' },
  { up: 'Numpad8', left: 'Numpad4', right: 'Numpad6', dash: 'Numpad9' },
];

function resizeCanvas() {
  const maxWidth = 1920;
  const maxHeight = 1080;
  const windowRatio = window.innerWidth / window.innerHeight;
  const gameRatio = maxWidth / maxHeight;

  if (windowRatio > gameRatio) {
    canvas.height = Math.min(window.innerHeight, maxHeight);
    canvas.width = canvas.height * gameRatio;
  } else {
    canvas.width = Math.min(window.innerWidth, maxWidth);
    canvas.height = canvas.width / gameRatio;
  }
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const game = {
  players: [],
  platforms: [],
  gameLoop: null,
  timeLeft: GAME_TIME,
  tagCount: 0,
  lastTagTime: 0,
  gameStarted: false,
  currentMap: map1,
  activePlayerId: 0,
  camera: {
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
  },

  init() {
    this.players = [];
    this.platforms = [];
    bots = [];
    this.timeLeft = GAME_TIME;
    this.tagCount = 0;
    timerDisplay.textContent = `Time: ${this.timeLeft}`;
    scoreDisplay.textContent = `Tags: ${this.tagCount}`;

    // Use the selected map's platforms
    const selectedMapOption = document.querySelector('.map-option.selected');
    if (
      selectedMapOption &&
      selectedMapOption.dataset.map.startsWith('custom_')
    ) {
      const savedMaps = JSON.parse(localStorage.getItem('customMaps') || '[]');
      const mapIndex = parseInt(selectedMapOption.dataset.map.split('_')[1]);
      const customMapData = savedMaps[mapIndex];
      if (customMapData) {
        this.platforms = customMapData.platforms.map(
          (p) => new Platform(p.x, p.y, p.width, p.height, p.angle)
        );
      }
    } else {
      const platformData = this.currentMap.platforms(canvas);
      this.platforms = platformData.map(
        (p) => new Platform(p.x, p.y, p.width, p.height, p.angle)
      );
    }

    const spacing = canvas.width / (playerCount + 1);

    for (let i = 0; i < playerCount; i++) {
      const playerSection = document.querySelector(`#player${i + 1}`);
      if (!playerSection) continue;

      const x = spacing * (i + 1);
      const y = canvas.height - 100;

      const selectedTypeOption = playerSection.querySelector(
        '.player-type-option.selected'
      );
      const selectedSkillOption = playerSection.querySelector(
        '.skill-option.selected'
      );

      if (!selectedTypeOption || !selectedSkillOption) continue;

      const playerType = selectedTypeOption.dataset.type;
      const skill = selectedSkillOption.dataset.skill || 'none';

      const controls = {
        up: false,
        left: false,
        right: false,
        dash: false,
        wasUpPressed: false,
      };

      const player = new Player(x, y, playerColors[i], controls, skill);
      this.players.push(player);

      if (playerType === 'bot') {
        const difficultyOption = playerSection.querySelector(
          '.difficulty-option.selected'
        );

        const difficulty = difficultyOption
          ? difficultyOption.dataset.difficulty
          : 'medium';

        switch (difficulty) {
          case 'easy':
            bots.push(new EasyBot(player));
            break;
          case 'hard':
            bots.push(new HardBot(player));
            break;
          default:
            bots.push(new MediumBot(player));
        }
      }
    }

    if (this.players.length > 0) {
      this.players[0].isIt = true;
    }
  },

  updateCamera() {
    const activePlayer = this.players[this.activePlayerId];
    if (!activePlayer) return;

    const targetX = activePlayer.x - canvas.width / 2;
    const minCamX = 0;
    const maxCamX = this.camera.width - canvas.width;

    const smoothing = 0.1;
    this.camera.x += (targetX - this.camera.x) * smoothing;
    this.camera.x = Math.max(minCamX, Math.min(maxCamX, this.camera.x));
  },

  start() {
    this.init();
    if (this.players.length === 0) return;

    menu.classList.add('hidden');
    this.gameStarted = true;
    if (this.gameLoop) clearInterval(this.gameLoop);
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    this.gameLoop = setInterval(() => this.update(), 1000 / 60);
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      timerDisplay.textContent = `Time: ${this.timeLeft}`;
      if (this.timeLeft <= 0) this.end();
    }, 1000);
  },

  update() {
    this.updateCamera();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a1a');
    gradient.addColorStop(1, '#4a4a4a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.platforms.forEach((platform) => {
      if (platform.isVisible(this.camera, canvas)) {
        platform.draw(ctx, this.camera);
      }
    });

    bots.forEach((bot) => {
      const target = this.players.find((p) => p !== bot.player && p.isIt);
      if (target) {
        bot.update(target, this.platforms);
      }
    });

    this.players.forEach((player) => {
      player.update(this.platforms, canvas, this.camera);
      player.draw(ctx, this.camera);
    });

    this.checkCollisions();
  },

  checkCollisions() {
    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        const p1 = this.players[i];
        const p2 = this.players[j];

        if (
          p1.x < p2.x + p2.width &&
          p1.x + p1.width > p2.x &&
          p1.y < p2.y + p2.height &&
          p1.y + p1.height > p2.y
        ) {
          const now = Date.now();
          if (now - this.lastTagTime >= IMMUNITY_TIME) {
            if (p1.isIt) {
              p1.isIt = false;
              p2.isIt = true;
              p2.lastTagged = now;
            } else if (p2.isIt) {
              p2.isIt = false;
              p1.isIt = true;
              p1.lastTagged = now;
            }
            this.lastTagTime = now;
            this.tagCount++;
            scoreDisplay.textContent = `Tags: ${this.tagCount}`;
          }
        }
      }
    }
  },

  end() {
    clearInterval(this.gameLoop);
    clearInterval(this.timerInterval);
    this.gameStarted = false;
    menu.classList.remove('hidden');

    const winner = this.players.find((p) => !p.isIt);
    const winnerIndex = this.players.indexOf(winner) + 1;

    const endGameMenu = document.createElement('div');
    endGameMenu.innerHTML = `
      <h2 style="color: white; margin-bottom: 20px;">Game Over!</h2>
      <p style="color: white; margin-bottom: 10px;">Winner: Player ${winnerIndex}</p>
      <p style="color: white; margin-bottom: 20px;">Total tags: ${this.tagCount}</p>
      <button id="restartButton" class="menu-button">Play Again</button>
      <button id="homeButton" class="menu-button">Home</button>
    `;

    menu.innerHTML = '';
    menu.appendChild(endGameMenu);

    const restartButton = document.getElementById('restartButton');
    const homeButton = document.getElementById('homeButton');

    // Remove any existing event listeners
    const newRestartButton = restartButton.cloneNode(true);
    const newHomeButton = homeButton.cloneNode(true);
    restartButton.parentNode.replaceChild(newRestartButton, restartButton);
    homeButton.parentNode.replaceChild(newHomeButton, homeButton);

    // Add new event listeners
    newRestartButton.addEventListener('click', () => {
      // Reset game state
      this.players = [];
      this.platforms = [];
      bots = [];
      this.timeLeft = GAME_TIME;
      this.tagCount = 0;
      timerDisplay.textContent = `Time: ${this.timeLeft}`;
      scoreDisplay.textContent = `Tags: ${this.tagCount}`;
      
      // Reset UI
      menu.classList.add('hidden');
      mainMenu.classList.add('hidden');
      characterSelect.classList.remove('hidden');

      // Reset selections but keep map selection
      document.querySelectorAll('.selected').forEach(el => {
        if (!el.classList.contains('map-option')) {
          el.classList.remove('selected');
        }
      });

      // Reset default selections
      document.querySelector('.count-option[data-count="2"]').classList.add('selected');
      playerCount = 2;

      // Reset player sections
      document.querySelectorAll('.player-section').forEach((section, index) => {
        if (index < 2) {
          section.classList.remove('hidden');
          section.querySelector('.player-type-option[data-type="player"]').classList.add('selected');
          section.querySelector('.skill-option[data-skill="dash"]').classList.add('selected');
          section.querySelector('.difficulty-select').classList.add('hidden');
        } else {
          section.classList.add('hidden');
        }
      });

      // Add event listener for Start button
      const startButton = document.querySelector('#startButton');
      if (startButton) {
        const newStartButton = startButton.cloneNode(true);
        startButton.parentNode.replaceChild(newStartButton, startButton);
        newStartButton.addEventListener('click', () => {
          characterSelect.classList.add('hidden');
          this.start();
        });
      }
    });

    newHomeButton.addEventListener('click', () => {
      location.reload();
    });
  },
};

function loadCustomMaps() {
  const savedMaps = JSON.parse(localStorage.getItem('customMaps') || '[]');
  customMapOptions.innerHTML = '';

  savedMaps.forEach((mapData, index) => {
    const mapOption = document.createElement('div');
    mapOption.className = 'map-option';
    mapOption.dataset.map = `custom_${index}`;

    // Create preview canvas
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = 200;
    previewCanvas.height = 150;
    const previewCtx = previewCanvas.getContext('2d');

    // Draw preview
    previewCtx.fillStyle = '#1a1a1a';
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

    // Scale platforms to fit preview
    const scale = Math.min(
      previewCanvas.width / 1920,
      previewCanvas.height / 1080
    );

    previewCtx.save();
    previewCtx.scale(scale, scale);
    mapData.platforms.forEach((p) => {
      previewCtx.save();
      previewCtx.translate(p.x + p.width / 2, p.y + p.height / 2);
      previewCtx.rotate((p.angle * Math.PI) / 180);
      previewCtx.fillStyle = '#4CAF50';
      previewCtx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      previewCtx.restore();
    });
    previewCtx.restore();

    mapOption.innerHTML = `
      <div class="map-preview">
        <img src="${previewCanvas.toDataURL()}" alt="${mapData.name}" />
        <span>${mapData.name}</span>
      </div>
    `;

    mapOption.addEventListener('click', () => {
      document
        .querySelectorAll('.map-option')
        .forEach((opt) => opt.classList.remove('selected'));
      mapOption.classList.add('selected');
    });

    customMapOptions.appendChild(mapOption);
  });
}

// Event Listeners
document.addEventListener('keydown', (e) => {
  if (!game.gameStarted) return;

  const keyName = getKeyName(e);

  game.players.forEach((player, index) => {
    const controls = playerControls[index];
    const playerSection = document.querySelector(`.player-section:nth-child(${index + 1})`);
    if (!playerSection) return;

    const selectedTypeOption = playerSection.querySelector(
      '.player-type-option.selected'
    );
    if (!selectedTypeOption) return;

    const isBot = selectedTypeOption.dataset.type === 'bot';

    if (!isBot) {
      if (keyName.toLowerCase() === controls.up.toLowerCase()) {
        player.controls.up = true;
      }
      if (keyName.toLowerCase() === controls.left.toLowerCase()) {
        player.controls.left = true;
      }
      if (keyName.toLowerCase() === controls.right.toLowerCase()) {
        player.controls.right = true;
      }
      if (keyName.toLowerCase() === controls.dash.toLowerCase()) {
        player.controls.dash = true;
      }
    }
  });
});

document.addEventListener('keyup', (e) => {
  if (!game.gameStarted) return;

  const keyName = getKeyName(e);

  game.players.forEach((player, index) => {
    const controls = playerControls[index];
    const playerSection = document.querySelector(`.player-section:nth-child(${index + 1})`);
    if (!playerSection) return;

    const selectedTypeOption = playerSection.querySelector(
      '.player-type-option.selected'
    );
    if (!selectedTypeOption) return;

    const isBot = selectedTypeOption.dataset.type === 'bot';

    if (!isBot) {
      if (keyName.toLowerCase() === controls.up.toLowerCase()) {
        player.controls.up = false;
      }
      if (keyName.toLowerCase() === controls.left.toLowerCase()) {
        player.controls.left = false;
      }
      if (keyName.toLowerCase() === controls.right.toLowerCase()) {
        player.controls.right = false;
      }
      if (keyName.toLowerCase() === controls.dash.toLowerCase()) {
        player.controls.dash = false;
      }
    }
  });
});

function getKeyName(e) {
  if (e.code.startsWith('Numpad')) {
    return e.code;
  }
  return e.key;
}

function showCharacterSelect() {
  mainMenu.classList.add('hidden');
  characterSelect.classList.remove('hidden');
  loadCustomMaps();
}

function showMainMenu() {
  characterSelect.classList.add('hidden');
  mainMenu.classList.remove('hidden');
}

createMapButton.addEventListener('click', () => {
  window.location.href = 'mapEditor.html';
});

document.querySelectorAll('.count-option').forEach((option) => {
  option.addEventListener('click', (e) => {
    document
      .querySelectorAll('.count-option')
      .forEach((opt) => opt.classList.remove('selected'));
    option.classList.add('selected');
    playerCount = parseInt(option.dataset.count);

    document.querySelectorAll('.player-section').forEach((section, index) => {
      if (index < playerCount) {
        section.classList.remove('hidden');
      } else {
        section.classList.add('hidden');
      }
    });
  });
});

document.querySelectorAll('.skill-option').forEach((option) => {
  option.addEventListener('click', (e) => {
    const skillSection = e.target.closest('.skill-select');
    skillSection.querySelectorAll('.skill-option').forEach((opt) => {
      opt.classList.remove('selected');
    });
    option.classList.add('selected');
  });
});

document.querySelectorAll('.player-type-option').forEach((option) => {
  option.addEventListener('click', (e) => {
    const typeSection = e.target.closest('.player-type-select');
    const playerSection = e.target.closest('.player-section');
    const difficultySelect = playerSection.querySelector('.difficulty-select');

    typeSection.querySelectorAll('.player-type-option').forEach((opt) => {
      opt.classList.remove('selected');
    });
    option.classList.add('selected');

    if (option.dataset.type === 'bot') {
      difficultySelect.classList.remove('hidden');
    } else {
      difficultySelect.classList.add('hidden');
    }
  });
});

document.querySelectorAll('.difficulty-option').forEach((option) => {
  option.addEventListener('click', (e) => {
    const difficultySection = e.target.closest('.difficulty-select');
    difficultySection.querySelectorAll('.difficulty-option').forEach((opt) => {
      opt.classList.remove('selected');
    });
    option.classList.add('selected');
  });
});

startButton.addEventListener('click', showCharacterSelect);
backButton.addEventListener('click', showMainMenu);
playButton.addEventListener('click', () => {
  characterSelect.classList.add('hidden');
  game.start();
});

// Load custom maps on initial load
loadCustomMaps();
