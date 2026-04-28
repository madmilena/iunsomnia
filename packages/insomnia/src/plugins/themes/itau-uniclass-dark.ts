const blue = '#0059B2';
const brightBlue = '#3388FF';
const ink = '#EAF2FF';
const surface = '#040D1A';
const paper = '#07182F';

const statusBackground = {
  success: '#175C34',
  notice: '#5C4400',
  warning: '#9E470E',
  danger: '#8A1B14',
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

const coolHighlightDark = {
  default: 'rgba(51, 136, 255, 1)',
  xxs: 'rgba(0, 89, 178, 0.15)',
  xs: 'rgba(0, 89, 178, 0.25)',
  sm: 'rgba(0, 89, 178, 0.35)',
  md: 'rgba(0, 89, 178, 0.5)',
  lg: 'rgba(51, 136, 255, 0.65)',
  xl: 'rgba(234, 242, 255, 0.85)',
};

export default {
  name: 'itau-uniclass-dark',
  displayName: 'Itaú Uniclass Dark',
  theme: {
    background: {
      default: paper,
      ...statusBackground,
    },
    foreground: {
      default: ink,
      ...statusForeground,
    },
    highlight: coolHighlightDark,
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
        highlight: coolHighlightDark,
      },
      pane: {
        background: { default: paper, ...statusBackground },
        foreground: { default: ink, ...statusForeground },
        highlight: coolHighlightDark,
      },
      paneHeader: {
        background: { default: '#0B2347', ...statusBackground },
        foreground: { default: ink, ...statusForeground },
      },
      dialog: {
        background: { default: '#091E3D', surprise: brightBlue },
        foreground: { default: ink, surprise: '#FFFFFF' },
      },
      link: {
        foreground: { default: brightBlue },
      },
      transparentOverlay: {
        background: { default: 'rgba(4, 13, 26, 0.8)' },
        foreground: { default: ink },
      },
    },
  },
};
