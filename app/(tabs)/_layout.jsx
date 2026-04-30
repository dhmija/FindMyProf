import React, { useState } from 'react';
import { Tabs, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { TouchableOpacity, View } from "react-native";
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AuthGateSheet from "../../components/AuthGateSheet";

export default function TabsLayout() {
  const { user } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [authSheetVisible, setAuthSheetVisible] = useState(false);
  const [authSheetMessage, setAuthSheetMessage] = useState("");
  const [pendingRoute, setPendingRoute] = useState(null);

  const handleProtectedTab = (e, routeName, message) => {
    if (!user) {
      e.preventDefault();
      setAuthSheetMessage(message);
      setPendingRoute(routeName);
      setAuthSheetVisible(true);
    }
  };

  const executePending = () => {
    if (pendingRoute) {
      router.push(pendingRoute);
    }
    setAuthSheetVisible(false);
    setPendingRoute(null);
  };

  const ThemeToggle = () => (
    <TouchableOpacity
      onPress={toggleTheme}
      style={{ marginRight: 16, padding: 4 }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Feather
        name={isDark ? 'sun' : 'moon'}
        size={18}
        color={colors.textMuted}
      />
    </TouchableOpacity>
  );

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleStyle: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.text,
          },
          headerRight: () => <ThemeToggle />,
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            elevation: 0,
            height: 60 + insets.bottom,
            paddingBottom: 8 + insets.bottom,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          }
        }}
      >
        <Tabs.Screen 
          name="directory/index" 
          options={{
            title: 'Directory',
            tabBarIcon: ({ color }) => <Feather name="grid" size={20} color={color} />
          }} 
        />
        <Tabs.Screen 
          name="directory/[id]" 
          options={{
            title: 'Directory Details',
            href: null,
          }} 
        />
        <Tabs.Screen 
          name="messages/index" 
          options={{
            title: 'Messages',
            tabBarIcon: ({ color }) => <Feather name="message-square" size={20} color={color} />
          }}
          listeners={{
            tabPress: (e) => handleProtectedTab(e, '/messages', 'Login required to view your messages.')
          }}
        />
        <Tabs.Screen 
          name="messages/[chatId]" 
          options={{
            title: 'Direct Message',
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen 
          name="office-hours/index" 
          options={{
            title: 'Office Hours',
            tabBarIcon: ({ color }) => <Feather name="calendar" size={20} color={color} />
          }}
          listeners={{
            tabPress: (e) => handleProtectedTab(e, '/office-hours', 'Login required to manage office hours.')
          }}
        />
        <Tabs.Screen 
          name="profile" 
          options={{
            title: user ? 'Profile' : 'Login',
            headerTitle: user ? 'My Profile' : 'Login Required',
            tabBarIcon: ({ color }) => (
               <Feather name={user ? "user" : "log-in"} size={20} color={color} />
            )
          }}
          listeners={{
            tabPress: (e) => {
               if (!user) {
                 e.preventDefault();
                 router.push('/auth/login');
               }
            }
          }}
        />
      </Tabs>
      
      {/* Global Auth Gate Sheet for Tabs */}
      <AuthGateSheet 
        visible={authSheetVisible}
        onClose={() => setAuthSheetVisible(false)}
        actionMessage={authSheetMessage}
        returnTo={pendingRoute}
      />
    </>
  );
}
