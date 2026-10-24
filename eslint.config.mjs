import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: ["playwright-report/**", "test-results/**", "coverage/**"],
  },
];

export default eslintConfig;
