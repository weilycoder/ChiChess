export const PIECE_SIZE = 56;

export const BOARD_CELL_SIZE = 60;
export const BOARD_MARGIN = 40;

export function getBoardX(col: number) {
  return BOARD_MARGIN + BOARD_CELL_SIZE * col;
}

export function getBoardY(row: number) {
  return BOARD_MARGIN + BOARD_CELL_SIZE * row;
}

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

export const pieces_abbr: Record<string, PieceName> = {
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

export type PieceAbbr = keyof typeof pieces_abbr;

export type PieceData = {
  name: PieceName;
  color: "red" | "black";
};

export function getPieceId(piece: PieceData): string {
  return `${piece.color}-${piece.name}`;
}
