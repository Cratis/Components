<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# Third-party notices

This MIT-licensed adapter interoperates with peer-installed PrimeReact software. It does not bundle
or redistribute PrimeReact or its transitive dependencies.

## PrimeReact 10

The proof matrix uses `primereact` 10.9.9. Its package metadata and supplied `LICENSE.md` identify
PrimeReact 10 as MIT-licensed software:

- package: <https://www.npmjs.com/package/primereact/v/10.9.9>
- source tag: <https://github.com/primefaces/primereact/tree/10.9.9>
- license: <https://github.com/primefaces/primereact/blob/10.9.9/LICENSE.md>

PrimeReact installs `react-transition-group` and its React type package as its own transitive
dependencies. They are not dependencies or bundled contents of this adapter. Applications should
review the notices and licenses shipped with their complete installed dependency graph.

PrimeIcons is not required by this adapter and is not bundled. An application that independently
uses PrimeIcons must install it and comply with the license supplied by that package.

PrimeReact 11 and PrimeUX themes are not part of this adapter. They have a separate package and
license boundary under `@cratis/components.primereact`.

This notice records package facts for transparency and is not legal advice.
