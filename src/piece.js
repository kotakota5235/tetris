import { SHAPES } from './tetrominoes.js';
import { COLORS } from './constants.js';

export class Piece {
    constructor(ctx) {
        this.ctx = ctx;
        this.spawn();
    }

    spawn() {
        this.typeId = this.randomizeTetrominoType(COLORS.length - 1);
        this.shape = SHAPES[this.typeId];
        this.color = COLORS[this.typeId];
        this.x = 0;
        this.y = 0;
        this.hardDropped = false;
        this.setStartingPosition();
    }

    draw() {
        this.ctx.fillStyle = this.color;
        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    this.ctx.fillStyle = this.color;
                    this.ctx.fillRect(this.x + x, this.y + y, 1, 1);

                    // Simple border for definition
                    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                    this.ctx.lineWidth = 0.05;
                    this.ctx.strokeRect(this.x + x, this.y + y, 1, 1);
                }
            });
        });
    }

    move(p) {
        this.x = p.x;
        this.y = p.y;
        this.shape = p.shape;
    }

    setStartingPosition() {
        this.x = this.typeId === 4 ? 4 : 3;
        this.y = 0; // Start at the top
    }

    setNextPosition() {
        // Center the piece in the 4x4 next canvas
        // The shape is a square matrix of size 2, 3, or 4
        const dimension = this.shape.length;
        this.x = (4 - dimension) / 2;
        this.y = (4 - dimension) / 2;
    }

    randomizeTetrominoType(noOfTypes) {
        if (!Piece.bag || Piece.bag.length === 0) {
            this.fillBag(noOfTypes);
        }
        const typeId = Piece.bag.pop();
        Piece.lastTypeId = typeId;
        return typeId;
    }

    fillBag(noOfTypes) {
        const types = [];
        for (let i = 1; i <= noOfTypes; i++) {
            types.push(i);
        }

        // Fisher-Yates shuffle
        for (let i = types.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [types[i], types[j]] = [types[j], types[i]];
        }

        // Prevent consecutive duplicates across bags
        // We pop from the end, so check the last element
        if (Piece.lastTypeId && types[types.length - 1] === Piece.lastTypeId) {
            // Swap with the first element
            [types[0], types[types.length - 1]] = [types[types.length - 1], types[0]];
        }

        Piece.bag = types;
    }
}

// Initialize static properties
Piece.bag = [];
Piece.lastTypeId = 0;
