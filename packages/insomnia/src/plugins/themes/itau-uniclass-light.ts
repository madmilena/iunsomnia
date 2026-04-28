const blue = '#003DA5';
const brightBlue = '#0066CC';
const ink = '#07182F';
const paper = '#F5F9FF';
const surface = '#EAF2FF';

const statusBackground = {
  success: '#1E7A45',
  notice: '#7A5B00',
  warning: '#C55A11',
  danger: '#B3261E',
  surprise: brightBlue,
  info: blue,
};

const statusForeground = {
  success: '#FFFFFF',
  notice: '#FFFFFF',
  warning: '#FFFFFF',
  danger: '#FFFFFF',
  surprise: '#FFFFFF',
  info: '#FFFFFF',
};

const coolHighlight = {
  default: 'rgba(0, 61, 165, 1)',
  xxs: 'rgba(0, 61, 165, 0.05)',
  xs: 'rgba(0, 61, 165, 0.1)',
  sm: 'rgba(0, 61, 165, 0.18)',
  md: 'rgba(0, 61, 165, 0.3)',
  lg: 'rgba(0, 61, 165, 0.52)',
  xl: 'rgba(7, 24, 47, 0.82)',
};

export default {
  name: 'itau-uniclass-light',
  displayName: 'Itaú Uniclass Light',
  theme: {
    background: {
      default: paper,
      ...statusBackground,
    },
    foreground: {
      default: ink,
      ...statusForeground,
    },
    highlight: coolHighlight,
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
        background: { default: blue },
        foreground: { default: '#FFFFFF' },
      },
      sidebarHeader: {
        background: { default: blue },
        foreground: { default: '#FFFFFF' },
      },
      sidebar: {
        background: { default: surface, ...statusBackground },
        foreground: { default: ink, ...statusForeground },
        highlight: coolHighlight,
      },
      pane: {
        background: { default: paper, ...statusBackground },
        foreground: { default: ink, ...statusForeground },
        highlight: coolHighlight,
      },
      paneHeader: {
        background: { default: '#DDEBFF', ...statusBackground },
        foreground: { default: ink, ...statusForeground },
      },
      dialog: {
        background: { default: '#FAFCFF', surprise: brightBlue },
        foreground: { default: ink, surprise: '#FFFFFF' },
      },
      link: {
        foreground: { default: blue },
      },
      transparentOverlay: {
        background: { default: 'rgba(7, 24, 47, 0.74)' },
        foreground: { default: '#FFFFFF' },
      },
    },
  },
};
