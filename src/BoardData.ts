export const pieces_name = {
  advisor: {
    red: "士",
    black: "仕",
  },
  cannon: {
    red: "炮",
    black: "砲",
  },
  elephant: {
    red: "相",
    black: "象",
  },
  horse: {
    red: "马",
    black: "馬",
  },
  king: {
    red: "帅",
    black: "将",
  },
  pawn: {
    red: "兵",
    black: "卒",
  },
  rook: {
    red: "车",
    black: "車",
  },
};

export type PieceName = keyof typeof pieces_name;

export type PieceData = {
  name: PieceName;
  color: "red" | "black";
};

const pieces_abbr: Record<string, PieceName> = {
  A: "advisor",
  C: "cannon",
  E: "elephant",
  B: "elephant",
  H: "horse",
  N: "horse",
  K: "king",
  P: "pawn",
  R: "rook",
};

type PieceAbbr = keyof typeof pieces_abbr;

export type Position = {
  col: number;
  row: number;
};

export type Move = {
  from: Position;
  to: Position;
};

export type Situation = {
  board: (PieceData | null)[];
  turn: "red" | "black";
};

export type MoveHistoryNode = {
  situation: Situation;
  parentIndex: number | null;
  childrenIndices: number[];
  chineseNotation?: string;
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

export const numberNotation = {
  red: ["一", "二", "三", "四", "五", "六", "七", "八", "九"],
  black: ["１", "２", "３", "４", "５", "６", "７", "８", "９"],
};

const puzzleStepPattern = /^([a-i])([0-9])([a-i])([0-9])$/;

function parsePuzzlePosition(column: string, row: string): Position {
  return {
    col: column.charCodeAt(0) - "a".charCodeAt(0),
    row: 9 - Number(row),
  };
}

export function parseMoves(steps: string): Move[] {
  if (steps.trim() === "") throw new Error("Puzzle steps must not be empty");

  return steps
    .trim()
    .split(/\s+/)
    .map((step, index) => {
      const match = puzzleStepPattern.exec(step);
      if (match === null)
        throw new Error(`Invalid puzzle step at index ${index}: '${step}'`);

      const [, fromColumn, fromRow, toColumn, toRow] = match;
      return {
        from: parsePuzzlePosition(fromColumn, fromRow),
        to: parsePuzzlePosition(toColumn, toRow),
      };
    });
}

export class BoardData {
  private historyIndex: number;
  private history: MoveHistoryNode[];

  constructor(situation: string | Situation | null = initialFen) {
    let curr_turn: "red" | "black";
    let curr_board: (PieceData | null)[];
    if (situation === null) {
      curr_turn = "red";
      curr_board = Array(90).fill(null);
    } else if (typeof situation === "string") {
      const [piecesPart, turnPart] = situation.split(" ");

      curr_turn = ["b", "black"].includes(turnPart.toLowerCase())
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

      curr_board = board;
    } else {
      curr_turn = situation.turn;
      curr_board = situation.board;
    }

    this.historyIndex = 0;
    this.history = [
      {
        situation: {
          board: curr_board,
          turn: curr_turn,
        },
        parentIndex: null,
        childrenIndices: [],
      },
    ];
  }

  getTurn() {
    return this.history[this.historyIndex].situation.turn;
  }

  getHistory() {
    return { index: this.historyIndex, nodes: this.history } as const;
  }

  private board(): (PieceData | null)[] {
    return this.history[this.historyIndex].situation.board;
  }

  getBoard(): (PieceData | null)[] {
    return structuredClone(this.board());
  }

  pieceAt(col: number, row: number): PieceData | null {
    if (col < 0 || col >= 9 || row < 0 || row >= 10) return null;
    return this.board()[row * 9 + col];
  }

  sameColor(col1: number, row1: number, col2: number, row2: number): boolean {
    const piece1 = this.pieceAt(col1, row1);
    const piece2 = this.pieceAt(col2, row2);
    if (piece1 === null || piece2 === null) return false;
    return piece1.color === piece2.color;
  }

  copy(): BoardData {
    const newBoardData = new BoardData(null);
    newBoardData.history = structuredClone(this.history);
    newBoardData.historyIndex = this.historyIndex;
    return newBoardData;
  }

  movePiece(move: Move): boolean {
    const { from, to } = move;
    if (!this.isValidMove(move)) return false;

    const chineseNotation = this.chineseMoveNotation(move);
    const newBoard = this.getBoard();

    newBoard[to.row * 9 + to.col] = newBoard[from.row * 9 + from.col];
    newBoard[from.row * 9 + from.col] = null;
    const newTurn = this.getTurn() === "red" ? "black" : "red";

    const parentIndex = this.historyIndex;
    const newIndex = this.history.length;
    this.history.push({
      situation: {
        board: newBoard,
        turn: newTurn,
      },
      parentIndex,
      childrenIndices: [],
      chineseNotation,
    });
    this.history[parentIndex].childrenIndices.push(newIndex);
    this.historyIndex = newIndex;
    return true;
  }

  undoMove(): boolean {
    if (this.historyIndex === 0) return false;
    const parentIndex = this.history[this.historyIndex].parentIndex;
    if (parentIndex === null) return false;
    this.restoreHistory(parentIndex);
    return true;
  }

  jumpToHistory(index: number): boolean {
    if (index < 0 || index >= this.history.length) return false;
    this.restoreHistory(index);
    return true;
  }

  shiftToMainVariation(index: number): boolean {
    if (index < 0 || index >= this.history.length) return false;

    let currentIndex = index;
    while (this.history[currentIndex].parentIndex !== null) {
      const parentIndex = this.history[currentIndex].parentIndex;
      if (parentIndex === null) break;

      const children = this.history[parentIndex].childrenIndices;
      const childPosition = children.indexOf(currentIndex);
      if (childPosition === -1) return false;

      children.splice(childPosition, 1);
      children.unshift(currentIndex);
      currentIndex = parentIndex;
    }

    return true;
  }

  private restoreHistory(index: number): void {
    this.historyIndex = index;
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
      case "elephant": {
        let validMoves: Position[] = [];
        for (let i = 0; i < 4; i++) {
          const [ec, er] = advisorDelta[i];
          if (this.pieceAt(col + ec, row + er) === null) {
            const [dc, dr] = elephantDelta[i];
            const newCol = col + dc;
            const newRow = row + dr;
            if (
              newCol >= 0 &&
              newCol <= 8 &&
              newRow <= 4 == row <= 4 && // Ensure the elephant doesn't cross the river
              !this.sameColor(col, row, newCol, newRow)
            )
              validMoves.push({ col: newCol, row: newRow });
          }
        }
        return validMoves;
      }
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

  private chineseMoveNotation(move: Move): string {
    const { from, to } = move;
    const piece = this.pieceAt(from.col, from.row);
    if (!piece) throw new Error("No piece at the starting position");

    const advance =
      piece.color === "red" ? to.row < from.row : to.row > from.row;
    const rowDiff = Math.abs(to.row - from.row);
    const rowDiffNotation =
      rowDiff === 0 ? undefined : numberNotation[piece.color][rowDiff - 1];

    const chineseColNotation = (col: number, color: "red" | "black") =>
      numberNotation[color][color === "red" ? 8 - col : col];
    const fromColNotation = chineseColNotation(from.col, piece.color);
    const toColNotation = chineseColNotation(to.col, piece.color);

    const pieceName = pieces_name[piece.name][piece.color];
    switch (piece.name) {
      case "advisor":
      case "elephant":
      case "horse":
        return `${pieceName}${fromColNotation}${advance ? "进" : "退"}${toColNotation}`;
      case "king":
        if (rowDiffNotation === undefined)
          return `${pieceName}${fromColNotation}平${toColNotation}`;
        else
          return `${pieceName}${fromColNotation}${advance ? "进" : "退"}${rowDiffNotation}`;
      case "cannon":
      case "rook":
      case "pawn": {
        let sameColPieces: number[] = [];
        for (let row = 0; row < 10; row++) {
          const p = this.pieceAt(from.col, row);
          if (p && p.name === piece.name && p.color === piece.color)
            sameColPieces.push(row);
        }
        if (piece.color === "black") sameColPieces.reverse();

        const currentIndex = sameColPieces.indexOf(from.row);
        const sameColCount = sameColPieces.length;

        let pieceIdentifier: string;
        if (sameColCount === 1)
          pieceIdentifier = `${pieceName}${fromColNotation}`;
        else if (currentIndex === 0) pieceIdentifier = `前${pieceName}`;
        else if (currentIndex === sameColCount - 1)
          pieceIdentifier = `后${pieceName}`;
        else if (sameColCount === 3 && currentIndex === 1)
          pieceIdentifier = `中${pieceName}`;
        else
          pieceIdentifier = `${numberNotation.red[currentIndex]}${pieceName}`;

        if (rowDiffNotation === undefined)
          return `${pieceIdentifier}平${toColNotation}`;
        else
          return `${pieceIdentifier}${advance ? "进" : "退"}${rowDiffNotation}`;
      }
    }
  }

  isInCheck(color: "red" | "black"): boolean {
    const opponent = color === "red" ? "black" : "red";
    for (let row = 0; row < 10; row++)
      for (let col = 0; col < 9; col++) {
        const piece = this.pieceAt(col, row);
        if (piece?.color === opponent) {
          if (piece.name === "king") {
            const step = piece.color === "red" ? -1 : 1;
            for (let r = row + step; r >= 0 && r < 10; r += step) {
              const targetPiece = this.pieceAt(col, r);
              if (targetPiece) {
                if (targetPiece.name === "king" && targetPiece.color === color)
                  return true;
                break;
              }
            }
          } else {
            const possibleMoves = this.getPossibleMoves(col, row);
            for (let move of possibleMoves) {
              const targetPiece = this.pieceAt(move.col, move.row);
              if (targetPiece?.name === "king" && targetPiece.color === color)
                return true;
            }
          }
        }
      }
    return false;
  }

  getValidMoves(col: number, row: number): Position[] {
    const possibleMoves = this.getPossibleMoves(col, row);
    let validMoves: Position[] = [];
    for (let move of possibleMoves) {
      const newBoard = this.getBoard();
      newBoard[move.row * 9 + move.col] = newBoard[row * 9 + col];
      newBoard[row * 9 + col] = null;
      const newBoardData = new BoardData({
        board: newBoard,
        turn: this.getTurn(),
      });
      if (!newBoardData.isInCheck(this.getTurn())) validMoves.push(move);
    }
    return validMoves;
  }

  getAllValidMoves(): Move[] {
    const color = this.getTurn();
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
    if (this.pieceAt(from.col, from.row)?.color !== this.getTurn())
      return false;
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
          fen += piece.color === "red" ? abbr : abbr.toLowerCase();
        }
      }
      if (emptyCount > 0) fen += emptyCount.toString();
      if (row < 9) fen += "/";
    }
    return fen + " " + (this.getTurn() === "red" ? "w" : "b");
  }
}
