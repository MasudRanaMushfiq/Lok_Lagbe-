import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../firebaseConfig";
import { getAuth } from "firebase/auth";

type User = {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  nid?: string;
  rating?: number;
  verified?: boolean;
  acceptedWorks?: any[];
};

type UserWithStats = User & {
  totalPosts: number;
  completedPosts: number;
  pendingPosts: number;
  appliedPosts: number;
};

export default function ShowAllUsers() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const ADMIN_UID = "rccEl7PQ48Y4lZtQpv4lj3lea8i2";

  useEffect(() => {
    fetchUsersAndStats();
  }, []);

  async function fetchUsersAndStats() {
    setLoading(true);
    try {
      const usersCol = collection(db, "users");
      const usersSnap = await getDocs(usersCol);
      const usersList: UserWithStats[] = [];

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data() as User;

        const postsQuery = query(
          collection(db, "worked"),
          where("userId", "==", userDoc.id)
        );
        const postsSnap = await getDocs(postsQuery);

        let totalPosts = postsSnap.size;
        let completedPosts = 0;
        let pendingPosts = 0;

        postsSnap.docs.forEach((postDoc) => {
          const postData = postDoc.data();
          if (postData.status === "completed") completedPosts++;
          else if (postData.status === "pending") pendingPosts++;
        });

        let appliedPosts = 0;
        if (userData.acceptedWorks && Array.isArray(userData.acceptedWorks)) {
          appliedPosts = userData.acceptedWorks.length;
        }

        usersList.push({
          id: userDoc.id,
          fullName: userData.fullName,
          email: userData.email,
          phone: userData.phone,
          nid: userData.nid,
          rating: userData.rating ?? 1,
          verified: userData.verified ?? false,
          acceptedWorks: userData.acceptedWorks,
          totalPosts,
          completedPosts,
          pendingPosts,
          appliedPosts,
        });
      }

      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users or stats:", error);
      Alert.alert("Error", "Failed to fetch users data");
    } finally {
      setLoading(false);
    }
  }

  const toggleVerified = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { verified: !currentStatus });
      Alert.alert(
        "Success",
        `User is now ${!currentStatus ? "Verified" : "Not Verified"}`
      );
      fetchUsersAndStats();
    } catch (error) {
      console.error("Error toggling verified:", error);
      Alert.alert("Error", "Failed to update verification status");
    }
  };

  const deleteUser = (userId: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this user? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "users", userId));
              Alert.alert("Deleted", "User has been deleted.");
              await fetchUsersAndStats();
            } catch (error) {
              console.error("Error deleting user:", error);
              Alert.alert("Error", "Failed to delete user");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3a125d" />
      </View>
    );
  }

  const renderItem = ({ item }: { item: UserWithStats }) => (
    <View style={styles.userCard}>
      {/* Upper section: Profile info */}
      <View style={styles.profileSection}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={styles.name}>{item.fullName || "No Name"}</Text>

          {/* Verified toggle rectangular button for admin */}
          {currentUser?.uid === ADMIN_UID && (
            <TouchableOpacity
              onPress={() => toggleVerified(item.id, item.verified ?? false)}
              style={[
                styles.toggleRect,
                item.verified ? styles.verifiedOn : styles.verifiedOff,
              ]}
              accessibilityLabel={
                item.verified ? "Verified Profile" : "Unverified Profile"
              }
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleText,
                  item.verified ? styles.textOn : styles.textOff,
                ]}
              >
                {item.verified ? "Verified" : "Not Verified"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Show verified icon for non-admin */}
          {currentUser?.uid !== ADMIN_UID &&
            (item.verified ? (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#4caf50"
                style={{ marginLeft: 8 }}
                accessibilityLabel="Verified Profile"
              />
            ) : (
              <Ionicons
                name="close-circle"
                size={20}
                color="#e53935"
                style={{ marginLeft: 8 }}
                accessibilityLabel="Unverified Profile"
              />
            ))}
        </View>

        <Text style={styles.email}>{item.email || "No Email"}</Text>
        <Text style={styles.phone}>{item.phone || "No Phone"}</Text>
        <Text style={styles.nid}>NID: {item.nid || "Not set"}</Text>

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={18} color="#fbc02d" />
          <Text style={styles.ratingText}>{item.rating?.toFixed(1) || "1.0"}</Text>
        </View>

        {/* Admin delete button */}
        {currentUser?.uid === ADMIN_UID && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => deleteUser(item.id)}
          >
            <Ionicons name="trash" size={24} color="#e63946" />
            <Text style={styles.deleteText}>Delete User</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lower section: Post stats */}
      <View style={styles.statsSection}>
        <Text style={styles.statText}>Total Posts: {item.totalPosts}</Text>
        <Text style={styles.statText}>Completed Posts: {item.completedPosts}</Text>
        <Text style={styles.statText}>Pending Posts: {item.pendingPosts}</Text>
        <Text style={styles.statText}>Applied Posts: {item.appliedPosts}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>All Users</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#3a125d",
    textAlign: "center",
  },
  userCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  profileSection: {
    backgroundColor: "#6c5ce7",
    padding: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  email: {
    fontSize: 14,
    color: "#ddd",
    marginTop: 4,
  },
  phone: {
    fontSize: 14,
    color: "#ddd",
    marginTop: 2,
  },
  nid: {
    fontSize: 14,
    color: "#ddd",
    marginTop: 2,
    fontStyle: "italic",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  ratingText: {
    marginLeft: 6,
    color: "#fbc02d",
    fontWeight: "700",
    fontSize: 16,
  },
  statsSection: {
    backgroundColor: "#eceefc",
    padding: 16,
  },
  statText: {
    fontSize: 15,
    color: "#3a125d",
    marginBottom: 6,
    fontWeight: "600",
  },
  toggleRect: {
    marginLeft: 12,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedOn: {
    backgroundColor: "#4caf50",
  },
  verifiedOff: {
    backgroundColor: "#9e9e9e",
  },
  toggleText: {
    fontWeight: "700",
    fontSize: 14,
  },
  textOn: {
    color: "#fff",
  },
  textOff: {
    color: "#eee",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 12,
  },
  deleteText: {
    color: "#e63946",
    fontWeight: "600",
  },
});
