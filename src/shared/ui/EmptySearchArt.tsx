import { View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";

/**
 * Minh hoạ "không tìm thấy kết quả": tài liệu trống và kính lúp. Toàn bộ nét và nền nhạt dùng một màu
 * (truyền từ theme) nên tự đổi theo chủ đề và chế độ sáng/tối.
 */
export function EmptySearchArt({ color, width = 168 }: { color: string; width?: number }) {
  return (
    // Hình trang trí: ẩn khỏi trình đọc màn hình (tiêu đề bên dưới đã nói đủ ý).
    <View aria-hidden>
    <Svg width={width} height={(width * 200) / 240} viewBox="0 0 240 200" fill="none">
      <G stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M38 157c17-14 38-18 57-11 16-22 46-29 70-16 17-9 37-5 49 8" opacity={0.16} />
        <Path d="M82 37h56l25 25v71a9 9 0 0 1-9 9H82a9 9 0 0 1-9-9V46a9 9 0 0 1 9-9Z" fill={color} fillOpacity={0.07} />
        <Path d="M138 38v20a5 5 0 0 0 5 5h20" opacity={0.55} />
        <Path d="M94 82h43M94 98h32M94 114h23" opacity={0.35} />
        <Circle cx={145} cy={112} r={31} fill={color} fillOpacity={0.1} />
        <Path d="M167 134l25 25" strokeWidth={9} />
        <Circle cx={145} cy={112} r={21} />
        <Path d="M49 66v15M41.5 73.5h15M190 45v11M184.5 50.5h11" opacity={0.55} />
        <Circle cx={54} cy={126} r={3} fill={color} stroke="none" opacity={0.45} />
        <Circle cx={204} cy={100} r={4} fill={color} stroke="none" opacity={0.35} />
      </G>
    </Svg>
    </View>
  );
}
