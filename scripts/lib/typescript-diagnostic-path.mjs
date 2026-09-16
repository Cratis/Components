// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Gives the active native compiler's built-in libraries the same package-relative identity as TS6. */
export const normalizeTypeScriptDiagnosticPath = (
    file,
    version,
    platform = process.platform,
    architecture = process.arch,
) => {
    const prefix = `@typescript/typescript-${platform}-${architecture}/lib/`;
    return version.startsWith('7.') && file.startsWith(prefix)
        ? `typescript/lib/${file.slice(prefix.length)}`
        : file;
};
