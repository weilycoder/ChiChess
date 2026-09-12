import { Flex } from "antd";
import { useState } from "react";

import { Board } from "./Board";
import { BoardData } from "./BoardData";
import { MoveHistory } from "./MoveHistory";
import { BOARD_CELL_SIZE, BOARD_MARGIN } from "./utils";

function App() {
  const [boardData, setBoardData] = useState(new BoardData());

  return (
    <Flex align="stretch" gap={16}>
      <Board boardData={boardData} setBoardData={setBoardData} />
      <MoveHistory
        boardData={boardData}
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

export default App;
