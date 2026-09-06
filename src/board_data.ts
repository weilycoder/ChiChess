import { pieces_abbr, type PieceAbbr, type PieceData } from "./utils";

export type Position = {
  col: number;
  row: number;
};

export type Move = {
  from: Position;
  to: Position;
};

export type historyItem = {
  move: Move | null;
  originalPiece: PieceData | null;
};

export const initialFen =
  "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w";

// Also elephant eye positions
const advisorDelta = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];

const elephantDelta = [
  [-2, -2],
  [2, -2],
  [-2, 2],
  [2, 2],
];

// Also horse leg positions
const kingDelta = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

const horseDelta = [
  [
    [-2, -1],
    [-2, 1],
  ],
  [
    [2, -1],
    [2, 1],
  ],
  [
    [-1, -2],
    [1, -2],
  ],
  [
    [-1, 2],
    [1, 2],
  ],
];

export class BoardData {
  private turn: "red" | "black";
  private board: (PieceData | null)[];

  private historyIndex: number;
  private history: historyItem[];

  constructor(fen: string | null = initialFen) {
    if (fen === null) {
      this.turn = "red";
      this.board = Array(90).fill(null);
    } else {
      const [piecesPart, turnPart] = fen.split(" ");

      this.turn = ["b", "black"].includes(turnPart.toLowerCase())
        ? "black"
        : "red";

      let board = Array();
      for (let ch of piecesPart) {
        if ("0" <= ch && ch <= "9") {
          board.push(...Array(parseInt(ch)).fill(null));
        } else if (ch.toUpperCase() in pieces_abbr) {
          const name = pieces_abbr[ch.toUpperCase() as PieceAbbr];
          const color = ch === ch.toLowerCase() ? "black" : "red";
          board.push({ name, color });
        } else if (ch !== "/") {
          throw new Error(`Invalid FEN string: unknown character '${ch}'`);
        }
      }
      if (board.length !== 90)
        throw new Error("Invalid FEN string: incorrect number of squares");

      this.board = board;
    }
    this.historyIndex = 0;
    this.history = [{ move: null, originalPiece: null }];
  }

  getTurn() {
    return this.turn;
  }

  getHistory() {
    return [this.historyIndex, this.history] as const;
  }

  pieceAt(col: number, row: number): PieceData | null {
    if (col < 0 || col >= 9 || row < 0 || row >= 10) return null;
    return this.board[row * 9 + col];
  }

  sameColor(col1: number, row1: number, col2: number, row2: number): boolean {
    const piece1 = this.pieceAt(col1, row1);
    const piece2 = this.pieceAt(col2, row2);
    if (piece1 === null || piece2 === null) return false;
    return piece1.color === piece2.color;
  }

  copy(): BoardData {
    const newBoardData = new BoardData(null);
    newBoardData.turn = this.turn;
    newBoardData.board = [...this.board];
    newBoardData.history = [...this.history];
    newBoardData.historyIndex = this.historyIndex;
    return newBoardData;
  }

  movePiece(move: Move): boolean {
    const { from, to } = move;
    if (!this.isValidMove(move)) return false;

    this.history = this.history.slice(0, ++this.historyIndex);
    this.history.push({
      move,
      originalPiece: this.pieceAt(to.col, to.row),
    });

    this.board[to.row * 9 + to.col] = this.board[from.row * 9 + from.col];
    this.board[from.row * 9 + from.col] = null;
    this.turn = this.turn === "red" ? "black" : "red";
    return true;
  }

  undoMove(): boolean {
    if (this.historyIndex === 0) return false;
    const lastMove = this.history[this.historyIndex--];
    if (lastMove.move === null) return false;

    const { from, to } = lastMove.move;
    this.board[from.row * 9 + from.col] = this.board[to.row * 9 + to.col];
    this.board[to.row * 9 + to.col] = lastMove.originalPiece;
    this.turn = this.turn === "red" ? "black" : "red";
    return true;
  }

