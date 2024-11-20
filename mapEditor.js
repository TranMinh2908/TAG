const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');
const addPlatformBtn = document.getElementById('addPlatform');
const clearMapBtn = document.getElementById('clearMap');
const saveMapBtn = document.getElementById('saveMap');
const backToMenuBtn = document.getElementById('backToMenu');
const mapNameInput = document.getElementById('mapName');
const platformWidthInput = document.getElementById('platformWidth');
const platformHeightInput = document.getElementById('platformHeight');
const platformAngleInput = document.getElementById('platformAngle');
const gridSizeInput = document.getElementById('gridSize');
const showGridCheckbox = document.getElementById('showGrid');
const miniMapCanvas = document.getElementById('miniMap');
const miniMapCtx = miniMapCanvas.getContext('2d');

let platforms = [];
let selectedPlatform = null;
let isDragging = false;
let isResizing = false;
let isRotating = false;
let dragOffset = { x: 0, y: 0 };
let startPos = { x: 0, y: 0 };
let cameraOffset = { x: 0, y: 0 };
let isDraggingCanvas = false;
let lastMousePos = { x: 0, y: 0 };
let gridSize = 20;
let showGrid = true;

// Set canvas size
function resizeCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  miniMapCanvas.width = 200;
  miniMapCanvas.height = 150;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Platform class
class Platform {
  constructor(x, y, width, height, angle = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.angle = angle;
  }

  draw(ctx, offset = { x: 0, y: 0 }) {
    ctx.save();
    ctx.translate(
      this.x + this.width / 2 - offset.x,
      this.y + this.height / 2 - offset.y
    );
    ctx.rotate((this.angle * Math.PI) / 180);
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    if (this === selectedPlatform) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );

      // Draw rotation handle
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(0, -this.height / 2 - 20, 5, 0, Math.PI * 2);
      ctx.fill();

      // Draw resize handle
      ctx.fillRect(this.width / 2 - 5, this.height / 2 - 5, 10, 10);
    }

    ctx.restore();
  }

  drawMiniMap(ctx, scale) {
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(
      this.x * scale,
      this.y * scale,
      this.width * scale,
      this.height * scale
    );
  }

  contains(x, y) {
    const adjustedX = x + cameraOffset.x;
    const adjustedY = y + cameraOffset.y;
    const dx = adjustedX - (this.x + this.width / 2);
    const dy = adjustedY - (this.y + this.height / 2);
    const rotatedX =
      dx * Math.cos((-this.angle * Math.PI) / 180) -
      dy * Math.sin((-this.angle * Math.PI) / 180);
    const rotatedY =
      dx * Math.sin((-this.angle * Math.PI) / 180) +
      dy * Math.cos((-this.angle * Math.PI) / 180);

    return (
      Math.abs(rotatedX) < this.width / 2 &&
      Math.abs(rotatedY) < this.height / 2
    );
  }

  isOnRotateHandle(x, y) {
    const adjustedX = x + cameraOffset.x;
    const adjustedY = y + cameraOffset.y;
    const handleX = this.x + this.width / 2;
    const handleY = this.y - 20;
    const dx = adjustedX - handleX;
    const dy = adjustedY - handleY;
    return Math.sqrt(dx * dx + dy * dy) < 10;
  }

  isOnResizeHandle(x, y) {
    const adjustedX = x + cameraOffset.x;
    const adjustedY = y + cameraOffset.y;
    const handleX = this.x + this.width;
    const handleY = this.y + this.height;
    const dx = adjustedX - handleX;
    const dy = adjustedY - handleY;
    return Math.sqrt(dx * dx + dy * dy) < 10;
  }
}

function drawGrid() {
  if (!showGrid) return;

  const startX =
    Math.floor(cameraOffset.x / gridSize) * gridSize - cameraOffset.x;
  const startY =
    Math.floor(cameraOffset.y / gridSize) * gridSize - cameraOffset.y;

  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 1;

  for (let x = startX; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = startY; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function updateMiniMap() {
  miniMapCtx.clearRect(0, 0, miniMapCanvas.width, miniMapCanvas.height);
  miniMapCtx.fillStyle = '#2a2a2a';
  miniMapCtx.fillRect(0, 0, miniMapCanvas.width, miniMapCanvas.height);

  const scale = 0.05;
  platforms.forEach((platform) => platform.drawMiniMap(miniMapCtx, scale));

  // Draw viewport rectangle
  miniMapCtx.strokeStyle = '#ffffff';
  miniMapCtx.strokeRect(
    cameraOffset.x * scale,
    cameraOffset.y * scale,
    canvas.width * scale,
    canvas.height * scale
  );
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  platforms.forEach((platform) => platform.draw(ctx, cameraOffset));
  updateMiniMap();
  requestAnimationFrame(draw);
}

function updateSelectedPlatformProperties() {
  if (selectedPlatform) {
    platformWidthInput.value = selectedPlatform.width;
    platformHeightInput.value = selectedPlatform.height;
    platformAngleInput.value = selectedPlatform.angle;
  }
}

// Event Listeners
addPlatformBtn.addEventListener('click', () => {
  const platform = new Platform(
    canvas.width / 2 + cameraOffset.x - 50,
    canvas.height / 2 + cameraOffset.y - 10,
    parseInt(platformWidthInput.value),
    parseInt(platformHeightInput.value),
    parseInt(platformAngleInput.value)
  );
  platforms.push(platform);
  selectedPlatform = platform;
  updateSelectedPlatformProperties();
});

clearMapBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear the map?')) {
    platforms = [];
    selectedPlatform = null;
  }
});

