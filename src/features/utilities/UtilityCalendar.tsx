import { Text, View } from "react-native";
import { Formatter } from "../../shared/format";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "../../shared/theme";
import { Touchable } from "../../shared/ui";
import { DailyRecord } from "../../models/utilities.model";
import { UtilityMetric } from "../../enums/utilities.enum";
import { UtilityUsage } from "./UtilityUsage";

/** Lịch nhiệt theo ngày của một tháng (yyyy-MM): ô càng đậm tiêu thụ càng cao; ngày chưa có số đo để mờ. */
export function UtilityCalendar({ month, records, firstStayDate = null, metric = "electricity", onSelect }: { month: string; records: DailyRecord[]; firstStayDate?: string | null; metric?: UtilityMetric; onSelect: (record: DailyRecord) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const color = metric === "electricity" ? colors.primary : colors.info;
  const unit = metric === "electricity" ? "kWh" : "m³";
  const byDate = new Map(records.map((record) => [record.date, record]));
  const values = records.map((record) => record[metric]);
  const max = Math.max(0, ...values);
  const min = values.length ? Math.min(...values) : 0;
  const first = UtilityUsage.dateOf(`${month}-01`);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7; // Thứ Hai đầu tuần
  const dates = Array.from({ length: daysInMonth }, (_, index) => UtilityUsage.addDays(`${month}-01`, index));
  const cells: (string | null)[] = [...Array.from({ length: offset }, () => null), ...dates];
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
        {cells.map((date, index) => {
          if (!date) return <View key={`e${index}`} style={styles.cell} />;
          const record = byDate.get(date);
          const dayNumber = Number(date.slice(8));
          if (!record) {
            // Ngày trước khi vào ở: không phải thiếu số đo, để trống hẳn và ghi chú cho trình đọc màn hình.
            const beforeStay = firstStayDate != null && date < firstStayDate;
            return (
              <View key={date} style={styles.cell}>
                <View
                  accessibilityLabel={beforeStay ? `${Formatter.date(UtilityUsage.dateOf(date))}: ${t("utilities.beforeStay")}` : undefined}
                  style={[styles.day, beforeStay ? { backgroundColor: "transparent", opacity: 0.4 } : { backgroundColor: colors.surfaceMuted }]}
                >
                  <Text style={[styles.dayText, { color: colors.muted, fontWeight: "500" }]}>{dayNumber}</Text>
                </View>
              </View>
            );
          }
          const level = (record[metric] - min) / Math.max(0.0001, max - min);
          const strong = level > 0.55;
          return (
            <View key={date} style={styles.cell}>
              <Touchable
                onPress={() => onSelect(record)}
                accessibilityLabel={`${Formatter.date(UtilityUsage.dateOf(date))}: ${Formatter.decimal(record[metric], metric === "electricity" ? 2 : 3)} ${unit}`}
                style={[styles.day, { backgroundColor: color, opacity: 0.18 + level * 0.82 }]}
              >
                <Text style={[styles.dayText, { color: strong ? colors.onPrimary : colors.ink }]}>{dayNumber}</Text>
              </Touchable>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>{t("utilities.less")}</Text>
        {[0.2, 0.4, 0.6, 0.8, 1].map((value) => (
          <View key={value} style={[styles.legendCell, { backgroundColor: color, opacity: value }]} />
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
