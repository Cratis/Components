// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Run inside a packed consumer with neither reflect-metadata nor tsyringe installed explicitly. */
import { createRequire } from 'node:module';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const resolveIfPresent = (specifier, resolver) => {
    try {
        return resolver.resolve(specifier);
    } catch (error) {
        if (error?.code === 'MODULE_NOT_FOUND' || error?.code === 'ERR_MODULE_NOT_FOUND') return undefined;
        throw error;
    }
};
const consumerRequire = createRequire(import.meta.url);
const componentsRequire = createRequire(import.meta.resolve('@cratis/components'));
if (resolveIfPresent('reflect-metadata', consumerRequire) ||
    resolveIfPresent('reflect-metadata', componentsRequire)) {
    throw new Error('reflect-metadata is installed; this is not the absent-peer case.');
}
console.log('reflect-metadata absent from consumer and Components');

const root = await import('@cratis/components');
if (!root.CratisComponentsProvider) throw new Error('Root import did not export the provider.');
console.log('root import passed');
const display = await import('@cratis/components/Display');
if (!display.Badge) throw new Error('Non-Arc Display subpath failed.');
console.log('non-Arc Display import passed');

// tsyringe must resolve from Arc React, not from Components' optional peer declaration.
const arcReactRequire = createRequire(import.meta.resolve('@cratis/arc.react'));
if (!resolveIfPresent('tsyringe', arcReactRequire)) {
    throw new Error('Arc React did not bring tsyringe as its own dependency.');
}
console.log('Arc React resolves its own tsyringe dependency');
await import('@cratis/arc');
if (typeof Reflect.getMetadata !== 'function') {
    throw new Error('Arc did not initialize the Fundamentals Reflect metadata implementation.');
}
console.log('Arc initializes Reflect metadata without reflect-metadata');

const dataTables = await import('@cratis/components/DataTables');
if (!dataTables.DataTableForQuery) throw new Error('Arc-backed DataTables import failed.');
const { QueryFor } = await import('@cratis/arc/queries');
class ExampleQuery extends QueryFor {
    constructor() { super(Object, true); }
    route = '/api/example';
    parameterDescriptors = [];
    requiredRequestParameters = [];
    defaultValue = [];
}
const markup = renderToStaticMarkup(createElement(dataTables.DataTableForQuery, {
    query: ExampleQuery,
    emptyMessage: 'No examples',
}));
if (!markup.includes('cratis-datatable__table')) {
    throw new Error('Arc-backed DataTables query did not render a table.');
}
console.log('Arc-backed DataTables query rendered without optional peers');
