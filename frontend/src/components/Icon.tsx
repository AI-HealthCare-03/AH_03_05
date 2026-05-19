// Icon.tsx
// Feather + MaterialCommunityIcons + Ionicons 통합
// Usage: <Icon name="home" size={16} color="#fff" />

import React from 'react';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

type FeatherName = React.ComponentProps<typeof Feather>['name'];
type MCIName     = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface IconProps { name: string; size?: number; color?: string; }

// ─── Feather map ─────────────────────────────────────────────────────────────
const FEATHER_MAP: Record<string, FeatherName> = {
  home:           'home',
  doc:            'file-text',
  chat:           'message-circle',
  settings:       'settings',
  bell:           'bell',
  camera:         'camera',
  image:          'image',
  file:           'file',
  edit:           'edit-2',
  scan:           'maximize-2',
  search:         'search',
  send:           'send',
  check:          'check',
  'check-circle': 'check-circle',
  x:              'x',
  plus:           'plus',
  minus:          'minus',
  'chevron-left':  'chevron-left',
  'chevron-right': 'chevron-right',
  'chevron-down':  'chevron-down',
  'arrow-left':    'arrow-left',
  'arrow-right':   'arrow-right',
  logout:         'log-out',
  trash:          'trash-2',
  shield:         'shield',
  info:           'info',
  alert:          'alert-triangle',
  'alert-circle': 'alert-circle',
  calendar:       'calendar',
  clock:          'clock',
  user:           'user',
  link:           'link',
  mail:           'mail',
  lock:           'lock',
  device:         'smartphone',
  globe:          'globe',
  list:           'list',
  moon:           'moon',
  sun:            'sun',
  wand:           'zap',
  menu:           'menu',
  ban:            'slash',
  keyboard:       'type',
  pdf:            'file-text',
  heart:          'heart',
  upload:         'upload-cloud',
  'cloud-upload': 'upload-cloud',
  'upload-cloud': 'upload-cloud',
  'log-out':      'log-out',
  'shield-check': 'shield',
  'chevron-forward': 'chevron-right',
  close:          'x',
  star:           'star',
  eye:            'eye',
  'eye-off':      'eye-off',
  copy:           'copy',
  share:          'share-2',
  external:       'external-link',
  refresh:        'refresh-cw',
};

// ─── MCI map (icons not in Feather) ──────────────────────────────────────────
const MCI_MAP: Record<string, MCIName> = {
  pill:    'pill',
  robot:   'robot',
  fire:    'fire',
  running: 'run',
  wand:    'magic-staff',
};

// ─── Ionicons map (richer icon set from target design) ───────────────────────
const IONICONS_MAP: Record<string, IoniconsName> = {
  chatbubbles:          'chatbubbles',
  'cloud-upload-sharp': 'cloud-upload-sharp',
  'notifications':      'notifications',
  'lock-closed':        'lock-closed',
  'shield-checkmark':   'shield-checkmark',
  'person':             'person',
  'log-out-sharp':      'log-out-sharp',
  'warning':            'warning',
  'document':           'document',
  'document-text':      'document-text',
  'medkit':             'medkit',
  'fitness':            'fitness',
  'bar-chart':          'bar-chart',
  'time':               'time',
  'checkmark-circle':   'checkmark-circle',
  'close-circle':       'close-circle',
  'ellipsis-horizontal':'ellipsis-horizontal',
  'chevron-back':       'chevron-back',
  'add':                'add',
  'remove':             'remove',
};

export default function Icon({ name, size = 18, color = '#0F172A' }: IconProps) {
  if (IONICONS_MAP[name]) {
    return <Ionicons name={IONICONS_MAP[name]} size={size} color={color} />;
  }
  if (MCI_MAP[name]) {
    return <MaterialCommunityIcons name={MCI_MAP[name]} size={size} color={color} />;
  }
  const featherName = FEATHER_MAP[name];
  if (featherName) {
    return <Feather name={featherName} size={size} color={color} />;
  }
  return <Feather name="circle" size={size} color={color} />;
}


