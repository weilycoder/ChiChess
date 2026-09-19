import { useEffect, useRef } from "react";

import { type BoardData, type MoveHistoryNode } from "./BoardData";

type MoveHistoryProps = {
  boardData: BoardData;
  setBoardData?: React.Dispatch<React.SetStateAction<BoardData>>;
  startText?: string;
  height?: number;
  style?: React.CSSProperties;
};

function MoveCell({
  boardData,
  nodes,
  nodeIndex,
  currentIndex,
  setBoardData,
}: {
  boardData: BoardData;
  nodes: readonly MoveHistoryNode[];
  nodeIndex: number | null;
  currentIndex: number;
  setBoardData?: React.Dispatch<React.SetStateAction<BoardData>>;
}) {
  if (nodeIndex === null) return <div style={{ minHeight: 28 }} />;

  const node = nodes[nodeIndex];
  const parent = node.parentIndex === null ? null : nodes[node.parentIndex];
  const color = parent?.situation.turn ?? "red";
  const selected = currentIndex === nodeIndex;
  const isBlackVariation =
    color === "black" && parent?.childrenIndices[0] !== nodeIndex;

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {isBlackVariation ? (
        <span
          aria-hidden="true"
          style={{
            padding: "3px 2px 3px 0",
            color: "#8c8c8c",
            font: "15px/1.4 Arial, sans-serif",
          }}
        >
          ...
        </span>
      ) : null}
      <button
        type="button"
        data-history-index={nodeIndex}
        onClick={
          setBoardData
            ? () => {
                const newBoardData = boardData.copy();
                newBoardData.jumpToHistory(nodeIndex);
                setBoardData(newBoardData);
              }
            : undefined
        }
        style={{
          display: "block",
          width: "max-content",
          minWidth: 76,
          minHeight: 28,
          padding: "3px 6px",
          border: 0,
          borderRadius: 3,
          background: selected ? "#e6f4ff" : "transparent",
          color: color === "red" ? "#d4380d" : "#262626",
          cursor: setBoardData ? "pointer" : "default",
          font: "600 15px/1.4 Arial, PingFang SC, SimHei, sans-serif",
          textAlign: "left",
          whiteSpace: "nowrap",
        }}
      >
        {node.chineseNotation}
      </button>
    </div>
  );
}

function moveNumber(nodes: readonly MoveHistoryNode[], nodeIndex: number) {
  let number = 0;
  let currentIndex: number | null = nodeIndex;
  while (currentIndex !== null) {
    const node: MoveHistoryNode = nodes[currentIndex];
    if (
      node.parentIndex !== null &&
      nodes[node.parentIndex].situation.turn === "red"
    )
      number++;
    currentIndex = node.parentIndex;
  }
  return number;
}

