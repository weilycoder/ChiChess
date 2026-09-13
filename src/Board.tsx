import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";

import { BoardData, type PieceData, type Position } from "./BoardData";
import { BoardSvg } from "./BoardSvg";
import { PieceSvg, NoPieceSvg } from "./PiecesSvg";
import {
  getBoardX as getX,
  getBoardY as getY,
  BOARD_CELL_SIZE as CELL,
  getPieceId,
} from "./utils";

const ANIMATION_DURATION = 150;
const BOARD_COLS = 9;

type Transition = {
  piece: PieceData;
  from: Position;
  to: Position;
  captured: PieceData | null;
};

type Animation = {
  base: BoardData;
  target: BoardData;
  transitions: Transition[];
  startTime: number;
};

function getPieceKey(piece: PieceData | null): string {
  return piece === null ? "" : getPieceId(piece);
}

function toPosition(index: number): Position {
  return { col: index % BOARD_COLS, row: Math.floor(index / BOARD_COLS) };
}

// Match the changed squares between two boards into piece movements by
// shortest distance. Pieces only move to a square they do not already occupy.
function diffTransitions(base: BoardData, target: BoardData): Transition[] {
  const baseCells = base.getBoard();
  const targetCells = target.getBoard();

  const removed: number[] = [];
  const added: number[] = [];
  for (let i = 0; i < baseCells.length; i++) {
    if (getPieceKey(baseCells[i]) === getPieceKey(targetCells[i])) continue;
    if (baseCells[i] !== null) removed.push(i);
    if (targetCells[i] !== null) added.push(i);
  }

  const usedAdded = new Set<number>();
  const transitions: Transition[] = [];
  for (const fromIndex of removed) {
    const piece = baseCells[fromIndex];
    if (piece === null) continue;

    const from = toPosition(fromIndex);
    let bestIndex = -1;
    let bestDistance = Infinity;
    for (const toIndex of added) {
      if (usedAdded.has(toIndex)) continue;
      const candidate = targetCells[toIndex];
      if (candidate === null) continue;
      if (getPieceKey(candidate) !== getPieceKey(piece)) continue;

      const to = toPosition(toIndex);
      const distance =
        Math.abs(to.col - from.col) + Math.abs(to.row - from.row);
      if (distance < 1) continue;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = toIndex;
      }
    }
    if (bestIndex === -1) continue;

    usedAdded.add(bestIndex);
    const to = toPosition(bestIndex);
    const occupied = baseCells[bestIndex];
    transitions.push({
      piece,
      from,
      to,
      captured:
        occupied !== null && getPieceKey(occupied) !== getPieceKey(piece)
          ? occupied
          : null,
    });
  }
  return transitions;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Watches the board instance and derives an animation from every change, so
// local moves, history jumps and external updates all animate the same way.
function useBoardAnimation(boardData: BoardData) {
  const [animation, setAnimation] = useState<Animation | null>(null);
  const [progress, setProgress] = useState(0);
  const prevBoardRef = useRef(boardData);

  useLayoutEffect(() => {
    const base = prevBoardRef.current;
    prevBoardRef.current = boardData;
    if (base === boardData) return;

    const transitions = diffTransitions(base, boardData);
    if (transitions.length === 0) {
      setAnimation(null);
      return;
    }

    setProgress(0);
    setAnimation({
      base,
      target: boardData,
      transitions,
      startTime: performance.now(),
    });
  }, [boardData]);

  useEffect(() => {
    if (animation === null) return;

    let frameId = 0;
    const tick = () => {
      const elapsed = performance.now() - animation.startTime;
      const next = Math.min(elapsed / ANIMATION_DURATION, 1);
      setProgress(next);
      if (next >= 1) setAnimation(null);
      else frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [animation]);

  const active =
    animation !== null && animation.target === boardData ? animation : null;
  return [active, progress] as const;
}

export function Board({
  boardData,
  setBoardData,
}: {
  boardData: BoardData;
  setBoardData?: React.Dispatch<React.SetStateAction<BoardData>>;
}) {
  const [selection, setSelection] = useState<{
    position: Position;
    board: BoardData;
  } | null>(null);
  const [animation, progress] = useBoardAnimation(boardData);

  // A selection only stays valid for the board instance it was made on.
  const selected =
    selection !== null && selection.board === boardData
      ? selection.position
      : null;

  const readonly = useMemo(() => setBoardData === undefined, [setBoardData]);

  const drawnBoard = animation ? animation.base : boardData;

  const updateSelected = (col: number, row: number) => {
    if (readonly || animation !== null) return;
    const select = () =>
      setSelection({ position: { col, row }, board: boardData });

    if (selected === null) select();
    else if (selected.col === col && selected.row === row) setSelection(null);
    else {
      const newBoardData = boardData.copy();
      if (
        newBoardData.movePiece({
          from: { col: selected.col, row: selected.row },
          to: { col, row },
        })
      ) {
        setSelection(null);
        setBoardData?.(newBoardData);
      } else select();
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

    // Squares taken over by the ghost layer while an animation is running.
    const hidden = new Set<string>();
    if (animation)
      for (const transition of animation.transitions) {
        hidden.add(`${transition.from.col}-${transition.from.row}`);
        if (transition.captured)
          hidden.add(`${transition.to.col}-${transition.to.row}`);
      }

    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 9; col++) {
        if (hidden.has(`${col}-${row}`)) continue;

        const piece = drawnBoard.pieceAt(col, row);
        const transform = `translate(${getX(col) - CELL / 2 + 2}, ${getY(row) - CELL / 2 + 2})`;

        if (piece === null)
          children.push(
            <g key={`${col}-${row}`} transform={transform}>
              <NoPieceSvg
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
              <PieceSvg
                name={piece.name}
                color={piece.color}
                onClick={
                  !readonly &&
                  animation === null &&
                  (piece.color === drawnBoard.getTurn() ||
                    isValidMove(col, row))
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
      const eased = easeOutCubic(progress);
      for (const transition of animation.transitions) {
        const { piece, from, to, captured } = transition;

        if (captured) {
          const capturedTransform = `translate(${getX(to.col) - CELL / 2 + 2}, ${getY(to.row) - CELL / 2 + 2})`;
          children.push(
            <g
              key={`capture-${getPieceId(captured)}-${to.col}-${to.row}`}
              transform={capturedTransform}
              opacity={1 - eased}
            >
              <PieceSvg name={captured.name} color={captured.color} />
            </g>,
          );
        }

        const col = from.col + (to.col - from.col) * eased;
        const row = from.row + (to.row - from.row) * eased;
        const transform = `translate(${getX(col) - CELL / 2 + 2}, ${getY(row) - CELL / 2 + 2})`;
        children.push(
          <g
            key={`anim-${getPieceId(piece)}-${to.col}-${to.row}`}
            transform={transform}
          >
            <PieceSvg name={piece.name} color={piece.color} />
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
        setSelection(null);
      }}
    >
      <BoardSvg>{renderPieces()}</BoardSvg>
    </div>
  );
}

export function ReadonlyBoard({ fen }: { fen: string }) {
  const boardData = useMemo(() => new BoardData(fen), [fen]);

  return <Board boardData={boardData} />;
}
