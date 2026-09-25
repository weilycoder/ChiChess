# ChiChess

ChiChess 是一个基于 React、TypeScript 和 Vite 的静态中国象棋谜题网站。

## 当前能力

- 使用 SVG 棋盘进行中国象棋走子和合法性校验。
- 支持 FEN 局面、中文棋谱和分支走法历史。
- 题目数据位于 `public/puzzles.json` 在运行时请求。
- 使用 Zod 校验五字段 Puzzle 数据：`schemaVersion`、`id`、`category`、`initialFen`、`steps`。
- 支持错误走法进入历史分支、正确主线提升和黑方自动应手。
- 题库使用 Hash 导航：`#puzzle/<id>`。

## 题目数据

题目数据位于 [src/puzzles.json](src/puzzles.json)，以下是一个示例题目：

```json
{
  "schemaVersion": 1,
  "id": "test-001",
  "category": "兵三进一",
  "initialFen": "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w",
  "steps": "g3g4 h7g7"
}
```

`steps` 是使用空白分隔的四字符走法字符串。每个走法依次表示起点列、起点行、终点列、终点行：

- 列从红方视角左到右使用 `a-i`。
- 行从红方视角下到上使用 `0-9`。
- `initialFen` 保留当前先手信息，不额外使用 `playerColor`。
- 例如 `c3c4` 转换为内部坐标 `{ from: { col: 2, row: 6 }, to: { col: 2, row: 5 } }`。
- 初版每个局面只有一条标准走法，不支持多解。

`src/BoardData.ts` 中的 `parseMoves()` 负责坐标转换，`src/Puzzle.ts` 中的 `PuzzleSchema` 负责数据校验。

## 项目结构

- `src/App.tsx`：题库加载、Hash 导航和完成状态。
- `src/PuzzleList.tsx`：题库列表。
- `src/PuzzleGame.tsx`：解题进度、反馈、自动应手和重置。
- `src/BoardData.ts`：棋盘规则、FEN、走法历史和主变例。
- `src/Board.tsx`：棋盘交互与动画。
- `src/Game.tsx`：棋盘和走法历史布局。
- `src/MoveHistory.tsx`：可自由跳转的走法历史。
- `src/Puzzle.ts`：Zod 数据 schema 和题库加载。

## 下一步计划

1. 增加更明确的解题进度显示、提示功能和下一题操作。
2. 完善多题场景下的完成状态和题目详情信息。
3. 补充谜题控制器、错误分支、主变例提升和自动应手的聚焦测试。
4. 完成桌面端和移动端响应式布局验收。
5. 更新页面标题和基础元信息，完善静态部署验收。
