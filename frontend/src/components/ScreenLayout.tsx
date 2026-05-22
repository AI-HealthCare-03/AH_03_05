import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from "react-native";
import Icon from "./Icon";
import { colors, radii, spacing, typography } from "../theme";
import { useBreakpoint } from "../hooks/useBreakpoint";

const CONTENT_MAX_WIDTH = 900;

interface ScreenLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  back?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  headerExtra?: React.ReactNode;
  header?: React.ReactNode;
  noHeader?: boolean;
  scrollable?: boolean;
  scrollPadding?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: object;
  scrollRef?: React.RefObject<ScrollView>;
}

export default function ScreenLayout({ children, title, subtitle, back, onBack, right, headerExtra, header, noHeader, scrollable, scrollPadding = true, refreshing, onRefresh, contentStyle, scrollRef }: ScreenLayoutProps) {
  const { isDesktopOrAbove } = useBreakpoint();
  const hasHeader = !noHeader && (header !== undefined || title !== undefined || back || subtitle || headerExtra);

  const headerContent = header ?? (
    <>
      {back && (
        <TouchableOpacity onPress={onBack} style={s.iconBtn}>
          <Icon name="arrow-left" size={16} color={colors.ink2} />
        </TouchableOpacity>
      )}
      <View style={[s.titleBlock, back && { marginLeft: spacing.s8 }]}>
        {title && (
          <Text style={[s.title, subtitle && { marginBottom: 2 }]} numberOfLines={back ? 1 : undefined}>
            {title}
          </Text>
        )}
        {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
      </View>
      {right && !headerExtra && <View>{right}</View>}
    </>
  );

  return (
    <View style={s.root}>
      {hasHeader && (
        <View style={s.topBar}>
          <View style={[s.topBarInner, headerExtra ? s.topBarInnerColumn : undefined, isDesktopOrAbove && s.topBarInnerDesktop]}>
            {headerContent}
            {headerExtra && (
              <View style={s.headerExtraRow}>
                <View style={{ flex: 1 }}>{headerExtra}</View>
                {right && <View style={{ marginLeft: spacing.s8 }}>{right}</View>}
              </View>
            )}
          </View>
        </View>
      )}

      {scrollable ? (
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={scrollPadding ? { padding: spacing.s16 } : undefined} refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.accent} /> : undefined}>
          <View
            style={[
              isDesktopOrAbove && {
                maxWidth: CONTENT_MAX_WIDTH,
                alignSelf: "center",
                width: "100%",
              },
              contentStyle,
            ]}
          >
            {children}
          </View>
        </ScrollView>
      ) : (
        <View style={[s.contentOuter, isDesktopOrAbove && s.contentOuterDesktop]}>
          <View style={[s.contentInner, isDesktopOrAbove && s.contentInnerDesktop, { flex: 1 }, contentStyle]}>{children}</View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  topBar: {
    alignItems: "center",
  },
  topBarInner: {
    width: "100%",
    paddingHorizontal: spacing.s16,
    paddingTop: spacing.safeTop,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  topBarInnerColumn: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
  },
  topBarInnerDesktop: {
    maxWidth: CONTENT_MAX_WIDTH,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  contentOuter: {
    flex: 1,
  },
  contentOuterDesktop: {
    alignItems: "center",
  },
  contentInner: {
    flex: 1,
  },
  contentInnerDesktop: {
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
  },
});
