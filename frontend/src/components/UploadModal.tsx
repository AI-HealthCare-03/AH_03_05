// src/components/UploadModal.tsx
import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity,
  StyleSheet, useWindowDimensions,
} from 'react-native';
import Icon from './Icon';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { colors, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onStart: () => void;
};

export default function UploadModal({ visible, onClose, onStart }: Props) {
  const [type, setType] = useState('처방전');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);

  const { isDesktop } = useBreakpoint();
  const { width } = useWindowDimensions();
  const cardWidth = isDesktop ? 520 : width - 40;

  const types = [
    { id: '처방전',  icon: 'doc' },
    { id: '약봉투',  icon: 'pill' },
    { id: '진료기록', icon: 'list' },
  ];
  const sources = [
    { id: 'camera',  label: '사진촬영',       icon: 'camera' },
    { id: 'gallery', label: '갤러리에서 선택', icon: 'image' },
    { id: 'pdf',     label: 'PDF 업로드',     icon: 'file' },
    { id: 'manual',  label: '직접입력',        icon: 'keyboard' },
  ];

  const handleClose = () => {
    setUploading(false);
    setUploadProgress(0);
    setUploadDone(false);
    onClose();
  };

  const handleSourcePress = () => {
    setUploading(true);
    let p = 0;
    const iv = setInterval(() => {
      p += 25;
      setUploadProgress(p);
      if (p >= 100) {
        clearInterval(iv);
        setUploadDone(true);
        setTimeout(() => { handleClose(); onStart(); }, 700);
      }
    }, 250);
  };

  const Content = () => (
    <>
      {/* 핸들 (모바일 바텀 시트) */}
      {!isDesktop && <View style={s.handle} />}

      {/* 헤더 */}
      <View style={s.head}>
        <View>
          <Text style={s.title}>의료 문서 업로드</Text>
          <Text style={s.subtitle}>어떤 문서를 분석할까요?</Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
          <Icon name="x" size={15} color={colors.accent700} />
        </TouchableOpacity>
      </View>

      {/* 업로드 진행 중 */}
      {uploading ? (
        <View style={{ paddingVertical: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <View style={[s.progressIcon, { backgroundColor: uploadDone ? colors.success : colors.accent }]}>
              <Icon name={uploadDone ? 'check' : 'camera'} size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>
                {uploadDone ? '업로드 완료' : '업로드 중...'}
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>
                {uploadDone ? '분석 화면으로 이동합니다.' : '잠시만 기다려주세요.'}
              </Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.accent }}>{uploadProgress}%</Text>
          </View>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${uploadProgress}%` as any }]} />
          </View>
        </View>
      ) : (
        <>
          {/* 문서 유형 선택 */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {types.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[s.typeCard, type === t.id && s.typeCardActive]}
                onPress={() => setType(t.id)}>
                <View style={[s.typeIcon, { backgroundColor: type === t.id ? colors.accent100 : colors.surface2 }]}>
                  <Icon name={t.icon} size={14} color={type === t.id ? colors.accent700 : colors.muted} />
                </View>
                <Text style={[{ fontSize: 12, fontWeight: '600' }, type === t.id && { color: colors.accent700 }]}>
                  {t.id}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 업로드 소스 — 2×2 그리드 */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            {sources.map((src) => (
              <TouchableOpacity
                key={src.id}
                style={[s.srcCard, { width: (cardWidth - 52) / 2 }]}
                onPress={handleSourcePress}>
                <View style={s.srcIcon}>
                  <Icon name={src.icon} size={16} color={colors.accent700} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600' }}>{src.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ fontSize: 11, color: colors.muted, textAlign: 'center' }}>
            JPG · PNG · PDF / 최대 10MB · 원본은 90일 후 자동 삭제
          </Text>
        </>
      )}
    </>
  );

  // 데스크탑 — 중앙 다이얼로그
  if (isDesktop) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <TouchableOpacity style={s.scrimCenter} activeOpacity={1} onPress={handleClose}>
          <TouchableOpacity activeOpacity={1} style={[s.dialogCard, { width: cardWidth }]} onPress={() => {}}>
            <Content />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }

  // 모바일 — 바텀 시트
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={s.scrim} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={s.sheet} onPress={() => {}}>
          <Content />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  // 스크림
  scrim:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  scrimCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },

  // 컨테이너
  sheet:      { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.s16 },
  dialogCard: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing.s16 },

  // 내부 요소
  handle:   { width: 36, height: 4, backgroundColor: colors.hairlineStrong, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  head:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  title:    { fontSize: 17, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 13, color: colors.muted },
  closeBtn: { width: 36, height: 36, borderRadius: 999, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center' },

  // 업로드 진행
  progressIcon: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  progressBg:   { height: 6, backgroundColor: colors.hairline, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%' as any, backgroundColor: colors.accent, borderRadius: 3 },

  // 유형 카드
  typeCard:       { flex: 1, alignItems: 'center', padding: 12, borderRadius: radii.md, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surface2 },
  typeCardActive: { backgroundColor: colors.accent50, borderColor: colors.accent },
  typeIcon:       { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },

  // 소스 카드
  srcCard: { alignItems: 'center', padding: 16, borderRadius: radii.md, borderWidth: 0.5, borderColor: colors.hairline, backgroundColor: colors.surface },
  srcIcon: { width: 36, height: 36, borderRadius: radii.sm, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
