import nextConfig from "eslint-config-next/core-web-vitals";

const eslintConfig = [
    ...nextConfig,
    {
        ignores: [".gemini/**", ".worktrees/**"]
    },
    {
        rules: {
            "react-hooks/set-state-in-effect": "warn"
        }
    }
];

export default eslintConfig;