saveMapBtn.addEventListener('click', () => {
  const mapName = mapNameInput.value.trim() || 'custom_map';
  const mapData = {
    name: mapName,
    platforms: platforms.map((p) => ({
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height,
      angle: p.angle,
    })),
  };

  // Save to localStorage
  const savedMaps = JSON.parse(localStorage.getItem('customMaps') || '[]');
  savedMaps.push(mapData);
  localStorage.setItem('customMaps', JSON.stringify(savedMaps));

  alert('Map saved successfully!');
});

backToMenuBtn.addEventListener('click', () => {
  if (platforms.length > 0) {
    if (confirm('Do you want to save your map before leaving?')) {
      saveMapBtn.click();
    }
  }
  window.location.href = 'index.html';
});

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (e.button === 1 || e.button === 2) {
    // Middle or right click for canvas dragging
    isDraggingCanvas = true;
    lastMousePos = { x: e.clientX, y: e.clientY };
    return;
  }

  // Check platforms in reverse order (top-most first)
  for (let i = platforms.length - 1; i >= 0; i--) {
    const platform = platforms[i];

    if (selectedPlatform === platform) {
      if (platform.isOnRotateHandle(x, y)) {
        isRotating = true;
        startPos = { x, y };
        return;
      }
      if (platform.isOnResizeHandle(x, y)) {
        isResizing = true;
        startPos = { x, y };
        return;
      }
    }

    if (platform.contains(x, y)) {
      selectedPlatform = platform;
      isDragging = true;
      dragOffset = {
        x: x + cameraOffset.x - platform.x,
        y: y + cameraOffset.y - platform.y,
      };
      updateSelectedPlatformProperties();
      return;
    }
  }

  selectedPlatform = null;
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isDraggingCanvas) {
    cameraOffset.x += lastMousePos.x - e.clientX;
    cameraOffset.y += lastMousePos.y - e.clientY;
    lastMousePos = { x: e.clientX, y: e.clientY };
    return;
  }

  if (isDragging && selectedPlatform) {
    selectedPlatform.x = x + cameraOffset.x - dragOffset.x;
    selectedPlatform.y = y + cameraOffset.y - dragOffset.y;

    // Snap to grid if enabled
    if (showGrid) {
      selectedPlatform.x = Math.round(selectedPlatform.x / gridSize) * gridSize;
      selectedPlatform.y = Math.round(selectedPlatform.y / gridSize) * gridSize;
    }
  } else if (isRotating && selectedPlatform) {
    const center = {
      x: selectedPlatform.x + selectedPlatform.width / 2 - cameraOffset.x,
      y: selectedPlatform.y + selectedPlatform.height / 2 - cameraOffset.y,
    };

    const angle = Math.atan2(y - center.y, x - center.x);
    const prevAngle = Math.atan2(startPos.y - center.y, startPos.x - center.x);
    const deltaAngle = ((angle - prevAngle) * 180) / Math.PI;

    selectedPlatform.angle += deltaAngle;
    startPos = { x, y };
    platformAngleInput.value = Math.round(selectedPlatform.angle);
  } else if (isResizing && selectedPlatform) {
    const deltaX = x - startPos.x;
    const deltaY = y - startPos.y;

    selectedPlatform.width = Math.max(20, selectedPlatform.width + deltaX);
    selectedPlatform.height = Math.max(20, selectedPlatform.height + deltaY);

    if (showGrid) {
      selectedPlatform.width =
        Math.round(selectedPlatform.width / gridSize) * gridSize;
      selectedPlatform.height =
        Math.round(selectedPlatform.height / gridSize) * gridSize;
    }

    startPos = { x, y };
    platformWidthInput.value = Math.round(selectedPlatform.width);
    platformHeightInput.value = Math.round(selectedPlatform.height);
  }
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
  isRotating = false;
  isResizing = false;
  isDraggingCanvas = false;
});

canvas.addEventListener('wheel', (e) => {
  const delta = e.deltaY > 0 ? 1 : -1;
  const newGridSize = Math.max(10, Math.min(100, gridSize + delta * 5));
  if (newGridSize !== gridSize) {
    gridSize = newGridSize;
    gridSizeInput.value = gridSize;
  }
});

// Prevent context menu
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Property input handlers
platformWidthInput.addEventListener('change', () => {
  if (selectedPlatform) {
    selectedPlatform.width = parseInt(platformWidthInput.value);
  }
});

platformHeightInput.addEventListener('change', () => {
  if (selectedPlatform) {
    selectedPlatform.height = parseInt(platformHeightInput.value);
  }
});

platformAngleInput.addEventListener('change', () => {
  if (selectedPlatform) {
    selectedPlatform.angle = parseInt(platformAngleInput.value);
  }
});

gridSizeInput.addEventListener('change', () => {
  gridSize = parseInt(gridSizeInput.value);
});

showGridCheckbox.addEventListener('change', () => {
  showGrid = showGridCheckbox.checked;
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Delete' && selectedPlatform) {
    platforms = platforms.filter((p) => p !== selectedPlatform);
    selectedPlatform = null;
  }
});

// Start animation loop
draw();
