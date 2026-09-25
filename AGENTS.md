# ChiChess Agent Guide

## Project Shape

- This is a React 19 + TypeScript + Vite Chinese chess board.
- `src/App.tsx` owns the current `BoardData` instance.
- `src/Game.tsx` composes the interactive `Board` and `MoveHistory` views.
- `src/BoardData.ts` owns positions, FEN parsing, legal move validation, check detection, Chinese notation, and branched move history.
- `src/Board.tsx` owns selection, move interaction, read-only mode, and board transition animation.
- `src/BoardSvg.tsx` and `src/PiecesSvg.tsx` are the SVG rendering layers.
- `src/Puzzle.ts` defines and validates the five-field `Puzzle` schema with Zod and loads `/puzzles.json` from the Vite `public` directory at runtime.
- `src/PuzzleGame.tsx` owns puzzle progress, feedback messages, automatic black responses, and reset behavior.
- `src/PuzzleList.tsx` renders the puzzle list; `App.tsx` selects list/detail views through `#puzzle/<id>` hashes.
- `public/puzzles.json` is served as a static asset and fetched at runtime; do not add a TypeScript JSON import for the puzzle data.

## Chess State Rules

- Treat `BoardData` as immutable React state. Before changing a position, call `copy()`, then update through `movePiece()` or `jumpToHistory()`, and replace state with the new instance.
- Do not mutate the board array or history nodes directly. Doing so breaks React updates, selection invalidation, animation, turn changes, notation, and variation history.
- The board is 9 columns by 10 rows. Array indices are `row * 9 + col`; red moves toward decreasing row numbers.
- Preserve the parent/child links in `MoveHistoryNode` when changing history behavior. The first child is the main variation; later children are displayed as variations.
- `BoardData.shiftToMainVariation(index)` promotes a node and its ancestor path by reordering `childrenIndices`; call it on a copied `BoardData` instance.
- `BoardData.movePiece()` reuses an existing child with the same resulting situation instead of creating a duplicate variation node.
- Keep new board interactions disabled while `Board` has an active animation unless the behavior explicitly accounts for that state.

## Puzzle Conventions

- The initial `Puzzle` schema contains only `schemaVersion`, `id`, `category`, `initialFen`, and `steps`; do not add `playerColor` or multi-solution fields without an explicit requirement.
- `initialFen` carries the side-to-move information. `steps` is one whitespace-separated string of four-character moves such as `c3c4 b7c7`.
- External puzzle coordinates use columns `a-i` from Red's left to right and rows `0-9` from Red's bottom to top. `BoardData.parseMoves()` converts them to internal coordinates; for example, `c3c4` becomes `{ from: { col: 2, row: 6 }, to: { col: 2, row: 5 } }`.
- Red is the player and Black responses are automatic according to the initial turn and step order. Legal wrong moves remain in the history as variations; they do not advance puzzle progress.
- `MoveHistory` must remain freely navigable in puzzle mode. Puzzle state should synchronize after a jump rather than disabling history controls.

## Development Commands

Use `pnpm`:

```bash
pnpm install
pnpm run dev             # Vite on port 30147
pnpm run build           # TypeScript build, then Vite build
pnpm run lint            # oxlint
pnpm run format:check    # verify oxfmt output
pnpm run precommit       # lint + format check + TypeScript build
```

There is currently no test script or test suite. For changes to chess rules or history, add focused coverage when introducing a test framework is appropriate. Since Vite uses `strictPort`, a busy port causes `pnpm run dev` to fail instead of selecting another port.

## Code Conventions

- Follow the existing TypeScript and React patterns; keep components focused on their current layer.
- `tsconfig.app.json` enables `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, and `noFallthroughCasesInSwitch`.
- Run `pnpm run lint`, `pnpm run format:check`, and `pnpm run build` after changes that affect source code.
- Keep SVG geometry aligned with `BOARD_CELL_SIZE`, `BOARD_MARGIN`, and the coordinate helpers in `src/utils.ts`.
- Use Ant Design `message` for transient puzzle and application feedback; render its `contextHolder` in the component tree.

## Agent Workflow

- When the user asks to plan, discuss, or review first, do not edit files until the user explicitly asks to execute the change.
- Preserve the approved data contracts and scope. In particular, do not add puzzle fields or features that the user has explicitly deferred, and keep unrelated edits out of the change.
- After modifying any project file, update `README.md` in the same task so the project documentation remains synchronized with the implementation.
- After modifying any project file, update `AGENTS.md` in the same task. Record any changed project structure, behavior, data contracts, conventions, commands, or file locations; if there is no new project fact, still review the file and confirm it remains synchronized before finishing.
