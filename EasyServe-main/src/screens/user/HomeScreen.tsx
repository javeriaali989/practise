// ============================================
// screens/user/HomeScreen.tsx - UX POLISHED (LOGIC UNCHANGED)
// ============================================

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { authService } from '../../services/authService';
import { categoryService } from '../../services/categoryService';
import { Category } from '../../types';
import { logger } from '../../utils/logger';

const TAG = 'HomeScreen';
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

export default function HomeScreen({ navigation }: any) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadData();
    return () => {
      setCategories([]);
    };
  }, []);

  const loadData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setUserName(user.name.split(' ')[0]);
        logger.info(TAG, `Loaded user: ${user.name}`);
      }

      const data = await categoryService.getAll();
      setCategories(data);
      logger.info(TAG, `Loaded ${data.length} categories`);
    } catch (error) {
      logger.error(TAG, 'Error loading data', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await authService.logout();
            logger.info(TAG, 'Logged out successfully');
            navigation.replace('Login');
          } catch (error) {
            logger.error(TAG, 'Logout failed', error);
            Alert.alert('Error', 'Logout failed. Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {userName}! 👋</Text>
          <Text style={styles.subtitle}>What service do you need?</Text>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('MyRequests')}
        >
          <Text style={styles.actionIcon}>📝</Text>
          <Text style={styles.actionText}>My Requests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('MyBookings')}
        >
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionText}>My Bookings</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Browse Categories</Text>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading services…</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item, index) =>
            item._id?.toString() || item.id?.toString() || `cat-${index}`
          }
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🗂️</Text>
              <Text style={styles.emptyText}>No categories available</Text>
            </View>
          }
          renderItem={({ item }) => {
            const categoryId = item._id?.toString() || item.id?.toString();

            return (
              <TouchableOpacity
                style={styles.categoryCard}
                activeOpacity={0.85}
                onPress={() => {
                  if (!categoryId) {
                    Alert.alert('Error', 'This category cannot be opened');
                    return;
                  }
                  navigation.navigate('ProviderList', {
                    categoryId,
                    categoryName: item.name,
                  });
                }}
              >
                <View style={styles.iconWrapper}>
                  <Text style={styles.categoryIcon}>{item.icon || '🔧'}</Text>
                </View>

                <Text style={styles.categoryName}>{item.name}</Text>

                <View style={styles.arrowContainer}>
                  <Text style={styles.arrow}>→</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 8,
  },

  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoutIcon: { fontSize: 22 },

  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -22,
    gap: 14,
  },

  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },

  actionButtonSecondary: {
    borderLeftColor: '#FF9800',
  },

  actionIcon: { fontSize: 30, marginBottom: 6 },

  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#333',
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  categoryList: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },

  categoryCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    margin: 8,
    elevation: 4,
  },

  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },

  categoryIcon: { fontSize: 34 },

  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    lineHeight: 18,
  },

  arrowContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },

  arrow: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },

  emptyText: {
    fontSize: 15,
    color: '#777',
    fontWeight: '600',
  },
});
