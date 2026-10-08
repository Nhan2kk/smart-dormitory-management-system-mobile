import { useMemo } from "react";
import Svg, { Rect } from "react-native-svg";


/**
 * Mã QR minh hoạ (không mã hoá dữ liệu thật) — sinh ma trận giả ngẫu nhiên ổn định theo `seed`.
 * Khi nối API sẽ thay bằng ảnh QR từ cổng thanh toán.
 */
export class MockQrMatrix {
  static create(seed: string, size = 29): boolean[][] {
    let state = Array.from(seed).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
    const random = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 2 ** 32;
    };
    const matrix = Array.from({ length: size }, () => Array.from({ length: size }, () => random() > 0.52));
    const finder = (row: number, col: number) => {
      for (let r = 0; r < 7; r += 1)
        for (let c = 0; c < 7; c += 1) {
          const edge = r === 0 || r === 6 || c === 0 || c === 6;
          const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          matrix[row + r][col + c] = edge || core;
        }
      for (let i = -1; i <= 7; i += 1)
        for (const [r, c] of [
          [row - 1, col + i],
          [row + 7, col + i],
          [row + i, col - 1],
          [row + i, col + 7],
        ])
          if (matrix[r]?.[c] !== undefined) matrix[r][c] = false;
    };
    finder(0, 0);
    finder(0, size - 7);
    finder(size - 7, 0);
    return matrix;
  }
}

export function QrCode({ seed, size = 196 }: { seed: string; size?: number }) {
  const matrix = useMemo(() => MockQrMatrix.create(seed), [seed]);
  const cell = size / matrix.length;
  return (
    <Svg width={size} height={size} accessibilityLabel="Mã QR thanh toán">
      <Rect width={size} height={size} fill="#FFFFFF" />
      {matrix.flatMap((row, r) =>
        row.map((on, c) =>
          on ? (
            <Rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell + 0.4} height={cell + 0.4} rx={cell * 0.2} fill="#1F1B17" />
          ) : null,
        ),
      )}
    </Svg>
  );
}
