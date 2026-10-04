import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../features/auth/AuthProvider";

export default function Index() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator color="#07569B" />
      </View>
    );
  return <Redirect href={user ? "/(tabs)" : "/welcome"} />;
}
