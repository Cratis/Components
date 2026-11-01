// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { componentMarkerCoverage } from './componentMarkerCoverage';

const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
const surface = JSON.parse(readFileSync(`${sourceRoot}api-surface.json`, 'utf8')) as Record<
    string,
    Record<string, string>
>;

// A public component is an exported, PascalCase value whose signature produces elements.
const looksLikeComponent = (name: string, signature: string) =>
    /^[A-Z]/u.test(name) &&
    !/^(export )?(interface|type|enum|class)/u.test(signature) &&
    /JSX\.Element|ReactNode|ForwardRef|ReactElement|FunctionComponent|Memo|=> \{|\(props/u.test(signature);

// CommandDialog and StepperCommandDialog are components with static members, so their exported
// signature is not a plain function type.
const alsoComponents = ['CommandDialog', 'StepperCommandDialog'];

const publicComponents = (): string[] => {
    const names = new Set<string>(alsoComponents);
    for (const exports of Object.values(surface)) {
        for (const [name, signature] of Object.entries(exports)) {
            if (looksLikeComponent(name, signature)) names.add(name);
        }
    }
    return [...names].sort();
};

const declaresMarker = (source: string, component: string) => {
    const text = readFileSync(`${sourceRoot}${source}`, 'utf8');
    return (
        text.includes(`data-cratis-component='${component}'`) ||
        text.includes(`data-cratis-component="${component}"`) ||
        new RegExp(`describeComponent<\\w+>\\(\\s*'${component}'`, 'u').test(text)
    );
};

const PENDING_CEILING = 46;

const markersDeclaredInSource = (): Set<string> => {
    const declared = new Set<string>();
    const walk = (directory: string) => {
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
            if (entry.isDirectory()) {
                if (!['node_modules', 'dist'].includes(entry.name) && !entry.name.startsWith('for_')) {
                    walk(`${directory}${entry.name}/`);
                }
            } else if (/\.tsx?$/u.test(entry.name) && !entry.name.includes('.stories.')) {
                const text = readFileSync(`${directory}${entry.name}`, 'utf8');
                for (const match of text.matchAll(/data-cratis-component=['"](\w+)['"]|describeComponent<\w+>\(\s*'(\w+)'/gu)) {
                    declared.add(match[1] ?? match[2]);
                }
            }
        }
    };
    walk(sourceRoot);
    return declared;
};

describe('when checking component identity markers', () => {
    const components = publicComponents();

    it('should find the public components', () => components.length.should.be.greaterThan(80));

    it('should account for every public component', () => {
        const unaccounted = components.filter((name) => !(name in componentMarkerCoverage));
        unaccounted.should.deep.equal(
            [],
            `These public components render no data-cratis-component on their root. Add the marker and a componentMarkerCoverage entry: ${unaccounted.join(', ')}`,
        );
    });

    it('should not list a component that is no longer public', () => {
        const stale = Object.keys(componentMarkerCoverage).filter((name) => !components.includes(name));
        stale.should.deep.equal([]);
    });

    it('should find the marker in every file that claims to declare it', () => {
        const missing: string[] = [];
        for (const [name, coverage] of Object.entries(componentMarkerCoverage)) {
            if (!('marked' in coverage)) continue;
            if (!coverage.marked.some((source) => declaresMarker(source, name))) missing.push(name);
        }
        missing.should.deep.equal([]);
    });

    it('should delegate only to a component that is itself marked', () => {
        const broken = Object.entries(componentMarkerCoverage)
            .filter(([, coverage]) => 'delegatesTo' in coverage)
            .filter(([, coverage]) => {
                const target = componentMarkerCoverage[(coverage as { delegatesTo: string }).delegatesTo];
                return !target || !('marked' in target);
            })
            .map(([name]) => name);
        broken.should.deep.equal([]);
    });

    it('should not keep a marked component on the pending list', () => {
        const declared = markersDeclaredInSource();
        const stillPending = Object.entries(componentMarkerCoverage)
            .filter(([name, coverage]) => 'pending' in coverage && declared.has(name))
            .map(([name]) => name);
        stillPending.should.deep.equal([]);
    });

    it('should only ever shrink the pending list', () => {
        const pending = Object.values(componentMarkerCoverage).filter((coverage) => 'pending' in coverage);
        pending.length.should.be.at.most(PENDING_CEILING);
    });
});
