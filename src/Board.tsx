import type { ReactElement } from "react";

import { BOARD_CELL_SIZE, BOARD_MARGIN } from "./utils";

export function Board({ children }: { children?: React.ReactNode }) {
  const cell = BOARD_CELL_SIZE;
  const margin = BOARD_MARGIN;
  const W = cell * 8 + 2 * margin;
  const H = cell * 9 + 2 * margin;

  const leftX = margin;
  const rightX = W - margin;

  const topY = margin;
  const bottomY = H - margin;
  const riverTop = topY + cell * 4;
  const riverBottom = riverTop + cell;

  const elements: ReactElement[] = [];

  const addLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    key: string,
    strokeWidth: number,
  ) => {
    elements.push(
      <line
        key={key}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#222"
        strokeWidth={strokeWidth}
      />,
    );
  };

  for (let i = 0; i <= 9; i++) {
    const y = topY + cell * i;
    addLine(leftX, y, rightX, y, `h-${i}`, 4);
  }

  for (let i = 0; i <= 8; i++) {
    const x = margin + cell * i;

    if (i === 0 || i === 8) {
      addLine(x, topY, x, bottomY, `v-${i}`, 4);
    } else {
      addLine(x, topY, x, riverTop, `v-top-${i}`, 3);
      addLine(x, riverBottom, x, bottomY, `v-bottom-${i}`, 3);
    }
  }

  const gx1 = margin + cell * 3;
  const gx2 = margin + cell * 5;

  addLine(gx1, topY, gx2, topY + cell * 2, "palace-top-1", 3);
  addLine(gx2, topY, gx1, topY + cell * 2, "palace-top-2", 3);
  addLine(gx1, bottomY - cell * 2, gx2, bottomY, "palace-bottom-1", 3);
  addLine(gx2, bottomY - cell * 2, gx1, bottomY, "palace-bottom-2", 3);

  function drawMarker(x: number, y: number, dirs: string[], keyPrefix: string) {
    const d = 8;
    const g = 6;
    const paths: ReactElement[] = [];

    dirs.forEach((dir, index) => {
      let x0 = g + d;
      let y0 = g;
      let x1 = g;
      let y1 = g;
      let x2 = g;
      let y2 = g + d;

      if (dir[0] === "t") {
        y0 *= -1;
        y1 *= -1;
        y2 *= -1;
      }

      if (dir[1] === "l") {
        x0 *= -1;
        x1 *= -1;
        x2 *= -1;
      }

      paths.push(
        <path
          key={`${keyPrefix}-${dir}-${index}`}
          d={`M${x + x0},${y + y0} L${x + x1},${y + y1} L${x + x2},${y + y2}`}
          stroke="#222"
          strokeWidth={2.4}
          fill="none"
        />,
      );
    });

    return paths;
  }

  elements.push(
    ...drawMarker(
      leftX + cell,
      topY + cell * 2,
      ["tl", "tr", "bl", "br"],
      "bp2-left",
    ),
  );
  elements.push(
    ...drawMarker(
      rightX - cell,
      topY + cell * 2,
      ["tl", "tr", "bl", "br"],
      "bp2-right",
    ),
  );

  [0, 2, 4, 6, 8].forEach((c) => {
    const dirs: string[] = [];

    if (c === 0) {
      dirs.push("tr", "br");
    } else if (c === 8) {
      dirs.push("tl", "bl");
    } else {
      dirs.push("tl", "tr", "bl", "br");
    }

    elements.push(
      ...drawMarker(leftX + cell * c, riverTop - cell, dirs, `bp3-col-${c}`),
    );
    elements.push(
      ...drawMarker(leftX + cell * c, riverBottom + cell, dirs, `rp2-col-${c}`),
    );
  });

  elements.push(
    ...drawMarker(
      leftX + cell,
      bottomY - cell * 2,
      ["tl", "tr", "bl", "br"],
      "rp3-left",
    ),
  );
  elements.push(
    ...drawMarker(
      rightX - cell,
      bottomY - cell * 2,
      ["tl", "tr", "bl", "br"],
      "rp3-right",
    ),
  );

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <rect x="0" y="0" width={W} height={H} fill="#fff" rx="4" />
      <rect
        x={margin - 8}
        y={topY - 8}
        width={W - 2 * margin + 16}
        height={H - 2 * margin + 16}
        fill="none"
        stroke="#222"
        strokeWidth={8}
        rx="2"
      />
      {elements}
      {children}
    </svg>
  );
}
