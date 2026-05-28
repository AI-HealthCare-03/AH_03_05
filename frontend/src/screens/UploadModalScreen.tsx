import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useBreakpoint } from '../hooks/useBreakpoint';
import Icon from '../components/Icon';
import { colors, radii, spacing, typography } from '../theme';
import { uploadRecord } from '../api/records';
import type { UploadFile } from '../api/records';
import type { RecordType } from '../api/types';

const TYPE_MAP: Record<string, RecordType> = {
  '처방전': 'prescription',
  '약봉투': 'medicine_bag',
  '진료기록': 'medical_record',
};

const TYPES = [
  { id: '처방전', icon: 'doc' },
  { id: '약봉투', icon: 'pill' },
  { id: '진료기록', icon: 'list' },
];

const SOURCES = [
  { id: 'camera', label: '사진촬영', icon: 'camera' },
  { id: 'gallery', label: '갤러리에서 선택', icon: 'image' },
  { id: 'pdf', label: 'PDF 업로드', icon: 'file' },
  { id: 'manual', label: '직접입력', icon: 'keyboard' },
];

type SourceCardProps = {
  src: { id: string; label: string; icon: string };
  onPress: (id: string) => void;
};

function SourceCard({ src, onPress }: SourceCardProps) {
  return (
    <TouchableOpacity
      style={[s.srcCard, { flex: 1 }]}
      onPress={() => onPress(src.id)}
    >
      <View style={s.srcIcon}>
        <Icon name={src.icon} size={14} color={colors.accent700} />
      </View>
      <Text style={{ fontSize: typography.fz12, fontWeight: typography.fw6 }}>{src.label}</Text>
    </TouchableOpacity>
  );
}

