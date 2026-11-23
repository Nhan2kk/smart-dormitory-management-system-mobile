import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Photos } from "../images";
import { GlassLevel, useTheme, withAlpha } from "../theme";
import { Gradient } from "./Gradient";

const BLUR: Record<GlassLevel, number> = { soft: 40, medium: 28, clear: 16 };
const TINT: Record<GlassLevel, number> = {
  soft: 0.55,
  medium: 0.38,
  clear: 0.22,
};

/**
 * Nền phía sau nội dung màn hình.
 * - Chế độ kính: ảnh nền người dùng chọn làm mờ toàn màn hình, phủ một lớp màu nền theo độ trong.
 * - Mặc định: ảnh khuôn viên mờ nhạt ở đầu màn hình, nhạt dần vào màu nền (tắt bằng `ambient={false}`).
 */
export function Backdrop({ ambient = false }: { ambient?: boolean }) {
  const { colors, isDark, glass, glassLevel, wallpaper } = useTheme();
  if (glass)
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={Photos.wallpaper(wallpaper)}
          placeholder={Photos.placeholder}
          blurRadius={BLUR[glassLevel]}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: withAlpha(
                colors.background,
                TINT[glassLevel] + (isDark ? 0.2 : 0),
              ),
            },
          ]}
        />
      </View>
    );
  if (!ambient) return null;
  return (
    <View style={styles.ambient} pointerEvents="none">
      <Image
        source={Photos.campusSunset(600)}
        blurRadius={40}
        contentFit="cover"
        style={[StyleSheet.absoluteFill, { opacity: isDark ? 0.45 : 0.22 }]}
      />
      <Gradient
        colors={[withAlpha(colors.background, 0.1), colors.background]}
        direction="vertical"
        eased
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ambient: { position: "absolute", top: 0, left: 0, right: 0, height: 360 },
});
