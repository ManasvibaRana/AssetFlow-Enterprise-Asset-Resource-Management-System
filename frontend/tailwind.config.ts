import type { Config } from "tailwindcss";

// AssetFlow Professional design system — tokens mirrored from the Stitch design.
const rgbVar = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Accent / brand colors — identical in both themes (static hex).
        "deep-navy": "#0F172A",
        "primary-container": "#1e293b",
        "on-primary": "#ffffff",
        "on-primary-container": "#8590a6",
        "primary-fixed": "#d8e3fb",
        "primary-fixed-dim": "#bcc7de",
        secondary: "#006c49",
        "secondary-container": "#6cf8bb",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#00714d",
        "emerald-active": "#059669",
        "indigo-accent": "#4F46E5",
        tertiary: "#040057",
        background: "#fbf8fa",
        "surface-container-highest": "#e4e2e3",
        outline: "#75777d",
        "outline-variant": "#c5c6cd",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        "status-warning": "#F59E0B",
        "status-critical": "#EF4444",
        // Theme-flippable tokens — driven by CSS variables (see globals.css).
        primary: rgbVar("primary"),
        surface: rgbVar("surface"),
        "surface-subtle": rgbVar("surface-subtle"),
        "surface-container-lowest": rgbVar("surface-container-lowest"),
        "surface-container-low": rgbVar("surface-container-low"),
        "surface-container": rgbVar("surface-container"),
        "surface-container-high": rgbVar("surface-container-high"),
        "surface-variant": rgbVar("surface-variant"),
        "on-surface": rgbVar("on-surface"),
        "on-surface-variant": rgbVar("on-surface-variant"),
        "border-muted": rgbVar("border-muted"),
      },
      spacing: {
        base: "4px",
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        gutter: "20px",
        "margin-edge": "24px",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        full: "9999px",
      },
      fontFamily: {
        "display-lg": ["var(--font-hanken)", "system-ui", "sans-serif"],
        "headline-md": ["var(--font-hanken)", "system-ui", "sans-serif"],
        "headline-sm": ["var(--font-hanken)", "system-ui", "sans-serif"],
        "body-lg": ["var(--font-inter)", "system-ui", "sans-serif"],
        "body-md": ["var(--font-inter)", "system-ui", "sans-serif"],
        "body-sm": ["var(--font-inter)", "system-ui", "sans-serif"],
        "label-caps": ["var(--font-inter)", "system-ui", "sans-serif"],
        "mono-data": ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "headline-sm": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "18px", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
        "mono-data": ["13px", { lineHeight: "18px", fontWeight: "500" }],
      },
      boxShadow: {
        card: "0px 1px 2px rgba(15,23,42,0.04)",
        lifted: "0px 10px 15px -3px rgba(15,23,42,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
