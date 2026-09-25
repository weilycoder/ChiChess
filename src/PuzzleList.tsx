import { Button, Flex, List, Typography } from "antd";

import type { Puzzle } from "./Puzzle";

export function PuzzleList({
  puzzles,
  completedIds,
  onSelect,
}: {
  puzzles: readonly Puzzle[];
  completedIds: ReadonlySet<string>;
  onSelect: (puzzle: Puzzle) => void;
}) {
  return (
    <Flex vertical gap={16} style={{ maxWidth: 720, padding: 24 }}>
      <Typography.Title level={2} style={{ margin: 0 }}>
        中国象棋谜题
      </Typography.Title>
      <List
        bordered
        dataSource={[...puzzles]}
        renderItem={(puzzle) => (
          <List.Item
            actions={[
              <Button
                key="open"
                type="primary"
                onClick={() => onSelect(puzzle)}
              >
                开始
              </Button>,
            ]}
          >
            <List.Item.Meta title={puzzle.id} description={puzzle.category} />
            {completedIds.has(puzzle.id) ? (
              <Typography.Text type="success">已完成</Typography.Text>
            ) : null}
          </List.Item>
        )}
      />
    </Flex>
  );
}
