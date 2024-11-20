export const map1 = {
  platforms: (canvas) => {
    const w = canvas.width * 3; // Expanded map width
    const h = canvas.height;

    return [
      // Ground level platforms
      { x: 0, y: h - 20, width: w, height: 20, angle: 0 },

      // Left section
      { x: w * 0.05, y: h - 100, width: w * 0.06, height: 15, angle: 0 },
      { x: w * 0.15, y: h - 150, width: w * 0.1, height: 15, angle: 0 },
      { x: w * 0.1, y: h - 250, width: w * 0.08, height: 15, angle: 15 },
      { x: w * 0.05, y: h - 350, width: w * 0.05, height: 15, angle: 0 },
      { x: w * 0.15, y: h - 450, width: w * 0.1, height: 15, angle: 0 },

      // Center-left section
      { x: w * 0.3, y: h - 200, width: w * 0.15, height: 15, angle: 0 },
      { x: w * 0.35, y: h - 300, width: w * 0.1, height: 15, angle: 0 },
      { x: w * 0.25, y: h - 400, width: w * 0.1, height: 15, angle: 0 },
      { x: w * 0.35, y: h - 500, width: w * 0.15, height: 15, angle: 0 },

      // Center section
      { x: w * 0.45, y: h - 250, width: w * 0.1, height: 15, angle: 0 },
      { x: w * 0.5, y: h - 350, width: w * 0.15, height: 15, angle: 0 },
      { x: w * 0.45, y: h - 450, width: w * 0.1, height: 15, angle: 0 },
      { x: w * 0.5, y: h - 550, width: w * 0.2, height: 15, angle: 0 },

      // Center-right section
      { x: w * 0.65, y: h - 200, width: w * 0.15, height: 15, angle: 0 },
      { x: w * 0.7, y: h - 300, width: w * 0.1, height: 15, angle: 0 },
      { x: w * 0.65, y: h - 400, width: w * 0.1, height: 15, angle: 0 },
      { x: w * 0.7, y: h - 500, width: w * 0.15, height: 15, angle: 0 },

      // Right section
      { x: w * 0.85, y: h - 100, width: w * 0.06, height: 15, angle: 0 },
      { x: w * 0.9, y: h - 150, width: w * 0.1, height: 15, angle: 0 },
      { x: w * 0.85, y: h - 250, width: w * 0.08, height: 15, angle: -15 },
      { x: w * 0.9, y: h - 350, width: w * 0.05, height: 15, angle: 0 },
      { x: w * 0.85, y: h - 450, width: w * 0.1, height: 15, angle: 0 },

      // Additional platforms
      { x: w * 0.2, y: h - 550, width: w * 0.1, height: 15, angle: 0 },
      { x: w * 0.7, y: h - 550, width: w * 0.1, height: 15, angle: 0 },
      { x: w * 0.45, y: h - 600, width: w * 0.1, height: 15, angle: 0 },
    ];
  },

  playerPositions: (canvas) => ({
    player1: { x: canvas.width * 0.1, y: canvas.height - 100 },
    player2: { x: canvas.width * 0.9 - 40, y: canvas.height - 100 },
  }),
};
