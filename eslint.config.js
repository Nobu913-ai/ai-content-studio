import prettier from "eslint-config-prettier";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        setTimeout: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-constant-condition": "warn",
      "no-debugger": "error",
      "no-duplicate-imports": "error",
      "prefer-const": "warn",
      eqeqeq: ["error", "always"],
    },
  },
  {
    ignores: ["node_modules/", "content/"],
  },
  prettier,
];
