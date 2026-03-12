/**
 * Error Boundary — catches JS errors in the component tree
 * and shows a friendly recovery screen instead of crashing.
 *
 * Required for App Store — unhandled crashes lead to rejection.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console for debugging — in production, send to error tracking
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
            backgroundColor: "#060d1f",
          }}
        >
          <Text style={{ fontSize: 56, marginBottom: 16 }}>
            {"\uD83D\uDE35\u200D\uD83D\uDCAB"}
          </Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#ffffff",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Oops! Something went wrong
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#94a3b8",
              textAlign: "center",
              lineHeight: 21,
              marginBottom: 24,
            }}
          >
            Don&apos;t worry — your progress is saved.{"\n"}Try again or
            restart the app.
          </Text>
          <Pressable
            onPress={this.handleRetry}
            style={({ pressed }) => ({
              backgroundColor: "#6C5CE7",
              borderRadius: 14,
              paddingHorizontal: 32,
              paddingVertical: 14,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={{ fontSize: 16, fontWeight: "600", color: "#ffffff" }}
            >
              Try Again
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
