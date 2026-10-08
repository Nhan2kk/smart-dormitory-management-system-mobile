import { Text, View } from "react-native";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { Touchable } from "../../shared/ui";
import { DailyRecord } from "./utilities.mock";

/** Lịch nhiệt theo ngày: ô càng đậm tiêu thụ điện càng cao. */
export function UtilityCalendar({ records, onSelect }: { records: DailyRecord[]; onSelect: (record: DailyRecord) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const max = Math.max(...records.map((record) => record.electricity));
  const min = Math.min(...records.map((record) => record.electricity));
  const first = new Date(records[0].date);
  const offset = (first.getDay() + 6) % 7; // Thứ Hai đầu tuần
  const cells: (DailyRecord | null)[] = [...Array.from({ length: offset }, () => null), ...records];
  const weekdays = Array.from({ length: 7 }, (_, index) => Formatter.weekday(new Date(2026, 8, 7 + index)));

  return (
    <View>
      <View style={styles.row}>
        {weekdays.map((day) => (
          <Text key={day} style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((record, index) => {
          if (!record) return <View key={`e${index}`} style={styles.cell} />;
          const level = (record.electricity - min) / Math.max(0.01, max - min);
          const strong = level > 0.55;
          return (
            <View key={record.date} style={styles.cell}>
              <Touchable
                onPress={() => onSelect(record)}
                accessibilityLabel={`${Formatter.date(record.date)}: ${Formatter.decimal(record.electricity, 2)} kWh`}
                style={[styles.day, { backgroundColor: colors.primary, opacity: 0.18 + level * 0.82 }]}
              >
                <Text style={[styles.dayText, { color: strong ? colors.onPrimary : colors.ink }]}>{new Date(record.date).getDate()}</Text>
              </Touchable>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>{t("utilities.less")}</Text>
        {[0.2, 0.4, 0.6, 0.8, 1].map((value) => (
          <View key={value} style={[styles.legendCell, { backgroundColor: colors.primary, opacity: value }]} />
        ))}
        <Text style={styles.legendText}>{t("utilities.more")}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles(({ font }) => ({
  row: { flexDirection: "row", marginBottom: spacing.sm },
  weekday: { ...font.caption, width: `${100 / 7}%`, textAlign: "center", fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  day: { flex: 1, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  dayText: { fontSize: 13, fontWeight: "700" },
  legend: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: spacing.md },
  legendCell: { width: 14, height: 14, borderRadius: 4 },
  legendText: { ...font.caption, marginHorizontal: 4 },
}));
