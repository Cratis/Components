// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import 'primeicons/primeicons.css';
import './preview.css';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: { expanded: true },
  backgrounds: {
    default: 'dark',
    values: [
      { name: 'dark', value: '#111827' },
      { name: 'surface-card', value: '#1f2937' },
    ],
  },
};
