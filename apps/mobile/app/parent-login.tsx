/**
 * Parent Login — email + password authentication.
 *
 * On success, navigates to the parent dashboard.
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
} from "react-native";
import { router, Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../lib/theme";
import { useAuthStore } from "../store/auth";

export default function ParentLoginScreen() {
  const { colors } = useTheme();
  const { loginAsParent, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const passwordRef = useRef<TextInput>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleLogin = async () => {
    if (!canSubmit || isLoading) return;
    clearError();

    try {
      await loginAsParent(email.trim().toLowerCase(), password);
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
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.accentLight,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 40 }}>
              {"\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67"}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              color: colors.text,
              marginBottom: 4,
            }}
          >
            Parent Login
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 28,
            }}
          >
            Track your child's learning progress
          </Text>

          {/* Error */}
          {error && (
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
                {error}
              </Text>
            </View>
          )}

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
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (error) clearError();
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
              Password
            </Text>
            <TextInput
              ref={passwordRef}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (error) clearError();
              }}
              placeholder="Enter your password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
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

          {/* Login button */}
          <Pressable
            onPress={handleLogin}
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
                Log In
              </Text>
            )}
          </Pressable>

          {/* Back */}
          <Link href="/" asChild>
            <Pressable
              style={({ pressed }) => ({
                paddingVertical: 12,
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
