import { Flex } from "antd";

import { Board } from "./Board";
import { type BoardData } from "./BoardData";
import { MoveHistory } from "./MoveHistory";
import { BOARD_CELL_SIZE, BOARD_MARGIN } from "./utils";

export function Game({
  boardData,
  setBoardData,
  disablePlay,
}: {
  boardData: BoardData;
  setBoardData: React.Dispatch<React.SetStateAction<BoardData>>;
  disablePlay?: boolean;
}) {
  return (
    <Flex align="stretch" gap={16} style={{ paddingRight: BOARD_MARGIN }}>
      <Board
        boardData={boardData}
        setBoardData={disablePlay ? undefined : setBoardData}
      />
      <MoveHistory
        boardData={boardData}
        setBoardData={setBoardData}
        height={BOARD_CELL_SIZE * 9}
        style={{
          width: 160,
          margin: `${BOARD_MARGIN}px 0`,
          border: "1px solid #ccc",
        }}
      />
    </Flex>
  );
}
