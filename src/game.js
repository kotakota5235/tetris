import { Board } from './board.js';
import { Piece } from './piece.js';
import { KEY, POINTS, LEVEL_SPEED, COLS, ROWS, BLOCK_SIZE, LINES_PER_LEVEL } from './constants.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('board');
        this.ctx = this.canvas.getContext('2d');
        this.canvasNext = document.getElementById('next');
        this.ctxNext = this.canvasNext.getContext('2d');

        this.initNextCanvas();

        this.board = new Board(this.ctx, this.ctxNext);
        this.requestId = null;
        this.time = { start: 0, elapsed: 0, level: LEVEL_SPEED[0] };

        this.scoreElement = document.getElementById('score');
        this.linesElement = document.getElementById('lines');
        this.levelElement = document.getElementById('level');
        this.finalScoreElement = document.getElementById('final-score');

        this.startOverlay = document.getElementById('start-overlay');
        this.pauseOverlay = document.getElementById('pause-overlay');
        this.gameOverOverlay = document.getElementById('game-over-overlay');
        this.restartBtn = document.getElementById('restart-btn');
        this.startBtn = document.getElementById('start-btn');

        this.account = {
            score: 0,
            lines: 0,
            level: 0
        };

        this.piece = null;
        this.nextPiece = null;
        this.isPlaying = false;
        this.isPaused = false;

        this.addEventListener();
        this.reset();
        console.log("Game initialized");
    }

    initNextCanvas() {
        this.ctxNext.canvas.width = 4 * BLOCK_SIZE;
        this.ctxNext.canvas.height = 4 * BLOCK_SIZE;
        this.ctxNext.scale(BLOCK_SIZE, BLOCK_SIZE);
    }

    reset() {
        this.account = {
            score: 0,
            lines: 0,
            level: 0
        };
        this.board.reset();
        this.time = { start: 0, elapsed: 0, level: LEVEL_SPEED[0] };
        this.updateAccount();
        this.gameOverOverlay.style.display = 'none';
        this.pauseOverlay.style.display = 'none';
        this.startOverlay.style.display = 'flex';
        this.isPlaying = false;
        this.isPaused = false;
    }

    play() {
        this.reset();
        this.isPlaying = true;
        this.startOverlay.style.display = 'none';
        this.piece = new Piece(this.ctx);
        this.nextPiece = new Piece(this.ctxNext);
        this.nextPiece.ctx = this.ctxNext; // Ensure context is correct for next piece
        this.nextPiece.setNextPosition();
        this.animate();
    }

    animate(now = 0) {
        if (!this.isPlaying || this.isPaused) return;

        this.time.elapsed = now - this.time.start;
        if (this.time.elapsed > this.time.level) {
            this.time.start = now;
            this.drop();
        }

        this.draw();
        this.requestId = requestAnimationFrame(this.animate.bind(this));
    }

    draw() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.board.draw();
        this.piece.draw();

        // Draw next piece
        if (this.nextPiece) {
            this.ctxNext.clearRect(0, 0, this.ctxNext.canvas.width, this.ctxNext.canvas.height);
            this.nextPiece.draw();
        }
    }

    drop() {
        let p = { ...this.piece, x: this.piece.x, y: this.piece.y + 1 };
        if (this.board.valid(p)) {
            this.piece.move(p);
        } else {
            this.board.freeze(this.piece);
            this.clearLines();
            if (this.piece.y === 0) {
                // Game Over
                this.gameOver();
                return;
            }
            this.piece = this.nextPiece;
            this.piece.ctx = this.ctx;
            this.piece.setStartingPosition();
            this.nextPiece = new Piece(this.ctxNext);
            this.nextPiece.ctx = this.ctxNext; // Ensure context is correct
            this.nextPiece.setNextPosition();
        }
    }

    clearLines() {
        const lines = this.board.clearLines();
        if (lines > 0) {
            this.account.lines += lines;
            this.account.score += this.getLinesScore(lines);

            // Level up logic
            if (this.account.lines >= (this.account.level + 1) * LINES_PER_LEVEL) {
                this.account.level++;
                this.time.level = LEVEL_SPEED[this.account.level] || LEVEL_SPEED[10];
            }

            this.updateAccount();
        }
    }

    getLinesScore(lines) {
        const lineScore =
            lines === 1 ? POINTS.SINGLE :
                lines === 2 ? POINTS.DOUBLE :
                    lines === 3 ? POINTS.TRIPLE :
                        lines === 4 ? POINTS.TETRIS : 0;

        return (this.account.level + 1) * lineScore;
    }

    updateAccount() {
        this.scoreElement.textContent = this.account.score;
        this.linesElement.textContent = this.account.lines;
        this.levelElement.textContent = this.account.level;
    }

    gameOver() {
        this.isPlaying = false;
        cancelAnimationFrame(this.requestId);
        this.finalScoreElement.textContent = this.account.score;
        this.gameOverOverlay.style.display = 'flex';
    }

    pause() {
        if (!this.isPlaying) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.pauseOverlay.style.display = 'flex';
            cancelAnimationFrame(this.requestId);
        } else {
            this.pauseOverlay.style.display = 'none';
            this.animate();
        }
    }

    handleInput(event) {
        if (event.key === KEY.ESC) {
            this.pause();
            return;
        }

        if (this.isPaused) return;

        if (!this.isPlaying) {
            if (event.key === KEY.SPACE) {
                this.play();
            }
            return;
        }

        if (event.key === KEY.LEFT) {
            let p = { ...this.piece, x: this.piece.x - 1, y: this.piece.y };
            if (this.board.valid(p)) {
                this.piece.move(p);
            }
        } else if (event.key === KEY.RIGHT) {
            let p = { ...this.piece, x: this.piece.x + 1, y: this.piece.y };
            if (this.board.valid(p)) {
                this.piece.move(p);
            }
        } else if (event.key === KEY.DOWN) {
            let p = { ...this.piece, x: this.piece.x, y: this.piece.y + 1 };
            if (this.board.valid(p)) {
                this.piece.move(p);
                this.account.score += POINTS.SOFT_DROP;
                this.updateAccount();
            }
        } else if (event.key === KEY.UP) {
            let p = this.board.rotate(this.piece);
            if (this.board.valid(p)) {
                this.piece.move(p);
            } else {
                // Wall kick: try moving left or right
                const kickOffsets = [1, -1, 2, -2]; // Try moving right 1, left 1, right 2, left 2
                for (let offset of kickOffsets) {
                    let pKicked = { ...p, x: p.x + offset };
                    if (this.board.valid(pKicked)) {
                        this.piece.move(pKicked);
                        break; // Found a valid kick, stop checking
                    }
                }
            }
        } else if (event.key === KEY.SPACE) {
            let p = { ...this.piece, x: this.piece.x, y: this.piece.y + 1 };
            while (this.board.valid(p)) {
                this.piece.move(p);
                this.account.score += POINTS.HARD_DROP;
                p = { ...this.piece, x: this.piece.x, y: this.piece.y + 1 };
            }
            this.updateAccount();
            this.drop(); // Force drop to lock
        }

        this.draw();
    }

    addEventListener() {
        document.addEventListener('keydown', this.handleInput.bind(this));
        this.restartBtn.addEventListener('click', () => {
            this.play();
        });
        this.startBtn.addEventListener('click', () => {
            this.play();
        });
    }
}
