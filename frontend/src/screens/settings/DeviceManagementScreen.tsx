import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useApp } from '../../context/AppContext';
import Icon from '../../components/Icon';
import { colors, spacing, typography } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import ScreenLayout from '../../components/ScreenLayout';
import { s } from './_settingsShared';

type Device = {
  id: string;
  name: string;
  loc: string;
  at: string;
  current: boolean;
  icon: string;
};

const INITIAL_DEVICES: Device[] = [
  { id: 'd1', name: 'MacBook Air · Safari', loc: '서울, 한국', at: '지금 사용 중', current: true, icon: 'doc' },
  { id: 'd2', name: 'iPhone 15 · MediPT 앱', loc: '서울, 한국', at: '12시간 전', current: false, icon: 'device' },
  { id: 'd3', name: 'Chrome · Windows', loc: '부산, 한국', at: '3일 전', current: false, icon: 'globe' },
];

type DeviceRowProps = {
  device: Device;
  isFirst: boolean;
  onRevoke: (id: string) => void;
};

function DeviceRow({ device: d, isFirst, onRevoke }: DeviceRowProps) {
  return (
    <View style={[s.rowItem, !isFirst && { borderTopWidth: 0.5, borderTopColor: colors.hairline }]}>
      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.accent50, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={d.icon} size={18} color={colors.accent700} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.s12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s8 }}>
          <Text style={{ fontSize: typography.fz14, fontWeight: typography.fw6 }}>{d.name}</Text>
          {d.current && <Badge variant="success">현재 기기</Badge>}
        </View>
        <Text style={{ fontSize: typography.fz12, color: colors.muted }}>{d.loc} · {d.at}</Text>
      </View>
      {!d.current && (
        <Button variant="ghost" size="sm" onPress={() => onRevoke(d.id)}>로그아웃</Button>
      )}
    </View>
  );
}

export function DeviceManagementScreen({ navigation }: any) {
  const { flash } = useApp();
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);

  const revoke = (id: string) => { setDevices(prev => prev.filter(d => d.id !== id)); flash('해당 기기에서 로그아웃 했어요'); };

  return (
    <ScreenLayout title="로그인 기기 관리" back onBack={() => navigation.getState().index > 0 ? navigation.goBack() : navigation.navigate('Settings')} scrollable>
      <Card shadow noPadding style={{ overflow: 'hidden', marginBottom: 18 }}>
        {devices.map((d, i) => (
          <DeviceRow key={d.id} device={d} isFirst={i === 0} onRevoke={revoke} />
        ))}
      </Card>
      <Button
        variant="danger"
        size="md"
        onPress={() => { setDevices(prev => prev.filter(d => d.current)); flash('다른 기기는 모두 로그아웃 했어요'); }}
        fullWidth
      >다른 모든 기기 로그아웃</Button>
    </ScreenLayout>
  );
}

export default DeviceManagementScreen;
