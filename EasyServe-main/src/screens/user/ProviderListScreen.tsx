import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { providerService } from '../../services/providerService';
import { logger } from '../../utils/logger';
import { formatters } from '../../utils/formatter';
import { Provider } from '../../types';

const TAG = 'ProviderListScreen';

export default function ProviderListScreen({ route, navigation }: any) {
  const { categoryId, categoryName } = route.params;
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
    return () => setProviders([]);
  }, [categoryId]);

  const loadProviders = async () => {
    if (!categoryId) {
      setError('Category ID is missing');
      setLoading(false);
      return;
    }

    try {
      logger.info(TAG, `Loading providers for category: ${categoryId}`);
      const data = await providerService.getByCategory(categoryId);
      setProviders(data);
      setError(null);
      logger.info(TAG, `Loaded ${data.length} providers`);
    } catch (err: any) {
      logger.error(TAG, 'Error loading providers', err);
      setError(err.message || 'Failed to load providers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProviders();
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{categoryName}</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Primary Action */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.requestButton}
          onPress={() =>
            navigation.navigate('ServiceRequest', {
              category: {
                _id: categoryId,
                id: categoryId,
                name: categoryName,
              },
            })
          }
        >
          <Text style={styles.requestButtonIcon}>✨</Text>
          <Text style={styles.requestButtonText}>
            Post a Service Request
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : providers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>No providers available</Text>
          <Text style={styles.emptySubtext}>
            Post a request and get bids from providers
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Available Providers</Text>

          <FlatList
            data={providers}
            keyExtractor={(item, index) =>
              item._id?.toString() ||
              item.id?.toString() ||
              `prov-${index}`
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4CAF50']}
              />
            }
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const providerId =
                item._id?.toString() || item.id?.toString();

              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.providerCard}
                  onPress={() => {
                    if (!providerId) {
                      Alert.alert(
                        'Error',
                        'Provider information unavailable'
                      );
                      return;
                    }
                    navigation.navigate('ProviderDetails', {
                      providerId,
                    });
                  }}
                >
                  {/* Avatar */}
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatar}>👤</Text>
                  </View>

                  {/* Info */}
                  <View style={styles.providerInfo}>
                    <Text style={styles.providerName}>
                      {item.name}
                    </Text>

                    <View style={styles.ratingRow}>
                      <Text style={styles.ratingStars}>⭐</Text>
                      <Text style={styles.ratingText}>
                        {formatters.rating(item.rating)}
                      </Text>
                      <Text style={styles.ratingCount}>
                        ({item.reviews?.length || 0})
                      </Text>
                    </View>

                    <View style={styles.locationRow}>
                      <Text style={styles.locationIcon}>📍</Text>
                      <Text style={styles.locationText}>
                        {item.area}
                      </Text>
                    </View>

                    {item.price && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>
                          Starting from
                        </Text>
                        <Text style={styles.priceValue}>
                          {formatters.currency(item.price)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Arrow */}
                  <View style={styles.arrowButton}>
                    <Text style={styles.arrowIcon}>→</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 18,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  backButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
  },

  actionBar: { padding: 20 },

  requestButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },

  requestButtonIcon: { fontSize: 20, marginRight: 8 },

  requestButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  errorIcon: { fontSize: 60, marginBottom: 20 },

  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 30,
  },

  errorButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },

  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  emptyIcon: { fontSize: 80, marginBottom: 20 },

  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },

  emptySubtext: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
  },

  list: { paddingHorizontal: 20, paddingBottom: 30 },

  providerCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
  },

  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  avatar: { fontSize: 36 },

  providerInfo: { flex: 1 },

  providerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#333',
    marginBottom: 6,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  ratingStars: { fontSize: 14, marginRight: 4 },

  ratingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginRight: 4,
  },

  ratingCount: { fontSize: 13, color: '#999' },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  locationIcon: { fontSize: 12, marginRight: 4 },

  locationText: { fontSize: 13, color: '#666' },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  priceLabel: {
    fontSize: 12,
    color: '#666',
  },

  priceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4CAF50',
  },

  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },

  arrowIcon: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
});
