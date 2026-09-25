import { Spin, message } from "antd";
import { useCallback, useEffect, useState } from "react";

import { loadPuzzles, type Puzzle } from "./Puzzle";
import { PuzzleGame } from "./PuzzleGame";
import { PuzzleList } from "./PuzzleList";

function puzzleIdFromHash(hash: string): string | null {
  const prefix = "#puzzle/";
  if (!hash.startsWith(prefix)) return null;
  return decodeURIComponent(hash.slice(prefix.length));
}

function App() {
  const [messageApi, contextHolder] = message.useMessage();
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [puzzleId, setPuzzleId] = useState(() =>
    puzzleIdFromHash(window.location.hash),
  );
  const [error, setError] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const selectPuzzle = useCallback((selectedPuzzle: Puzzle) => {
    window.location.hash = `puzzle/${encodeURIComponent(selectedPuzzle.id)}`;
  }, []);

  const showPuzzleList = useCallback(() => {
    window.location.hash = "";
  }, []);

  useEffect(() => {
    const updateHash = () =>
      setPuzzleId(puzzleIdFromHash(window.location.hash));
    window.addEventListener("hashchange", updateHash);
    loadPuzzles()
      .then((puzzles) => {
        setPuzzles(puzzles);
      })
      .catch((loadError: unknown) => {
        setError(
          loadError instanceof Error ? loadError.message : String(loadError),
        );
      });

    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  const puzzle =
    puzzleId === null
      ? null
      : (puzzles.find((candidate) => candidate.id === puzzleId) ?? null);
  const invalidPuzzleId =
    puzzles.length > 0 && puzzleId !== null && puzzle === null;

  const markCompleted = useCallback((completedPuzzle: Puzzle) => {
    setCompletedIds((previous) => {
      const next = new Set(previous);
      next.add(completedPuzzle.id);
      return next;
    });
  }, []);
  const handleCompleted = useCallback(() => {
    if (puzzle !== null) markCompleted(puzzle);
  }, [markCompleted, puzzle]);

  useEffect(() => {
    if (error !== null) messageApi.error(error);
  }, [error, messageApi]);

  useEffect(() => {
    if (invalidPuzzleId) messageApi.warning(`未找到题目：${puzzleId}`);
  }, [invalidPuzzleId, messageApi, puzzleId]);

  if (error !== null)
    return (
      <>
        {contextHolder}
        <Spin />
      </>
    );
  if (puzzles.length === 0)
    return (
      <>
        {contextHolder}
        <Spin />
      </>
    );

  if (puzzle === null) {
    return (
      <>
        {contextHolder}
        <PuzzleList
          puzzles={puzzles}
          completedIds={completedIds}
          onSelect={selectPuzzle}
        />
      </>
    );
  }

  return (
    <>
      {contextHolder}
      <PuzzleGame
        key={puzzle.id}
        puzzle={puzzle}
        onBack={showPuzzleList}
        onCompleted={handleCompleted}
      />
    </>
  );
}

export default App;
