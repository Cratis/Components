#!/usr/bin/env node
// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { transformSource } from '../lib/transform.js';
import { packageName as defaultPackageName } from '../lib/namespaceMap.js';

const EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.yarn']);

function printUsage() {
    console.log(
        [
            'Usage: cratis-components-remove-root-namespace-imports [--check] [--package <name>] <path...>',
            '',
            'Rewrites \'import { Namespace } from "@cratis/components"\' into',
            '\'import * as Namespace from "@cratis/components/Namespace"\' for every namespace',
            'removed from the Components 4 package root. Approved setup symbols (for example',
            "'CratisComponentsProvider') are left importable from the root.",
            '',
            'Options:',
            '  --check           Report what would change without writing files; exits 1 if',
            '                    anything would change or any unsupported case was found.',
            '  --package <name>  Package to migrate away from (default: @cratis/components).',
            '',
            '<path...> may be files or directories; directories are walked recursively for',
            '.ts/.tsx/.mts/.cts files, skipping node_modules, dist, .git, and .yarn.',
        ].join('\n'),
    );
}

function collectFiles(inputPath) {
    const stats = statSync(inputPath);
    if (stats.isFile()) {
        return EXTENSIONS.has(extname(inputPath)) ? [inputPath] : [];
    }
    if (!stats.isDirectory()) return [];

    const files = [];
    for (const entry of readdirSync(inputPath, { withFileTypes: true })) {
        if (SKIP_DIRS.has(entry.name)) continue;
        const entryPath = join(inputPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectFiles(entryPath));
        } else if (entry.isFile() && EXTENSIONS.has(extname(entry.name))) {
            files.push(entryPath);
        }
    }
    return files;
}

function main(argv) {
    const args = [...argv];
    let check = false;
    let packageName = defaultPackageName;
    const paths = [];

    while (args.length > 0) {
        const arg = args.shift();
        if (arg === '--check') {
            check = true;
        } else if (arg === '--package') {
            const configuredPackage = args.shift();
            if (!configuredPackage) {
                console.error('--package requires a package name.');
                return 1;
            }
            packageName = configuredPackage;
        } else if (arg === '--help' || arg === '-h') {
            printUsage();
            return 0;
        } else if (arg.startsWith('-')) {
            console.error(`Unknown option: ${arg}`);
            return 1;
        } else {
            paths.push(arg);
        }
    }

    if (paths.length === 0) {
        printUsage();
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

    for (const file of files) {
        const original = readFileSync(file, 'utf8');
        const { text, changed, diagnostics } = transformSource(file, original, {
            packageName,
        });

        for (const diagnostic of diagnostics) {
            diagnosticCount += 1;
            console.warn(
                `${diagnostic.file}:${diagnostic.line}:${diagnostic.column}: ${diagnostic.message}`,
            );
        }

        if (changed) {
            changedCount += 1;
            if (check) {
                console.log(`would rewrite ${file}`);
            } else {
                writeFileSync(file, text, 'utf8');
                console.log(`rewrote ${file}`);
            }
        }
    }

    console.log(
        `\n${files.length} file(s) scanned, ${changedCount} ${check ? 'would change' : 'changed'}, ${diagnosticCount} unsupported case(s) reported.`,
    );

    // Non-zero whenever there is unmigrated, unsupported material to look at by hand, or
    // (in --check mode only) whenever a supported rewrite has not yet been applied.
    if (diagnosticCount > 0) return 1;
    if (check && changedCount > 0) return 1;
    return 0;
}

process.exitCode = main(process.argv.slice(2));
