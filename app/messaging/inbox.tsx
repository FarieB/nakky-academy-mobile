import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import API from "../../src/services/api";

export default function InboxScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<any>({});

  // ==========================
  // Load Inbox Conversations
  // ==========================
  const loadInbox = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const user = JSON.parse(
        (await AsyncStorage.getItem("user")) || "{}"
      );

      if (!token) return;

      API.defaults.headers.common.Authorization = `Bearer ${token}`;
      const res = await API.get("/messages");
      const unique: any = {};

      res.data.forEach((msg: any) => {
        const other =
          msg.sender._id === user._id
            ? msg.receiver
            : msg.sender;

        unique[other._id] = {
          ...other,
          lastMessage: msg.message,
          lastDate: msg.createdAt,
        };
      });

      setConversations(Object.values(unique));
    } catch (err: any) {
      console.log(
        "INBOX ERROR",
        err?.response?.data || err.message
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================
  // Fetch Unread Counts
  // ==========================
  const fetchUnreadCounts = async () => {
    try {
      const res = await API.get("/messages/unread/counts");
      const map: any = {};

      res.data.forEach((item: any) => {
        map[item._id] = item.unreadCount;
      });

      setUnreadCounts(map);
    } catch (err: any) {
      console.log("FETCH COUNTS ERROR:", err.message);
    }
  };

  // ==========================
  // Lifecycle Hook
  // ==========================
  useFocusEffect(
    useCallback(() => {
      loadInbox();
      fetchUnreadCounts();
    }, [])
  );

  const filtered = conversations.filter((c: any) =>
    (c.firstName || c.name)
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

   return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Messages
      </Text>

      <TextInput
        placeholder="Search conversations..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item: any) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadInbox();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No conversations yet
            </Text>
          </View>
        }
        renderItem={({ item }: any) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: `/messaging/${item._id}`,
                params: {
                  name: item.firstName || item.name,
                },
              })
            }
          >
            <Image
              source={{
                uri: item.profilePhoto || "https://via.placeholder.com/100",
              }}
              style={styles.avatar}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {item.firstName || item.name}
              </Text>

              {/* Updated Layout Row containing Last Message & Unread Badges */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 5,
                }}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.message, { flex: 1 }]}
                >
                  {item.lastMessage}
                </Text>

                {unreadCounts[item._id] > 0 && (
                  <View
                    style={{
                      backgroundColor: "#E91E63",
                      minWidth: 22,
                      height: 22,
                      borderRadius: 11,
                      justifyContent: "center",
                      alignItems: "center",
                      paddingHorizontal: 6,
                      marginLeft: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: 12,
                      }}
                    >
                      {unreadCounts[item._id]}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.rightSide}>
              <View style={styles.online} />

              <Text style={styles.time}>
                {item.lastDate
                  ? new Date(item.lastDate).toLocaleDateString()
                  : ""}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
 
const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:"#F5F7FA",
    padding:20
  },

  center:{
    flex:1,
    justifyContent:"center",
    alignItems:"center"
  },

  title:{
    fontSize:28,
    fontWeight:"bold",
    marginBottom:20
  },

  search:{
    backgroundColor:"#fff",
    borderRadius:12,
    padding:14,
    marginBottom:20,
    fontSize:16
  },

  card:{
    backgroundColor:"#fff",
    padding:15,
    borderRadius:15,
    flexDirection:"row",
    alignItems:"center",
    marginBottom:12,

    shadowColor:"#000",
    shadowOpacity:0.05,
    shadowRadius:5,

    elevation:2
  },

  avatar:{
    width:60,
    height:60,
    borderRadius:30,
    marginRight:15
  },

  name:{
    fontSize:17,
    fontWeight:"700"
  },

  message:{
    color:"#777",
    marginTop:5
  },

  rightSide:{
    alignItems:"flex-end"
  },

  online:{
    width:12,
    height:12,
    borderRadius:6,
    backgroundColor:"#2ECC71",
    marginBottom:8
  },

  time:{
    color:"#999",
    fontSize:12
  },

  empty:{
    marginTop:80,
    alignItems:"center"
  },

  emptyText:{
    color:"#999",
    fontSize:16
  }

});