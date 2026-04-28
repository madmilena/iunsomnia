const gold = '#A37C29';
const softGold = '#D4B872';
const brightGold = '#F2D991';
const deepBlue = '#061D38';
const ink = '#F9F8F5';
const surface = '#031124';

const statusBackground = {
  success: '#175C34',
  notice: gold,
  warning: '#8F3D0E',
  danger: '#8A1B14',
  surprise: softGold,
  info: '#13467A',
};

const statusForeground = {
  success: '#FFFFFF',
  notice: '#FFFFFF',
  warning: '#FFFFFF',
  danger: '#FFFFFF',
  surprise: '#031124',
  info: '#FFFFFF',
};

const premiumHighlightDark = {
  default: 'rgba(212, 184, 114, 1)',
  xxs: 'rgba(212, 184, 114, 0.1)',
  xs: 'rgba(212, 184, 114, 0.2)',
  sm: 'rgba(212, 184, 114, 0.3)',
  md: 'rgba(242, 217, 145, 0.65)',
  lg: 'rgba(242, 217, 145, 0.85)',
  xl: 'rgba(249, 248, 245, 0.85)',
};

export default {
  name: 'itau-personnalite-dark',
  displayName: 'Itaú Personnalité Dark',
  theme: {
    background: {
      default: deepBlue,
      ...statusBackground,
    },
    foreground: {
      default: ink,
      ...statusForeground,
    },
    highlight: premiumHighlightDark,
    rawCss: `
:root {
  --font-default: "Itaú Text", "Itau Text", "Inter", "Segoe UI", system-ui, sans-serif !important;
}
body {
  font-family: var(--font-default);
}
`,
    styles: {
      appHeader: {
        background: { default: surface },
        foreground: { default: brightGold },
      },
      sidebarHeader: {
        background: { default: surface },
        foreground: { default: brightGold },
      },
      sidebar: {
        background: { default: surface, ...statusBackground },
        foreground: { default: ink, ...statusForeground },
        highlight: premiumHighlightDark,
      },
      pane: {
        background: { default: deepBlue, ...statusBackground },
        foreground: { default: ink, ...statusForeground },
        highlight: premiumHighlightDark,
      },
      paneHeader: {
        background: { default: '#092952', ...statusBackground },
        foreground: { default: ink, ...statusForeground },
      },
      dialog: {
        background: { default: '#0B2342', surprise: gold },
        foreground: { default: ink, surprise: '#FFFFFF' },
      },
      link: {
        foreground: { default: softGold },
      },
      transparentOverlay: {
        background: { default: 'rgba(3, 17, 36, 0.8)' },
        foreground: { default: ink },
      },
    },
  },
};