export default function UploadModalScreen({ navigation }: any) {
  const [type, setType] = useState('처방전');
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const { isTabletOrAbove } = useBreakpoint();
  const { width } = useWindowDimensions();
  const cardWidth = isTabletOrAbove ? 520 : width - 40;

  const handleClose = () => {
    setUploading(false);
    setUploadDone(false);
    setUploadError('');
    navigation.goBack();
  };

  const doUpload = async (file: UploadFile | globalThis.File) => {
    setUploadError('');
    setUploading(true);
    try {
      const res = await uploadRecord(file, TYPE_MAP[type]);
      setUploadDone(true);
      setTimeout(() => {
        (navigation as any).navigate('Main', {
          screen: 'HomeTab',
          params: { screen: 'OCRProcessing', params: { recordId: res.record_id } },
        });
      }, 700);
    } catch (e: any) {
      setUploading(false);
      if (e?.response?.status === 413) {
        setUploadError('파일 크기가 너무 큽니다. 10MB 이하의 파일을 업로드해주세요.');
      } else {
        setUploadError(e?.response?.data?.detail ?? e?.message ?? '업로드에 실패했습니다.');
      }
    }
  };

  const pickFileWeb = (srcId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    if (srcId === 'camera') {
      input.accept = 'image/*';
      (input as any).capture = 'environment';
    } else if (srcId === 'gallery') {
      input.accept = 'image/*';
    } else {
      input.accept = 'application/pdf';
    }
    input.onchange = (e: Event) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) doUpload(f);
    };
    input.click();
  };

  const handleSourcePress = async (srcId: string) => {
    if (srcId === 'manual') {
      setUploadError('직접입력 기능은 준비 중입니다.');
      return;
    }

    if (Platform.OS === 'web') {
      pickFileWeb(srcId);
      return;
    }

    if (srcId === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert('권한 필요', '카메라 권한이 필요합니다.'); return; }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85, allowsEditing: false });
      if (result.canceled || !result.assets?.length) return;
      const a = result.assets[0];
      await doUpload({ uri: a.uri, name: a.fileName ?? `photo_${Date.now()}.jpg`, type: a.mimeType ?? 'image/jpeg' });
    } else if (srcId === 'gallery') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('권한 필요', '사진 라이브러리 권한이 필요합니다.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, allowsEditing: false });
      if (result.canceled || !result.assets?.length) return;
      const a = result.assets[0];
      await doUpload({ uri: a.uri, name: a.fileName ?? `image_${Date.now()}.jpg`, type: a.mimeType ?? 'image/jpeg' });
    } else if (srcId === 'pdf') {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.length) return;
      const a = result.assets[0];
      await doUpload({ uri: a.uri, name: a.name, type: a.mimeType ?? 'application/pdf' });
    }
  };

  const content = (
    <>
      {!isTabletOrAbove && <View style={s.modalHandle} />}
      <View style={s.modalHead}>
        <View>
          <Text style={s.modalTitle}>의료 문서 업로드</Text>
          <Text style={s.modalSub}>어떤 문서를 분석할까요?</Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
          <Icon name="x" size={15} color={colors.accent700} />
        </TouchableOpacity>
      </View>

      {uploading ? (
        <View style={{ paddingVertical: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s12, marginBottom: spacing.s16 }}>
            <View style={{ width: 40, height: 40, borderRadius: radii.pill, backgroundColor: uploadDone ? colors.success : colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={uploadDone ? 'check' : 'camera'} size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.fz15, fontWeight: typography.fw7, color: colors.ink }}>
                {uploadDone ? '업로드 완료' : '업로드 중...'}
              </Text>
              <Text style={{ fontSize: typography.fz13, color: colors.muted }}>
                {uploadDone ? '분석 화면으로 이동합니다.' : '잠시만 기다려주세요.'}
              </Text>
            </View>
          </View>
          <View style={s.progressBg}>
            <View style={[s.progressFill, uploadDone && { width: '100%' as any }]} />
          </View>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: spacing.s8, marginBottom: 14 }}>
            {TYPES.map((t) => (
              <TouchableOpacity key={t.id} style={[s.typeCard, type === t.id && s.typeCardActive]} onPress={() => setType(t.id)}>
                <View style={[s.typeIcon, { backgroundColor: type === t.id ? colors.accent100 : colors.surface2 }]}>
                  <Icon name={t.icon} size={14} color={type === t.id ? colors.accent700 : colors.muted} />
                </View>
                <Text style={[{ fontSize: typography.fz12, fontWeight: typography.fw6 }, type === t.id && { color: colors.accent700 }]}>{t.id}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ gap: spacing.s8, marginBottom: 14 }}>
            {[SOURCES.slice(0, 2), SOURCES.slice(2, 4)].map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row', gap: spacing.s8 }}>
                {row.map((src) => (
                  <SourceCard key={src.id} src={src} onPress={handleSourcePress} />
                ))}
              </View>
            ))}
          </View>

          {uploadError ? (
            <View style={s.errorBox}>
              <Icon name="alert" size={13} color={colors.danger} />
              <Text style={s.errorText}>{uploadError}</Text>
            </View>
          ) : null}

          <Text style={{ fontSize: typography.fz11, color: colors.muted, textAlign: 'center' }}>
            JPG · PNG · PDF / 최대 10MB · 원본은 90일 후 자동 삭제
          </Text>
        </>
      )}
    </>
  );

  if (isTabletOrAbove) {
    return (
      <TouchableOpacity style={s.scrimCenter} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={[s.modalCenter, { width: cardWidth }]} onPress={() => {}}>
          {content}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={s.scrim} activeOpacity={1} onPress={handleClose}>
      <TouchableOpacity activeOpacity={1} style={s.modal} onPress={() => {}}>
        {content}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  scrimCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.s20 },
  modalCenter: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing.s20 },
  modalHandle: { width: 36, height: 4, backgroundColor: colors.hairlineStrong, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.s16 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  modalTitle: { fontSize: typography.fz17, fontWeight: typography.fw7, color: colors.ink },
  modalSub: { fontSize: typography.fz13, color: colors.muted },
  closeBtn: { width: 36, height: 36, borderRadius: 999, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center' },
  typeCard: { flex: 1, alignItems: 'center', padding: spacing.s12, borderRadius: radii.md, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surface2 },
  typeCardActive: { backgroundColor: colors.accent50, borderColor: colors.accent },
  typeIcon: { width: 28, height: 28, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  srcCard: { alignItems: 'center', padding: spacing.s12, borderRadius: radii.md, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surface2 },
  srcIcon: { width: 28, height: 28, borderRadius: radii.sm, backgroundColor: colors.accent100, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  progressBg: { height: 6, backgroundColor: colors.hairline, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3, width: '60%' },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.s8, backgroundColor: colors.danger50, borderRadius: radii.sm, padding: spacing.s12, marginBottom: spacing.s8 },
  errorText: { flex: 1, fontSize: typography.fz12, color: colors.danger, lineHeight: 18 },
});
