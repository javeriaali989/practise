// ============================================
// screens/auth/SignupScreen.tsx - ENHANCED UX
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
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { authService } from '../../services/authService';
import { categoryService } from '../../services/categoryService';
import { validators } from '../../utils/validators';
import { logger } from '../../utils/logger';
import { Category } from '../../types';

const TAG = 'SignupScreen';

export default function SignupScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'user' | 'provider'>('user');
  const [showPassword, setShowPassword] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      logger.error(TAG, 'Failed to load categories', error);
    }
  };

  const handleSignup = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!validators.name(name)) {
      Alert.alert('Error', 'Name must be at least 2 characters');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!validators.email(email)) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    const pwdValidation = validators.password(password);
    if (!pwdValidation.valid) {
      Alert.alert('Error', pwdValidation.error);
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (!validators.phone(phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    if (role === 'provider') {
      if (!selectedCategory) {
        Alert.alert('Error', 'Please select a service category');
        return;
      }

      const priceValidation = validators.price(price);
      if (!priceValidation.valid) {
        Alert.alert('Error', priceValidation.error);
        return;
      }

      if (!area.trim()) {
        Alert.alert('Error', 'Please enter your service area');
        return;
      }

      if (!description.trim()) {
        Alert.alert('Error', 'Please enter a service description');
        return;
      }

      if (description.length > 1000) {
        Alert.alert('Error', 'Description is too long (max 1000 characters)');
        return;
      }
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      logger.info(TAG, `Signup attempt as ${role}`);

      if (role === 'provider') {
        await authService.providerSignup({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
          categoryId: selectedCategory!._id || selectedCategory!.id || '',
          categoryName: selectedCategory!.name,
          price: parseFloat(price),
          area: area.trim(),
          description: description.trim(),
        });
        logger.info(TAG, 'Provider signup successful');
        Alert.alert('Success', 'Provider account created successfully!');
        navigation.replace('ProviderHome');
      } else {
        await authService.signup({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
        });
        logger.info(TAG, 'User signup successful');
        Alert.alert('Success', 'User account created successfully!');
        navigation.replace('Home');
      }
    } catch (error: any) {
      logger.error(TAG, 'Signup failed', error);
      const msg = error.response?.data?.message || 'Signup failed. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Sign up to get started</Text>

              {/* Role Toggle */}
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[styles.roleButton, role === 'user' && styles.roleButtonSelected]}
                  onPress={() => setRole('user')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.roleIcon}>👤</Text>
                  <Text style={[styles.roleText, role === 'user' && styles.roleTextSelected]}>
                    User
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleButton, role === 'provider' && styles.roleButtonSelected]}
                  onPress={() => setRole('provider')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.roleIcon}>🔧</Text>
                  <Text style={[styles.roleText, role === 'provider' && styles.roleTextSelected]}>
                    Provider
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionLabel}>📝 Basic Information</Text>

              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#999"
                editable={!loading}
                returnKeyType="next"
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
                editable={!loading}
                returnKeyType="next"
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password (minimum 6 characters)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#999"
                  editable={!loading}
                  returnKeyType="next"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Text style={styles.eyeIconText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
                editable={!loading}
                returnKeyType={role === 'user' ? 'done' : 'next'}
              />

              {role === 'provider' && (
                <>
                  <Text style={styles.sectionLabel}>🔧 Service Information</Text>

                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.dropdownText,
                      !selectedCategory && styles.dropdownPlaceholder
                    ]}>
                      {selectedCategory?.name || 'Select Service Category'}
                    </Text>
                    <Text style={[
                      styles.dropdownIcon,
                      showCategoryDropdown && styles.dropdownIconOpen
                    ]}>
                      ▼
                    </Text>
                  </TouchableOpacity>

                  {showCategoryDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView
                        style={styles.dropdownScrollView}
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={false}
                      >
                        {categories.map((cat) => (
                          <TouchableOpacity
                            key={cat._id || cat.id}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setSelectedCategory(cat);
                              setShowCategoryDropdown(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.dropdownItemText}>{cat.name}</Text>
                            {selectedCategory?._id === cat._id && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <TextInput
                    style={styles.input}
                    placeholder="Base Price (Rs.)"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                    editable={!loading}
                    returnKeyType="next"
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Service Area (e.g., Karachi)"
                    value={area}
                    onChangeText={setArea}
                    placeholderTextColor="#999"
                    editable={!loading}
                    returnKeyType="next"
                  />

                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Brief Description of your services"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    placeholderTextColor="#999"
                    editable={!loading}
                    returnKeyType="done"
                  />
                </>
              )}

              <TouchableOpacity
                style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                onPress={handleSignup}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.signupButtonText}>Create Account</Text>
                    <Text style={styles.signupButtonIcon}>✨</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                disabled={loading}
                style={styles.loginLinkContainer}
              >
                <Text style={styles.loginLink}>
                  Already have an account?{' '}
                  <Text style={styles.loginLinkBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>

              {/* Bottom spacing */}
              <View style={{ height: 30 }} />
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 25,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 25,
    fontWeight: '500',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 25,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: '#FAFAFA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8F4',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.2,
    elevation: 4,
  },
  roleIcon: { fontSize: 22, marginRight: 7 },
  roleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 0.3,
  },
  roleTextSelected: { color: '#4CAF50' },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 14,
    marginTop: 10,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 14,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#FAFAFA',
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    marginBottom: 14,
    backgroundColor: '#FAFAFA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 12,
  },
  eyeIconText: {
    fontSize: 18,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  dropdown: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  dropdownText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    color: '#999',
    fontWeight: '400',
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#666',
    fontWeight: '700',
  },
  dropdownIconOpen: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownList: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    marginBottom: 14,
    backgroundColor: '#fff',
    maxHeight: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownScrollView: {
    maxHeight: 220,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '700',
  },
  signupButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  signupButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.2,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  signupButtonIcon: {
    fontSize: 17,
  },
  loginLinkContainer: {
    paddingVertical: 10,
  },
  loginLink: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  loginLinkBold: {
    color: '#4CAF50',
    fontWeight: '700',
  },
});