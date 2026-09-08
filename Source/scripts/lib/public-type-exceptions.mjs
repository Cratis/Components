// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Returns true when a TypeScript diagnostic is anchored in this package's declarations. */
export const isOwnedDeclarationDiagnostic = (diagnostic, packageName) =>
    diagnostic.file.startsWith(`${packageName}/`);

/** Matches one non-owned diagnostic to a reviewed upstream exception. */
export const matchesExternalIssue = (diagnostic, issue, packageName) =>
    !isOwnedDeclarationDiagnostic(diagnostic, packageName) &&
    issue.diagnosticCodes.includes(diagnostic.code) &&
    ((issue.filePrefixes ?? []).some((prefix) => diagnostic.file.startsWith(prefix)) ||
        (issue.messagePatterns ?? []).some((pattern) =>
            diagnostic.message.includes(pattern),
        ));

/**
 * Matches a diagnostic anchored in Components only when the same compiler run contains the exact
 * reviewed root-cause diagnostic in the upstream package named by its message. This prevents a
 * message-only exception from hiding an independent Components declaration regression.
 */
export const matchesPairedOwnedCascade = (
    diagnostic,
    issue,
    diagnostics,
    packageName,
) => {
    if (
        !isOwnedDeclarationDiagnostic(diagnostic, packageName) ||
        !issue.diagnosticCodes.includes(diagnostic.code)
    )
        return false;

    const cascade = (issue.ownedCascades ?? []).find((candidate) =>
        diagnostic.message.includes(candidate.messagePattern),
    );
    if (!cascade) return false;

    return diagnostics.some(
        (candidate) =>
            !isOwnedDeclarationDiagnostic(candidate, packageName) &&
            cascade.rootCauseDiagnosticCodes.includes(candidate.code) &&
            candidate.file.startsWith(cascade.rootCauseFilePrefix),
    );
};
