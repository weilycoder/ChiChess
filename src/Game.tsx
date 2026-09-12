import { useState, useEffect, useMemo, useRef } from "react";

import { Board } from "./Board";
import { type BoardData, type Position } from "./BoardData";
import { Piece, NoPiece } from "./Pieces";
import {
  getBoardX as getX,
  getBoardY as getY,
  BOARD_CELL_SIZE as CELL,
  getPieceId,
} from "./utils";

const TOTAL_ANIMATION_DURATION = 100;
const PER_FRAME_DURATION = 10;

type MoveAnimation = {
  from: Position;
  to: Position;
  progress: number;
};

function getAnimatedPosition(animation: MoveAnimation): Position {
  const { from, to, progress } = animation;
  const x = from.col + (to.col - from.col) * progress;
  const y = from.row + (to.row - from.row) * progress;
  return { col: x, row: y };
}

function useMoveAnimation() {
  const [animation, setAnimation] = useState<MoveAnimation | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<MoveAnimation | null>(null);
  const onCompleteRef = useRef<(() => void) | undefined>(undefined);

  const startAnimation = (
    from: Position,
    to: Position,
    onComplete?: () => void,
  ) => {
    onCompleteRef.current = onComplete;
    const initialAnimation = { from, to, progress: 0 };
    animationRef.current = initialAnimation;
    setAnimation(initialAnimation);
    setIsAnimating(true);
  };

  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      const current = animationRef.current;
      if (!current) return;

      const newProgress = Math.min(
        current.progress + PER_FRAME_DURATION / TOTAL_ANIMATION_DURATION,
        1.0,
      );

      if (newProgress >= 1) {
        clearInterval(interval);
        setIsAnimating(false);
        setAnimation(null);
        onCompleteRef.current?.();
      } else {
        const updated = { ...current, progress: newProgress };
        animationRef.current = updated;
        setAnimation(updated);
      }
    }, PER_FRAME_DURATION);

    return () => clearInterval(interval);
  }, [isAnimating]);

  return [animation, startAnimation] as const;
}

export function Game({
  boardData,
  setBoardData,
}: {
  boardData: BoardData;
  setBoardData?: React.Dispatch<React.SetStateAction<BoardData>>;
}) {
  const [selected, setSelected] = useState<Position | null>(null);
  const [animation, startAnimation] = useMoveAnimation();

  const readonly = useMemo(() => setBoardData === undefined, [setBoardData]);

  const updateSelected = (col: number, row: number) => {
    if (readonly || animation !== null) return;
    if (selected === null) setSelected({ col, row });
    else if (selected.col === col && selected.row === row) setSelected(null);
    else {
      const newBoardData = boardData.copy();
      if (
        newBoardData.movePiece({
          from: { col: selected.col, row: selected.row },
          to: { col, row },
        })
      ) {
        setSelected(null);
        startAnimation(selected, { col, row }, () => {
          setBoardData?.(newBoardData);
        });
      } else setSelected({ col, row });
    }
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

        if (
          animation &&
          animation.from.col === col &&
          animation.from.row === row
        )
          continue;

        if (piece === null)
          children.push(
            <g key={`${col}-${row}`} transform={transform}>
              <NoPiece
                onClick={
                  !readonly && animation === null && isValidMove(col, row)
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
                  !readonly &&
                  animation === null &&
                  (piece.color === boardData.getTurn() || isValidMove(col, row))
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

    if (animation) {
      const animatedPos = getAnimatedPosition(animation);
      const originalPiece = boardData.pieceAt(
        animation.from.col,
        animation.from.row,
      );
      if (originalPiece) {
        const transform = `translate(${getX(animatedPos.col) - CELL / 2 + 2}, ${getY(animatedPos.row) - CELL / 2 + 2})`;
        children.push(
          <g
            key={`anim-${getPieceId(originalPiece)}-${animation.to.col}-${animation.to.row}`}
            transform={transform}
          >
            <Piece name={originalPiece.name} color={originalPiece.color} />
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
