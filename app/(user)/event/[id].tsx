import { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, Alert, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { eventsApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, spacing, radii } from '@/src/theme';
import type { EventCategory } from '@/src/types';

const CATEGORY_LABEL: Record<EventCategory, string> = {
  health: '健康',
  recreation: 'レクリエーション',
  volunteer: 'ボランティア',
  other: 'その他',
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const kkpId = useAuthStore((s) => s.kkpId)!;

  const [permission, requestPermission] = useCameraPermissions();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [myQrOpen, setMyQrOpen] = useState(false);
  const scanned = useRef(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getEvent(id),
    enabled: !!id,
  });

  const attendMutation = useMutation({
    mutationFn: () => eventsApi.attend(id, kkpId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['event', id] });
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['history'] });
      Alert.alert('参加登録完了', `${data.pointsAwarded}ptを獲得しました！`);
    },
    onError: (err: any) => {
      const code = err?.response?.data?.error;
      if (code === 'already_participated') {
        Alert.alert('すでに参加済み', 'このイベントにはすでに参加登録されています。');
      } else if (code === 'date_mismatch') {
        Alert.alert('開催日が異なります', 'イベント開催日当日のみ参加登録できます。');
      } else if (code === 'event_closed') {
        Alert.alert('受付終了', 'このイベントは受付を終了しています。');
      } else {
        Alert.alert('エラー', '参加登録できませんでした。');
      }
    },
  });

  async function openScanner() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('カメラの許可が必要です', '設定からカメラのアクセスを許可してください。');
        return;
      }
    }
    scanned.current = false;
    setScannerOpen(true);
  }

  function handleBarcode({ data }: { data: string }) {
    if (scanned.current) return;
    scanned.current = true;
    setScannerOpen(false);
    // Validate that the QR contains the event ID
    if (data === id) {
      attendMutation.mutate();
    } else {
      Alert.alert('QRコードが一致しません', 'このイベントのQRコードを読み取ってください。');
    }
  }

  if (isLoading || !event) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <AppText variant="body">読み込み中...</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const isPast = event.status !== 'open';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <AppText variant="body" style={styles.backText}>← 一覧に戻る</AppText>
        </TouchableOpacity>

        <Card>
          <View style={styles.categoryRow}>
            <View style={styles.categoryBadge}>
              <AppText variant="caption" style={styles.categoryText}>
                {CATEGORY_LABEL[event.category]}
              </AppText>
            </View>
            {isPast && (
              <View style={styles.closedBadge}>
                <AppText variant="caption" style={styles.closedText}>受付終了</AppText>
              </View>
            )}
          </View>

          <AppText variant="title">{event.title}</AppText>
          <AppText variant="body">{event.description}</AppText>

          <View style={styles.infoGrid}>
            <InfoRow label="日時" value={formatDateTime(event.startAt)} />
            <InfoRow label="場所" value={event.location} />
            <InfoRow label="主催" value={event.organizerName} />
            <InfoRow
              label="参加者"
              value={`${event.participantCount}名${event.maxParticipants ? `（定員 ${event.maxParticipants}名）` : ''}`}
            />
            <InfoRow label="獲得ポイント" value={`${event.pointsAwarded}pt`} accent />
          </View>
        </Card>

        {!isPast && (
          <Card style={styles.actionCard}>
            <AppText variant="heading">参加方法</AppText>

            <View style={styles.actionSection}>
              <AppText variant="body" style={styles.actionLabel}>
                ① 会場のQRコードをスキャン
              </AppText>
              <AppText variant="caption" style={styles.actionNote}>
                会場に掲示されているQRコードをスキャンして参加登録します
              </AppText>
              <AppButton
                label={attendMutation.isPending ? '登録中...' : 'QRコードをスキャン'}
                onPress={openScanner}
                disabled={attendMutation.isPending}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.actionSection}>
              <AppText variant="body" style={styles.actionLabel}>
                ② 自分のQRを開催者に提示
              </AppText>
              <AppText variant="caption" style={styles.actionNote}>
                開催者にあなたのQRコードを読み取ってもらいます
              </AppText>
              <AppButton
                label="自分のQRコードを表示"
                variant="secondary"
                onPress={() => setMyQrOpen(true)}
              />
            </View>
          </Card>
        )}
      </ScrollView>

      {/* QRスキャナーモーダル */}
      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleBarcode}
          />
          <View style={styles.scannerOverlay}>
            <AppText variant="heading" style={styles.scannerTitle}>QRコードをスキャン</AppText>
            <View style={styles.scanFrame} />
            <AppText variant="caption" style={styles.scannerHint}>
              会場に掲示されているQRコードにカメラを向けてください
            </AppText>
            <AppButton label="キャンセル" variant="secondary" onPress={() => setScannerOpen(false)} />
          </View>
        </View>
      </Modal>

      {/* マイQRコードモーダル */}
      <Modal visible={myQrOpen} animationType="slide" transparent onRequestClose={() => setMyQrOpen(false)}>
        <View style={styles.qrModalBg}>
          <View style={styles.qrModalCard}>
            <AppText variant="heading" style={styles.qrTitle}>イベント参加用QRコード</AppText>
            <AppText variant="caption" style={styles.qrSub}>開催者に読み取ってもらってください</AppText>
            <View style={styles.qrWrapper}>
              <QRCode value={kkpId} size={200} />
            </View>
            <AppText variant="body" style={styles.qrId}>{kkpId}</AppText>
            <AppButton label="閉じる" variant="secondary" onPress={() => setMyQrOpen(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <AppText variant="caption" style={styles.infoLabel}>{label}</AppText>
      <AppText variant="body" style={[styles.infoValue, accent && styles.accentValue]}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: spacing.lg, gap: spacing.md },
  back: { marginBottom: spacing.xs },
  backText: { color: colors.primary },
  categoryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  categoryBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: { color: '#fff', fontWeight: '700' },
  closedBadge: {
    backgroundColor: colors.disabled,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  closedText: { color: '#fff', fontWeight: '700' },
  infoGrid: { gap: spacing.sm, marginTop: spacing.sm },
  infoRow: { flexDirection: 'row', gap: spacing.md },
  infoLabel: { width: 80, color: colors.textMuted },
  infoValue: { flex: 1 },
  accentValue: { color: colors.success, fontWeight: '700' },
  actionCard: { gap: spacing.md },
  actionSection: { gap: spacing.sm },
  actionLabel: { fontWeight: '700' },
  actionNote: { color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.border },
  // Scanner
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  scannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  scannerTitle: { color: '#fff' },
  scanFrame: {
    width: 200,
    height: 200,
    borderWidth: 3,
    borderColor: colors.primary,
    borderRadius: radii.md,
  },
  scannerHint: { color: '#ccc', textAlign: 'center' },
  // MyQR modal
  qrModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  qrModalCard: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    maxWidth: 360,
  },
  qrTitle: { textAlign: 'center' },
  qrSub: { color: colors.textMuted, textAlign: 'center' },
  qrWrapper: {
    padding: spacing.md,
    backgroundColor: '#fff',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrId: { color: colors.textMuted, fontWeight: '700' },
});
