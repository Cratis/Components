// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * The footer markup surrounding the buttons: the footer element and its busy scope.
 * @param buttons The expected markup of the buttons.
 * @param scopeState Extra attributes the busy scope carries while busy.
 * @returns The expected footer markup.
 */
export const footerMarkup = (buttons: string, scopeState = ''): string =>
    '<footer class="cratis-dialog__footer" data-cratis-part="footer">' +
    '<fieldset class="cratis-dialog__busy-scope cratis-dialog__busy-scope--footer" data-cratis-part="busy-scope"' +
    scopeState +
    '>' +
    buttons +
    '</fieldset></footer>';
