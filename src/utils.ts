import {
  pieces_name,
  numberNotation,
  type PieceName,
  type PieceData,
} from "./BoardData";

export const PIECE_SIZE = 56;

export const BOARD_CELL_SIZE = 60;
export const BOARD_MARGIN = 40;

export function getBoardX(col: number) {
  return BOARD_MARGIN + BOARD_CELL_SIZE * col;
}

export function getBoardY(row: number) {
  return BOARD_MARGIN + BOARD_CELL_SIZE * row;
}

export { pieces_name, numberNotation, type PieceName, type PieceData };

export function getPieceId(piece: PieceData): string {
  return `${piece.color}-${piece.name}`;
}
