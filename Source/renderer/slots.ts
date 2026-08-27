// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';

/**
 * Open renderer slot table. Core declarations are attached by the renderer barrel at the subpath
 * boundary so the setup-only package root can name `unstable_UiLibrary` without resolving
 * every component contract and optional peer. Adapters may declaration-merge private slots here.
 *
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
// Core slot members are supplied by the renderer subpath barrel's type augmentation.
export interface unstable_CratisSlots extends Record<never, never> {}

/**
 * Identifier of a declared renderer slot.
 *
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export type unstable_SlotId = keyof unstable_CratisSlots;

/**
 * Ownership mode for a renderer slot. Presentation mode preserves Core behavior; atomic mode gives
 * the adapter ownership of the complete interaction.
 *
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export type unstable_BehaviorMode = 'presentation' | 'atomic';

/**
 * Fidelity with which an adapter implements a slot.
 *
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export type unstable_Fidelity = 'native' | 'emulated' | 'unsupported';

/**
 * One typed renderer implementation and its behavior/fidelity declaration.
 *
 * @typeParam K Slot implemented by the declaration.
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export interface unstable_SlotDeclaration<K extends unstable_SlotId> {
    /** Which layer owns the slot's interaction behavior. */
    readonly mode: unstable_BehaviorMode;
    /** How faithfully the adapter satisfies the Core slot contract. */
    readonly fidelity: unstable_Fidelity;
    /** React component implementing the slot's exact public props. */
    readonly render: ComponentType<unstable_CratisSlots[K]>;
}

/**
 * Partial renderer slot table. A library may implement only the slots it honestly supports.
 *
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export type unstable_SlotMap = {
    readonly [K in unstable_SlotId]?: unstable_SlotDeclaration<K>;
};
