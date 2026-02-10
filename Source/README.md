# Cratis Components

A collection of React components for building modern applications with Cratis.

## Requirements

### Minimum Versions

- TypeScript: 4.7+
- React: 18.0+ or 19.0+
- Node.js: 16+ (for development)

### TypeScript Configuration

This package is compatible with all modern TypeScript `moduleResolution` strategies:

- ✅ `"bundler"` (recommended for Vite, esbuild, webpack 5+)
- ✅ `"node16"` / `"nodenext"` (for Node.js projects)
- ✅ `"node"` (legacy, but supported)

The package provides dual CommonJS and ES Module builds with proper conditional exports for optimal module resolution and tree-shaking.

## Installation

```bash
npm install @cratis/components
# or
yarn add @cratis/components
```

## Usage

### Importing Components

You can import components using subpath imports for better tree-shaking:

```typescript
// Import specific component modules
import { TimeMachine } from '@cratis/components/TimeMachine';
import { DataPage } from '@cratis/components/DataPage';
import { CommandForm } from '@cratis/components/CommandForm';

// Or import from the main entry point
import { TimeMachine, DataPage } from '@cratis/components';
```

### Available Subpath Exports

- `@cratis/components/CommandDialog`
- `@cratis/components/CommandForm`
- `@cratis/components/Common`
- `@cratis/components/DataPage`
- `@cratis/components/DataTables`
- `@cratis/components/Dialogs`
- `@cratis/components/Dropdown`
- `@cratis/components/EventModeling`
- `@cratis/components/PivotViewer`
- `@cratis/components/TimeMachine`

## Troubleshooting

### Module Resolution Errors

If you encounter errors like:

```
Cannot find module '@cratis/components/TimeMachine' or its corresponding type declarations.
```

**Solution:** Ensure you're using the correct case-sensitive import paths (e.g., `TimeMachine`, not `timeMachine`).

If using TypeScript 4.7+, try updating your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"  // or "node16" / "nodenext"
  }
}
```

### Import Errors

Ensure you're using the correct import paths. The package uses case-sensitive paths that match the actual component names.