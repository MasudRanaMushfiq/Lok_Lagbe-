import { Text, View, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  const handleStart = () => {
    router.replace("/auth/login"); // Navigate to login page
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/icon.png")} // Make sure icon.png is inside the assets folder
        style={styles.icon}
        resizeMode="contain"
      />
      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Let&apos;s Start</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff", // White background
  },
  icon: {
    width: 350,
    height: 350,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#19A7CE",
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
});
