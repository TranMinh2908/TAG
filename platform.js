export class Platform {
  constructor(x, y, width, height, angle = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.angle = angle;
  }

  isVisible(camera, canvas) {
    // Add padding to ensure platforms just off screen are still rendered
    const padding = 100;
    return (
      this.x + this.width > camera.x - padding &&
      this.x < camera.x + canvas.width + padding &&
      this.y + this.height > camera.y - padding &&
      this.y < camera.y + canvas.height + padding
    );
  }

  draw(ctx, camera) {
    const screenX = this.x - camera.x;

    ctx.save();
    ctx.translate(screenX + this.width / 2, this.y + this.height / 2);
    ctx.rotate((this.angle * Math.PI) / 180);
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.fillStyle = '#E91E63';
    ctx.fillRect(-this.width / 2, this.height / 2 - 5, this.width, 5);
    ctx.restore();
  }
}
