import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useBreakpoint } from '../hooks/useBreakpoint';
import Icon from '../components/Icon';
import { colors, radii, spacing, typography } from '../theme';

export default function UploadModalScreen({ navigation }: any) {
  const [type, setType] = useState('처방전');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);

  const types = [
    { id: '처방전', icon: 'doc' },
    { id: '약봉투', icon: 'pill' },
    { id: '진료기록', icon: 'list' },
  ];
  const sources = [
    { id: 'camera', label: '사진촬영', icon: 'camera' },
    { id: 'gallery', label: '갤러리에서 선택', icon: 'image' },
    { id: 'pdf', label: 'PDF 업로드', icon: 'file' },
    { id: 'manual', label: '직접입력', icon: 'keyboard' },
  ];

  const { isTabletOrAbove } = useBreakpoint();
  const { width } = useWindowDimensions();
  const cardWidth = isTabletOrAbove ? 520 : width - 40;

  const handleClose = () => {
    setUploading(false);
    setUploadProgress(0);
    setUploadDone(false);
    navigation.goBack();
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
        setTimeout(() => {
          (navigation as any).navigate('Main', {
            screen: 'HomeTab',
            params: { screen: 'OCRProcessing' },
          });
        }, 700);
      }
    }, 250);
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
            <Text style={{ fontSize: 16, fontWeight: typography.fw7, color: colors.accent }}>{uploadProgress}%</Text>
          </View>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${uploadProgress}%` as any }]} />
          </View>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: spacing.s8, marginBottom: 14 }}>
            {types.map((t) => (
              <TouchableOpacity key={t.id} style={[s.typeCard, type === t.id && s.typeCardActive]} onPress={() => setType(t.id)}>
                <View style={[s.typeIcon, { backgroundColor: type === t.id ? colors.accent100 : colors.surface2 }]}>
                  <Icon name={t.icon} size={14} color={type === t.id ? colors.accent700 : colors.muted} />
                </View>
                <Text style={[{ fontSize: typography.fz12, fontWeight: typography.fw6 }, type === t.id && { color: colors.accent700 }]}>{t.id}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            {sources.map((src) => (
              <TouchableOpacity
                key={src.id}
                style={[s.srcCard, { width: (cardWidth - 52) / 2 }]}
                onPress={handleSourcePress}
              >
                <View style={s.srcIcon}>
                  <Icon name={src.icon} size={16} color={colors.accent700} />
                </View>
                <Text style={{ fontSize: typography.fz13, fontWeight: typography.fw6 }}>{src.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

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
  srcCard: { alignItems: 'center', padding: spacing.s16, borderRadius: radii.md, borderWidth: 0.5, borderColor: colors.hairline, backgroundColor: colors.surface },
  srcIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.s8 },
  progressBg: { height: 6, backgroundColor: colors.hairline, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
});
