import type { ThemeConfig } from "antd";

const theme: ThemeConfig = {
  token: {
    colorPrimary: "#4ade80",
    colorInfo: "#4ade80",
    colorSuccess: "#4ade80",
    colorLink: "#4ade80",
    fontFamily: "var(--font-belanosima)",
  },
  components: {
    Upload: {
      actionsColor: "#4ade80",
      colorPrimary: "#4ade80",
      colorPrimaryHover: "#22c55e",
      colorPrimaryActive: "#16a34a",
    },
    Button: {
      fontFamily: "var(--font-belanosima)",
      colorPrimary: "#4ade80",
    },
    Input: {
      fontFamily: "var(--font-belanosima)",
    },
    Select: {
      fontFamily: "var(--font-belanosima)",
    },
    Modal: {
      fontFamily: "var(--font-belanosima)",
    },
    Typography: {
      fontFamily: "var(--font-belanosima)",
    },
  },
};

export default theme;