function MoveRows({
  boardData,
  nodes,
  firstNodeIndex,
  currentIndex,
  setBoardData,
  depth,
}: {
  boardData: BoardData;
  nodes: readonly MoveHistoryNode[];
  firstNodeIndex: number;
  currentIndex: number;
  setBoardData?: React.Dispatch<React.SetStateAction<BoardData>>;
  depth: number;
}) {
  const rows: React.ReactNode[] = [];
  let nodeIndex: number | null = firstNodeIndex;

  while (nodeIndex !== null) {
    const node: MoveHistoryNode = nodes[nodeIndex];
    const parent: MoveHistoryNode | null =
      node.parentIndex === null ? null : nodes[node.parentIndex];
    const redNodeIndex: number | null =
      parent?.situation.turn === "red" ? nodeIndex : null;
    const blackNodeIndex: number | null =
      parent?.situation.turn === "black" ? nodeIndex : null;
    const mainBlackIndex: number | null =
      redNodeIndex !== null && nodes[redNodeIndex].childrenIndices.length > 0
        ? nodes[redNodeIndex].childrenIndices[0]
        : null;
    const rowBlackIndex: number | null = mainBlackIndex ?? blackNodeIndex;
    const rowAnchorIndex: number | null =
      rowBlackIndex ?? redNodeIndex ?? blackNodeIndex;
    if (rowAnchorIndex === null) break;

    const branches = [
      ...(redNodeIndex === null
        ? []
        : nodes[redNodeIndex].childrenIndices.slice(
            mainBlackIndex === null ? 0 : 1,
          )),
      ...(rowBlackIndex === null
        ? []
        : nodes[rowBlackIndex].childrenIndices.slice(1)),
    ];

    rows.push(
      <div key={`${depth}-${rowAnchorIndex}`}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "24px max-content max-content",
            alignItems: "center",
            gap: 2,
            padding: "2px 4px",
            width: "max-content",
            minWidth: "100%",
          }}
        >
          <span
            style={{
              color: "#8c8c8c",
              font: "12px/1.4 Arial, sans-serif",
              textAlign: "right",
            }}
          >
            {moveNumber(nodes, rowAnchorIndex)}
          </span>
          <MoveCell
            boardData={boardData}
            nodes={nodes}
            nodeIndex={redNodeIndex}
            currentIndex={currentIndex}
            setBoardData={setBoardData}
          />
          <MoveCell
            boardData={boardData}
            nodes={nodes}
            nodeIndex={rowBlackIndex}
            currentIndex={currentIndex}
            setBoardData={setBoardData}
          />
        </div>
        {branches.map((branchIndex) => (
          <div
            key={`${depth}-variation-${branchIndex}`}
            style={{
              margin: "2px 4px 2px 28px",
              paddingLeft: 8,
              borderLeft: "1px solid #bfbfbf",
            }}
          >
            <MoveRows
              boardData={boardData}
              nodes={nodes}
              firstNodeIndex={branchIndex}
              currentIndex={currentIndex}
              setBoardData={setBoardData}
              depth={depth + 1}
            />
          </div>
        ))}
      </div>,
    );

    nodeIndex = nodes[rowAnchorIndex].childrenIndices[0] ?? null;
  }

  return rows;
}

export function MoveHistory({
  boardData,
  setBoardData,
  startText,
  height,
  style,
}: MoveHistoryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { index: currentIndex, nodes } = boardData.getHistory();
  const rootChildren = nodes[0].childrenIndices;
  const firstNodeIndex = rootChildren[0];

  const startButton = (
    <button
      type="button"
      data-history-index={0}
      onClick={
        setBoardData
          ? () => {
              const newBoardData = boardData.copy();
              newBoardData.jumpToHistory(0);
              setBoardData(newBoardData);
            }
          : undefined
      }
      style={{
        display: "block",
        minHeight: 28,
        padding: "3px 6px",
        border: 0,
        borderRadius: 3,
        background: currentIndex === 0 ? "#e6f4ff" : "transparent",
        color: "#595959",
        cursor: setBoardData ? "pointer" : "default",
        font: "600 15px/1.4 Arial, PingFang SC, SimHei, sans-serif",
        textAlign: "left",
        whiteSpace: "nowrap",
      }}
    >
      {startText || "Start"}
    </button>
  );

  useEffect(() => {
    const selected = containerRef.current?.querySelector(
      `[data-history-index="${currentIndex}"]`,
    );
    selected?.scrollIntoView({ block: "nearest" });
  }, [boardData, currentIndex]);

  return (
    <div
      ref={containerRef}
      style={{
        height,
        overflowY: "auto",
        overflowX: "auto",
        background: "#fff",
        color: "#262626",
        ...style,
      }}
    >
      <div style={{ padding: "2px 4px" }}>{startButton}</div>
      {firstNodeIndex !== undefined ? (
        <>
          <MoveRows
            boardData={boardData}
            nodes={nodes}
            firstNodeIndex={firstNodeIndex}
            currentIndex={currentIndex}
            setBoardData={setBoardData}
            depth={0}
          />
          {rootChildren.slice(1).map((variationIndex) => (
            <div
              key={`root-variation-${variationIndex}`}
              style={{
                margin: "2px 4px 2px 28px",
                paddingLeft: 8,
                borderLeft: "1px solid #bfbfbf",
              }}
            >
              <MoveRows
                boardData={boardData}
                nodes={nodes}
                firstNodeIndex={variationIndex}
                currentIndex={currentIndex}
                setBoardData={setBoardData}
                depth={1}
              />
            </div>
          ))}
        </>
      ) : null}
    </div>
  );
}
