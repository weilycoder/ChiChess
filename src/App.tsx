import { Alert, Spin } from "antd";
import { useEffect, useState } from "react";

import { loadPuzzles, type Puzzle } from "./Puzzle";
import { PuzzleGame } from "./PuzzleGame";

function App() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPuzzles()
      .then((puzzles) => {
        const firstPuzzle = puzzles[0];
        if (firstPuzzle === undefined) throw new Error("No puzzles available.");
        setPuzzle(firstPuzzle);
      })
      .catch((loadError: unknown) => {
        setError(
          loadError instanceof Error ? loadError.message : String(loadError),
        );
      });
  }, []);

  if (error !== null) return <Alert message={error} type="error" showIcon />;
  if (puzzle === null) return <Spin />;

  return <PuzzleGame puzzle={puzzle} />;
}

export default App;
