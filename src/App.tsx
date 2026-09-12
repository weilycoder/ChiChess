import { useState } from "react";

import { Board } from "./Board";
import { BoardData } from "./BoardData";

function App() {
  const [boardData, setBoardData] = useState(new BoardData());

  return <Board boardData={boardData} setBoardData={setBoardData} />;
}

export default App;
