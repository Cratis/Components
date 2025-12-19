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
- Never leave unused using statements in the code.
- Always ensure that the code compiles without warnings.
- Always ensure that the code passes all tests.
- Always ensure that the code adheres to the project's coding standards.
- Always ensure that the code is maintainable.

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

