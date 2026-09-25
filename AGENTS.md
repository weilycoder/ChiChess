# ChiChess Agent Guide

## Project Shape

- This is a React 19 + TypeScript + Vite Chinese chess board.
- `src/App.tsx` owns the current `BoardData` instance.
- `src/Game.tsx` composes the interactive `Board` and `MoveHistory` views.
- `src/BoardData.ts` owns positions, FEN parsing, legal move validation, check detection, Chinese notation, and branched move history.
- `src/Board.tsx` owns selection, move interaction, read-only mode, and board transition animation.
- `src/BoardSvg.tsx` and `src/PiecesSvg.tsx` are the SVG rendering layers.

## Chess State Rules

- Treat `BoardData` as immutable React state. Before changing a position, call `copy()`, then update through `movePiece()` or `jumpToHistory()`, and replace state with the new instance.
- Do not mutate the board array or history nodes directly. Doing so breaks React updates, selection invalidation, animation, turn changes, notation, and variation history.
- The board is 9 columns by 10 rows. Array indices are `row * 9 + col`; red moves toward decreasing row numbers.
- Preserve the parent/child links in `MoveHistoryNode` when changing history behavior. The first child is the main variation; later children are displayed as variations.
- Keep new board interactions disabled while `Board` has an active animation unless the behavior explicitly accounts for that state.

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
