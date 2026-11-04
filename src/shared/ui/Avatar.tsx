import { Image } from "expo-image";
import { useState } from "react";
import { Text, View } from "react-native";
import { useTheme } from "../theme";

/** Ảnh đại diện: ảnh người dùng chọn, hoặc chữ cái đầu khi chưa có ảnh. */
export function Avatar({
  initials,
  uri,
  size = 48,
  ring = true,
}: {
  initials: string;
  uri?: string | null;
  size?: number;
  ring?: boolean;
}) {
  const { colors } = useTheme();
  // Ảnh tải lỗi (bị xoá, mất mạng) thì quay về chữ cái đầu thay vì ô trống.
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = !!uri && failedUri !== uri;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primarySoft,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
        ring && { borderWidth: 3, borderColor: colors.surface },
      ]}
      accessibilityLabel={initials}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={200}
          onError={() => setFailedUri(uri)}
        />
      ) : (
        <Text
          style={{
            color: colors.primary,
            fontWeight: "800",
            fontSize: size * 0.36,
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}
