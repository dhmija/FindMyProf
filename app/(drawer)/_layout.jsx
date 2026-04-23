import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from "@react-navigation/drawer";
import { useAuth } from "../../context/AuthContext";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

function CustomDrawerContent(props) {
  const { logout } = useAuth();
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
        <DrawerItem label="Logout" onPress={handleLogout} />
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  const { role } = useAuth();

  return (
    <Drawer screenOptions={{ headerShown: true }} drawerContent={(props) => <CustomDrawerContent {...props} />}>
      {/* Render both homes but hide the irrelevant one visually from the drawer based on role */}
      <Drawer.Screen 
        name="student/home" 
        options={{ 
          drawerLabel: 'Home', 
          headerTitle: 'Student Home',
          drawerItemStyle: { display: role === 'student' ? 'flex' : 'none' } 
        }} 
      />
      <Drawer.Screen 
        name="faculty/home" 
        options={{ 
          drawerLabel: 'Home', 
          headerTitle: 'Faculty Home',
          drawerItemStyle: { display: role === 'faculty' ? 'flex' : 'none' } 
        }} 
      />
      <Drawer.Screen 
        name="directory/index" 
        options={{ 
          drawerLabel: 'Directory',
          headerTitle: 'Faculty Directory'
        }} 
      />
      <Drawer.Screen 
        name="directory/[id]" 
        options={{ 
          drawerLabel: 'Directory Details', 
          drawerItemStyle: { display: 'none' } // Hide dynamic route from drawer tab list
        }} 
      />
      <Drawer.Screen 
        name="messages/index" 
        options={{ 
          drawerLabel: 'Messages',
          headerTitle: 'Messages'
        }} 
      />
      <Drawer.Screen 
        name="office-hours/index" 
        options={{ 
          drawerLabel: 'Office Hours',
          headerTitle: 'Office Hours'
        }} 
      />
      <Drawer.Screen 
        name="faculty/profile" 
        options={{ 
          drawerLabel: 'My Profile', 
          headerTitle: 'My Profile',
          drawerItemStyle: { display: role === 'faculty' ? 'flex' : 'none' } 
        }} 
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  logoutContainer: {
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  }
});
