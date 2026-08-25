// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/*
 * Provider-context identity verification for the setup-only root architecture
 * (Cratis/Components root architecture).
 *
 * The root barrel (`@cratis/components`) and every subpath (`@cratis/components/Dialogs`,
 * `/Dropdown`, `/DataTables`, `/TimeMachine`, ...) are now separate Rollup entry points,
 * each emitted with `preserveModules` into its own `dist/esm/<Subpath>` tree (see
 * `rollup.config.mjs`'s `entryPointsFromExports`). That is a real risk this script exists
 * to rule out: if the shared `CratisComponentsContext` (custom labels) or
 * `react-aria-components`' `I18nProvider` locale context were ever duplicated across entry
 * points instead of staying one singleton module, a consumer mounting
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
 * Rendering uses `react-dom/server`'s `renderToStaticMarkup` rather than jsdom: no DOM
 * polyfill, no `requestAnimationFrame`/`ResizeObserver`/global-property shimming, and no
 * dependency on a full browser environment being faithfully reproduced - only a plain
 * Node ESM process. `Dialog` and `Dropdown` already render fully in a non-browser
 * environment (`Dialog`'s SSR fallback path; `Dropdown`/`DataTableCore`/`TimeMachine` have
 * no `document`-gated early return), so their labels are present in the server markup
 * without needing any interaction. `Toaster` is deliberately excluded from this fixture -
 * it renders through `createPortal(..., document.body)` and returns `null` while
 * `document` is undefined, so it has nothing to prove here and belongs to a DOM-based
 * spec instead.
 *
 * One `CratisComponentsProvider` (imported from the package root) wraps a `Dialog`
 * (`./Dialogs`), a `Dropdown` (`./Dropdown`), a `DataTableCore` (`./DataTables`), and a
 * `TimeMachine` (`./TimeMachine`) - four separately bundled subpath modules - with
 * sentinel `messages` unique to this run and a non-English `locale`. The rendered server
 * markup is asserted to contain every sentinel label/locale-formatted value, proving the
 * same context instances actually reach all four subpaths.
 *
 * Usage:  node scripts/verify-provider-context-identity.mjs [--keep-fixture]
 * Exits non-zero if any subpath fails to reflect the root provider's configuration.
 */

import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
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

// Every subpath exercised here (Dialogs, Dropdown, DataTables, TimeMachine) is
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

// A fresh random nonce per run rather than a fixed sentinel string, so a stale cached
// build/module or a hardcoded default in the component itself cannot coincidentally match.
const nonce = randomUUID().slice(0, 8);

// The identity probe itself runs as its own ESM entry file (rather than an --eval string) so it
// can use top-level await comfortably and stay readable.
const probeFile = path.join(scratchRoot, 'identity-probe.mjs');
writeFileSync(probeFile, buildProbeSource(pkg.name, nonce));

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
    '\nRoot provider configuration (messages + locale) reaches Dialog, Dropdown, DataTableCore, ' +
        'and TimeMachine, each imported from its own separately built subpath, in server-rendered markup.',
);

/** Builds the child probe's source: a react-dom/server render and label/markup assertions. */
function buildProbeSource(packageName, nonce) {
    return `
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CratisComponentsProvider } from '${packageName}';
import { Dialog } from '${packageName}/Dialogs';
import { DialogButtons } from '@cratis/arc.react/dialogs';
import { Dropdown } from '${packageName}/Dropdown';
import { DataTableCore, Column } from '${packageName}/DataTables';
import { TimeMachine } from '${packageName}/TimeMachine';

const nonce = ${JSON.stringify(nonce)};
const sentinelMessages = {
    dialog: { ok: \`IDENTITY-ok-\${nonce}\`, cancel: \`IDENTITY-cancel-\${nonce}\` },
    dropdown: { showOptions: \`IDENTITY-show-options-\${nonce}\` },
    dataTable: {
        search: \`IDENTITY-search-placeholder-\${nonce}\`,
        searchAriaLabel: \`IDENTITY-search-aria-\${nonce}\`,
    },
};
const LOCALE = 'nb-NO';
const versionTimestamp = new Date(Date.UTC(2024, 0, 15, 10, 30));
const nbFormatted = new Intl.DateTimeFormat(LOCALE, { month: 'short', day: 'numeric', year: 'numeric' }).format(versionTimestamp);
const enFormatted = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(versionTimestamp);

const markup = renderToStaticMarkup(
    h(
        CratisComponentsProvider,
        { value: { locale: LOCALE, messages: sentinelMessages } },
        h(Dialog, { title: 'Identity dialog', buttons: DialogButtons.OkCancel }, 'Body'),
        h(Dropdown, { filter: true, options: [{ label: 'A', value: 'a' }] }),
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

const failures = [];
const contains = (label, needle) => {
    if (markup.includes(needle)) {
        console.log('  ok   - ' + label);
    } else {
        failures.push(label);
        console.error('  FAIL - ' + label + ' (expected to find ' + JSON.stringify(needle) + ' in the server-rendered markup)');
    }
};

contains("Dialog (./Dialogs) resolves the root provider's Ok label", \`IDENTITY-ok-\${nonce}\`);
contains("Dialog (./Dialogs) resolves the root provider's Cancel label", \`IDENTITY-cancel-\${nonce}\`);
contains("Dropdown (./Dropdown) resolves the root provider's show-options label", \`IDENTITY-show-options-\${nonce}\`);
contains("DataTableCore (./DataTables) resolves the root provider's search placeholder", \`IDENTITY-search-placeholder-\${nonce}\`);
contains("DataTableCore (./DataTables) resolves the root provider's search aria-label", \`IDENTITY-search-aria-\${nonce}\`);

if (nbFormatted === enFormatted) {
    console.error('  FAIL - locale fixture is not distinguishing (nb-NO and en-US formatted the same) - fix the fixture date');
    failures.push('locale fixture distinguishes nb-NO from en-US');
} else {
    contains(
        "TimeMachine (./TimeMachine) resolves the root provider's nb-NO locale via react-aria-components' I18nProvider",
        nbFormatted,
    );
}

if (failures.length > 0) {
    console.error('\\n' + failures.length + ' identity assertion(s) failed.');
    process.exit(1);
}
console.log('\\nAll 4 subpath consumers reflect the root provider configuration in server-rendered markup.');
`;
}
