import { pieces_abbr, type PieceAbbr, type PieceData } from "./utils";

export const initialFen =
  "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w";

export class BoardData {
  private turn: "red" | "black";
  private board: (PieceData | null)[];

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
  }

  getTurn() {
    return this.turn;
  }

  pieceAt(col: number, row: number): PieceData | null {
    if (col < 0 || col >= 9 || row < 0 || row >= 10)
      throw new Error("Invalid board coordinates");
    return this.board[row * 9 + col];
  }

  copy(): BoardData {
    const newBoardData = new BoardData(null);
    newBoardData.turn = this.turn;
    newBoardData.board = [...this.board];
    return newBoardData;
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
