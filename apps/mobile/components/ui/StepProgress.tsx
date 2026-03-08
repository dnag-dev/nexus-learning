import { View, Text } from "react-native";
import { useTheme } from "../../lib/theme";

const STEPS = ["Learn", "Check", "Guided", "Practice", "Prove"] as const;

interface StepProgressProps {
  /** Current step index (0-4) */
  currentStep: number;
  /** Steps completed so far */
  completedSteps?: number;
}

export function StepProgress({
  currentStep,
  completedSteps = 0,
}: StepProgressProps) {
  const { colors } = useTheme();

  return (
    <View style={{ alignItems: "center", paddingVertical: 8 }}>
      {/* Dots and lines */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
        {STEPS.map((_, index) => {
          const isCompleted = index < completedSteps;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <View key={index} style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: isCurrent ? 14 : 10,
                  height: isCurrent ? 14 : 10,
                  borderRadius: 7,
                  backgroundColor: isCompleted
                    ? colors.success
                    : isCurrent
                      ? colors.primary
                      : colors.border,
                  borderWidth: isCurrent ? 2 : 0,
                  borderColor: isCurrent ? colors.primary : undefined,
                }}
              />
              {index < STEPS.length - 1 && (
                <View
                  style={{
                    width: 24,
                    height: 2,
                    backgroundColor:
                      index < completedSteps ? colors.success : colors.border,
                  }}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Labels */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
        {STEPS.map((label, index) => (
          <Text
            key={label}
            style={{
              fontSize: 9,
              fontWeight: index === currentStep ? "700" : "400",
              color: index === currentStep ? colors.primary : colors.textMuted,
              textAlign: "center",
              flex: 1,
            }}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}
