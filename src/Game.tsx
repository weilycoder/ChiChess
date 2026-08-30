import { useState, useMemo } from "react";

import { Board } from "./Board";
import { BoardData, type Position } from "./board_data";
import { Piece, NoPiece } from "./Pieces";
import {
  getBoardX as getX,
  getBoardY as getY,
  BOARD_CELL_SIZE as CELL,
  getPieceId,
} from "./utils";

export function Game() {
  const [boardData, setBoardData] = useState(new BoardData());
  const [selected, setSelected] = useState<Position | null>(null);

  const updateSelected = (col: number, row: number) => {
    if (selected === null) setSelected({ col, row });
    else if (selected.col === col && selected.row === row) setSelected(null);
    else if (boardData.isValidMove(selected.col, selected.row, col, row)) {
      const newBoardData = boardData.copy();
      newBoardData.movePiece(selected.col, selected.row, col, row);
      setSelected(null);
      setBoardData(newBoardData);
    } else setSelected({ col, row });
  };

  const validMove = useMemo(() => {
    if (!selected) return [];
    return boardData.getValidMoves(selected.col, selected.row);
  }, [selected, boardData]);

  const isValidMove = (toCol: number, toRow: number) => {
    return validMove.some((move) => move.col === toCol && move.row === toRow);
  };

  const renderPieces = () => {
    const children: React.ReactNode[] = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 9; col++) {
        const piece = boardData.pieceAt(col, row);
        const transform = `translate(${getX(col) - CELL / 2 + 2}, ${getY(row) - CELL / 2 + 2})`;
        if (piece === null)
          children.push(
            <g key={`${col}-${row}`} transform={transform}>
              <NoPiece
                onClick={
                  isValidMove(col, row)
                    ? (e) => {
                        e.stopPropagation();
                        updateSelected(col, row);
                      }
                    : undefined
                }
                reachable={isValidMove(col, row)}
              />
            </g>,
          );
        else
          children.push(
            <g key={`${getPieceId(piece)}-${col}-${row}`} transform={transform}>
              <Piece
                name={piece.name}
                color={piece.color}
                onClick={
                  piece.color === boardData.getTurn() || isValidMove(col, row)
                    ? (e) => {
                        e.stopPropagation();
                        updateSelected(col, row);
                      }
                    : undefined
                }
                selected={selected?.col === col && selected?.row === row}
                reachable={isValidMove(col, row)}
              />
            </g>,
          );
      }
    }
    return children;
  };

  return (
    <div
      style={{ display: "inline-block" }}
      onClick={(e) => {
        e.stopPropagation();
        setSelected(null);
      }}
    >
      <Board>{renderPieces()}</Board>
    </div>
  );
}
