// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Capability identifiers understood by the renderer ABI. Consumers branch on capabilities, never
 * on a renderer's identity.
 *
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export type unstable_CapabilityId =
    | 'slot.render'
    | 'parts.passthrough'
    | 'focus.trap'
    | 'focus.restore'
    | 'overlay.portal'
    | 'collection.virtualize'
    | 'selection.multi'
    | 'datetime.i18n'
    | 'form.validationMessage'
    | 'theme.tokens'
    | 'ssr.staticRender'
    | 'rtl'
    | 'forcedColors'
    | 'motion.reduced'
    | 'machine.binding'
    | 'paging.server';
