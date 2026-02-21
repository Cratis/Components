# Cratis Components

The Cratis Components library provides a comprehensive set of reusable React components built on top of PrimeReact, designed specifically for building data-driven applications with the Cratis Arc framework.

## Overview

This library includes specialized components for:

- **Command Handling**: Dialog and form components for executing commands
- **Data Display**: Advanced data tables and pages for queries and observable queries
- **Data Visualization**: Pivot viewers, time machines, and schema editors
- **Common UI Elements**: Pages, dialogs, and form elements
- **Navigation**: Object navigational bars and content editors

## Key Features

- Built with TypeScript for type safety
- Integrates seamlessly with Cratis Arc framework
- Uses PrimeReact components for consistent UI/UX
- Supports both queries and observable queries
- Comprehensive Storybook documentation
- Accessibility-focused design

## Getting Started

All components are exported from the main package and can be imported as needed:

```typescript
import { CommandDialog, DataPage, PivotViewer } from '@cratis/components';
```

## Component Categories

### Command Components
Components for handling command execution and user interactions.

### Data Components
Components for displaying and interacting with data from queries.

### Common Components
Reusable UI elements for building consistent layouts.

### Specialized Components
Advanced components for specific use cases like schema editing and time-based data exploration.

## Development

The components are built using:

- Vite for development and bundling
- Vitest for testing
- Storybook for component documentation
- yarn for package management

## Documentation

Each component includes comprehensive documentation and examples in Storybook. See the individual component pages for detailed usage instructions, props documentation, and live examples.
