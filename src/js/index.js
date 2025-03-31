import '../css/style.css';
import { GameInitializer } from './engine/gameInitializer';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Set initial canvas size
  canvas.width = 1280;
  canvas.height = 720;

  // Initialize game
  const game = new GameInitializer(canvas, ctx);
  game.start();
});
