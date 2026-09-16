// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

const parseJson = (output) => {
    // Lifecycle scripts may print before npm's final, possibly pretty-printed JSON.
    for (const match of output.matchAll(/^[ \t]*(?:\[|\{)/gmu)) {
        try {
            return JSON.parse(output.slice(match.index));
        } catch {
            // Only skip non-JSON lifecycle output, never invalid package metadata.
        }
    }
    throw new Error('npm pack did not produce a parseable JSON result.');
};

export const parseNpmPackResult = (output, expectedName) => {
    const parsed = parseJson(output);
    // npm 12 keys results by package name; earlier versions return an array.
    const packages = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object'
            ? Object.values(parsed)
            : [];
    if (packages.length !== 1) {
        throw new Error(`npm pack must return exactly one package for '${expectedName}'.`);
    }

    const [packed] = packages;
    if (
        packed?.name !== expectedName ||
        typeof packed.filename !== 'string' ||
        packed.filename.length === 0 ||
        !Array.isArray(packed.files) ||
        !packed.files.every((file) => typeof file?.path === 'string' && file.path.length > 0)
    ) {
        throw new Error(`npm pack returned invalid package metadata for '${expectedName}'.`);
    }
    return packed;
};
