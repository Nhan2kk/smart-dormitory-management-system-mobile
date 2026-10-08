import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { Formatter } from "../format";
import { useI18n } from "../i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "../theme";
import { IconName } from "./Badges";
import { Touchable } from "./Touchable";

/** Nhóm trường form có tiêu đề. */
export function FormSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!hint && <Text style={styles.sectionHint}>{hint}</Text>}
      <View style={{ marginTop: spacing.md }}>{children}</View>
    </View>
  );
}

/** Lưới ô chọn có icon (chọn một) — vùng chạm lớn, dễ dùng hơn dropdown trên mobile. */
export function OptionGrid<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: { value: T; label: string; icon: IconName; description?: string }[];
  value: T | null;
  onChange: (value: T) => void;
  columns?: number;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.grid}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Touchable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={[styles.tile, { width: `${100 / columns - 2.5}%` }, selected && styles.tileSelected]}
          >
            <View style={[styles.tileIcon, selected && { backgroundColor: colors.primary }]}>
              <Ionicons name={option.icon} size={20} color={selected ? colors.onPrimary : colors.inkSoft} />
            </View>
            <Text style={[styles.tileLabel, selected && { color: colors.primary }]} numberOfLines={1}>
              {option.label}
            </Text>
            {!!option.description && <Text style={styles.tileDescription}>{option.description}</Text>}
            {selected && (
              <View style={styles.tileCheck}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              </View>
            )}
          </Touchable>
        );
      })}
    </View>
  );
}

export class DateStripModel {
  static range(start: Date, days: number): Date[] {
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }

  static iso(date: Date): string {
    return Formatter.iso(date);
  }
}

/** Dải chọn ngày cuộn ngang — chọn nhanh bằng một chạm thay cho lịch bật lên. */
export function DateStrip({ dates, value, onChange, isDisabled }: { dates: Date[]; value: string | null; onChange: (iso: string) => void; isDisabled?: (date: Date) => boolean }) {
  const styles = useStyles();
  const { t } = useI18n();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stripScroller} contentContainerStyle={styles.strip}>
      {dates.map((date) => {
        const iso = DateStripModel.iso(date);
        const selected = iso === value;
        const disabled = isDisabled?.(date) ?? false;
        return (
          <Touchable
            key={iso}
            onPress={() => onChange(iso)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={Formatter.date(date)}
            style={[styles.day, selected && styles.daySelected]}
          >
            <Text style={[styles.dayWeek, selected && styles.daySoft]}>{Formatter.weekday(date)}</Text>
            <Text style={[styles.dayNum, selected && styles.dayStrong]}>{date.getDate()}</Text>
            <Text style={[styles.dayMonth, selected && styles.daySoft]}>{t("time.monthShort", { month: date.getMonth() + 1 })}</Text>
          </Touchable>
        );
      })}
    </ScrollView>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Touchable onPress={() => onChange(!checked)} accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={label} style={styles.checkRow} pressScale={0.99}>
      <View style={[styles.checkBox, checked && styles.checkBoxOn]}>{checked && <Ionicons name="checkmark" size={16} color={colors.onPrimary} />}</View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Touchable>
  );
}

/** Ô thêm ảnh minh chứng. Truyền `uris` để hiển thị ảnh thật; không truyền thì hiện biểu tượng giữ chỗ. */
export function PhotoSlots({ count, onAdd, onRemove, max = 4, uris }: { count: number; onAdd: () => void; onRemove: (index: number) => void; max?: number; uris?: string[] }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <View style={styles.photos}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.photo}>
          {uris?.[index] ? <Image source={{ uri: uris[index] }} style={styles.photoImage} contentFit="cover" /> : <Ionicons name="image" size={26} color={colors.primary} />}
          <Touchable onPress={() => onRemove(index)} accessibilityLabel={t("common.removePhoto", { index: index + 1 })} style={styles.photoRemove}>
            <Ionicons name="close" size={14} color={colors.onInverse} />
          </Touchable>
        </View>
      ))}
      {count < max && (
        <Touchable onPress={onAdd} accessibilityLabel={t("common.addPhoto")} style={[styles.photo, styles.photoAdd]}>
          <Ionicons name="camera-outline" size={24} color={colors.primary} />
          <Text style={styles.photoAddText}>{t("common.addPhoto")}</Text>
        </Touchable>
      )}
    </View>
  );
}

const useStyles = makeStyles(({ colors, font }) => ({
  section: { marginTop: spacing.xxl },
  sectionTitle: { ...font.heading, fontSize: 16 },
  sectionHint: { ...font.caption, fontSize: 13, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.md },
  tile: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1.5, borderColor: colors.border, gap: spacing.sm, minHeight: 92 },
  tileSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceWarm },
  tileIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" },
  tileLabel: { ...font.label },
  tileDescription: { ...font.caption },
  tileCheck: { position: "absolute", top: 10, right: 10 },
  stripScroller: { marginHorizontal: -spacing.xl, flexGrow: 0 },
  strip: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  day: { width: 62, height: 82, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 2 },
  daySelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayWeek: { ...font.caption, fontWeight: "700" },
  dayNum: { fontSize: 20, fontWeight: "800", color: colors.ink },
  dayMonth: { ...font.caption, fontSize: 11 },
  daySoft: { color: "rgba(255,255,255,0.85)" },
  dayStrong: { color: colors.onPrimary },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, paddingVertical: spacing.xs },
  checkBox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  checkBoxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkLabel: { ...font.body, flex: 1, fontSize: 14, color: colors.ink },
  photos: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  photo: { width: 76, height: 76, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  photoImage: { width: "100%", height: "100%", borderRadius: radius.md },
  photoAdd: { backgroundColor: colors.surface, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.primaryLight, gap: 2 },
  photoAddText: { fontSize: 11, fontWeight: "700", color: colors.primary },
  photoRemove: { position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.inverse, alignItems: "center", justifyContent: "center" },
}));
