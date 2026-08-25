// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/*
 * Provider-context identity verification for the setup-only root architecture
 * (Cratis/Components root architecture).
 *
 * The root barrel (`@cratis/components`) and every subpath (`@cratis/components/Dialogs`,
 * `/Dropdown`, `/DataTables`, `/Notifications`, `/TimeMachine`, ...) are now separate
 * Rollup entry points, each emitted with `preserveModules` into its own `dist/esm/<Subpath>`
 * tree (see `rollup.config.mjs`'s `entryPointsFromExports`). That is a real risk this
 * script exists to rule out: if the shared `CratisComponentsContext` (custom labels) or
 * `react-aria-components`' `I18nProvider` locale context were ever duplicated across
 * entry points instead of staying one singleton module, a consumer mounting
 * `CratisComponentsProvider` from the root and a component from a subpath would silently
 * fail to share configuration - each subpath's `useCratisComponentsConfig()` would read
 * its own defaults instead of the root's live value.
 *
 * This runs against the *packed* artifact (via package specifiers resolved through a
 * scratch `node_modules`, exactly like `verify-no-pixi-consumer.mjs`), not source, because
 * source-level relative imports trivially share one module graph regardless of how the
 * published entry points are structured - only the built/packed boundary can actually
 * exercise this risk.
 *
 * One `CratisComponentsProvider` (imported from the package root) wraps a `Dialog`
 * (`./Dialogs`), a `Dropdown` (`./Dropdown`), a `DataTableCore` (`./DataTables`), a
 * `Toaster` (`./Notifications`), and a `TimeMachine` (`./TimeMachine`) - five separately
 * bundled subpath modules - with sentinel `messages` and a non-English `locale`. Every
 * rendered label is asserted to be the sentinel/locale-formatted value, never the English
 * default, proving the same context instances actually reach all five subpaths.
 *
 * Usage:  node scripts/verify-provider-context-identity.mjs [--keep-fixture]
 * Exits non-zero if any subpath fails to reflect the root provider's configuration.
 */

import { spawnSync } from 'node:child_process';
import {
    existsSync,
    mkdtempSync,
    readFileSync,
    realpathSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScratchNodeModules, packArtifact } from './lib/packed-artifact.mjs';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const monorepoRoot = path.resolve(packageDir, '..');

const args = process.argv.slice(2);
const keepFixture = args.includes('--keep-fixture');

const pkg = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8'));

const esmRoot = path.join(packageDir, path.dirname(pkg.module ?? 'dist/esm/index.js'));
if (!existsSync(esmRoot)) {
    console.error(
        `Built output not found at ${esmRoot}. Run the publish build first: ` +
            '`yarn workspace @cratis/components run prepare`.',
    );
    process.exit(1);
}

console.log(`\nverify-provider-context-identity: ${pkg.name}@${pkg.version}\n`);

const scratchRoot = realpathSync(
    mkdtempSync(path.join(tmpdir(), 'cratis-components-identity-')),
);
let removed = false;
const cleanup = () => {
    if (keepFixture || removed) return;
    removed = true;
    rmSync(scratchRoot, { recursive: true, force: true });
};
process.once('exit', cleanup);

console.log(`Packing ${pkg.name}@${pkg.version} ...`);
const { entries: packedEntries } = packArtifact(packageDir, scratchRoot);

// Every subpath exercised here (Dialogs, Dropdown, DataTables, Notifications, TimeMachine) is
// non-spatial, so pixi.js is withheld the same way verify-no-pixi-consumer.mjs does - this
// fixture only needs the mandatory peers.
buildScratchNodeModules({
    monorepoRoot,
    scratchRoot,
    packedEntries,
    excludeTopLevel: new Set(['pixi.js']),
    excludeScoped: new Set(['@pixi', '@webgpu']),
});

writeFileSync(
    path.join(scratchRoot, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }, null, 4),
);

// The identity probe itself runs as its own ESM entry file (rather than an --eval string) so it
// can use top-level await comfortably and stay readable.
const probeFile = path.join(scratchRoot, 'identity-probe.mjs');
writeFileSync(probeFile, buildProbeSource(pkg.name));

const result = spawnSync(process.execPath, [probeFile], {
    cwd: scratchRoot,
    encoding: 'utf8',
    timeout: 60_000,
});

console.log(result.stdout ?? '');
if (result.stderr) console.error(result.stderr);

if (keepFixture) {
    console.log(`--keep-fixture: scratch consumer retained at ${scratchRoot}`);
} else {
    cleanup();
}

if (result.status !== 0) {
    console.error('\nProvider-context identity check FAILED.');
    process.exit(1);
}

console.log(
    '\nRoot provider configuration (messages + locale) reaches Dialog, Dropdown, DataTable, ' +
        'Toaster, and TimeMachine, each imported from its own separately built subpath.',
);

