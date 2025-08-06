import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login"); // Navigate to login after 2 sec
    }, 2000);

    return () => clearTimeout(timer); // Clean up if component unmounts
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#19A7CE",
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff" }}>
        Welcome to Lok Lagbe!
      </Text>
      <Text style={{ fontSize: 16, color: "#fff", marginTop: 10 }}>
        Redirecting to login...
      </Text>
    </View>
  );
}
