import { Board } from "./Board";
import { BoardData } from "./board_data";
import { Piece, NoPiece } from "./Pieces";
import {
  getBoardX as getX,
  getBoardY as getY,
  BOARD_CELL_SIZE as CELL,
  getPieceId,
} from "./utils";

export function Game() {
  const boardData = new BoardData();

  const renderPieces = () => {
    const children: React.ReactNode[] = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 9; col++) {
        const piece = boardData.pieceAt(col, row);
        const transform = `translate(${getX(col) - CELL / 2}, ${getY(row) - CELL / 2})`;
        if (piece === null)
          children.push(
            <g key={`${col}-${row}`} transform={transform}>
              <NoPiece />
            </g>,
          );
        else
          children.push(
            <g key={`${getPieceId(piece)}-${col}-${row}`} transform={transform}>
              <Piece name={piece.name} color={piece.color} />
            </g>,
          );
      }
    }
    return children;
  };

  return (
    <div style={{ display: "inline-block" }}>
      <Board>{renderPieces()}</Board>
    </div>
  );
}
