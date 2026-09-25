import { Flex } from "antd";

import { Board } from "./Board";
import { type BoardData } from "./BoardData";
import { MoveHistory } from "./MoveHistory";
import { BOARD_CELL_SIZE, BOARD_MARGIN } from "./utils";

export type EditScope =
  | { kind: "all" }
  | { kind: "none" }
  | { kind: "subtree"; rootIndex: number };

function isEditable(
  scope: EditScope,
  currentIndex: number,
  nodes: readonly { parentIndex: number | null }[],
): boolean {
  if (scope.kind === "all") return true;
  if (scope.kind === "none") return false;

  let index: number | null = currentIndex;
  while (index !== null) {
    if (index === scope.rootIndex) return true;
    index = nodes[index].parentIndex;
  }
  return false;
}

export function Game({
  boardData,
  setBoardData,
  disablePlay,
  editScope = { kind: "all" },
}: {
  boardData: BoardData;
  setBoardData: React.Dispatch<React.SetStateAction<BoardData>>;
  disablePlay?: boolean;
  editScope?: EditScope;
}) {
  const { index, nodes } = boardData.getHistory();
  const editable = !disablePlay && isEditable(editScope, index, nodes);

  return (
    <Flex align="stretch" gap={16} style={{ paddingRight: BOARD_MARGIN }}>
      <Board
        boardData={boardData}
        setBoardData={editable ? setBoardData : undefined}
      />
      <MoveHistory
        boardData={boardData}
        setBoardData={setBoardData}
        height={BOARD_CELL_SIZE * 9}
        style={{
          width: 320,
          margin: `${BOARD_MARGIN}px 0`,
          border: "1px solid #ccc",
        }}
      />
    </Flex>
  );
}
