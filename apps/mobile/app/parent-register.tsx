/**
 * Parent Registration — create a new parent account.
 *
 * Fields: name, email, password, confirm password.
 * On success → navigates to parent dashboard.
 */

import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router, Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../lib/theme";
import { useAuthStore } from "../store/auth";

export default function ParentRegisterScreen() {
  const { colors } = useTheme();
  const { registerAsParent, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const displayError = localError || error;

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    confirmPassword.length > 0;

  const handleRegister = async () => {
    if (!canSubmit || isLoading) return;
    clearError();
    setLocalError(null);

    // Client-side validation
    const trimmedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setLocalError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords don't match");
      return;
    }

    try {
      await registerAsParent(trimmedEmail, password, name.trim());
      router.replace("/(parent)/dashboard");
    } catch {
      // Error is set in the store
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingVertical: 32,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.accentLight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 40 }}>{"\u2728"}</Text>
            </View>
          </View>

          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              color: colors.text,
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            Create Account
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              marginBottom: 28,
            }}
          >
            Start your child's learning journey
          </Text>

          {/* Error */}
          {displayError && (
            <View
              style={{
                width: "100%",
                backgroundColor: colors.errorLight,
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: colors.error,
                  textAlign: "center",
                }}
              >
                {displayError}
              </Text>
            </View>
          )}

          {/* Name input */}
          <View style={{ width: "100%", marginBottom: 14 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.textSecondary,
                marginBottom: 6,
                marginLeft: 4,
              }}
            >
              Your Name
            </Text>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (displayError) {
                  clearError();
                  setLocalError(null);
                }
              }}
              placeholder="e.g. Sarah"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              style={{
                width: "100%",
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: colors.text,
              }}
            />
          </View>

          {/* Email input */}
          <View style={{ width: "100%", marginBottom: 14 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.textSecondary,
                marginBottom: 6,
                marginLeft: 4,
              }}
            >
              Email
            </Text>
            <TextInput
              ref={emailRef}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (displayError) {
                  clearError();
                  setLocalError(null);
                }
              }}
              placeholder="parent@example.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              style={{
                width: "100%",
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: colors.text,
              }}
            />
          </View>

          {/* Password input */}
          <View style={{ width: "100%", marginBottom: 14 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.textSecondary,
                marginBottom: 6,
                marginLeft: 4,
              }}
            >
              Password
            </Text>
            <TextInput
              ref={passwordRef}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (displayError) {
                  clearError();
                  setLocalError(null);
                }
              }}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              style={{
                width: "100%",
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: colors.text,
              }}
            />
          </View>

          {/* Confirm password */}
          <View style={{ width: "100%", marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.textSecondary,
                marginBottom: 6,
                marginLeft: 4,
              }}
            >
              Confirm Password
            </Text>
            <TextInput
              ref={confirmRef}
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                if (displayError) {
                  clearError();
                  setLocalError(null);
                }
              }}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={handleRegister}
              style={{
                width: "100%",
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: colors.text,
              }}
            />
          </View>

          {/* Register button */}
          <Pressable
            onPress={handleRegister}
            disabled={!canSubmit || isLoading}
            style={({ pressed }) => ({
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor: canSubmit ? colors.accent : colors.border,
              opacity: pressed ? 0.85 : 1,
              marginBottom: 16,
            })}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#ffffff",
                }}
              >
                Create Account
              </Text>
            )}
          </Pressable>

          {/* Already have an account */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              Already have an account?{" "}
            </Text>
            <Link href="/parent-login" asChild>
              <Pressable>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.accent,
                  }}
                >
                  Log In
                </Text>
              </Pressable>
            </Link>
          </View>

          {/* Back */}
          <Link href="/" asChild>
            <Pressable
              style={({ pressed }) => ({
                paddingVertical: 12,
                alignItems: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 15,
                  color: colors.primary,
                  fontWeight: "600",
                }}
              >
                {"\u2190"} Back
              </Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
