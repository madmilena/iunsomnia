const darkBlue = '#0E3C70';
const ink = '#1F1A13';
const paper = '#F9F8F5';
const surface = '#EAE5DB';

const statusBackground = {
  success: '#1E7A45',
  notice: '#A37C29',
  warning: '#B84D12',
  danger: '#B3261E',
  surprise: darkBlue,
  info: '#1A5A9E',
};

const statusForeground = {
  success: '#FFFFFF',
  notice: '#FFFFFF',
  warning: '#FFFFFF',
  danger: '#FFFFFF',
  surprise: '#FFFFFF',
  info: '#FFFFFF',
};

const premiumHighlight = {
  default: 'rgba(163, 124, 41, 1)',
  xxs: 'rgba(163, 124, 41, 0.05)',
  xs: 'rgba(163, 124, 41, 0.1)',
  sm: 'rgba(163, 124, 41, 0.18)',
  md: 'rgba(163, 124, 41, 0.3)',
  lg: 'rgba(14, 60, 112, 0.4)',
  xl: 'rgba(31, 26, 19, 0.8)',
};

export default {
  name: 'itau-personnalite-light',
  displayName: 'Itaú Personnalité Light',
  theme: {
    background: {
      default: paper,
      ...statusBackground,
    },
    foreground: {
      default: ink,
      ...statusForeground,
    },
    highlight: premiumHighlight,
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
        background: { default: darkBlue },
        foreground: { default: '#FFFFFF' },
      },
      sidebarHeader: {
        background: { default: darkBlue },
        foreground: { default: '#FFFFFF' },
      },
      sidebar: {
        background: { default: surface, ...statusBackground },
        foreground: { default: ink, ...statusForeground },
        highlight: premiumHighlight,
      },
      pane: {
        background: { default: paper, ...statusBackground },
        foreground: { default: ink, ...statusForeground },
        highlight: premiumHighlight,
      },
      paneHeader: {
        background: { default: '#DFD8C9', ...statusBackground },
        foreground: { default: ink, ...statusForeground },
      },
      dialog: {
        background: { default: '#FCFCFB', surprise: darkBlue },
        foreground: { default: ink, surprise: '#FFFFFF' },
      },
      link: {
        foreground: { default: darkBlue },
      },
      transparentOverlay: {
        background: { default: 'rgba(31, 26, 19, 0.72)' },
        foreground: { default: '#FFFFFF' },
      },
    },
  },
};
