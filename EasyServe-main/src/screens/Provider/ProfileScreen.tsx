// ============================================
// screens/user/ProfileScreen.tsx - Enhanced UX
// ============================================

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { authService } from '../../services/authService';
import { profileService } from '../../services/profileService';
import { AuthUser } from '../../types';
import { logger } from '../../utils/logger';
import { validators } from '../../utils/validators';

const TAG = 'ProfileScreen';

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await profileService.getProfile();
      setUser(profile);
      setFormData(profile || {});
      logger.info(TAG, 'Profile loaded');
    } catch (error) {
      logger.error(TAG, 'Failed to load profile', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty');
      return;
    }

    if (!validators.name(formData.name)) {
      Alert.alert('Validation Error', 'Name must be at least 2 characters');
      return;
    }

    if (formData.phone && !validators.phone(formData.phone)) {
      Alert.alert('Validation Error', 'Please enter a valid phone number');
      return;
    }

    setSaving(true);
    try {
      const updated = await profileService.updateProfile({
        ...formData,
      });

      if (updated) {
        setUser(updated);
        setEditing(false);
        logger.info(TAG, 'Profile updated successfully');
        Alert.alert('Success! 🎉', 'Your profile has been updated successfully');
      }
    } catch (error: any) {
      logger.error(TAG, 'Profile update failed', error);
      const msg = error.message || 'Failed to update profile';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData(user || {});
    setEditing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Profile</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Profile</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={styles.errorText}>Profile not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
            <Text style={styles.retryButtonText}>🔄 Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Profile</Text>
          <TouchableOpacity onPress={() => (editing ? handleCancelEdit() : setEditing(true))}>
            <View style={[styles.editButtonContainer, editing && styles.editButtonContainerActive]}>
              <Text style={[styles.editButton, editing && styles.editButtonActive]}>
                {editing ? '✕' : '✏️'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Header Card */}
          <View style={styles.profileCard}>
            <View style={[styles.avatar, editing && styles.avatarEditing]}>
              <Text style={styles.avatarText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
              {editing && (
                <View style={styles.editOverlay}>
                  <Text style={styles.editOverlayText}>✏️</Text>
                </View>
              )}
            </View>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
            {user.phone && (
              <View style={styles.phoneContainer}>
                <Text style={styles.phoneIcon}>📱</Text>
                <Text style={styles.phone}>{user.phone}</Text>
              </View>
            )}
            <View style={[styles.roleBadge, user.role === 'user' && styles.clientBadge]}>
              <Text style={styles.roleBadgeIcon}>
                {user.role === 'provider' ? '🔧' : '👤'}
              </Text>
              <Text style={styles.roleBadgeText}>
                {user.role === 'provider' ? 'Service Provider' : 'Client'}
              </Text>
            </View>
          </View>

          {editing ? (
            /* Edit Mode */
            <View style={styles.editContainer}>
              <Text style={styles.sectionTitle}>📝 Edit Information</Text>

              <View style={styles.editForm}>
                {/* Name Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="Enter your full name"
                    placeholderTextColor="#999"
                    editable={!saving}
                  />
                </View>

                {/* Email Field (Disabled) */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.disabledInputContainer}>
                    <TextInput
                      style={[styles.input, styles.disabledInput]}
                      value={formData.email}
                      editable={false}
                      placeholderTextColor="#999"
                    />
                    <Text style={styles.disabledLabel}>🔒 Cannot be changed</Text>
                  </View>
                </View>

                {/* Phone Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                    placeholderTextColor="#999"
                    editable={!saving}
                  />
                </View>

                {/* Provider-specific Fields */}
                {user.role === 'provider' && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Service Description</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.description}
                        onChangeText={(text) =>
                          setFormData({ ...formData, description: text })
                        }
                        placeholder="Describe your services"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        placeholderTextColor="#999"
                        editable={!saving}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Base Price</Text>
                      <View style={styles.priceInputContainer}>
                        <Text style={styles.currencySymbol}>Rs.</Text>
                        <TextInput
                          style={styles.priceInput}
                          value={formData.price?.toString()}
                          onChangeText={(text) =>
                            setFormData({
                              ...formData,
                              price: parseInt(text) || 0,
                            })
                          }
                          placeholder="0"
                          keyboardType="numeric"
                          placeholderTextColor="#999"
                          editable={!saving}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Service Area</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.area}
                        onChangeText={(text) =>
                          setFormData({ ...formData, area: text })
                        }
                        placeholder="e.g., Karachi, Lahore"
                        placeholderTextColor="#999"
                        editable={!saving}
                      />
                    </View>
                  </>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelEdit}
                    disabled={saving}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>💾 Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            /* View Mode */
            <>
              <Text style={styles.sectionTitle}>📋 Account Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoLabelContainer}>
                    <Text style={styles.infoIcon}>📧</Text>
                    <Text style={styles.infoLabel}>Email</Text>
                  </View>
                  <Text style={styles.infoValue}>{user.email}</Text>
                </View>

                {user.phone && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelContainer}>
                      <Text style={styles.infoIcon}>📱</Text>
                      <Text style={styles.infoLabel}>Phone</Text>
                    </View>
                    <Text style={styles.infoValue}>{user.phone}</Text>
                  </View>
                )}

                {user.role === 'provider' && (
                  <>
                    <View style={styles.infoRow}>
                      <View style={styles.infoLabelContainer}>
                        <Text style={styles.infoIcon}>🏷️</Text>
                        <Text style={styles.infoLabel}>Category</Text>
                      </View>
                      <Text style={styles.infoValue}>{(user as any).categoryName}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <View style={styles.infoLabelContainer}>
                        <Text style={styles.infoIcon}>📍</Text>
                        <Text style={styles.infoLabel}>Service Area</Text>
                      </View>
                      <Text style={styles.infoValue}>{(user as any).area}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <View style={styles.infoLabelContainer}>
                        <Text style={styles.infoIcon}>💰</Text>
                        <Text style={styles.infoLabel}>Base Price</Text>
                      </View>
                      <Text style={[styles.infoValue, styles.priceValue]}>
                        Rs. {(user as any).price?.toLocaleString()}
                      </Text>
                    </View>

                    {(user as any).description && (
                      <View style={[styles.infoRow, styles.descriptionRow]}>
                        <View style={styles.infoLabelContainer}>
                          <Text style={styles.infoIcon}>📝</Text>
                          <Text style={styles.infoLabel}>Description</Text>
                        </View>
                        <Text style={[styles.infoValue, styles.descriptionValue]}>
                          {(user as any).description}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* Edit Prompt */}
              <View style={styles.editPrompt}>
                <Text style={styles.editPromptIcon}>💡</Text>
                <Text style={styles.editPromptText}>
                  Tap the edit button above to update your profile information
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: { color: '#4CAF50', fontWeight: '600', fontSize: 16 },
  editButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonContainerActive: { backgroundColor: '#FFEBEE' },
  editButton: { fontSize: 18 },
  editButtonActive: { fontSize: 20 },
  title: { fontSize: 20, fontWeight: '800', color: '#333' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#666' },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: { fontSize: 80, marginBottom: 20 },
  errorText: { color: '#666', fontSize: 18, marginBottom: 30, fontWeight: '600' },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  content: { padding: 20 },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  avatarEditing: { borderWidth: 3, borderColor: '#FFC107', borderStyle: 'dashed' },
  avatarText: { fontSize: 48, fontWeight: '700', color: '#fff' },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFC107',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editOverlayText: { fontSize: 14 },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  email: { fontSize: 15, color: '#666', marginBottom: 10 },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  phoneIcon: { fontSize: 16, marginRight: 6 },
  phone: { fontSize: 15, color: '#666', fontWeight: '500' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
    gap: 6,
  },
  clientBadge: { backgroundColor: '#E3F2FD' },
  roleBadgeIcon: { fontSize: 16 },
  roleBadgeText: { color: '#4CAF50', fontWeight: '700', fontSize: 14 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    marginBottom: 15,
  },
  editContainer: { marginBottom: 20 },
  editForm: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#F8F9FA',
  },
  disabledInputContainer: { position: 'relative' },
  disabledInput: { backgroundColor: '#F0F0F0', color: '#999' },
  disabledLabel: {
    position: 'absolute',
    right: 15,
    top: 15,
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 15,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    padding: 15,
    fontSize: 15,
    color: '#333',
  },
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 10 },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 16, fontWeight: '700', color: '#666' },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  descriptionRow: { flexDirection: 'column', alignItems: 'flex-start' },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: { fontSize: 16 },
  infoLabel: { fontSize: 14, color: '#666', fontWeight: '600' },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: '60%',
  },
  priceValue: { color: '#4CAF50', fontSize: 16, fontWeight: '800' },
  descriptionValue: {
    marginTop: 8,
    textAlign: 'left',
    maxWidth: '100%',
    lineHeight: 20,
  },
  editPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: 15,
    borderRadius: 12,
    gap: 10,
  },
  editPromptIcon: { fontSize: 20 },
  editPromptText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});