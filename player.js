import { GRAVITY, JUMP_FORCE, MOVE_SPEED, IMMUNITY_TIME } from './constants.js';
import { handleDash, drawDashEffects } from './src/skills/dash.js';
import { handleTeleport, drawTeleportEffects } from './src/skills/teleport.js';
import {
  handleDoubleJump,
  drawDoubleJumpEffects,
} from './src/skills/doubleJump.js';
import { drawCooldownIndicator } from './src/skills/cooldown.js';
import {
  DASH_COOLDOWN,
  DASH_DURATION,
  TELEPORT_COOLDOWN,
  DOUBLE_JUMP_COOLDOWN,
} from './constants.js';

export class Player {
  constructor(x, y, color, controls, skill = 'none') {
    this.x = x;
    this.y = y;
    this.width = 35;
    this.height = 40;
    this.color = color;
    this.controls = controls;
    this.velocity = { x: 0, y: 0 };
    this.isOnGround = false;
    this.isIt = false;
    this.lastTagged = 0;
    this.skill = skill;
    this.jumpCount = 0;
    this.maxJumps = this.skill === 'double-jump' ? 2 : 1;
    this.canDoubleJump = skill === 'double-jump';
    this.isDashing = false;
    this.canDash = skill === 'dash';
    this.canTeleport = skill === 'teleport';
    this.dashCooldown = DASH_COOLDOWN;
    this.dashDuration = DASH_DURATION;
    this.dashSpeed = 15;
    this.lastDashTime = 0;
    this.teleportCooldown = TELEPORT_COOLDOWN;
    this.lastTeleportTime = 0;
    this.doubleJumpCooldown = DOUBLE_JUMP_COOLDOWN;
    this.lastDoubleJumpTime = 0;
    this.speed = MOVE_SPEED;
  }

  update(platforms, canvas, camera) {
    // Handle skills
    if (this.controls.dash) {
      if (this.canDash) {
        let direction;
        if (this.controls.up) {
          direction = 'up';
        } else {
          direction = this.velocity.x > 0 ? 'right' : 'left';
        }
        handleDash(this, direction);
      } else if (this.canTeleport) {
        handleTeleport(this, platforms, canvas, camera);
      }
    }

    if (!this.isDashing) {
      if (this.controls.left && this.x > camera.x) {
        this.velocity.x = -MOVE_SPEED;
      } else if (
        this.controls.right &&
        this.x < camera.x + canvas.width - this.width
      ) {
        this.velocity.x = MOVE_SPEED;
      } else {
        this.velocity.x *= 0.8;
      }
    }

    this.velocity.y += GRAVITY;

    if (this.controls.up && !this.controls.wasUpPressed) {
      if (this.canDoubleJump) {
        handleDoubleJump(this);
      } else if (this.isOnGround) {
        this.velocity.y = JUMP_FORCE;
        this.isOnGround = false;
      }
    }

    this.controls.wasUpPressed = this.controls.up;

    const nextX = this.x + this.velocity.x;
    const nextY = this.y + this.velocity.y;

    let validMove = true;
    platforms.forEach((platform) => {
      if (this.wouldCollideWith(nextX, nextY, platform)) {
        const collision = this.getCollisionResponse(nextX, nextY, platform);
        if (collision) {
          this.x = collision.x;
          this.y = collision.y;
          this.velocity.x = collision.vx;
          this.velocity.y = collision.vy;
          this.isOnGround = collision.isOnGround;
          if (this.isOnGround) {
            this.jumpCount = 0;
          }
          validMove = false;
        }
      }
    });

    if (validMove) {
      this.x = nextX;
      this.y = nextY;
    }

    if (this.x < camera.x) this.x = camera.x;
    if (this.x > camera.x + canvas.width - this.width) {
      this.x = camera.x + canvas.width - this.width;
    }
    if (this.y > canvas.height - this.height) {
      this.y = canvas.height - this.height;
      this.velocity.y = 0;
      this.isOnGround = true;
      this.jumpCount = 0;
    }
  }

  draw(ctx, camera) {
    const screenX = this.x - camera.x;

    // Draw skill effects
    if (this.skill === 'dash') {
      drawDashEffects(this, ctx, screenX);
      drawCooldownIndicator(
        this,
        ctx,
        screenX,
        this.lastDashTime,
        this.dashCooldown
      );
    } else if (this.skill === 'teleport') {
      drawTeleportEffects(this, ctx, screenX);
      drawCooldownIndicator(
        this,
        ctx,
        screenX,
        this.lastTeleportTime,
        this.teleportCooldown
      );
    } else if (this.skill === 'double-jump') {
      drawDoubleJumpEffects(this, ctx, screenX);
      drawCooldownIndicator(
        this,
        ctx,
        screenX,
        this.lastDoubleJumpTime,
        this.doubleJumpCooldown
      );
    }

    // Draw character body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(
      screenX + this.width / 2,
      this.y + this.height / 2,
      this.width / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw "it" indicator
    if (this.isIt) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(
        screenX + this.width / 2,
        this.y + this.height / 2,
        this.width / 2 + 2,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    // Draw immunity indicator
    if (Date.now() - this.lastTagged < IMMUNITY_TIME) {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(
        screenX + this.width / 2,
        this.y + this.height / 2,
        this.width / 2 + 4,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  wouldCollideWith(nextX, nextY, platform) {
    const angle = (platform.angle * Math.PI) / 180;
    const cx = platform.x + platform.width / 2;
    const cy = platform.y + platform.height / 2;

    const rotatedX =
      (nextX - cx) * Math.cos(-angle) - (nextY - cy) * Math.sin(-angle) + cx;
    const rotatedY =
      (nextX - cx) * Math.sin(-angle) + (nextY - cy) * Math.cos(-angle) + cy;

    return (
      rotatedX < platform.x + platform.width &&
      rotatedX + this.width > platform.x &&
      rotatedY < platform.y + platform.height &&
      rotatedY + this.height > platform.y
    );
  }

  getCollisionResponse(nextX, nextY, platform) {
    const angle = (platform.angle * Math.PI) / 180;
    const cx = platform.x + platform.width / 2;
    const cy = platform.y + platform.height / 2;

    const rotatedX =
      (nextX - cx) * Math.cos(-angle) - (nextY - cy) * Math.sin(-angle) + cx;
    const rotatedY =
      (nextX - cx) * Math.sin(-angle) + (nextY - cy) * Math.cos(-angle) + cy;

    const overlapX =
      rotatedX + this.width / 2 < platform.x + platform.width / 2
        ? platform.x - (rotatedX + this.width)
        : platform.x + platform.width - rotatedX;
    const overlapY =
      rotatedY + this.height / 2 < platform.y + platform.height / 2
        ? platform.y - (rotatedY + this.height)
        : platform.y + platform.height - rotatedY;

    if (Math.abs(overlapX) < Math.abs(overlapY)) {
      const adjustedX = nextX + overlapX * Math.cos(angle);
      const adjustedY = nextY + overlapX * Math.sin(angle);
      return {
        x: adjustedX,
        y: adjustedY,
        vx: 0,
        vy: this.velocity.y,
        isOnGround: false,
      };
    } else {
      const adjustedX = nextX - overlapY * Math.sin(angle);
      const adjustedY = nextY + overlapY * Math.cos(angle);
      return {
        x: adjustedX,
        y: adjustedY,
        vx: this.velocity.x,
        vy: 0,
        isOnGround: overlapY < 0,
      };
    }
  }
}
