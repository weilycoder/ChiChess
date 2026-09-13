import { Listy, Typography, Card, type ListyRef } from "antd";
import { useRef, useEffect } from "react";

import { type BoardData } from "./BoardData";
import { numberNotation } from "./utils";

function getNotationColor(chineseNotation: string): "red" | "black" {
  return numberNotation.black.some((num) => chineseNotation.includes(num))
    ? "black"
    : "red";
}

export function MoveHistory({
  boardData,
  setBoardData,
  startText,
  height,
  style,
}: {
  boardData: BoardData;
  setBoardData?: React.Dispatch<React.SetStateAction<BoardData>>;
  startText?: string;
  height?: number;
  style?: React.CSSProperties;
}) {
  const listyRef = useRef<ListyRef>(null);

  const { index: currentIndex, items: moves } = boardData.getHistory();
  const items = moves.map((move, index) => {
    return {
      id: index,
      content: move.chineseNotation || startText || "Start",
      color: move.chineseNotation
        ? getNotationColor(move.chineseNotation)
        : "brown",
    };
  });

  useEffect(() => {
    listyRef.current?.scrollTo({ key: currentIndex, align: "auto" });
  }, [boardData, listyRef, currentIndex]);

  return (
    <Listy
      items={items}
      ref={listyRef}
      rowKey="id"
      height={height}
      virtual
      style={style}
      itemRender={(item) => (
        <Card
          size="small"
          variant="outlined"
          hoverable
          style={{
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: currentIndex === item.id ? "#e6f7ff" : undefined,
          }}
          onClick={
            setBoardData
              ? () => {
                  const newBoardData = boardData.copy();
                  newBoardData.jumpToHistory(item.id);
                  setBoardData(newBoardData);
                }
              : undefined
          }
        >
          <Typography
            style={{
              color: item.color,
              fontWeight: 600,
              fontFamily: "Arial, PingFang SC, SimHei, sans-serif",
            }}
          >
            {item.content}
          </Typography>
        </Card>
      )}
    ></Listy>
  );
}
