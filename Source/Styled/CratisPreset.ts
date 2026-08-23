// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Legacy preset marker retained for source compatibility.
 *
 * Components now styles its Cratis-owned markup through `tokens`, `styles`, and
 * the optional `theme` stylesheet. Consumer design systems should map their own
 * variables onto the `--cratis-*` tokens instead of extending a renderer preset.
 */
export const CratisPreset = Object.freeze({
    name: 'cratis',
    darkModeSelector: '.cratis-dark',
});
