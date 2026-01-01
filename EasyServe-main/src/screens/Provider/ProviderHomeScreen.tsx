import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { authService } from '../../services/authService';
import api from '../../config/api';
import { logger } from '../../utils/logger';
import { Provider as ProviderType } from '../../types';

const TAG = 'ProviderHomeScreen';
const { width } = Dimensions.get('window');

interface ProviderStats {
  activeBids: number;
  acceptedBids: number;
  completedJobs: number;
  rating: number;
}

export default function ProviderHomeScreen({ navigation }: any) {
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProviderStats>({
    activeBids: 0,
    acceptedBids: 0,
    completedJobs: 0,
    rating: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = (await authService.getCurrentUser()) as ProviderType;
      if (user) {
        setUserName(user.name.split(' ')[0]);

        logger.info(TAG, `Loaded provider: ${user.name}`);

        // ✅ Fetch provider stats from bookings
        const statsRes = await api.get(`/bookings/provider/${user.id}/stats`);
        const providerStats = statsRes.data;

        // Fetch bids
        const bidsRes = await api.get(`/service-requests/provider-bids/${user.id}`);

        const activeBids = (bidsRes.data || []).filter(
          (b: any) => b.status === 'pending'
        ).length;
        const acceptedBids = (bidsRes.data || []).filter(
          (b: any) => b.status === 'accepted'
        ).length;

        // ✅ Update stats with real data
        setStats({
          activeBids,
          acceptedBids,
          completedJobs: providerStats.completedJobs || 0,
          rating: providerStats.averageRating || 0,
        });

        logger.info(TAG, `Stats loaded - Rating: ${providerStats.averageRating}, Completed: ${providerStats.completedJobs}`);
      }
    } catch (error) {
      logger.error(TAG, 'Error loading data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              logger.info(TAG, 'Provider logged out');
              navigation.replace('Login');
            } catch (error) {
              logger.error(TAG, 'Logout failed', error);
              Alert.alert('Error', 'Logout failed. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greetingTime}>{getGreeting()}</Text>
          <Text style={styles.greeting}>{userName}! 👋</Text>
          <Text style={styles.subtitle}>Your Provider Dashboard</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutIcon}>🚪</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats Section */}
        {loading ? (
          <View style={styles.statsLoadingContainer}>
            <ActivityIndicator size="small" color="#4CAF50" />
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>💰</Text>
              </View>
              <Text style={styles.statValue}>{stats.activeBids}</Text>
              <Text style={styles.statLabel}>Active Bids</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>✓</Text>
              </View>
              <Text style={styles.statValue}>{stats.acceptedBids}</Text>
              <Text style={styles.statLabel}>Accepted</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>⭐</Text>
              </View>
              <Text style={styles.statValue}>{stats.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        )}

        {/* Quick Actions Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionSubtitle}>Manage your services</Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('AvailableRequests')}
          >
            <View style={[styles.menuIconContainer, styles.iconBlue]}>
              <Text style={styles.menuIcon}>🔍</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Available Requests</Text>
              <Text style={styles.menuSubtitle}>Find new opportunities</Text>
            </View>
            <View style={styles.menuArrowContainer}>
              <Text style={styles.menuArrow}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('MyBids')}
          >
            <View style={[styles.menuIconContainer, styles.iconPurple]}>
              <Text style={styles.menuIcon}>📋</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>My Bids</Text>
              <Text style={styles.menuSubtitle}>Track your submitted bids</Text>
            </View>
            <View style={styles.menuArrowContainer}>
              <Text style={styles.menuArrow}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ProviderBookings')}
          >
            <View style={[styles.menuIconContainer, styles.iconGreen]}>
              <Text style={styles.menuIcon}>📂</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>My Bookings</Text>
              <Text style={styles.menuSubtitle}>View accepted jobs & track progress</Text>
            </View>
            <View style={styles.menuArrowContainer}>
              <Text style={styles.menuArrow}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Wallet')}
          >
            <View style={[styles.menuIconContainer, styles.iconOrange]}>
              <Text style={styles.menuIcon}>💳</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Wallet</Text>
              <Text style={styles.menuSubtitle}>Manage your earnings</Text>
            </View>
            <View style={styles.menuArrowContainer}>
              <Text style={styles.menuArrow}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={[styles.menuIconContainer, styles.iconTeal]}>
              <Text style={styles.menuIcon}>👤</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>My Profile</Text>
              <Text style={styles.menuSubtitle}>View & edit your profile</Text>
            </View>
            <View style={styles.menuArrowContainer}>
              <Text style={styles.menuArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 60,
    paddingBottom: 35,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: { flex: 1 },
  greetingTime: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  logoutButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: { fontSize: 24 },
  scrollContent: { flexGrow: 1 },
  statsLoadingContainer: {
    paddingHorizontal: 20,
    marginTop: -25,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -25,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIcon: { fontSize: 24 },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  menuContainer: { paddingHorizontal: 20 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  menuIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconBlue: { backgroundColor: '#E3F2FD' },
  iconPurple: { backgroundColor: '#F3E5F5' },
  iconGreen: { backgroundColor: '#F0FDF4' },
  iconOrange: { backgroundColor: '#FFF3E0' },
  iconTeal: { backgroundColor: '#E0F2F1' },
  menuIcon: { fontSize: 28 },
  menuContent: { flex: 1 },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  menuArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuArrow: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: '700',
  },
});