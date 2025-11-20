import { Game } from './game.js';

// Initialize the Game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing game...");
    const game = new Game();
});
