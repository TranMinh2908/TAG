import { TELEPORT_COOLDOWN } from '../../constants.js';

export function handleTeleport(player, platforms, canvas, camera) {
  if (Date.now() - player.lastTeleportTime < TELEPORT_COOLDOWN) return;

  let newX, newY;
  let attempts = 0;
  const maxAttempts = 50;

  do {
    newX = camera.x + Math.random() * (canvas.width - player.width);
    newY = Math.random() * (canvas.height - player.height - 100);
    attempts++;
  } while (
    !isSafePosition(newX, newY, player, platforms) &&
    attempts < maxAttempts
  );

  if (attempts < maxAttempts) {
    player.x = newX;
    player.y = newY;
    player.velocity.x = 0;
    player.velocity.y = 0;
    player.lastTeleportTime = Date.now();
  }
}

function isSafePosition(x, y, player, platforms) {
  return platforms.some(
    (platform) =>
      x < platform.x + platform.width &&
      x + player.width > platform.x &&
      y + player.height >= platform.y &&
      y + player.height <= platform.y + 10
  );
}

export function drawTeleportEffects(player, ctx, screenX) {
  if (Date.now() - player.lastTeleportTime < 300) {
    ctx.save();
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      screenX + player.width / 2,
      player.y + player.height / 2,
      player.width,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.restore();
  }
}
