// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as React from 'react';

declare global {
  namespace JSX {
    interface Element extends React.ReactElement {}
    // Add additional JSX-related overrides if necessary.
  }
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const content: { readonly [key: string]: string };
  export default content;
}