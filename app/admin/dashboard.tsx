import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebaseConfig"; // adjust path if needed
import { router } from "expo-router";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    approvedPosts: 0,
    pendingPosts: 0,
    completedPosts: 0,
    totalComplaints: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const totalUsers = usersSnap.size;

        const workedSnap = await getDocs(collection(db, "worked"));
        const totalPosts = workedSnap.size;

        const approvedSnap = await getDocs(
          query(collection(db, "worked"), where("status", "==", "active"))
        );
        const approvedPosts = approvedSnap.size;

        const pendingSnap = await getDocs(
          query(collection(db, "worked"), where("status", "==", "pending"))
        );
        const pendingPosts = pendingSnap.size;

        const completedSnap = await getDocs(
          query(collection(db, "worked"), where("status", "==", "completed"))
        );
        const completedPosts = completedSnap.size;

        const complaintsSnap = await getDocs(collection(db, "notifications"));
        const totalComplaints = complaintsSnap.size;

        setStats({
          totalUsers,
          totalPosts,
          approvedPosts,
          pendingPosts,
          completedPosts,
          totalComplaints,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3a125d" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Admin Dashboard</Text>

      <View style={styles.grid}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: "#6c5ce7" }]}
          onPress={() => router.push("/alluser")}
          activeOpacity={0.7}
        >
          <Ionicons name="people" size={26} color="#fff" />
          <Text style={styles.number}>{stats.totalUsers}</Text>
          <Text style={styles.title}>All Users</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: "#00b894" }]}
          onPress={() => router.push("/screen/allpost")}
          activeOpacity={0.7}
        >
          <Ionicons name="document-text" size={26} color="#fff" />
          <Text style={styles.number}>{stats.totalPosts}</Text>
          <Text style={styles.title}> All Posts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: "#0984e3" }]}
          onPress={() => router.push("/screen/activepost")}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-circle" size={26} color="#fff" />
          <Text style={styles.number}>{stats.approvedPosts}</Text>
          <Text style={styles.title}>Active Post</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: "#fdcb6e" }]}
          onPress={() => router.push("/screen/pendingpost")}
          activeOpacity={0.7}
        >
          <Ionicons name="time" size={26} color="#fff" />
          <Text style={styles.number}>{stats.pendingPosts}</Text>
          <Text style={styles.title}>Pending</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: "#00cec9" }]}
          onPress={() => router.push("/screen/completedpost")}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-done" size={26} color="#fff" />
          <Text style={styles.number}>{stats.completedPosts}</Text>
          <Text style={styles.title}>Completed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: "#d63031" }]}
          onPress={() => router.push("/screen/pendingpost")}
          activeOpacity={0.7}
        >
          <Ionicons name="alert-circle" size={26} color="#fff" />
          <Text style={styles.number}>{stats.totalComplaints}</Text>
          <Text style={styles.title}>Complaints</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: "#f9f9f9",
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3a125d",
    marginBottom: 15,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "31%",
    borderRadius: 10,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    marginBottom: 12,
  },
  number: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginVertical: 4,
  },
  title: {
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
  },
});
