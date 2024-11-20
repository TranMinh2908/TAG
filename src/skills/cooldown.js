export function drawCooldownIndicator(
  player,
  ctx,
  screenX,
  lastUseTime,
  cooldown
) {
  const now = Date.now();
  const timeElapsed = now - lastUseTime;

  if (timeElapsed < cooldown) {
    const progress = timeElapsed / cooldown;
    const radius = player.width / 2 + 8;
    const centerX = screenX + player.width / 2;
    const centerY = player.y + player.height / 2;

    // Draw background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw progress arc
    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      radius,
      -Math.PI / 2,
      -Math.PI / 2 + progress * Math.PI * 2
    );
    ctx.strokeStyle = player.color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw remaining time
    const remainingTime = ((cooldown - timeElapsed) / 1000).toFixed(1);
    ctx.font = '12px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(remainingTime, centerX, centerY);
  }
}
