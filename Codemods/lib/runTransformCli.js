// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { packageName as defaultPackageName } from './namespaceMap.js';

const EXTENSIONS = new Set([
    '.js',
    '.jsx',
    '.mjs',
    '.cjs',
    '.ts',
    '.tsx',
    '.mts',
    '.cts',
]);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.yarn']);

/** Runs one independently invocable Components codemod CLI. */
export function runTransformCli(argv, { command, description, transform }) {
    const args = [...argv];
    let check = false;
    let packageName = defaultPackageName;
    const paths = [];

    while (args.length > 0) {
        const arg = args.shift();
        if (arg === '--check') check = true;
        else if (arg === '--package') {
            const configuredPackage = args.shift();
            if (!configuredPackage) {
                console.error('--package requires a package name.');
                return 1;
            }
            packageName = configuredPackage;
        } else if (arg === '--help' || arg === '-h') {
            printUsage(command, description);
            return 0;
        } else if (arg.startsWith('-')) {
            console.error(`Unknown option: ${arg}`);
            return 1;
        } else paths.push(arg);
    }

    if (paths.length === 0) {
        printUsage(command, description);
        return 1;
    }

    let files;
    try {
        files = paths.flatMap(collectFiles);
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        return 1;
    }

    let changedCount = 0;
    let diagnosticCount = 0;
    let errorCount = 0;
    for (const file of files) {
        try {
            const original = readFileSync(file, 'utf8');
            const result = transform(file, original, { packageName });
            for (const diagnostic of result.diagnostics) {
                diagnosticCount += 1;
                console.warn(
                    `${diagnostic.file}:${diagnostic.line}:${diagnostic.column}: ${diagnostic.message}`,
                );
            }
            if (result.changed) {
                changedCount += 1;
                if (check) console.log(`would rewrite ${file}`);
                else {
                    writeFileSync(file, result.text, 'utf8');
                    console.log(`rewrote ${file}`);
                }
            }
        } catch (error) {
            errorCount += 1;
            console.error(
                `${file}: failed to process: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    console.log(
        `\n${files.length} file(s) scanned, ${changedCount} ${check ? 'would change' : 'changed'}, ${diagnosticCount} unsupported or ambiguous case(s) reported, ${errorCount} processing error(s).`,
    );
    if (diagnosticCount > 0 || errorCount > 0 || (check && changedCount > 0)) return 1;
    return 0;
}

function printUsage(command, description) {
    console.log(
        [
            `Usage: ${command} [--check] [--package <name>] <path...>`,
            '',
            description,
            '',
            'Options:',
            '  --check           Report what would change without writing files; exits 1 if',
            '                    anything would change or manual review is required.',
            '  --package <name>  Components package name (default: @cratis/components).',
            '',
            '<path...> may be files or directories; directories are walked recursively for',
            '.js/.jsx/.mjs/.cjs/.ts/.tsx/.mts/.cts files, skipping node_modules,',
            'dist, .git, and .yarn.',
        ].join('\n'),
    );
}

function collectFiles(inputPath) {
    const stats = statSync(inputPath);
    if (stats.isFile()) return EXTENSIONS.has(extname(inputPath)) ? [inputPath] : [];
    if (!stats.isDirectory()) return [];
    const files = [];
    for (const entry of readdirSync(inputPath, { withFileTypes: true })) {
        if (SKIP_DIRS.has(entry.name)) continue;
        const entryPath = join(inputPath, entry.name);
        if (entry.isDirectory()) files.push(...collectFiles(entryPath));
        else if (entry.isFile() && EXTENSIONS.has(extname(entry.name)))
            files.push(entryPath);
    }
    return files;
}
