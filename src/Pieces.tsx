import { PIECE_SIZE, pieces_name } from "./utils";

export function NoPiece({
  onClick,
}: {
  onClick?: React.MouseEventHandler<SVGSVGElement>;
}) {
  const size = PIECE_SIZE;
  const r = size * 0.45;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <circle cx={cx} cy={cy} r={r} fill="rgba(0, 0, 0, 0)" stroke="none" />
    </svg>
  );
}

export function Piece({
  name,
  color,
  onClick,
  selected,
  style,
}: {
  name: keyof typeof pieces_name;
  color: "red" | "black";
  onClick?: React.MouseEventHandler<SVGSVGElement>;
  selected?: boolean;
  style?: React.CSSProperties;
}) {
  const size = PIECE_SIZE;
  const r = size * 0.45;
  const cx = size / 2;
  const cy = size / 2;
  const strokeColor = color === "black" ? "#222" : "#c0392b";
  const textName = pieces_name[name][color];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default", ...style }}
    >
      <defs>
        <radialGradient id={`grad-${name}-${color}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#e8e5e0" />
          <stop offset="60%" stopColor="#d0cdc8" />
          <stop offset="100%" stopColor="#b8b5b0" />
        </radialGradient>
      </defs>
      {selected && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 6}
          fill="none"
          stroke="#f1c40f"
          strokeWidth="4"
          opacity="0.9"
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={`url(#grad-${name}-${color})`}
        stroke={strokeColor}
        strokeWidth="5"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r - 3.5}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
      />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="KaiTi, STKaiti, SimKai, Songti SC"
        fontWeight="bold"
        fontSize={size * 0.45}
        fill={strokeColor}
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
        }}
      >
        {textName}
      </text>
    </svg>
  );
}
