// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// Compatibility shim. The chat kit that used to live physically under `Canvas/shapes/ChatBubble`
// is generic and Pixi-free — it never touches Canvas or PivotViewer — so it now lives at
// `Source/Chat/Kit`, the shared, non-spatial home both the `./Chat` and `./Canvas` subpaths build
// on. This barrel keeps every symbol the `@cratis/components/Canvas` subpath has ever exported
// from this path reachable exactly as before; `../Canvas/index.ts` still re-exports it unchanged.
// Do not add new code here — add it to `Source/Chat/Kit` and it flows through this shim.
export * from '../../../Chat/Kit';