  redoMove(): boolean {
    if (this.historyIndex >= this.history.length) return false;
    const nextMove = this.history[this.historyIndex++];
    if (nextMove.move === null) return false;

    const { from, to } = nextMove.move;
    this.board[to.row * 9 + to.col] = this.board[from.row * 9 + from.col];
    this.board[from.row * 9 + from.col] = null;
    this.turn = this.turn === "red" ? "black" : "red";
    return true;
  }

  jumpToHistory(index: number): boolean {
    if (index < 0 || index >= this.history.length) return false;
    while (this.historyIndex < index) this.redoMove();
    while (this.historyIndex > index) this.undoMove();
    return true;
  }

  // Get all possible moves for a piece at (col, row) without considering check
  private getPossibleMoves(col: number, row: number): Position[] {
    const piece = this.pieceAt(col, row);
    if (piece === null) return [];
    switch (piece.name) {
      case "advisor":
        return advisorDelta
          .map(([dc, dr]) => ({ col: col + dc, row: row + dr }))
          .filter(
            (pos) =>
              pos.col >= 3 &&
              pos.col <= 5 &&
              (pos.row >= 7 || pos.row <= 2) &&
              !this.sameColor(col, row, pos.col, pos.row),
          );
      case "elephant":
        return elephantDelta
          .map(([dc, dr]) => ({ col: col + dc, row: row + dr }))
          .filter(
            (pos) =>
              pos.col >= 0 &&
              pos.col <= 8 &&
              // prettier-ignore
              (pos.row <= 4) == (row <= 4) && // Ensure the elephant doesn't cross the river
              !this.sameColor(col, row, pos.col, pos.row),
          );
      case "king":
        return kingDelta
          .map(([dc, dr]) => ({ col: col + dc, row: row + dr }))
          .filter(
            (pos) =>
              pos.col >= 3 &&
              pos.col <= 5 &&
              (pos.row >= 7 || pos.row <= 2) &&
              !this.sameColor(col, row, pos.col, pos.row),
          );
      case "horse": {
        let validMoves: Position[] = [];
        for (let i = 0; i < 4; i++) {
          const [legColOffset, legRowOffset] = kingDelta[i];
          if (this.pieceAt(col + legColOffset, row + legRowOffset) === null) {
            for (let [dc, dr] of horseDelta[i]) {
              const newCol = col + dc;
              const newRow = row + dr;
              if (
                newCol >= 0 &&
                newCol <= 8 &&
                newRow >= 0 &&
                newRow <= 9 &&
                !this.sameColor(col, row, newCol, newRow)
              )
                validMoves.push({ col: newCol, row: newRow });
            }
          }
        }
        return validMoves;
      }
      case "cannon": {
        let validMoves: Position[] = [];

        let hasJumped = false;
        const checkDirection = (dc: number, dr: number) => {
          if (this.pieceAt(dc, dr) === null) {
            if (!hasJumped) validMoves.push({ col: dc, row: dr });
          } else {
            if (!hasJumped) hasJumped = true;
            else {
              if (!this.sameColor(col, row, dc, dr))
                validMoves.push({ col: dc, row: dr });
              return true; // Stop searching in this direction
            }
          }
        };

        for (let dc = 1; col + dc < 9; dc++)
          if (checkDirection(col + dc, row)) break;
        hasJumped = false;
        for (let dc = 1; col - dc >= 0; dc++)
          if (checkDirection(col - dc, row)) break;
        hasJumped = false;
        for (let dr = 1; row + dr < 10; dr++)
          if (checkDirection(col, row + dr)) break;
        hasJumped = false;
        for (let dr = 1; row - dr >= 0; dr++)
          if (checkDirection(col, row - dr)) break;

        return validMoves;
      }
      case "rook": {
        let validMoves: Position[] = [];

        const checkDirection = (dc: number, dr: number) => {
          if (!this.sameColor(col, row, dc, dr))
            validMoves.push({ col: dc, row: dr });
          if (this.pieceAt(dc, dr) !== null) return true; // Stop searching in this direction
        };

        for (let dc = 1; col + dc < 9; dc++)
          if (checkDirection(col + dc, row)) break;
        for (let dc = 1; col - dc >= 0; dc++)
          if (checkDirection(col - dc, row)) break;
        for (let dr = 1; row + dr < 10; dr++)
          if (checkDirection(col, row + dr)) break;
        for (let dr = 1; row - dr >= 0; dr++)
          if (checkDirection(col, row - dr)) break;

        return validMoves;
      }
      case "pawn": {
        let validMoves: Position[] = [];
        const forward = piece.color === "red" ? -1 : 1;
        if (
          row + forward >= 0 &&
          row + forward <= 9 &&
          !this.sameColor(col, row, col, row + forward)
        )
          validMoves.push({ col, row: row + forward });
        if (piece.color === "red" ? row <= 4 : row >= 5) {
          [-1, 1].forEach((dc) => {
            if (
              col + dc >= 0 &&
              col + dc <= 8 &&
              !this.sameColor(col, row, col + dc, row)
            )
              validMoves.push({ col: col + dc, row });
          });
        }
        return validMoves;
      }
    }
  }

