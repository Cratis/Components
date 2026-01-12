# GitHub Copilot Instructions

## Tooling

- Vite
- yarn
- PrimeReact
- Storybook
- Vitest

## General

- Make only high confidence suggestions when reviewing code changes.
- Never change package.json or package-lock.json files unless explicitly asked to.
- Never leave unused import statements in the code.
- Always ensure that the code compiles without warnings.
  - Use yarn compile to verify.
  - If its successful it doesn't output anything.
- Always ensure that the code passes all tests.
- Always ensure that the code adheres to the project's coding standards.
- Always ensure that the code is maintainable.
- The user always keeps the Storybook running - **DO NOT try to stop it, suggest stopping it or start your own**

## Development Workflow - CRITICAL

**DO NOT skip these steps - they are mandatory, not optional:**

- **After creating each new file, IMMEDIATELY run `yarn compile` from the Source folder** before proceeding to the next file
  - Do NOT wait until the end of the task to validate
  - Fix all lint/TypeScript errors immediately as they appear
  - Never accumulate technical debt or defer error resolution
- **Before adding parameters to interfaces/function signatures, review all usages:**
  - Check if new parameters will be used in all call sites
  - Remove unused imports immediately if they're not needed
  - Validate that removing an import doesn't break other functionality
- **When modifying imports, audit all occurrences:**
  - If adding an import, verify it's actually used in the file
  - If removing an import, verify it's not used elsewhere
  - Check for multiple usage patterns of the same function/type
- **Never use placeholder or temporary types** - use proper types from the start
  - If the type is complex or unknown, use `unknown` with proper type guards
  - Don't plan to "fix types later" - fix them immediately
- **Review each file for lint compliance BEFORE moving on:**
  - ESLint errors about unused variables or improper types are blocking issues
  - Fixing them takes seconds now, but accumulates into hours if deferred

## Formatting

- Honor the existing code style and conventions in the project.
- Apply code-formatting style defined in .editorconfig.
- Prefer file-scoped namespace declarations and single-line using directives.
- Insert a new line before the opening curly brace of any code block (e.g., after `if`, `for`, `while`, `foreach`, `using`, `try`, etc.).
- Ensure that the final return statement of a method is on its own line.
- Use pattern matching and switch expressions wherever possible.
- Place private class declarations at the bottom of the file.

## Instructions

- Write clear and concise comments for each function.
- Prefer `const` over `let` over `var` when declaring variables.
- Do not add unnecessary comments or documentation.
- Use `import` directives for package imports at the top of the file.
- Sort the `imports` directives alphabetically.
- Remove unused `import` directives.
- Use `async` and `await` for asynchronous programming.
- Never add postfixes like Async, Impl, etc. to class or method names.
- Favor collection initializers and object initializers.
- Use string interpolation instead of string.Format or concatenation.
- Favor primary constructors for all types.

## TypeScript Type Safety

- Never use `any` type - always use proper type annotations:
  - Use `unknown` for values of unknown type that need runtime checking
  - Use `Record<string, unknown>` for objects with unknown properties
  - Use proper generic constraints like `<TCommand extends object = object>` instead of `= any`
  - Use `React.ComponentType<Props>` for React component types
  - Use `PIXI.TextStyle` or similar library types instead of casting to `any`
- When type assertions are necessary, use `unknown` as an intermediate type:
  - Prefer `value as unknown as TargetType` over `value as any`
  - For objects with dynamic properties: `(obj as unknown as { prop: Type }).prop`
  - For incompatible type conversions in Storybook: `Comp as unknown as React.ComponentType<...>`
- For generic React components:
  - Use `unknown` as default generic parameter instead of `any`
  - Example: `<TCommand = unknown>` not `<TCommand = any>`
  - Add proper constraints when working with libraries (e.g., PrimeReact DataTable requires `extends object`)
- For Storybook files:
  - Use `React.ComponentType<Record<string, never>>` for components with no props
  - Always use `as unknown as` when converting component imports to avoid type mismatch errors
  - Properly type story args instead of using `any`
- For event handlers:
  - Be careful with React.MouseEvent vs DOM MouseEvent - they are different types
  - React synthetic events: `React.MouseEvent<Element, MouseEvent>`
  - DOM native events: `MouseEvent`
  - Convert between them using: `nativeEvent as unknown as React.MouseEvent`
  - Use proper event types: `React.MouseEvent`, `MouseEvent`, etc.
  - Use `e.preventDefault?.()` instead of `(e as any).preventDefault?.()`
- For library objects (PIXI, etc.):
  - Use proper library types when available
  - Use specific property types: `{ canvas?: HTMLCanvasElement }` instead of `any`
- When working with external libraries that have strict generic constraints:
  - Import necessary types (e.g., `Command` from `@cratis/arc/commands`)
  - Use type assertions through `unknown` to satisfy constraints: `props.command as unknown as Constructor<Command<...>>`
  - Extract tuple results explicitly rather than destructuring when type assertions are needed
- For function parameter types that may be unknown:
  - Add type guards: `if (typeof accessor !== 'function') return ''`
  - Type parameters with fallbacks: `function<T = unknown>(accessor: ((obj: T) => unknown) | unknown)`
- For arrays and collections accessed from `unknown` types:
  - Cast to proper array type: `((obj as Record<string, unknown>).items || []) as string[]`
  - Type array elements when iterating: `array.forEach((item: string) => ...)`
- For generic type parameters:
  - Ensure proper type conversions: `String(value)` when string operations are needed
  - Use explicit Date parameter types: `new Date(value as string | number | Date)`

## Testing

- Follow the following guides:
   - [How to Write Specs](./instructions/specs.instructions.md)
   - [How to Write TypeScript Specs](./instructions/specs.typescript.instructions.md)

## Header

All files should start with the following header:

```csharp
// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
```

