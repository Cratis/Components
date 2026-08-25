# Cratis Components

## Packages

[![NPM](https://img.shields.io/npm/v/@cratis/components?label=@cratis/components&logo=npm)](https://www.npmjs.com/package/@cratis/components)

## Builds

[![Publish](https://github.com/Cratis/Components/actions/workflows/publish.yml/badge.svg)](https://github.com/Cratis/Components/actions/workflows/publish.yml)
[![Documentation site](https://github.com/Cratis/Documentation/actions/workflows/pages.yml/badge.svg)](https://github.com/Cratis/Documentation/actions/workflows/pages.yml)

## Description

A collection of React components designed to work seamlessly with the constructs found in the Arc universe. These components provide a rich set of UI elements for building modern applications, including command dialogs, data tables, schema editors, and more.

## Codemods

`Codemods/` holds internal, unpublished codemods that support consumer migrations. The
`remove-root-namespace-imports` codemod rewrites `@cratis/components` root-barrel namespace
imports (`import { Canvas } from '@cratis/components'`) onto their canonical subpath
(`import * as Canvas from '@cratis/components/Canvas'`); see [`Codemods/README.md`](./Codemods/README.md)
for full behavior and the companion `@cratis/components/no-root-barrel-import` ESLint rule.

```sh
npx --package @cratis/components-codemods \
  cratis-components-remove-root-namespace-imports <paths...>
```

## Support

Cratis is an open community, and we are glad to help users, teams evaluating the stack, and contributors.

| Channel       | Details                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------- |
| Discord       | Join the community on [Discord](https://discord.gg/kt4AMpV8WV) for questions and discussions |
| GitHub Issues | [Report bugs or request features](https://github.com/Cratis/Components/issues)               |
| Documentation | Read the docs at [cratis.io](https://cratis.io)                                              |
