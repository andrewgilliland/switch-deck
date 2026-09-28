import eslintPluginAstro from "eslint-plugin-astro";
import typescriptEslint from "typescript-eslint";

export default [
  {
    ignores: ["dist/**", ".astro/**", "node_modules/**", "test-results/**"],
  },
  ...typescriptEslint.configs.recommended,
  ...eslintPluginAstro.configs["flat/recommended"],
];
