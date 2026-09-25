import { z } from "zod";

import { BoardData, parseMoves } from "./BoardData";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const PuzzleSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().min(1),
    category: z.string().min(1),
    initialFen: z.string().min(1),
    steps: z.string().trim().min(1),
  })
  .strict()
  .superRefine((puzzle, context) => {
    try {
      new BoardData(puzzle.initialFen);
    } catch (error) {
      context.addIssue({
        code: "custom",
        path: ["initialFen"],
        message: errorMessage(error),
      });
    }

    try {
      parseMoves(puzzle.steps);
    } catch (error) {
      context.addIssue({
        code: "custom",
        path: ["steps"],
        message: errorMessage(error),
      });
    }
  });

export type Puzzle = z.infer<typeof PuzzleSchema>;

function parsePuzzle(value: unknown, index: number): Puzzle {
  const result = PuzzleSchema.safeParse(value);
  if (!result.success)
    throw new Error(
      `Invalid puzzle at index ${index}: ${result.error.message}`,
    );
  return result.data;
}

export function parsePuzzles(value: unknown): Puzzle[] {
  if (!Array.isArray(value)) throw new Error("Puzzle data must be an array");
  return value.map(parsePuzzle);
}

export async function loadPuzzles(): Promise<Puzzle[]> {
  const response = await fetch("/puzzles.json");
  if (!response.ok) {
    throw new Error(`Failed to load puzzles: ${response.status}`);
  }
  return parsePuzzles(await response.json());
}
