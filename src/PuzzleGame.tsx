import { Button, Flex, message, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";

import { BoardData, parseMoves, type Move, type Situation } from "./BoardData";
import { Game } from "./Game";
import type { Puzzle } from "./Puzzle";

const AUTO_RESPONSE_DELAY = 180;

function sameSituation(left: Situation, right: Situation): boolean {
  return (
    left.turn === right.turn &&
    left.board.every((piece, index) => {
      const other = right.board[index];
      return piece?.name === other?.name && piece?.color === other?.color;
    })
  );
}

function buildPuzzleSituations(puzzle: Puzzle): Situation[] {
  const boardData = new BoardData(puzzle.initialFen);
  const situations = [boardData.getHistory().nodes[0].situation];

  for (const move of parseMoves(puzzle.steps)) {
    if (!boardData.movePiece(move))
      throw new Error(
        `Puzzle contains an illegal move: ${JSON.stringify(move)}`,
      );
    const { index, nodes } = boardData.getHistory();
    situations.push(nodes[index].situation);
  }

  return situations;
}

function isAutomaticStep(initialTurn: "red" | "black", stepIndex: number) {
  return initialTurn === "black" ? stepIndex % 2 === 0 : stepIndex % 2 === 1;
}

function isMainVariation(boardData: BoardData, index: number): boolean {
  const { nodes } = boardData.getHistory();
  const parentIndex = nodes[index].parentIndex;
  return (
    parentIndex === null || nodes[parentIndex].childrenIndices[0] === index
  );
}

export function PuzzleGame({
  puzzle,
  onBack,
  onCompleted,
}: {
  puzzle: Puzzle;
  onBack: () => void;
  onCompleted: () => void;
}) {
  const [messageApi, contextHolder] = message.useMessage();
  const [boardData, setBoardData] = useState(
    () => new BoardData(puzzle.initialFen),
  );
  const situations = useMemo(() => buildPuzzleSituations(puzzle), [puzzle]);
  const moves = useMemo(() => parseMoves(puzzle.steps), [puzzle]);
  const { index: historyIndex, nodes } = boardData.getHistory();
  const currentSituation = nodes[historyIndex].situation;
  const canonicalIndex = situations.findIndex((situation) =>
    sameSituation(currentSituation, situation),
  );
  const completed = canonicalIndex >= moves.length;
  const nextMove: Move | undefined = moves[canonicalIndex];
  const nextIsAutomatic =
    nextMove !== undefined &&
    isAutomaticStep(situations[0].turn, canonicalIndex);
  const feedback =
    canonicalIndex < 0
      ? "这步走法不在当前题目的标准主线中。"
      : completed
        ? "恭喜，题目完成。"
        : null;

  useEffect(() => {
    if (canonicalIndex > 0 && !isMainVariation(boardData, historyIndex)) {
      const timer = window.setTimeout(() => {
        const nextBoardData = boardData.copy();
        nextBoardData.shiftToMainVariation(historyIndex);
        setBoardData(nextBoardData);
      }, AUTO_RESPONSE_DELAY);

      return () => window.clearTimeout(timer);
    }

    if (!nextIsAutomatic || nextMove === undefined) return;

    const timer = window.setTimeout(() => {
      const nextBoardData = boardData.copy();
      if (!nextBoardData.movePiece(nextMove)) return;
      nextBoardData.shiftToMainVariation(nextBoardData.getHistory().index);
      setBoardData(nextBoardData);
    }, AUTO_RESPONSE_DELAY);

    return () => window.clearTimeout(timer);
  }, [
    boardData,
    canonicalIndex,
    completed,
    historyIndex,
    nextIsAutomatic,
    nextMove,
    situations,
  ]);

  useEffect(() => {
    if (feedback === null) return;
    if (completed) messageApi.success(feedback);
    else messageApi.warning(feedback);
  }, [completed, feedback, messageApi]);

  useEffect(() => {
    if (completed) onCompleted();
  }, [completed, onCompleted]);

  const reset = () => {
    setBoardData(new BoardData(puzzle.initialFen));
  };

  return (
    <>
      {contextHolder}
      <Flex vertical gap={12} style={{ padding: 16 }}>
        <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {puzzle.id}
          </Typography.Title>
          <Flex gap={8}>
            <Button onClick={onBack}>题库</Button>
            <Button onClick={reset}>重置</Button>
          </Flex>
        </Flex>
        <Game
          boardData={boardData}
          setBoardData={setBoardData}
          disablePlay={nextIsAutomatic || completed}
        />
      </Flex>
    </>
  );
}
