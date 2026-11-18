// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

const slotByCase: Record<string, string> = {
    text: 'common.textInput',
    email: 'common.textInput',
    'text with parts': 'common.textInput',
    'invalid text': 'common.textInput',
    textarea: 'common.textArea',
    'textarea defaults': 'common.textArea',
    checkbox: 'common.checkbox',
    'checkbox with parts': 'common.checkbox',
    'checkbox without label': 'common.checkbox',
    switch: 'common.switch',
    'switch with parts': 'common.switch',
    'radio group': 'common.radio',
    'horizontal radio group': 'common.radio',
    'radio button': 'common.radio',
    'radio button with parts': 'common.radio',
};

/** The presentation slot each field case is expected to resolve. */
export const slotIdFor = (caseName: string) => slotByCase[caseName];
