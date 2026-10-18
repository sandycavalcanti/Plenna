import { COLORS } from './colors';

export const DASHBOARD_THEME = {
  colors: {
    background: COLORS.fundoPrincipal,
    surface: '#FFFFFF',
    surfaceMuted: '#F4F1FA',
    ink: COLORS.perfilProfileCardTitulo,
    body: '#777B96',
    muted: '#9295AC',
    border: '#ECE8F4',
    track: '#F0EDF7',
    accent: COLORS.dadoDois,
    accentSoft: '#F3EEF9',
    accentSecondary: COLORS.dadoTres,
    navy: COLORS.dadoUm,
    warning: COLORS.dashboardGastosGeraisAviso,
    positive: '#4F8D7A',
    caution: '#B27B2B',
    dangerSurface: '#FFFAFB',
    hero: '#5D6287',
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
  shadows: {
    card: {
      shadowColor: '#535879',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.07,
      shadowRadius: 12,
      elevation: 2,
    },
  },
};