/** Builds the child probe's source: jsdom setup, a composed render, and label assertions. */
function buildProbeSource(packageName) {
    return `
import { JSDOM } from 'jsdom';

// pretendToBeVisual gives jsdom a real requestAnimationFrame/cancelAnimationFrame (used by
// React Aria's FocusScope and press interactions) instead of leaving them undefined.
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
});
const { window: jsdomWindow } = dom;

// Copy every own property of jsdom's window onto globalThis (not a fixed short list) - React
// Aria's interaction/focus/press internals reach for SVGElement, getComputedStyle, MutationObserver,
// CustomEvent, PointerEvent, DOMRect, and more; a fixed allowlist silently under-polyfills whichever
// of those a given interaction happens to need. Node 21+ already defines some of these (navigator,
// performance, ...) as getter-only globals, so this redefines rather than assigns.
for (const key of Object.getOwnPropertyNames(jsdomWindow)) {
    if (key === 'window' || key === 'globalThis' || key === 'self' || key === 'top' || key === 'parent') continue;
    try {
        Object.defineProperty(globalThis, key, {
            value: jsdomWindow[key],
            configurable: true,
            writable: true,
            enumerable: true,
        });
    } catch {
        // Non-configurable on this Node version - leave the existing global as-is.
    }
}
globalThis.window = jsdomWindow;
globalThis.document = jsdomWindow.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const React = await import('react');
const { createElement: h, act } = React;
const { createRoot } = await import('react-dom/client');
const { CratisComponentsProvider } = await import(${JSON.stringify(packageName)});
const { Dialog } = await import(${JSON.stringify(packageName)} + '/Dialogs');
const { DialogButtons } = await import('@cratis/arc.react/dialogs');
const { Dropdown } = await import(${JSON.stringify(packageName)} + '/Dropdown');
const { DataTableCore, Column } = await import(${JSON.stringify(packageName)} + '/DataTables');
const { Toaster } = await import(${JSON.stringify(packageName)} + '/Notifications');
const { TimeMachine } = await import(${JSON.stringify(packageName)} + '/TimeMachine');

const sentinelMessages = {
    dialog: { ok: 'IDENTITY-ok', cancel: 'IDENTITY-cancel' },
    dropdown: { showOptions: 'IDENTITY-show-options', clearSelection: 'IDENTITY-clear-selection' },
    dataTable: { search: 'IDENTITY-search', searchAriaLabel: 'IDENTITY-search-aria', selectRow: 'IDENTITY-select-row' },
    notifications: { region: 'IDENTITY-region', dismiss: 'IDENTITY-dismiss' },
};
const LOCALE = 'nb-NO';
const versionTimestamp = new Date(Date.UTC(2024, 0, 15, 10, 30));
const nbFormatted = new Intl.DateTimeFormat(LOCALE, { month: 'short', day: 'numeric', year: 'numeric' }).format(versionTimestamp);
const enFormatted = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(versionTimestamp);

const container = document.createElement('div');
document.body.append(container);
const root = createRoot(container);

await act(async () => {
    root.render(
        h(
            CratisComponentsProvider,
            { value: { locale: LOCALE, messages: sentinelMessages }, toaster: true },
            h(Dialog, { title: 'Identity dialog', buttons: DialogButtons.OkCancel }, 'Body'),
            h(Dropdown, { value: 'a', options: [{ label: 'A', value: 'a' }], showClear: true }),
            h(
                DataTableCore,
                { data: [{ id: '1', name: 'Row' }], dataKey: 'id', emptyMessage: 'No rows', globalFilterFields: ['name'] },
                h(Column, { field: 'name', header: 'Name' }),
            ),
            h(TimeMachine, {
                versions: [{ id: 'v1', timestamp: versionTimestamp, label: 'v1', content: h('div', null, 'v1') }],
            }),
        ),
    );
});

const failures = [];
const check = (label, actual, expected) => {
    if (actual === expected) {
        console.log('  ok   - ' + label);
    } else {
        failures.push(label);
        console.error('  FAIL - ' + label + ' (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
    }
};
const contains = (label, haystack, needle) => {
    if (typeof haystack === 'string' && haystack.includes(needle)) {
        console.log('  ok   - ' + label);
    } else {
        failures.push(label);
        console.error('  FAIL - ' + label + ' (expected to find ' + JSON.stringify(needle) + ' in ' + JSON.stringify(haystack) + ')');
    }
};

const okButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent === 'IDENTITY-ok');
check('Dialog (./Dialogs) resolves the root provider\\'s Ok label', okButton?.textContent, 'IDENTITY-ok');

const dropdownTrigger = container.querySelector('[data-cratis-part="trigger"]');
check(
    'Dropdown (./Dropdown) resolves the root provider\\'s show-options label',
    dropdownTrigger?.getAttribute('aria-label'),
    'IDENTITY-show-options',
);

const searchInput = container.querySelector('[data-cratis-part="search-input"]');
check('DataTableCore (./DataTables) resolves the root provider\\'s search placeholder', searchInput?.getAttribute('placeholder'), 'IDENTITY-search');
check('DataTableCore (./DataTables) resolves the root provider\\'s search aria-label', searchInput?.getAttribute('aria-label'), 'IDENTITY-search-aria');

const toastRegion = document.querySelector('[data-cratis-part="region"]');
check('Toaster (./Notifications) resolves the root provider\\'s region label', toastRegion?.getAttribute('aria-label'), 'IDENTITY-region');

const timelineEntry = container.querySelector('.timeline-entry');
if (nbFormatted === enFormatted) {
    console.error('  FAIL - locale fixture is not distinguishing (nb-NO and en-US formatted the same) - fix the fixture date');
    failures.push('locale fixture distinguishes nb-NO from en-US');
} else {
    contains(
        "TimeMachine (./TimeMachine) resolves the root provider's nb-NO locale via react-aria-components' I18nProvider",
        timelineEntry?.getAttribute('aria-label') ?? '',
        nbFormatted,
    );
}

await act(async () => root.unmount());

if (failures.length > 0) {
    console.error('\\n' + failures.length + ' identity assertion(s) failed.');
    process.exit(1);
}
console.log('\\nAll 5 subpath consumers reflect the root provider configuration.');
`;
}
