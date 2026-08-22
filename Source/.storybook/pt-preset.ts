// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Sample PrimeReact `pt` (pass-through) preset that demonstrates the Path C
 * styling story from the README: drop into `CratisComponentsProvider` with
 * `unstyled: true`, and every covered PrimeReact widget picks up a fresh look
 * built entirely from Tailwind utility classes.
 *
 * This file is Storybook-only and not part of the published package. Treat it
 * as a PrimeReact 11 starting point you can fork into your own app. Its keys
 * follow the Components 3 contract published from `@cratis/components/compatibility`.
 */

const surface = 'bg-slate-900 text-slate-50';
const border = 'border border-slate-700';
const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400';

export const tailwindPtPreset = {
    button: {
        root: {
            className: [
                'inline-flex items-center justify-center gap-2',
                'px-4 py-2 rounded-lg font-medium',
                // sky-700 (not sky-500) so white label text clears WCAG AA (~6:1).
                'bg-sky-700 text-white',
                'hover:bg-sky-600 active:bg-sky-800',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors',
                focusRing,
            ].join(' '),
        },
    },

    inputtext: {
        root: {
            className: [
                'w-full px-3 py-2 rounded-md',
                surface,
                border,
                'placeholder:text-slate-400',
                'focus:border-sky-400',
                focusRing,
            ].join(' '),
        },
    },

    textarea: {
        root: {
            className: [
                'w-full px-3 py-2 rounded-md',
                surface,
                border,
                'placeholder:text-slate-400 resize-y',
                'focus:border-sky-400',
                focusRing,
            ].join(' '),
        },
    },

    inputnumber: {
        root: {
            root: { className: 'w-full' },
            input: {
                className: [
                    'w-full px-3 py-2 rounded-md',
                    surface,
                    border,
                    'focus:border-sky-400',
                    focusRing,
                ].join(' '),
            },
        },
    },

    select: {
        root: {
            root: {
                className: [
                    'w-full inline-flex items-center justify-between gap-2',
                    'px-3 py-2 rounded-md cursor-pointer',
                    surface,
                    border,
                    'hover:border-slate-500',
                    focusRing,
                ].join(' '),
            },
            value: { className: 'flex-1 truncate text-left' },
            indicator: { className: 'shrink-0 text-slate-400' },
            popup: {
                className: [
                    'mt-1 rounded-md shadow-xl overflow-hidden',
                    surface,
                    border,
                ].join(' '),
            },
            option: {
                className: 'px-3 py-2 cursor-pointer hover:bg-slate-800',
            },
        },
    },

    checkbox: {
        root: {
            root: { className: 'inline-flex items-center' },
            box: {
                className: [
                    'w-4 h-4 rounded',
                    'border border-slate-500 bg-slate-800',
                    'data-[p-highlight=true]:bg-sky-500 data-[p-highlight=true]:border-sky-500',
                    focusRing,
                ].join(' '),
            },
            indicator: { className: 'text-white text-xs' },
        },
    },

    dialog: {
        root: {
            popup: {
                className: ['rounded-2xl shadow-2xl overflow-hidden', surface].join(' '),
            },
            header: {
                className: [
                    'flex items-center justify-between gap-4',
                    'px-5 py-3 font-semibold',
                    'bg-slate-800 text-slate-50 border-b border-slate-700',
                ].join(' '),
            },
            title: { className: 'text-base' },
            close: {
                className: 'p-1 rounded hover:bg-slate-700 transition-colors',
            },
            content: {
                className: 'p-5 bg-slate-900 text-slate-100',
            },
            footer: {
                className:
                    'px-5 py-3 bg-slate-800 border-t border-slate-700 flex justify-end gap-2',
            },
            backdrop: {
                className: 'bg-slate-950/70 backdrop-blur-sm',
            },
        },
    },

    datatable: {
        root: {
            root: { className: 'w-full' },
            table: { className: 'w-full text-sm' },
            head: {
                className: 'bg-slate-800 text-slate-300 uppercase text-xs tracking-wider',
            },
            theadRow: { className: 'border-b border-slate-700' },
            theadCell: { className: 'px-3 py-2 text-left font-medium' },
            body: {
                className: 'divide-y divide-slate-800',
            },
            row: {
                className: [
                    'hover:bg-slate-800/60 data-[p-highlight=true]:bg-sky-500/10',
                    'data-[p-highlight=true]:text-sky-100',
                    'transition-colors',
                ].join(' '),
            },
            cell: { className: 'px-3 py-2 text-slate-100' },
        },
    },

    // PrimeReact 11 removed Menubar; the Cratis action bar is a Button toolbar
    // styled through the `button` slot above, so no menubar preset is needed.
} as const;
