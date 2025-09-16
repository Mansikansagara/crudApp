import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import BusinessListScreen from '../screens/BusinessListScreen';
import BusinessFormScreen from '../screens/BusinessFormScreen';
import ArticleListScreen from '../screens/ArticleListScreen';
import ArticleFormScreen from '../screens/ArticleFormScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Business Manager' }}
        />
        <Stack.Screen 
          name="BusinessList" 
          component={BusinessListScreen} 
          options={{ title: 'Businesses' }}
        />
        <Stack.Screen 
          name="BusinessForm" 
          component={BusinessFormScreen} 
          options={({ route }) => ({
            title: route.params?.business ? 'Edit Business' : 'Add Business'
          })}
        />
        <Stack.Screen 
          name="ArticleList" 
          component={ArticleListScreen} 
          options={({ route }) => ({
            title: `Articles - ${route.params?.businessName || 'All'}`
          })}
        />
        <Stack.Screen 
          name="ArticleForm" 
          component={ArticleFormScreen} 
          options={({ route }) => ({
            title: route.params?.article ? 'Edit Article' : 'Add Article'
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
