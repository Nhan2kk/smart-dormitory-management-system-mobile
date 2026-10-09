import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { makeStyles, radius, spacing, useTheme } from "../theme";
import { IconName } from "./Badges";
import { Touchable } from "./Touchable";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  count?: number;
};

export function Chip({ label, selected, onPress, icon, count }: ChipProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[styles.chip, selected && styles.selected]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={selected ? colors.onInverse : colors.inkSoft}
        />
      )}
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
      {count !== undefined && (
        <View style={[styles.count, selected && styles.countSelected]}>
          <Text style={[styles.countText, selected && styles.labelSelected]}>
            {count}
          </Text>
        </View>
      )}
    </Touchable>
  );
}

/** Hàng chip lọc (chọn một), cuộn ngang hoặc xuống dòng. */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  scroll = true,
}: {
  options: { value: T; label: string; icon?: IconName; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  scroll?: boolean;
}) {
  const styles = useStyles();
  const chips = options.map((option) => (
    <Chip
      key={option.value}
      label={option.label}
      icon={option.icon}
      count={option.count}
      selected={option.value === value}
      onPress={() => onChange(option.value)}
    />
  ));
  if (!scroll) return <View style={styles.wrap}>{chips}</View>;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroller}
    >
      {chips}
    </ScrollView>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: { backgroundColor: colors.inverse, borderColor: colors.inverse },
  label: { fontSize: 14, fontWeight: "600", color: colors.inkSoft },
  labelSelected: { color: colors.onInverse },
  count: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  countSelected: { backgroundColor: "rgba(128,128,128,0.3)" },
  countText: { fontSize: 11, fontWeight: "700", color: colors.inkSoft },
  row: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  scroller: { marginHorizontal: -spacing.xl, flexGrow: 0 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
}));
