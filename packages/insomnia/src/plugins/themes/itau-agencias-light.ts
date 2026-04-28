const orange = '#EC7000';
const ink = '#1F1308';
const clay = '#7A3A00';
const paper = '#FFF8F2';
const surface = '#FFF1E3';

const statusBackground = {
  success: '#287A3E',
  notice: '#765A00',
  warning: orange,
  danger: '#B3261E',
  surprise: orange,
  info: '#005B9E',
};

const statusForeground = {
  success: '#FFFFFF',
  notice: '#FFFFFF',
  warning: ink,
  danger: '#FFFFFF',
  surprise: ink,
  info: '#FFFFFF',
};

const warmHighlight = {
  default: 'rgba(122, 58, 0, 1)',
  xxs: 'rgba(236, 112, 0, 0.06)',
  xs: 'rgba(236, 112, 0, 0.12)',
  sm: 'rgba(236, 112, 0, 0.2)',
  md: 'rgba(236, 112, 0, 0.34)',
  lg: 'rgba(122, 58, 0, 0.56)',
  xl: 'rgba(31, 19, 8, 0.82)',
};

export default {
  name: 'itau-agencias-light',
  displayName: 'Itaú Agências Light',
  theme: {
    background: {
      default: paper,
      ...statusBackground,
    },
    foreground: {
      default: ink,
      ...statusForeground,
    },
    highlight: warmHighlight,
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
        background: { default: orange },
        foreground: { default: ink },
      },
      sidebarHeader: {
        background: { default: orange },
        foreground: { default: ink },
      },
      sidebar: {
        background: { default: surface, ...statusBackground },
        foreground: { default: ink, ...statusForeground },
        highlight: warmHighlight,
      },
      pane: {
        background: { default: paper, ...statusBackground },
        foreground: { default: ink, ...statusForeground },
        highlight: warmHighlight,
      },
      paneHeader: {
        background: { default: '#FFE3C7', ...statusBackground },
        foreground: { default: ink, ...statusForeground },
      },
      dialog: {
        background: { default: '#FFF9F4', surprise: orange },
        foreground: { default: ink, surprise: ink },
      },
      link: {
        foreground: { default: clay },
      },
      transparentOverlay: {
        background: { default: 'rgba(31, 19, 8, 0.72)' },
        foreground: { default: '#FFFFFF' },
      },
    },
  },
};
