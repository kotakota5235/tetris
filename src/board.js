import { COLS, ROWS, BLOCK_SIZE, COLORS } from './constants.js';

export class Board {
    constructor(ctx, ctxNext) {
        this.ctx = ctx;
        this.ctxNext = ctxNext;
        this.init();
    }

    init() {
        // Calculate size of canvas from constants.
        this.ctx.canvas.width = COLS * BLOCK_SIZE;
        this.ctx.canvas.height = ROWS * BLOCK_SIZE;

        // Scale so we don't need to multiply by BLOCK_SIZE every time
        this.ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
    }

    reset() {
        this.grid = this.getEmptyGrid();
        this.piece = null;
    }

    getEmptyGrid() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    valid(p) {
        return p.shape.every((row, dy) => {
            return row.every((value, dx) => {
                let x = p.x + dx;
                let y = p.y + dy;
                return (
                    value === 0 ||
                    (this.isInsideWalls(x) && this.isAboveFloor(y) && this.notOccupied(x, y))
                );
            });
        });
    }

    isInsideWalls(x) {
        return x >= 0 && x < COLS;
    }

    isAboveFloor(y) {
        return y <= ROWS;
    }

    notOccupied(x, y) {
        return this.grid[y] && this.grid[y][x] === 0;
    }

    rotate(piece) {
        // Clone the piece to test rotation
        let p = JSON.parse(JSON.stringify(piece));

        // Transpose matrix
        for (let y = 0; y < p.shape.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [p.shape[x][y], p.shape[y][x]] = [p.shape[y][x], p.shape[x][y]];
            }
        }

        // Reverse the order of the columns
        p.shape.forEach(row => row.reverse());

        return p;
    }

    draw() {
        this.grid.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    this.ctx.fillStyle = COLORS[value];
                    this.ctx.fillRect(x, y, 1, 1);

                    // Simple border for definition
                    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                    this.ctx.lineWidth = 0.05;
                    this.ctx.strokeRect(x, y, 1, 1);
                }
            });
        });
    }

    drawBoard() {
        this.draw();
    }

    freeze(piece) {
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    this.grid[y + piece.y][x + piece.x] = value;
                }
            });
        });
    }

    clearLines() {
        let lines = 0;

        this.grid.forEach((row, y) => {
            // If every value is greater than 0
            if (row.every(value => value > 0)) {
                lines++;

                // Remove the row
                this.grid.splice(y, 1);

                // Add zero filled row at the top
                this.grid.unshift(Array(COLS).fill(0));
            }
        });

        return lines;
    }
}
