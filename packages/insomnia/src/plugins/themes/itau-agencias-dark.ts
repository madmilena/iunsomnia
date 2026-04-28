const orange = '#EC7000';
const ink = '#F4EFEA';
const surface = '#120B05';
const paper = '#1F1308';
const clay = '#FFB87A';

const statusBackground = {
  success: '#1E5E2D',
  notice: '#594400',
  warning: orange,
  danger: '#8A1B14',
  surprise: orange,
  info: '#004375',
};

const statusForeground = {
  success: '#FFFFFF',
  notice: '#FFFFFF',
  warning: '#1F1308',
  danger: '#FFFFFF',
  surprise: '#1F1308',
  info: '#FFFFFF',
};

const warmHighlightDark = {
  default: 'rgba(255, 184, 122, 1)',
  xxs: 'rgba(236, 112, 0, 0.1)',
  xs: 'rgba(236, 112, 0, 0.2)',
  sm: 'rgba(236, 112, 0, 0.3)',
  md: 'rgba(236, 112, 0, 0.45)',
  lg: 'rgba(255, 184, 122, 0.65)',
  xl: 'rgba(244, 239, 234, 0.85)',
};

export default {
  name: 'itau-agencias-dark',
  displayName: 'Itaú Agências Dark',
  theme: {
    background: {
      default: paper,
      ...statusBackground,
    },
    foreground: {
      default: ink,
      ...statusForeground,
    },
    highlight: warmHighlightDark,
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
        foreground: { default: ink },
      },
      sidebarHeader: {
        background: { default: surface },
        foreground: { default: ink },
      },
      sidebar: {
        background: { default: surface, ...statusBackground },
        foreground: { default: ink, ...statusForeground },
        highlight: warmHighlightDark,
      },
      pane: {
        background: { default: paper, ...statusBackground },
        foreground: { default: ink, ...statusForeground },
        highlight: warmHighlightDark,
      },
      paneHeader: {
        background: { default: '#2E1E12', ...statusBackground },
        foreground: { default: ink, ...statusForeground },
      },
      dialog: {
        background: { default: '#26170A', surprise: orange },
        foreground: { default: ink, surprise: '#1F1308' },
      },
      link: {
        foreground: { default: clay },
      },
      transparentOverlay: {
        background: { default: 'rgba(18, 11, 5, 0.8)' },
        foreground: { default: ink },
      },
    },
  },
};
