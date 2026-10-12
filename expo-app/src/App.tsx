import React from "react";
import { Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  NavigationContainer,
  DarkTheme,
  useNavigation,
  RouteProp,
} from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
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
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: "Trang chủ", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏠</Text> }}
      />
      <Tab.Screen
        name="NewTab"
        component={NewMoviesTab}
        options={{ title: "Mới nhất", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>✨</Text> }}
      />
      <Tab.Screen
        name="RecentTab"
        component={RecentlyScreen}
        options={{ title: "Gần đây", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🕘</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer
          theme={{
            ...DarkTheme,
            colors: { ...DarkTheme.colors, background: colors.background, primary: colors.primary },
          }}
        >
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
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
