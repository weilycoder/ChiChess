import { useState } from "react";

import { BoardData } from "./BoardData";
import { Game } from "./Game";

function App() {
  const [boardData, setBoardData] = useState(new BoardData());

  return <Game boardData={boardData} setBoardData={setBoardData} />;
}

export default App;
