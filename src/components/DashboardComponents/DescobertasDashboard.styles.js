import { StyleSheet } from "react-native";
import { DASHBOARD_THEME } from "../../constants/dashboardTheme";
const {
  colors: COLORS,
  spacing: SPACING,
  radius: RADIUS
} = DASHBOARD_THEME;
export const styles = StyleSheet.create({
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted
  },
  discoveryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    paddingVertical: SPACING.sm
  },
  discoveryIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentSoft
  },
  discoveryCopy: {
    flex: 1,
    gap: SPACING.xs,
    paddingTop: 1
  },
  discoveryTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
    color: COLORS.ink
  },
  discoveryDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.body
  },
  relatedAction: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  relatedActionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: COLORS.accent
  }
});
