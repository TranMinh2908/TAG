import { DOUBLE_JUMP_COOLDOWN } from '../../constants.js';

export function handleDoubleJump(player) {
  const now = Date.now();
  if (player.isOnGround) {
    player.velocity.y = -15;
    player.isOnGround = false;
    player.jumpCount = 1;
  } else if (
    player.canDoubleJump &&
    player.jumpCount < player.maxJumps &&
    now - player.lastDoubleJumpTime >= DOUBLE_JUMP_COOLDOWN
  ) {
    player.velocity.y = -15;
    player.jumpCount++;
    player.lastDoubleJumpTime = now;
  }
}

export function drawDoubleJumpEffects(player, ctx, screenX) {
  if (!player.isOnGround && player.jumpCount > 1) {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
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
