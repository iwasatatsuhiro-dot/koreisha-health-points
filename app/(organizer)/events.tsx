import { useState, useRef } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Alert, Modal, TextInput, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';

import { AppText } from '@/src/components/ui/AppText';
import { AppButton } from '@/src/components/ui/AppButton';
import { Card } from '@/src/components/ui/Card';
import { eventsApi } from '@/src/services/api/endpoints';
import { useAuthStore } from '@/src/stores/authStore';
import { colors, radii, spacing, typography } from '@/src/theme';
import type { AppEvent, EventCategory, EventFeedbackSummary, EventRoster, EventSelectionMode } from '@/src/types';

const CATEGORY_OPTIONS: { value: EventCategory; label: string }[] = [
  { value: 'health', label: '健康' },
  { value: 'recreation', label: 'レクリエーション' },
  { value: 'volunteer', label: 'ボランティア' },
  { value: 'other', label: 'その他' },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}（${'日月火水木金土'[d.getDay()]}）`;
}

// ── イベント登録フォーム ───────────────────────────────────────────────────────

function RegisterModal({
  organizerId,
  organizerName,
  onClose,
}: {
  organizerId: string;
  organizerName: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('health');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [startDate, setStartDate] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('50');
  const [selectionMode, setSelectionMode] = useState<EventSelectionMode>('first-come');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      const startAt = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
      const lat = latitude ? parseFloat(latitude) : undefined;
      const lng = longitude ? parseFloat(longitude) : undefined;
      const cap = maxParticipants ? parseInt(maxParticipants, 10) : undefined;
      const deadline = applicationDeadline ? new Date(applicationDeadline).toISOString() : undefined;
      return eventsApi.registerEvent({
        title,
        category,
        location,
        latitude: Number.isFinite(lat) ? lat : undefined,
        longitude: Number.isFinite(lng) ? lng : undefined,
        startAt,
        endAt: startAt,
        description,
        organizerId,
        organizerName,
        pointsAwarded: parseInt(points, 10) || 50,
        maxParticipants: cap && Number.isFinite(cap) ? cap : undefined,
        selectionMode,
        applicationDeadline: deadline,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      Alert.alert('登録完了', 'イベントを登録しました。事務局の承認後に公開されます。');
      onClose();
    },
    onError: () => Alert.alert('エラー', 'イベントの登録に失敗しました。'),
  });

  function handleSubmit() {
    if (!title.trim()) { Alert.alert('イベント名を入力してください'); return; }
    if (!location.trim()) { Alert.alert('場所を入力してください'); return; }
    if (!startDate.trim()) { Alert.alert('開催日を入力してください（例: 2025-05-20）'); return; }
    if (selectionMode === 'lottery') {
      if (!maxParticipants.trim()) { Alert.alert('抽選制は定員の入力が必要です'); return; }
      if (!applicationDeadline.trim()) { Alert.alert('応募締切を入力してください'); return; }
    }
    mutation.mutate();
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.formContainer}>
          <AppText variant="title">イベント登録</AppText>

          <View style={styles.field}>
            <AppText variant="heading">イベント名 *</AppText>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="例: 健康ウォーキング教室" placeholderTextColor={colors.textMuted} />
          </View>

          <View style={styles.field}>
            <AppText variant="heading">カテゴリ</AppText>
            <View style={styles.categoryGrid}>
              {CATEGORY_OPTIONS.map((opt) => (
                <AppButton
                  key={opt.value}
                  label={opt.label}
                  variant={category === opt.value ? 'primary' : 'secondary'}
                  onPress={() => setCategory(opt.value)}
                  style={styles.catBtn}
                />
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <AppText variant="heading">場所 *</AppText>
            <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="例: 中央区円山公園" placeholderTextColor={colors.textMuted} />
          </View>

          <View style={styles.field}>
            <AppText variant="heading">会場の緯度・経度（位置情報不正防止）</AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TextInput style={[styles.input, { flex: 1 }]} value={latitude} onChangeText={setLatitude} placeholder="緯度 例: 43.0544" placeholderTextColor={colors.textMuted} keyboardType="numbers-and-punctuation" />
              <TextInput style={[styles.input, { flex: 1 }]} value={longitude} onChangeText={setLongitude} placeholder="経度 例: 141.3179" placeholderTextColor={colors.textMuted} keyboardType="numbers-and-punctuation" />
            </View>
          </View>

          <View style={styles.field}>
            <AppText variant="heading">開催日 *</AppText>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD（例: 2025-05-20）"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <View style={styles.field}>
            <AppText variant="heading">説明</AppText>
            <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} multiline numberOfLines={3} placeholder="イベントの説明を入力してください" placeholderTextColor={colors.textMuted} />
          </View>

          <View style={styles.field}>
            <AppText variant="heading">付与ポイント数</AppText>
            <TextInput style={styles.input} value={points} onChangeText={setPoints} keyboardType="number-pad" placeholder="50" placeholderTextColor={colors.textMuted} />
          </View>

          <View style={styles.field}>
            <AppText variant="heading">募集方式</AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <AppButton
                label="先着順"
                variant={selectionMode === 'first-come' ? 'primary' : 'secondary'}
                onPress={() => setSelectionMode('first-come')}
                style={{ flex: 1 }}
              />
              <AppButton
                label="抽選制"
                variant={selectionMode === 'lottery' ? 'primary' : 'secondary'}
                onPress={() => setSelectionMode('lottery')}
                style={{ flex: 1 }}
              />
            </View>
          </View>

          <View style={styles.field}>
            <AppText variant="heading">定員{selectionMode === 'lottery' ? ' *（抽選定員）' : ''}</AppText>
            <TextInput style={styles.input} value={maxParticipants} onChangeText={setMaxParticipants} keyboardType="number-pad" placeholder="例: 20" placeholderTextColor={colors.textMuted} />
          </View>

          {selectionMode === 'lottery' && (
            <View style={styles.field}>
              <AppText variant="heading">応募締切 *</AppText>
              <TextInput
                style={styles.input}
                value={applicationDeadline}
                onChangeText={setApplicationDeadline}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          )}

          <AppButton label={mutation.isPending ? '登録中...' : '登録する'} onPress={handleSubmit} disabled={mutation.isPending} />
          <AppButton label="キャンセル" variant="secondary" onPress={onClose} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── イベント編集フォーム ─────────────────────────────────────────────────────

function EditModal({
  event,
  organizerId,
  onClose,
}: {
  event: AppEvent;
  organizerId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(event.title);
  const [location, setLocation] = useState(event.location);
  const [description, setDescription] = useState(event.description);
  const [points, setPoints] = useState(String(event.pointsAwarded));
  const [maxParticipants, setMaxParticipants] = useState(
    event.maxParticipants ? String(event.maxParticipants) : '',
  );

  const mutation = useMutation({
    mutationFn: () => {
      const p = parseInt(points, 10);
      const cap = maxParticipants ? parseInt(maxParticipants, 10) : undefined;
      return eventsApi.updateEvent(event.id, organizerId, {
        title: title.trim(),
        location: location.trim(),
        description,
        pointsAwarded: Number.isFinite(p) ? p : undefined,
        maxParticipants: cap && Number.isFinite(cap) ? cap : undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event', event.id] });
      Alert.alert('更新完了', 'イベント情報を更新しました。');
      onClose();
    },
    onError: () => Alert.alert('エラー', 'イベントの更新に失敗しました。'),
  });

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.formContainer}>
          <AppText variant="title">イベントを編集</AppText>
          <AppText variant="caption" style={styles.muted}>
            日時・場所座標・募集方式は変更できません。変更が必要な場合は中止後に再登録してください。
          </AppText>

          <View style={styles.field}>
            <AppText variant="heading">イベント名</AppText>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor={colors.textMuted} />
          </View>

          <View style={styles.field}>
            <AppText variant="heading">場所</AppText>
            <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholderTextColor={colors.textMuted} />
          </View>

          <View style={styles.field}>
            <AppText variant="heading">説明</AppText>
            <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} multiline numberOfLines={4} placeholderTextColor={colors.textMuted} />
          </View>

          <View style={styles.field}>
            <AppText variant="heading">付与ポイント</AppText>
            <TextInput style={styles.input} value={points} onChangeText={setPoints} keyboardType="number-pad" placeholderTextColor={colors.textMuted} />
          </View>

          <View style={styles.field}>
            <AppText variant="heading">定員</AppText>
            <TextInput style={styles.input} value={maxParticipants} onChangeText={setMaxParticipants} keyboardType="number-pad" placeholder="上限なしの場合は空欄" placeholderTextColor={colors.textMuted} />
          </View>

          <AppButton label={mutation.isPending ? '更新中...' : '更新する'} onPress={() => mutation.mutate()} disabled={mutation.isPending} />
          <AppButton label="キャンセル" variant="secondary" onPress={onClose} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── 参加者名簿セクション ─────────────────────────────────────────────────────

const STATUS_LABEL: Record<'none' | 'pending' | 'won' | 'lost', string> = {
  none: '—',
  pending: '応募中',
  won: '当選',
  lost: '落選',
};

function RosterSection({ event }: { event: AppEvent }) {
  const roster = useQuery({
    queryKey: ['roster', event.id],
    queryFn: () => eventsApi.getRoster(event.id),
    staleTime: 5_000,
  });

  const handleShare = async (data: EventRoster) => {
    const header = `イベント名簿: ${event.title}\n開催日: ${event.startAt.slice(0, 10)}\n`;
    const lines = [
      'KKP-ID,ニックネーム,応募状態,応募日,参加,参加日時,付与pt',
      ...data.entries.map((e) =>
        [
          e.kkpId,
          e.nickname ?? '',
          STATUS_LABEL[e.applicationStatus],
          e.appliedAt?.slice(0, 10) ?? '',
          e.checkedIn ? '済' : '',
          e.checkedInAt?.slice(0, 16).replace('T', ' ') ?? '',
          e.pointsAwarded ?? '',
        ].join(','),
      ),
    ];
    try {
      await Share.share({ message: header + '\n' + lines.join('\n') });
    } catch {
      Alert.alert('共有に失敗しました');
    }
  };

  if (roster.isLoading) {
    return (
      <Card>
        <AppText variant="heading">参加者名簿</AppText>
        <AppText variant="body">読み込み中...</AppText>
      </Card>
    );
  }
  if (!roster.data) return null;

  const attendancePct =
    roster.data.winnerCount > 0
      ? Math.round((roster.data.checkedInCount / roster.data.winnerCount) * 100)
      : event.maxParticipants
        ? Math.round((roster.data.checkedInCount / event.maxParticipants) * 100)
        : null;

  return (
    <Card>
      <AppText variant="heading">参加者名簿（{roster.data.entries.length}名）</AppText>
      <View style={styles.rosterStats}>
        {event.selectionMode === 'lottery' && (
          <AppText variant="body" style={styles.muted}>
            応募 {roster.data.appliedCount} / 当選 {roster.data.winnerCount}
          </AppText>
        )}
        <AppText variant="body" style={styles.muted}>
          チェックイン済 {roster.data.checkedInCount}名
          {attendancePct != null ? `（出席率 ${attendancePct}%）` : ''}
        </AppText>
      </View>

      {roster.data.entries.length === 0 ? (
        <AppText variant="body" style={styles.muted}>
          まだ参加者はいません
        </AppText>
      ) : (
        <View style={styles.rosterList}>
          {roster.data.entries.map((e) => (
            <View key={e.kkpId} style={styles.rosterRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="body">{e.nickname ?? e.kkpId}</AppText>
                <AppText variant="caption" style={styles.muted}>
                  {e.kkpId}
                  {event.selectionMode === 'lottery' && `・${STATUS_LABEL[e.applicationStatus]}`}
                </AppText>
              </View>
              {e.checkedIn ? (
                <View style={[styles.statusBadge, styles.statusCheckedIn]}>
                  <AppText variant="caption" style={styles.statusBadgeText}>済</AppText>
                </View>
              ) : (
                <View style={[styles.statusBadge, styles.statusPending]}>
                  <AppText variant="caption" style={styles.statusBadgeText}>未</AppText>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <AppButton label="名簿を共有（CSV）" variant="secondary" onPress={() => handleShare(roster.data!)} />
    </Card>
  );
}

// ── イベント詳細（開催者用） ───────────────────────────────────────────────────

function EventDetailModal({
  event,
  organizerId,
  onClose,
}: {
  event: AppEvent;
  organizerId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [venueQrOpen, setVenueQrOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const scanned = useRef(false);

  const cancelMutation = useMutation({
    mutationFn: () => eventsApi.cancelEvent(event.id, organizerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event', event.id] });
      Alert.alert('中止しました', 'イベントを中止しました。参加者・応募者に通知されます。', [
        { text: 'OK', onPress: onClose },
      ]);
    },
    onError: () => Alert.alert('エラー', 'イベントの中止に失敗しました。'),
  });

  const handleCancel = () => {
    Alert.alert(
      'イベントを中止しますか？',
      '中止すると参加者・応募者に通知され、この操作は取り消せません。',
      [
        { text: 'やめる', style: 'cancel' },
        { text: '中止する', style: 'destructive', onPress: () => cancelMutation.mutate() },
      ],
    );
  };

  const checkInMutation = useMutation({
    mutationFn: (kkpId: string) => eventsApi.checkIn(event.id, organizerId, kkpId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['events'] });
      Alert.alert('チェックイン完了', `${data.kkpId} に ${data.pointsAwarded}pt を付与しました。`);
    },
    onError: (err: any) => {
      const code = err?.response?.data?.error;
      if (code === 'already_participated') {
        Alert.alert('参加済み', `このユーザはすでに参加登録済みです。`);
      } else if (code === 'user_not_found') {
        Alert.alert('ユーザ未登録', 'このKKP-IDは登録されていません。');
      } else {
        Alert.alert('エラー', 'チェックインに失敗しました。');
      }
    },
  });

  const drawMutation = useMutation({
    mutationFn: () => eventsApi.draw(event.id, organizerId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['events'] });
      Alert.alert('抽選完了', `応募 ${data.drawn}名 中 ${data.won}名を当選としました。結果は各応募者へ通知されます。`);
    },
    onError: (err: any) => {
      const code = err?.response?.data?.error;
      if (code === 'already_drawn') Alert.alert('抽選済み', 'このイベントは既に抽選済みです。');
      else Alert.alert('エラー', '抽選に失敗しました。');
    },
  });

  async function openScanner() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('カメラの許可が必要です');
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
    // data should be a KKP-ID
    if (/^KKP-\d{6}$/.test(data)) {
      checkInMutation.mutate(data);
    } else {
      Alert.alert('無効なQRコード', 'ユーザのイベント参加用QRコードを読み取ってください。');
    }
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.detailContainer}>
          <TouchableOpacity onPress={onClose} style={styles.backRow}>
            <AppText variant="body" style={styles.backText}>← 戻る</AppText>
          </TouchableOpacity>

          <AppText variant="title">{event.title}</AppText>
          <AppText variant="body" style={styles.muted}>{event.description}</AppText>

          <Card style={styles.infoCard}>
            <InfoRow label="日時" value={formatDate(event.startAt)} />
            <InfoRow label="場所" value={event.location} />
            <InfoRow label="参加者" value={`${event.participantCount}名`} />
            <InfoRow label="付与ポイント" value={`${event.pointsAwarded}pt`} />
            {event.status === 'cancelled' && (
              <InfoRow label="状態" value="中止済み" />
            )}
          </Card>

          {event.status === 'open' && (
            <Card>
              <AppText variant="heading">イベント管理</AppText>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <AppButton label="編集" variant="secondary" onPress={() => setEditOpen(true)} style={{ flex: 1 }} />
                <AppButton
                  label={cancelMutation.isPending ? '処理中...' : '中止する'}
                  variant="ghost"
                  onPress={handleCancel}
                  disabled={cancelMutation.isPending}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}

          <RosterSection event={event} />

          {event.selectionMode === 'lottery' && event.status === 'open' && (
            <Card>
              <AppText variant="heading">抽選管理</AppText>
              <AppText variant="body" style={styles.sectionNote}>
                このイベントは抽選制です。応募締切後に抽選を実行してください。結果は応募者へ自動通知されます。
              </AppText>
              {event.lotteryStatus === 'accepting' && (
                <AppButton
                  label={drawMutation.isPending ? '抽選中...' : '抽選を実行する'}
                  onPress={() => drawMutation.mutate()}
                  disabled={drawMutation.isPending}
                />
              )}
              {event.lotteryStatus === 'drawn' && (
                <AppText variant="body" style={styles.wonText}>抽選済み（当選者 {event.participantCount}名）</AppText>
              )}
            </Card>
          )}

          <FeedbackSummarySection eventId={event.id} organizerId={organizerId} />

          {event.status === 'open' && (
            <Card>
              <AppText variant="heading">参加者管理</AppText>

              <AppText variant="body" style={styles.sectionNote}>
                会場掲示用QRを参加者に見せてスキャンしてもらうか、参加者のQRをスキャンしてポイントを付与します。
              </AppText>

              <AppButton
                label="会場掲示用QRを表示"
                onPress={() => setVenueQrOpen(true)}
              />
              <AppButton
                label={checkInMutation.isPending ? '処理中...' : '参加者QRをスキャン'}
                variant="secondary"
                onPress={openScanner}
                disabled={checkInMutation.isPending}
              />
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* 会場掲示用QR */}
      <Modal visible={venueQrOpen} animationType="slide" transparent onRequestClose={() => setVenueQrOpen(false)}>
        <View style={styles.qrModalBg}>
          <View style={styles.qrModalCard}>
            <AppText variant="heading" style={styles.qrTitle}>会場掲示用QRコード</AppText>
            <AppText variant="caption" style={styles.qrSub}>参加者にスキャンしてもらってください</AppText>
            <View style={styles.qrWrapper}>
              <QRCode value={event.id} size={220} />
            </View>
            <AppText variant="body" style={styles.qrEventId}>{event.id}</AppText>
            <AppText variant="caption" style={styles.muted}>{event.title}</AppText>
            <AppButton label="閉じる" variant="secondary" onPress={() => setVenueQrOpen(false)} />
          </View>
        </View>
      </Modal>

      {/* 編集モーダル */}
      {editOpen && (
        <EditModal event={event} organizerId={organizerId} onClose={() => setEditOpen(false)} />
      )}

      {/* ユーザQRスキャナー */}
      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleBarcode}
          />
          <View style={styles.scannerOverlay}>
            <AppText variant="heading" style={styles.scannerTitle}>参加者QRをスキャン</AppText>
            <View style={styles.scanFrame} />
            <AppText variant="caption" style={styles.scannerHint}>
              参加者のイベント参加用QRコードをスキャンしてください
            </AppText>
            <AppButton label="キャンセル" variant="secondary" onPress={() => setScannerOpen(false)} />
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

function FeedbackSummarySection({
  eventId,
  organizerId,
}: {
  eventId: string;
  organizerId: string;
}) {
  const { data, isLoading } = useQuery<EventFeedbackSummary>({
    queryKey: ['event-feedback-summary', eventId, organizerId],
    queryFn: () => eventsApi.getFeedbackSummary(eventId, organizerId),
    enabled: !!eventId && !!organizerId,
    staleTime: 30_000,
  });

  return (
    <Card>
      <AppText variant="heading">参加者フィードバック</AppText>
      {isLoading && <AppText variant="body">読み込み中...</AppText>}
      {data && data.count === 0 && (
        <AppText variant="body" style={styles.muted}>まだフィードバックは寄せられていません。</AppText>
      )}
      {data && data.count > 0 && (
        <>
          <View style={fbStyles.summaryRow}>
            <AppText variant="title" style={fbStyles.avgText}>
              {data.averageRating?.toFixed(1) ?? '-'}
            </AppText>
            <AppText variant="caption" style={styles.muted}>
              / 5.0 ・ 回答 {data.count}件
            </AppText>
          </View>
          {(['5', '4', '3', '2', '1'] as const).map((key) => {
            const count = data.distribution[key];
            const pct = data.count > 0 ? Math.round((count / data.count) * 100) : 0;
            return (
              <View key={key} style={fbStyles.distRow}>
                <AppText variant="caption" style={fbStyles.distLabel}>{key}★</AppText>
                <View style={fbStyles.distTrack}>
                  <View style={[fbStyles.distFill, { width: `${pct}%` }]} />
                </View>
                <AppText variant="caption" style={fbStyles.distCount}>{count}</AppText>
              </View>
            );
          })}
          {data.recentComments.length > 0 && (
            <>
              <AppText variant="body" style={fbStyles.commentHead}>最近のコメント</AppText>
              {data.recentComments.map((c, i) => (
                <View key={i} style={fbStyles.commentRow}>
                  <AppText variant="caption" style={fbStyles.commentRating}>
                    {'★'.repeat(c.rating)}
                  </AppText>
                  <AppText variant="body">{c.comment}</AppText>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </Card>
  );
}

const fbStyles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  avgText: { color: colors.accent, fontWeight: '700' },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 2 },
  distLabel: { width: 32, color: colors.textMuted },
  distTrack: {
    flex: 1,
    height: 10,
    backgroundColor: colors.border,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  distFill: { height: '100%', backgroundColor: colors.accent },
  distCount: { width: 32, textAlign: 'right', color: colors.textMuted },
  commentHead: { fontWeight: '700', marginTop: spacing.sm },
  commentRow: {
    gap: 2,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  commentRating: { color: colors.accent, fontWeight: '700' },
});

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText variant="caption" style={styles.infoLabel}>{label}</AppText>
      <AppText variant="body" style={styles.infoValue}>{value}</AppText>
    </View>
  );
}

// ── メインスクリーン ───────────────────────────────────────────────────────────

export default function OrganizerEventsScreen() {
  const { kkpId } = useAuthStore();
  const [showRegister, setShowRegister] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventsApi.listEvents,
    staleTime: 30_000,
  });

  const myEvents = events.filter((e) => e.organizerId === kkpId);
  const openEvents = myEvents.filter((e) => e.status === 'open');
  const pastEvents = myEvents.filter((e) => e.status !== 'open');

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppText variant="title">イベント管理</AppText>

        <AppButton label="新規イベントを登録" onPress={() => setShowRegister(true)} />

        {isLoading ? (
          <AppText variant="body">読み込み中...</AppText>
        ) : (
          <>
            <AppText variant="heading">開催予定のイベント</AppText>
            {openEvents.length === 0 ? (
              <AppText variant="body" style={styles.empty}>開催予定のイベントはありません</AppText>
            ) : (
              openEvents.map((evt) => (
                <TouchableOpacity key={evt.id} onPress={() => setSelectedEvent(evt)} activeOpacity={0.7}>
                  <Card style={styles.eventCard}>
                    <AppText variant="heading">{evt.title}</AppText>
                    <AppText variant="body" style={styles.muted}>{formatDate(evt.startAt)} · {evt.location}</AppText>
                    <AppText variant="caption" style={styles.participants}>
                      参加者 {evt.participantCount}名 · {evt.pointsAwarded}pt付与
                    </AppText>
                  </Card>
                </TouchableOpacity>
              ))
            )}

            {pastEvents.length > 0 && (
              <>
                <AppText variant="heading" style={{ marginTop: spacing.md }}>過去のイベント</AppText>
                {pastEvents.map((evt) => (
                  <TouchableOpacity key={evt.id} onPress={() => setSelectedEvent(evt)} activeOpacity={0.7}>
                    <Card style={[styles.eventCard, styles.pastCard]}>
                      <AppText variant="heading" style={styles.muted}>{evt.title}</AppText>
                      <AppText variant="body" style={styles.muted}>{formatDate(evt.startAt)}</AppText>
                      <AppText variant="caption">参加者 {evt.participantCount}名</AppText>
                    </Card>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {showRegister && kkpId && (
        <RegisterModal
          organizerId={kkpId}
          organizerName="北区健康推進協会"
          onClose={() => setShowRegister(false)}
        />
      )}

      {selectedEvent && kkpId && (
        <EventDetailModal
          event={selectedEvent}
          organizerId={kkpId}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  eventCard: { gap: spacing.xs },
  pastCard: { opacity: 0.7 },
  muted: { color: colors.textMuted },
  participants: { color: colors.success, fontWeight: '700' },
  empty: { color: colors.textMuted },
  // Form
  formContainer: { padding: spacing.lg, gap: spacing.md },
  field: { gap: spacing.sm },
  input: {
    minHeight: 52,
    fontSize: typography.baseSize,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  multiline: { minHeight: 96, paddingTop: spacing.md, textAlignVertical: 'top' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catBtn: { flex: 1, minWidth: 120 },
  // Detail modal
  detailContainer: { padding: spacing.lg, gap: spacing.md },
  backRow: { marginBottom: spacing.xs },
  backText: { color: colors.accent },
  infoCard: { gap: spacing.sm },
  infoRow: { flexDirection: 'row', gap: spacing.md },
  infoLabel: { width: 80, color: colors.textMuted },
  infoValue: { flex: 1 },
  sectionNote: { color: colors.textMuted },
  // QR Modal
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
  qrEventId: { color: colors.textMuted, fontWeight: '700' },
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
    borderColor: colors.accent,
    borderRadius: radii.md,
  },
  scannerHint: { color: '#ccc', textAlign: 'center' },
  wonText: { color: colors.success, fontWeight: '700' },
  rosterStats: { gap: spacing.xs },
  rosterList: { gap: spacing.xs },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    minWidth: 44,
    alignItems: 'center',
  },
  statusCheckedIn: { backgroundColor: colors.success },
  statusPending: { backgroundColor: colors.textMuted },
  statusBadgeText: { color: '#FFFFFF', fontWeight: '700' },
});
