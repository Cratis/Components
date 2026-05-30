// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Sample PrimeReact `pt` (pass-through) preset that demonstrates the Path C
 * styling story from the README: drop into `CratisComponentsProvider` with
 * `unstyled: true`, and every covered PrimeReact widget picks up a fresh look
 * built entirely from Tailwind utility classes.
 *
 * This file is Storybook-only and not part of the published package. Treat it
 * as a starting point you can fork into your own app.
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
                'bg-sky-500 text-white',
                'hover:bg-sky-400 active:bg-sky-600',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors',
                focusRing,
            ].join(' '),
        },
        label: { className: 'whitespace-nowrap' },
        icon: { className: 'shrink-0' },
    },

    inputtext: {
        root: {
            className: [
                'w-full px-3 py-2 rounded-md',
                surface, border,
                'placeholder:text-slate-400',
                'focus:border-sky-400',
                focusRing,
            ].join(' '),
        },
    },

    inputtextarea: {
        root: {
            className: [
                'w-full px-3 py-2 rounded-md',
                surface, border,
                'placeholder:text-slate-400 resize-y',
                'focus:border-sky-400',
                focusRing,
            ].join(' '),
        },
    },

    inputnumber: {
        root: { className: 'w-full' },
        input: {
            root: {
                className: [
                    'w-full px-3 py-2 rounded-md',
                    surface, border,
                    'focus:border-sky-400',
                    focusRing,
                ].join(' '),
            },
        },
    },

    dropdown: {
        root: {
            className: [
                'w-full inline-flex items-center justify-between gap-2',
                'px-3 py-2 rounded-md cursor-pointer',
                surface, border,
                'hover:border-slate-500',
                focusRing,
            ].join(' '),
        },
        input: { className: 'flex-1 truncate text-left' },
        trigger: { className: 'shrink-0 text-slate-400' },
        panel: {
            className: [
                'mt-1 rounded-md shadow-xl overflow-hidden',
                surface, border,
            ].join(' '),
        },
        item: {
            className: 'px-3 py-2 cursor-pointer hover:bg-slate-800',
        },
    },

    checkbox: {
        root: { className: 'inline-flex items-center' },
        box: {
            className: [
                'w-4 h-4 rounded',
                'border border-slate-500 bg-slate-800',
                'data-[p-highlight=true]:bg-sky-500 data-[p-highlight=true]:border-sky-500',
                focusRing,
            ].join(' '),
        },
        icon: { className: 'text-white text-xs' },
    },

    dialog: {
        root: {
            className: [
                'rounded-2xl shadow-2xl overflow-hidden',
                surface,
            ].join(' '),
        },
        header: {
            className: [
                'flex items-center justify-between gap-4',
                'px-5 py-3 font-semibold',
                'bg-slate-800 text-slate-50 border-b border-slate-700',
            ].join(' '),
        },
        headerTitle: { className: 'text-base' },
        closeButton: {
            className: 'p-1 rounded hover:bg-slate-700 transition-colors',
        },
        content: {
            className: 'p-5 bg-slate-900 text-slate-100',
        },
        footer: {
            className: 'px-5 py-3 bg-slate-800 border-t border-slate-700 flex justify-end gap-2',
        },
        mask: {
            className: 'bg-slate-950/70 backdrop-blur-sm',
        },
    },

    datatable: {
        root: { className: 'w-full' },
        table: { className: 'w-full text-sm' },
        thead: {
            className: 'bg-slate-800 text-slate-300 uppercase text-xs tracking-wider',
        },
        headerRow: { className: 'border-b border-slate-700' },
        headerCell: { className: 'px-3 py-2 text-left font-medium' },
        tbody: {
            className: 'divide-y divide-slate-800',
        },
        bodyRow: {
            className: [
                'hover:bg-slate-800/60 data-[p-highlight=true]:bg-sky-500/10',
                'data-[p-highlight=true]:text-sky-100',
                'transition-colors',
            ].join(' '),
        },
        bodyCell: { className: 'px-3 py-2 text-slate-100' },
    },

    paginator: {
        root: {
            className: 'flex items-center justify-end gap-1 px-3 py-2 bg-slate-800 border-t border-slate-700',
        },
        pageButton: {
            className: 'px-3 py-1 rounded hover:bg-slate-700 data-[p-highlight=true]:bg-sky-500 data-[p-highlight=true]:text-white',
        },
    },

    menubar: {
        root: {
            className: 'flex items-center gap-1 px-3 py-2 bg-slate-800 border-b border-slate-700',
        },
        menuitem: { className: 'rounded' },
        action: {
            className: 'inline-flex items-center gap-2 px-3 py-1.5 rounded hover:bg-slate-700 cursor-pointer',
        },
    },
} as const;
