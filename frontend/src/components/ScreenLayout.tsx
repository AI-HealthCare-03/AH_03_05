import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, RefreshControl,
} from 'react-native';
import Icon from './Icon';
import { colors, radii, spacing, typography } from '../theme';
import { useBreakpoint } from '../hooks/useBreakpoint';

const CONTENT_MAX_WIDTH = 900;

interface ScreenLayoutProps {
  children: React.ReactNode;

  // Simple header (detail screens): title row with optional back + right
  title?: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;

  // Extended header (list screens): extra content below the title row
  headerExtra?: React.ReactNode;

  // Fully custom header: replaces the auto-generated header content
  // (topBar container with correct bg/border/padding is still rendered)
  header?: React.ReactNode;

  // No header at all
  noHeader?: boolean;

  // Body options
  scrollable?: boolean;
  scrollPadding?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: object;
}

export default function ScreenLayout({
  children,
  title,
  subtitle,
  back,
  onBack,
  right,
  headerExtra,
  header,
  noHeader,
  scrollable,
  scrollPadding = true,
  refreshing,
  onRefresh,
  contentStyle,
}: ScreenLayoutProps) {
  const { isDesktopOrAbove } = useBreakpoint();
  const hasHeader = !noHeader && (header !== undefined || title !== undefined || back || subtitle || headerExtra);

  const headerContent = header ?? (
    <>
      {/* Back button */}
      {back && (
        <TouchableOpacity onPress={onBack} style={s.iconBtn}>
          <Icon name="arrow-left" size={16} color={colors.ink2} />
        </TouchableOpacity>
      )}

      {/* Title + subtitle */}
      <View style={[s.titleBlock, back && { marginLeft: spacing.s8 }]}>
        {title && (
          <Text
            style={[s.title, subtitle && { marginBottom: 2 }]}
            numberOfLines={back ? 1 : undefined}
          >
            {title}
          </Text>
        )}
        {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
      </View>

      {/* Right slot (only rendered in the title row when there is no headerExtra) */}
      {right && !headerExtra && <View>{right}</View>}
    </>
  );

  return (
    <View style={s.root}>
      {hasHeader && (
        <View
          style={[
            s.topBar,
            headerExtra && s.topBarColumn,
          ]}
        >
          {headerContent}
          {headerExtra && (
            <View style={s.headerExtraRow}>
              <View style={{ flex: 1 }}>{headerExtra}</View>
              {right && <View style={{ marginLeft: spacing.s8 }}>{right}</View>}
            </View>
          )}
        </View>
      )}

      <View style={[s.contentOuter, isDesktopOrAbove && s.contentOuterDesktop]}>
        <View style={[s.contentInner, isDesktopOrAbove && s.contentInnerDesktop]}>
          {scrollable ? (
            <ScrollView
              contentContainerStyle={[
                scrollPadding && { padding: spacing.s16 },
                contentStyle,
              ]}
              refreshControl={
                onRefresh ? (
                  <RefreshControl
                    refreshing={!!refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.accent}
                  />
                ) : undefined
              }
            >
              {children}
            </ScrollView>
          ) : (
            <View style={[{ flex: 1 }, contentStyle]}>
              {children}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  topBar: {
    paddingHorizontal: spacing.s16,
    paddingTop: spacing.safeTop,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBarColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: typography.fz17,
    fontWeight: typography.fw7,
    color: colors.ink,
  },
  subtitle: {
    fontSize: typography.fz13,
    color: colors.muted,
  },
  headerExtraRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  contentOuter: {
    flex: 1,
  },
  contentOuterDesktop: {
    alignItems: 'center',
  },
  contentInner: {
    flex: 1,
  },
  contentInnerDesktop: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
  },
});
