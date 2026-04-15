import { useRef, useState } from 'react';
import { View, StyleSheet, TextInput, Alert, ScrollView, Modal } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { secretariatApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, radii, spacing, typography } from '@/src/theme';
import type { RegisterResult } from '@/src/types';

const KKP_ID_PATTERN = /^(KKP|ORG)-\d{6}$/;

function parseScannedPayload(raw: string): string | null {
  const s = raw.trim().toUpperCase();
  const direct = s.match(/(KKP|ORG)-\d{6}/);
  return direct ? direct[0] : null;
}

function formatBoundAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export default function Register() {
  const [kkpId, setKkpId] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const ensureDeviceId = useAuthStore((s) => s.ensureDeviceId);
  const tutorialCompletedAt = useAuthStore((s) => s.tutorialCompletedAt);
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  const mutation = useMutation({
    mutationFn: (args: { id: string; forceTransfer?: boolean }) =>
      secretariatApi.registerUser(args.id, ensureDeviceId(), {
        forceTransfer: args.forceTransfer,
      }),
    onSuccess: (result: RegisterResult, variables) => {
      if (result.kind === 'device_conflict') {
        Alert.alert(
          '他の端末で利用中です',
          `この KKP-ID は別の端末（${formatBoundAt(result.boundAt)} 登録）で利用中です。機種変更の場合は、前の端末のアプリは利用できなくなります。この端末に切り替えますか？`,
          [
            { text: 'キャンセル', style: 'cancel' },
            {
              text: 'この端末に切り替える',
              style: 'destructive',
              onPress: () => mutation.mutate({ id: variables.id, forceTransfer: true }),
            },
          ],
        );
        return;
      }
      const { profile } = result;
      setSession({ kkpId: profile.kkpId, role: profile.role, nickname: profile.nickname });
      if (profile.role === 'user' && !tutorialCompletedAt) {
        router.replace('/(user)/tutorial');
        return;
      }
      const dest = profile.role === 'organizer' ? '/(organizer)/home' : '/(user)/home';
      router.replace(dest);
    },
    onError: () => {
      Alert.alert('登録できませんでした', 'KKP-ID をご確認のうえ再度お試しください。');
    },
  });

  const submit = (id: string) => {
    const trimmed = id.trim().toUpperCase();
    if (!trimmed) {
      Alert.alert('KKP-ID を入力してください');
      return;
    }
    if (!KKP_ID_PATTERN.test(trimmed)) {
      Alert.alert('KKP-ID の形式が正しくありません', '例: KKP-000001（英字3文字＋ハイフン＋数字6桁）');
      return;
    }
    setKkpId(trimmed);
    mutation.mutate({ id: trimmed });
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(
          'カメラ権限が必要です',
          'QR コードを読み取るにはカメラの使用を許可してください。',
        );
        return;
      }
    }
    scannedRef.current = false;
    setScannerOpen(true);
  };

  const handleBarcode = (result: { data: string }) => {
    if (scannedRef.current) return;
    const parsed = parseScannedPayload(result.data);
    if (!parsed) return;
    scannedRef.current = true;
    setScannerOpen(false);
    submit(parsed);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">ユーザ登録</AppText>
        <AppText variant="body">
          お手元の通知に記載の QR コードを読み取るか、KKP-ID を入力してください。
        </AppText>

        <AppButton label="QRコードを読み取る" onPress={openScanner} />

        <View style={styles.field}>
          <AppText variant="heading">KKP-ID</AppText>
          <TextInput
            value={kkpId}
            onChangeText={setKkpId}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="例: KKP-000001"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            accessibilityLabel="KKP-ID入力欄"
          />
        </View>

        <AppButton
          label={mutation.isPending ? '登録中...' : '登録する'}
          onPress={() => submit(kkpId)}
          disabled={mutation.isPending}
          variant="secondary"
        />

        <AppText variant="caption" style={{ marginTop: spacing.md }}>
          テスト用 ID: KKP-000001 (ユーザ) / ORG-000001 (開催者)
        </AppText>
        <AppText variant="caption">
          ※ 1つの KKP-ID は1台の端末でのみ利用できます。機種変更時はこの画面から再登録してください。
        </AppText>
      </ScrollView>

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
              通知はがきに記載の QR コードにカメラを向けてください
            </AppText>
            <AppButton label="キャンセル" variant="secondary" onPress={() => setScannerOpen(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  field: { gap: spacing.sm, marginTop: spacing.md },
  input: {
    minHeight: 56,
    fontSize: typography.baseSize * 1.2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  scannerTitle: { color: '#FFFFFF' },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scannerHint: { color: '#FFFFFF', textAlign: 'center' },
});
