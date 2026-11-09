import { COLORS } from './colors';

export const DASHBOARD_THEME = {
  colors: {
    background: COLORS.fundoPrincipal,
    surface: COLORS.surface,
    surfaceMuted: COLORS.surfaceMuted,
    ink: COLORS.ink,
    body: COLORS.dashboardBodyText,
    muted: COLORS.dashboardMutedText,
    border: COLORS.border,
    track: COLORS.dashboardTrack,
    accent: COLORS.dadoDois,
    accentSoft: COLORS.surfaceAccent,
    accentSecondary: COLORS.dadoTres,
    navy: COLORS.dadoUm,
    warning: COLORS.dashboardGastosGeraisAviso,
    positive: COLORS.buttonPositiveText,
    caution: COLORS.dashboardCaution,
    dangerSurface: COLORS.dashboardDangerSurface,
    hero: COLORS.dashboardHero,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 20,
    pill: 999,
  },
  borders: {
    card: {
      borderWidth: 1,
      borderColor: COLORS.border,
    },
  },
  shadows: {
    card: {
      shadowColor: COLORS.dashboardShadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.07,
      shadowRadius: 12,
      elevation: 2,
    },
  },
};
