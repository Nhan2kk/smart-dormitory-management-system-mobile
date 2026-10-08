import { useIsFocused } from "expo-router";
import { StatusBar } from "expo-status-bar";

/** Chữ thanh trạng thái màu trắng khi màn hình đang hiển thị (dùng cho màn có ảnh tràn lên trên). */
export function LightStatusBar() {
  const focused = useIsFocused();
  return focused ? <StatusBar style="light" /> : null;
}
