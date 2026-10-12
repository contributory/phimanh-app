import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  NavigationContainer,
  DarkTheme,
  useNavigation,
} from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomeScreen from "./screens/HomeScreen";
import ListScreen from "./screens/ListScreen";
import WatchScreen from "./screens/WatchScreen";
import SearchScreen from "./screens/SearchScreen";
import RecentlyScreen from "./screens/RecentlyScreen";
import type { RootStackParamList } from "./components/Header";
import { colors } from "./lib/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 60 * 1000 },
  },
});

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function NewMoviesTab() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  React.useEffect(() => {
    navigation.navigate("List", { title: "Phim mới cập nhật", mode: "new" });
  }, [navigation]);
  return <HomeScreen />;
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // Prevent the white flash when switching tabs by painting the scene
        // container with the same background as the screens themselves.
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="NewTab"
        component={NewMoviesTab}
        options={{
          title: "Mới nhất",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RecentTab"
        component={RecentlyScreen}
        options={{
          title: "Gần đây",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" />
          {/* `contentStyle` prevents the white flash during native push/pop
              transitions on Android. */}
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="Main" component={Tabs} />
            <Stack.Screen name="List" component={ListScreen} />
            <Stack.Screen name="Watch" component={WatchScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
