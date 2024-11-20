import { DASH_COOLDOWN, DASH_DURATION } from '../../constants.js';

export function handleDash(player, direction) {
  if (
    !player.canDash ||
    player.isDashing ||
    Date.now() - player.lastDashTime < DASH_COOLDOWN
  )
    return;

  player.isDashing = true;
  player.lastDashTime = Date.now();

  const dashSpeed = player.dashSpeed || 15;

  switch (direction) {
    case 'left':
      player.velocity.x = -dashSpeed;
      player.velocity.y = 0;
      break;
    case 'right':
      player.velocity.x = dashSpeed;
      player.velocity.y = 0;
      break;
    case 'up':
      player.velocity.y = -dashSpeed;
      player.velocity.x = 0;
      break;
  }

  setTimeout(() => {
    player.isDashing = false;
  }, DASH_DURATION);
}

export function drawDashEffects(player, ctx, screenX) {
  if (player.isDashing) {
    // Draw trail effect
    const trailLength = 5;
    const trailOpacityStep = 0.2;

    for (let i = 0; i < trailLength; i++) {
      const trailX = screenX - player.velocity.x * i * 0.5;
      const trailY = player.y - player.velocity.y * i * 0.5;
      const opacity = 1 - i * trailOpacityStep;

      ctx.save();
      ctx.fillStyle = `${player.color}${Math.floor(opacity * 255)
        .toString(16)
        .padStart(2, '0')}`;
      ctx.beginPath();
      ctx.arc(
        trailX + player.width / 2,
        trailY + player.height / 2,
        (player.width / 2) * (1 - i * 0.15),
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }

    // Draw dash glow effect
    ctx.save();
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = `${player.color}80`;
    ctx.beginPath();
    ctx.arc(
      screenX + player.width / 2,
      player.y + player.height / 2,
      player.width / 1.5,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // Draw speed lines
    const speedLineCount = 8;
    const speedLineLength = 20;
    const direction = player.velocity.x > 0 ? -1 : 1;

    ctx.save();
    ctx.strokeStyle = `${player.color}40`;
    ctx.lineWidth = 2;

    for (let i = 0; i < speedLineCount; i++) {
      const angle = (Math.PI * 2 * i) / speedLineCount;
      const startX =
        screenX + player.width / 2 + Math.cos(angle) * (player.width / 2);
      const startY =
        player.y + player.height / 2 + Math.sin(angle) * (player.height / 2);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(
        startX + direction * speedLineLength * Math.cos(angle),
        startY + speedLineLength * Math.sin(angle)
      );
      ctx.stroke();
    }
    ctx.restore();
  }
}
