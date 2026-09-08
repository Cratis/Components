// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// Storybook 10 requires a nonempty stories configuration even for a composition-only manager.
// The !dev tag keeps this normalization placeholder out of the manager index and renderer UI.
export default {
    title: 'Internal/Composition manager',
    tags: ['manager-placeholder', '!dev', '!test'],
    render: () => null,
};

export const Placeholder = {};
