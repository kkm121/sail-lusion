# Contributing to SAIL Web Experience

Thank you for your interest in contributing to the SRM Artificial Intelligence Lab (SAIL) web platform!

## Code of Conduct

All contributors are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. Ensure you have **Node.js 18+** installed.
2. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Verify tests and build:
   ```bash
   npm run build
   ```

## Branching Strategy

- `main`: Production-ready branch.
- `feature/<name>`: For new features or visual components.
- `bugfix/<name>`: For bug fixes and responsive adjustments.

## Conventional Commits

We follow the Conventional Commits specification:
- `feat:` A new feature or component.
- `fix:` A bug fix.
- `docs:` Documentation updates.
- `style:` Code style / formatting changes (no functional impact).
- `refactor:` Code change that neither fixes a bug nor adds a feature.
- `perf:` A code change that improves performance.
- `test:` Adding or updating tests.
- `chore:` Tooling, dependency, or config updates.

## Pull Request Guidelines

1. Make sure all code compiles cleanly with `npm run build` with zero errors.
2. Verify responsive layout on both desktop (1920x1080) and mobile (390x844).
3. Ensure no memory leaks or canvas context loss in WebGL/Three.js loops.
4. Fill in the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md) completely.
