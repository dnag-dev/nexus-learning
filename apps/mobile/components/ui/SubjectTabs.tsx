import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../lib/theme";

interface SubjectTabsProps {
  selected: "math" | "english";
  onSelect: (subject: "math" | "english") => void;
}

export function SubjectTabs({ selected, onSelect }: SubjectTabsProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.surfaceAlt,
        borderRadius: 12,
        padding: 3,
      }}
    >
      <Pressable
        onPress={() => onSelect("math")}
        style={{
          flex: 1,
          paddingVertical: 10,
          borderRadius: 10,
          alignItems: "center",
          backgroundColor:
            selected === "math" ? colors.mathLight : "transparent",
          borderWidth: selected === "math" ? 1 : 0,
          borderColor: selected === "math" ? colors.mathBorder : "transparent",
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: selected === "math" ? colors.math : colors.textMuted,
          }}
        >
          🔢 Math
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onSelect("english")}
        style={{
          flex: 1,
          paddingVertical: 10,
          borderRadius: 10,
          alignItems: "center",
          backgroundColor:
            selected === "english" ? "#F5F3FF" : "transparent",
          borderWidth: selected === "english" ? 1.5 : 0,
          borderColor: selected === "english" ? "#DDD6FE" : "transparent",
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: selected === "english" ? colors.english : colors.textMuted,
          }}
        >
          📖 English
        </Text>
      </Pressable>
    </View>
  );
}
