import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

type Tab = 'home' | 'regulations';

const regulations = [
  { id: 'hours', number: '01', title: 'Giờ ra vào ký túc xá', summary: 'Tuân thủ thời gian mở cửa và quy trình đăng ký khi về muộn.', detail: 'Sinh viên xuất trình thẻ khi ra vào. Nếu cần về muộn, hãy đăng ký với ban quản lý theo quy định của ký túc xá.' },
  { id: 'safety', number: '02', title: 'An toàn phòng ở', summary: 'Giữ lối thoát hiểm thông thoáng và sử dụng thiết bị điện an toàn.', detail: 'Không tự ý sửa hệ thống điện hoặc dùng thiết bị có nguy cơ cháy nổ. Báo ngay cho ban quản lý khi phát hiện sự cố.' },
  { id: 'shared-space', number: '03', title: 'Không gian chung', summary: 'Giữ vệ sinh và tôn trọng thời gian nghỉ ngơi của mọi người.', detail: 'Dọn dẹp sau khi sử dụng khu vực chung, giữ trật tự và bỏ rác đúng nơi quy định.' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>S</Text></View>
            <View>
              <Text style={styles.brandName}>Smart Dormitory</Text>
              <Text style={styles.brandCaption}>Cổng thông tin sinh viên</Text>
            </View>
          </View>

          {activeTab === 'home' ? (
            <>
              <View style={styles.hero}>
                <Text style={styles.heroEyebrow}>ỨNG DỤNG MẪU</Text>
                <Text style={styles.heroTitle}>Ký túc xá trong tầm tay</Text>
                <Text style={styles.heroDescription}>Theo dõi thông tin cần thiết và xem nhanh nội quy ngay trên điện thoại.</Text>
                <Pressable style={styles.heroButton} onPress={() => setActiveTab('regulations')}>
                  <Text style={styles.heroButtonText}>Xem nội quy  →</Text>
                </Pressable>
              </View>

              <Text style={styles.sectionTitle}>Dành cho bạn</Text>
              <Pressable style={styles.featureCard} onPress={() => setActiveTab('regulations')}>
                <View style={styles.featureIcon}><Text style={styles.featureIconText}>01</Text></View>
                <View style={styles.featureBody}>
                  <Text style={styles.featureTitle}>Nội quy ký túc xá</Text>
                  <Text style={styles.featureDescription}>Xem các quy định cơ bản khi ở nội trú.</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
              <Pressable style={styles.featureCard} onPress={() => Alert.alert('Bản dùng thử', 'Tính năng thông báo sẽ được kết nối với hệ thống sau.')}>
                <View style={[styles.featureIcon, styles.featureIconMint]}><Text style={styles.featureIconText}>02</Text></View>
                <View style={styles.featureBody}>
                  <Text style={styles.featureTitle}>Thông báo</Text>
                  <Text style={styles.featureDescription}>Xem thông tin mới từ ban quản lý.</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
              <Text style={styles.demoNote}>Dữ liệu trên màn hình là nội dung minh họa cho bản dùng thử.</Text>
            </>
          ) : (
            <>
              <Text style={styles.pageEyebrow}>THÔNG TIN NỘI TRÚ</Text>
              <Text style={styles.pageTitle}>Nội quy ký túc xá</Text>
              <Text style={styles.pageDescription}>Chạm vào từng mục để đọc nội dung. Quy định chính thức sẽ được cập nhật từ hệ thống.</Text>
              {regulations.map((rule) => {
                const expanded = expandedRule === rule.id;
                return (
                  <Pressable key={rule.id} style={styles.ruleCard} onPress={() => setExpandedRule(expanded ? null : rule.id)} accessibilityRole="button" accessibilityState={{ expanded }}>
                    <View style={styles.ruleTop}>
                      <Text style={styles.ruleNumber}>{rule.number}</Text>
                      <Text style={styles.ruleTitle}>{rule.title}</Text>
                      <Text style={styles.chevron}>{expanded ? '⌄' : '›'}</Text>
                    </View>
                    <Text style={styles.ruleSummary}>{rule.summary}</Text>
                    {expanded && <Text style={styles.ruleDetail}>{rule.detail}</Text>}
                  </Pressable>
                );
              })}
              <Text style={styles.demoNote}>Nội dung minh họa, chưa thay thế nội quy chính thức.</Text>
            </>
          )}
        </ScrollView>

        <View style={styles.tabBar}>
          <Pressable style={styles.tab} onPress={() => setActiveTab('home')} accessibilityRole="tab" accessibilityState={{ selected: activeTab === 'home' }}>
            <Text style={[styles.tabIcon, activeTab === 'home' && styles.tabActive]}>⌂</Text>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabActive]}>Trang chủ</Text>
          </Pressable>
          <Pressable style={styles.tab} onPress={() => setActiveTab('regulations')} accessibilityRole="tab" accessibilityState={{ selected: activeTab === 'regulations' }}>
            <Text style={[styles.tabIcon, activeTab === 'regulations' && styles.tabActive]}>≡</Text>
            <Text style={[styles.tabLabel, activeTab === 'regulations' && styles.tabActive]}>Nội quy</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FB' },
  container: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 36 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  brandMark: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#2257D5', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  brandMarkText: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  brandName: { color: '#14213D', fontSize: 17, fontWeight: '800' },
  brandCaption: { color: '#8290A6', fontSize: 12, marginTop: 2 },
  hero: { backgroundColor: '#2257D5', borderRadius: 26, padding: 25, marginBottom: 31 },
  heroEyebrow: { color: '#BFD4FF', fontSize: 11, fontWeight: '800', letterSpacing: 1.6, marginBottom: 13 },
  heroTitle: { color: '#FFFFFF', fontSize: 29, lineHeight: 36, fontWeight: '800', maxWidth: 270 },
  heroDescription: { color: '#DCE7FF', fontSize: 14, lineHeight: 21, marginTop: 12, marginBottom: 23 },
  heroButton: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 17, paddingVertical: 12 },
  heroButtonText: { color: '#2257D5', fontWeight: '800', fontSize: 14 },
  sectionTitle: { color: '#14213D', fontSize: 20, fontWeight: '800', marginBottom: 15 },
  featureCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E9EDF4' },
  featureIcon: { width: 45, height: 45, borderRadius: 14, backgroundColor: '#E7EEFF', alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  featureIconMint: { backgroundColor: '#DFF8EE' },
  featureIconText: { color: '#2257D5', fontWeight: '800', fontSize: 13 },
  featureBody: { flex: 1 },
  featureTitle: { color: '#14213D', fontSize: 15, fontWeight: '700' },
  featureDescription: { color: '#77859B', fontSize: 12, lineHeight: 18, marginTop: 4 },
  chevron: { color: '#90A0B9', fontSize: 25, marginLeft: 7 },
  demoNote: { color: '#98A3B5', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 20 },
  pageEyebrow: { color: '#2257D5', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginTop: 8 },
  pageTitle: { color: '#14213D', fontSize: 28, fontWeight: '800', marginTop: 8 },
  pageDescription: { color: '#77859B', fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 23 },
  ruleCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 17, marginBottom: 12, borderWidth: 1, borderColor: '#E9EDF4' },
  ruleTop: { flexDirection: 'row', alignItems: 'center' },
  ruleNumber: { color: '#2257D5', fontSize: 14, fontWeight: '800', marginRight: 14 },
  ruleTitle: { color: '#14213D', fontSize: 15, fontWeight: '700', flex: 1 },
  ruleSummary: { color: '#77859B', fontSize: 13, lineHeight: 20, marginTop: 10 },
  ruleDetail: { color: '#3E4D65', fontSize: 13, lineHeight: 20, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EEF1F6' },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E8ECF3', paddingTop: 9, paddingBottom: 6 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  tabIcon: { color: '#9AA6B8', fontSize: 25, lineHeight: 27 },
  tabLabel: { color: '#9AA6B8', fontSize: 11, fontWeight: '700', marginTop: 3 },
  tabActive: { color: '#2257D5' },
});
