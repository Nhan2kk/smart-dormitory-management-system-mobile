import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../features/auth/AuthProvider";
import { colors } from "../shared/theme";

export default function LoginScreen() {
  const { signIn, user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!username.trim() || !password) {
      setError("Vui lòng nhập MSSV và mật khẩu.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await signIn(username, password);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Đăng nhập không thành công.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (user) return <Redirect href="/(tabs)" />;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={colors.navy} />
          </Pressable>
          <ImageBackground
            source={require("../../assets/dormitory-hero.png")}
            style={styles.image}
            imageStyle={{ borderRadius: 25 }}
          >
            <View style={styles.imageShade} />
            <Image
              source={require("../../assets/brand-logo.png")}
              style={{ width: 32, height: 32 }}
              resizeMode="contain"
            />
            <Text style={styles.imageText}>Chào mừng trở về KTX DN</Text>
          </ImageBackground>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>
            Nhập tài khoản sinh viên để tiếp tục
          </Text>
          <Text style={styles.label}>Mã số sinh viên</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={20} color={colors.muted} />
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Nhập MSSV"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              returnKeyType="next"
              accessibilityLabel="Mã số sinh viên"
            />
          </View>
          <Text style={styles.label}>Mật khẩu</Text>
          <View style={styles.inputWrap}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.muted}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Nhập mật khẩu"
              secureTextEntry={!visible}
              style={styles.input}
              accessibilityLabel="Mật khẩu"
              onSubmitEditing={submit}
            />
            <Pressable
              onPress={() => setVisible(!visible)}
              accessibilityLabel={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              <Ionicons
                name={visible ? "eye-off-outline" : "eye-outline"}
                size={21}
                color={colors.muted}
              />
            </Pressable>
          </View>
          {!!error && (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          )}
          <Pressable
            style={[styles.submit, submitting && { opacity: 0.65 }]}
            onPress={submit}
            disabled={submitting}
            accessibilityRole="button"
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.submitText}>Đăng nhập</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "white" },
  content: { flexGrow: 1, padding: 25 },
  back: { width: 40, height: 40, justifyContent: "center", marginBottom: 10 },
  image: {
    height: 205,
    padding: 22,
    justifyContent: "flex-end",
    overflow: "hidden",
    borderRadius: 25,
  },
  imageShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,38,85,0.30)",
  },
  imageText: { color: "white", fontWeight: "800", fontSize: 19, marginTop: 7 },
  title: { fontSize: 30, fontWeight: "800", color: colors.navy, marginTop: 30 },
  subtitle: { color: colors.muted, marginTop: 5, marginBottom: 20 },
  label: {
    color: colors.navy,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 16,
  },
  inputWrap: {
    height: 55,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    gap: 12,
  },
  input: { flex: 1, fontSize: 15, color: colors.navy },
  error: { color: "#C62828", marginTop: 16, lineHeight: 19 },
  submit: {
    marginTop: 28,
    height: 55,
    backgroundColor: "#064684",
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  submitText: { color: "white", fontWeight: "700", fontSize: 16 },
});
