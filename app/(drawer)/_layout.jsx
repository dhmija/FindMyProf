import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from "@react-navigation/drawer";
import { useAuth } from "../../context/AuthContext";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

function CustomDrawerContent(props) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/auth/login");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      <View style={styles.logoutContainer}>
        {user ? (
           <DrawerItem label="Logout" onPress={handleLogout} />
        ) : (
           <DrawerItem label="Login or Sign Up" onPress={() => router.push("/auth/login")} />
        )}
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  const { user, role } = useAuth();

  return (
    <Drawer 
      screenOptions={{ 
        headerShown: true,
        drawerActiveBackgroundColor: 'transparent',
        drawerActiveTintColor: '#111',
        drawerInactiveTintColor: '#666',
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: '500',
        },
        headerStyle: {
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontSize: 16,
          fontWeight: '700',
          color: '#111',
        }
      }} 
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen 
        name="directory/index" 
        options={{ 
          drawerLabel: 'Faculty Directory',
          headerTitle: 'Directory'
        }} 
      />
      <Drawer.Screen 
        name="student/home" 
        options={{ 
          drawerLabel: 'My Dashboard', 
          headerTitle: 'Dashboard',
          drawerItemStyle: { display: user && role === 'student' ? 'flex' : 'none' } 
        }} 
      />
      <Drawer.Screen 
        name="faculty/home" 
        options={{ 
          drawerLabel: 'My Dashboard', 
          headerTitle: 'Dashboard',
          drawerItemStyle: { display: user && role === 'faculty' ? 'flex' : 'none' } 
        }} 
      />
      <Drawer.Screen 
        name="directory/[id]" 
        options={{ 
          drawerLabel: 'Directory Details', 
          drawerItemStyle: { display: 'none' } 
        }} 
      />
      <Drawer.Screen 
        name="messages/index" 
        options={{ 
          drawerLabel: 'Messages',
          headerTitle: 'Messages',
          drawerItemStyle: { display: user ? 'flex' : 'none' }
        }} 
      />
      <Drawer.Screen 
        name="office-hours/index" 
        options={{ 
          drawerLabel: 'Office Hours',
          headerTitle: 'Office Hours',
          drawerItemStyle: { display: user ? 'flex' : 'none' }
        }} 
      />
      <Drawer.Screen 
        name="faculty/profile" 
        options={{ 
          drawerLabel: 'My Profile', 
          headerTitle: 'My Profile',
          drawerItemStyle: { display: user && role === 'faculty' ? 'flex' : 'none' } 
        }} 
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  logoutContainer: {
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  }
});
