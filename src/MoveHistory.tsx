import { Listy, Typography } from "antd";

import { type BoardData } from "./BoardData";
import { numberNotation } from "./utils";

function getNotationColor(chineseNotation: string): "red" | "black" {
  return numberNotation.black.some((num) => chineseNotation.includes(num))
    ? "black"
    : "red";
}

export function MoveHistory({
  boardData,
  startText,
  height,
  style,
}: {
  boardData: BoardData;
  startText?: string;
  height?: number;
  style?: React.CSSProperties;
}) {
  const { items: moves } = boardData.getHistory();
  const items = moves.map((move, index) => {
    return {
      id: index,
      content: move.chineseNotation || startText || "Start",
      color: move.chineseNotation
        ? getNotationColor(move.chineseNotation)
        : "brown",
    };
  });

  return (
    <Listy
      items={items}
      rowKey="id"
      height={height}
      virtual
      style={style}
      itemRender={(item) => (
        <Typography style={{ color: item.color, cursor: "pointer" }}>
          {item.content}
        </Typography>
      )}
    ></Listy>
  );
}
