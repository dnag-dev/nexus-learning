import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../lib/theme";
import { useAuthStore } from "../store/auth";

export default function KidLoginScreen() {
  const { colors, isDark } = useTheme();
  const { loginAsChild, isLoading, error, clearError } = useAuthStore();

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const pinRefs = useRef<(TextInput | null)[]>([null, null, null, null]);

  const handlePinChange = useCallback(
    (index: number, value: string) => {
      // Only accept digits
      const digit = value.replace(/[^0-9]/g, "");
      if (digit.length > 1) return;

      const newPin = [...pin];
      newPin[index] = digit;
      setPin(newPin);
      clearError();

      // Auto-advance to next box
      if (digit && index < 3) {
        pinRefs.current[index + 1]?.focus();
      }

      // Auto-submit on 4th digit
      if (digit && index === 3) {
        const fullPin = newPin.join("");
        if (fullPin.length === 4 && username.trim()) {
          handleLogin(username.trim(), fullPin);
        }
      }
    },
    [pin, username]
  );

  const handlePinKeyPress = useCallback(
    (index: number, key: string) => {
      if (key === "Backspace" && !pin[index] && index > 0) {
        pinRefs.current[index - 1]?.focus();
        const newPin = [...pin];
        newPin[index - 1] = "";
        setPin(newPin);
      }
    },
    [pin]
  );

  const handleLogin = useCallback(
    async (user: string, pinCode: string) => {
      try {
        await loginAsChild(user.toLowerCase(), pinCode);
        router.replace("/(kid)/dashboard");
      } catch {
        // Error already in store, reset PIN
        setPin(["", "", "", ""]);
        pinRefs.current[0]?.focus();
      }
    },
    [loginAsChild]
  );

  const handleSubmit = useCallback(() => {
    const fullPin = pin.join("");
    if (fullPin.length === 4 && username.trim()) {
      handleLogin(username.trim(), fullPin);
    }
  }, [pin, username, handleLogin]);

  const canSubmit = username.trim().length > 0 && pin.join("").length === 4;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          {/* Header */}
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: colors.primaryLight,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 48 }}>🚀</Text>
          </View>

          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 8,
            }}
          >
            Welcome Back!
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: colors.textSecondary,
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            Enter your username and secret PIN
          </Text>

          {/* Username input */}
          <View style={{ width: "100%", marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.textSecondary,
                marginBottom: 8,
              }}
            >
              USERNAME
            </Text>
            <TextInput
              value={username}
              onChangeText={(text) => {
                setUsername(text.toLowerCase());
                clearError();
              }}
              placeholder="Your username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => pinRefs.current[0]?.focus()}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                fontSize: 17,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          </View>

          {/* PIN input — 4 separate boxes */}
          <View style={{ width: "100%", marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.textSecondary,
                marginBottom: 8,
              }}
            >
              SECRET PIN
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 12,
              }}
            >
              {[0, 1, 2, 3].map((index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    pinRefs.current[index] = ref;
                  }}
                  value={pin[index]}
                  onChangeText={(value) => handlePinChange(index, value)}
                  onKeyPress={({ nativeEvent }) =>
                    handlePinKeyPress(index, nativeEvent.key)
                  }
                  keyboardType="number-pad"
                  maxLength={1}
                  secureTextEntry
                  selectTextOnFocus
                  style={{
                    width: 56,
                    height: 64,
                    backgroundColor: colors.surface,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: pin[index]
                      ? colors.primary
                      : error
                        ? colors.error
                        : colors.border,
                    fontSize: 24,
                    fontWeight: "700",
                    textAlign: "center",
                    color: colors.text,
                  }}
                />
              ))}
            </View>
          </View>

          {/* Error message */}
          {error && (
            <View
              style={{
                backgroundColor: colors.errorLight,
                borderRadius: 12,
                padding: 12,
                width: "100%",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: colors.error,
                  fontSize: 13,
                  fontWeight: "500",
                  textAlign: "center",
                }}
              >
                {error}
              </Text>
            </View>
          )}

          {/* Submit button */}
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit || isLoading}
            style={({ pressed }) => ({
              width: "100%",
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.primary,
              opacity: !canSubmit || isLoading ? 0.5 : pressed ? 0.8 : 1,
            })}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text
                style={{ fontSize: 17, fontWeight: "600", color: "#ffffff" }}
              >
                Blast Off! 🚀
              </Text>
            )}
          </Pressable>

          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={{ marginTop: 16, paddingVertical: 8 }}
          >
            <Text
              style={{
                fontSize: 14,
                color: colors.primary,
              }}
            >
              ← Back
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
