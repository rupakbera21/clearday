/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "<rootDir>/jest.env.cjs",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^uncrypto$": "<rootDir>/tests/mocks/uncrypto.cjs",
    "^@google/genai$": "<rootDir>/node_modules/@google/genai/dist/node/index.cjs",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/", "<rootDir>/tests/"],
  transformIgnorePatterns: [
    "node_modules/(?!(@upstash|uncrypto)/)",
  ],
  collectCoverageFrom: [
    "domain/**/*.ts",
    "services/**/*.ts",
    "app/api/**/*.ts",
    "schemas/**/*.ts",
    "data/**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  coverageThreshold: {
    global: {
      lines: 70,
      statements: 70,
      functions: 65,
      branches: 60,
    },
    "./domain/": {
      lines: 85,
      statements: 85,
    },
    "./services/": {
      lines: 85,
      statements: 85,
    },
    "./app/api/": {
      lines: 85,
      statements: 85,
    },
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          module: "commonjs",
          moduleResolution: "node",
          esModuleInterop: true,
          noUncheckedIndexedAccess: true,
        },
      },
    ],
  },
};

export default config;