  isInCheck(color: "red" | "black"): boolean {
    const opponent = color === "red" ? "black" : "red";
    for (let row = 0; row < 10; row++)
      for (let col = 0; col < 9; col++)
        if (this.pieceAt(col, row)?.color === opponent) {
          const possibleMoves = this.getPossibleMoves(col, row);
          for (let move of possibleMoves) {
            const targetPiece = this.pieceAt(move.col, move.row);
            if (targetPiece?.name === "king" && targetPiece.color === color)
              return true;
          }
        }
    return false;
  }

  getValidMoves(col: number, row: number): Position[] {
    const possibleMoves = this.getPossibleMoves(col, row);
    let validMoves: Position[] = [];
    for (let move of possibleMoves) {
      const newBoard = this.copy();
      newBoard.board[move.row * 9 + move.col] = newBoard.board[row * 9 + col];
      newBoard.board[row * 9 + col] = null;
      if (!newBoard.isInCheck(this.turn)) validMoves.push(move);
    }
    return validMoves;
  }

  getAllValidMoves(): Move[] {
    const color = this.turn;
    let allValidMoves: Move[] = [];
    for (let row = 0; row < 10; row++)
      for (let col = 0; col < 9; col++) {
        const piece = this.pieceAt(col, row);
        if (piece && piece.color === color) {
          const validMoves = this.getValidMoves(col, row);
          for (let move of validMoves)
            allValidMoves.push({ from: { col, row }, to: move });
        }
      }
    return allValidMoves;
  }

  isValidMove(move: Move): boolean {
    const { from, to } = move;
    if (this.pieceAt(from.col, from.row)?.color !== this.turn) return false;
    const validMoves = this.getValidMoves(from.col, from.row);
    return validMoves.some(
      (move) => move.col === to.col && move.row === to.row,
    );
  }

  getFen(): string {
    let fen = "";
    for (let row = 0; row < 10; row++) {
      let emptyCount = 0;
      for (let col = 0; col < 9; col++) {
        const piece = this.pieceAt(col, row);
        if (piece === null) emptyCount++;
        else {
          if (emptyCount > 0) {
            fen += emptyCount.toString();
            emptyCount = 0;
          }
          const abbr = piece.name[0].toUpperCase();
          fen += piece.color === "red" ? abbr.toUpperCase() : abbr;
        }
      }
      if (emptyCount > 0) fen += emptyCount.toString();
      if (row < 9) fen += "/";
    }
    return fen + " " + (this.turn === "red" ? "w" : "b");
  }
}
