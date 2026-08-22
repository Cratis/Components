# Use fully unstyled mode

You're integrating Cratis Components into a design system that defines its own button, dialog, and input visuals. You want zero PrimeReact CSS in the final bundle.

This setup disables every PrimeReact base style at the provider and supplies visuals through PrimeReact's `pt` (pass-through) mechanism, your own CSS, or both. Components render structurally only until your `pt` preset and CSS provide the actual UI.

## Setup

```tsx
import '@cratis/components/tokens'; // the --cratis-* layer, still useful for Cratis-scoped surfaces
import '@cratis/components/styles'; // component CSS + Tailwind utilities for spacing/layout
import { CratisComponentsProvider } from '@cratis/components';
import { globalPt } from './pt-preset';

export const App = () => (
    <CratisComponentsProvider value={{ unstyled: true, pt: globalPt }}>
        <YourApp />
    </CratisComponentsProvider>
);
```

`unstyled: true` removes every PrimeReact base style. The `pt` preset is what fills the visual vacuum. Without one, components render as raw HTML elements with browser defaults.

The top-level keys of a `pt` preset are PrimeReact 11's own component names — so `select`, not `dropdown`; `textarea`, not `inputtextarea`; and there is no `menubar` key at all, because PrimeReact 11 removed Menubar and the Cratis action bar is a `button` toolbar. Components 3 publishes the supported keys, slots, and rendered markers from `@cratis/components/compatibility`; do not rely on an ignored unknown slot as a compatibility strategy.

## Verify the contract

Use the published sentinel preset in a DOM test, render the Cratis surfaces your application depends on, and assert the relevant contract subset:

```tsx
import { render } from '@testing-library/react';
import { CratisComponentsProvider } from '@cratis/components';
import {
    assertPrimeReact11PassThroughCompatibility,
    primeReact11PassThroughSentinelPreset,
} from '@cratis/components/compatibility';

it('keeps the unstyled slots used by the application', () => {
    render(
        <CratisComponentsProvider
            value={{
                unstyled: true,
                pt: primeReact11PassThroughSentinelPreset,
            }}
        >
            <ApplicationCompatibilitySurface />
        </CratisComponentsProvider>,
    );

    assertPrimeReact11PassThroughCompatibility(document, ['button', 'dialog', 'select']);
});
```

The assertion ignores additions and fails with one diagnostic per missing sentinel or structural marker. The default component list checks the complete contract. The contract is scoped to Components 3 and PrimeReact 11; future Components majors may publish a different contract.

The two examples below show the same preset in two different styling languages. Pick whichever your design system uses.

## With plain CSS

Attach class names from your own stylesheet via a global preset:

```ts
// pt-preset.ts
export const globalPt = {
    button: {
        root: { className: 'my-btn' },
    },
    dialog: {
        root: {
            popup: { className: 'my-dialog' },
            header: { className: 'my-dialog__header' },
            content: { className: 'my-dialog__body' },
            backdrop: { className: 'my-dialog__mask' },
        },
    },
    inputtext: {
        root: { className: 'my-input' },
    },
} as const;
```

```css
/* yourApp.css */
.my-btn {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    background: var(--cratis-primary-color);
    color: var(--cratis-primary-color-text);
    border: none;
    border-radius: var(--cratis-border-radius);
    cursor: pointer;
}

.my-btn:hover {
    filter: brightness(1.1);
}
.my-btn:active {
    filter: brightness(0.9);
}
.my-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.my-dialog {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.my-dialog__header {
    padding: 1rem 1.25rem;
    background: var(--cratis-surface-card);
    border-bottom: 1px solid var(--cratis-surface-border);
    font-weight: 600;
}

.my-dialog__body {
    padding: 1.25rem;
    background: var(--cratis-surface-card);
    color: var(--cratis-text-color);
}

.my-dialog__mask {
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(4px);
}

.my-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: var(--cratis-surface-100);
    border: 1px solid var(--cratis-surface-border);
    border-radius: 6px;
    color: var(--cratis-text-color);
}

.my-input:focus {
    outline: 2px solid var(--cratis-primary-color);
    outline-offset: 1px;
}
```

This is the most discoverable shape: every PrimeReact slot gets a single dedicated class in your own CSS file. You can grep, refactor, and reuse the same classes outside Cratis Components without coupling to PrimeReact's internals.

## With TailwindCSS

Same shape, Tailwind utility classes as the class strings:

```ts
// pt-preset.ts
export const globalPt = {
    button: {
        root: {
            className: [
                'inline-flex items-center justify-center gap-2',
                'px-4 py-2 rounded-lg font-medium',
                'bg-sky-500 text-white',
                'hover:bg-sky-400 active:bg-sky-600',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
            ].join(' '),
        },
    },

    inputtext: {
        root: {
            className: [
                'w-full px-3 py-2 rounded-md',
                'bg-slate-800 text-slate-50',
                'border border-slate-700',
                'placeholder:text-slate-400',
                'focus:border-sky-400 focus:outline-none',
                'focus-visible:ring-2 focus-visible:ring-sky-400',
            ].join(' '),
        },
    },

    dialog: {
        root: {
            popup: {
                className:
                    'rounded-2xl shadow-2xl overflow-hidden bg-slate-900 text-slate-50',
            },
            header: {
                className: [
                    'flex items-center justify-between gap-4',
                    'px-5 py-3 font-semibold',
                    'bg-slate-800 text-slate-50 border-b border-slate-700',
                ].join(' '),
            },
            title: { className: 'text-base' },
            close: { className: 'p-1 rounded hover:bg-slate-700 transition-colors' },
            content: { className: 'p-5 bg-slate-900 text-slate-100' },
            footer: {
                className:
                    'px-5 py-3 bg-slate-800 border-t border-slate-700 flex justify-end gap-2',
            },
            backdrop: { className: 'bg-slate-950/70 backdrop-blur-sm' },
        },
    },

    select: {
        root: {
            root: {
                className: [
                    'w-full inline-flex items-center justify-between gap-2',
                    'px-3 py-2 rounded-md cursor-pointer',
                    'bg-slate-800 text-slate-50 border border-slate-700',
                    'hover:border-slate-500',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                ].join(' '),
            },
            value: { className: 'flex-1 truncate text-left' },
            indicator: { className: 'shrink-0 text-slate-400' },
            popup: {
                className:
                    'mt-1 rounded-md shadow-xl overflow-hidden bg-slate-800 border border-slate-700',
            },
            option: { className: 'px-3 py-2 cursor-pointer hover:bg-slate-800' },
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
                ].join(' '),
            },
            indicator: { className: 'text-white text-xs' },
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
            body: { className: 'divide-y divide-slate-800' },
            row: { className: 'hover:bg-slate-800/60 transition-colors' },
            cell: { className: 'px-3 py-2 text-slate-100' },
        },
    },

    // PrimeReact 11 removed Menubar; the Cratis action bar is a Button toolbar
    // styled through the `button` slot above, so no menubar preset is needed.
} as const;
```

A nearly-identical preset ships in the Storybook (`.storybook/pt-preset.ts`) — use it as a starter and fork into your own app.

## Per-instance overrides

Anything global can be overridden per-instance:

```tsx
<Dialog
    title="Brand callout"
    pt={{
        root:   { className: 'rounded-none' },
        header: { className: 'bg-pink-600 text-white' },
    }}
>
    …
</Dialog>

<InputTextField
    value={c => c.name}
    pt={{ root: { className: 'border-2 border-pink-500' } }}
/>
```

Per-instance `pt` is **merged** with the global preset by default (`ptOptions.mergeSections: true` is PrimeReact's default). To replace a slot entirely instead, set `ptOptions={{ mergeSections: false }}` on the wrapper.

## Composite components in unstyled mode

`DataPage` and `StepperCommandDialog` compose multiple PrimeReact widgets and expose explicit per-slot props. The global `pt` reaches every internal widget; per-instance overrides target the inner slot directly:

```tsx
<DataPage<AllAuthors, Author, never>
    title="Authors"
    query={AllAuthors}
    tablePt={{ table: { className: 'min-w-full divide-y divide-slate-700' } }}
    menubarPt={{ root: { className: 'px-3 py-2 bg-slate-900' } }}
>
    <DataPage.MenuItems>…</DataPage.MenuItems>
    <DataPage.Columns>…</DataPage.Columns>
</DataPage>

<StepperCommandDialog<RegisterOrder>
    command={RegisterOrder}
    title="New order"
    /* pt targets the inner Stepper */
    pt={{ stepperpanel: { content: { className: 'pt-6' } } }}
    /* dialogPt targets the outer Dialog */
    dialogPt={{ header: { className: 'bg-slate-900' } }}
>
    …
</StepperCommandDialog>
```

`ObjectContentEditor`, `ObjectNavigationalBar`, and `SchemaEditor` accept only `className` on the root — restyle their internals via the **global** `pt` preset set on `CratisComponentsProvider`. See [Pass-through cheat sheet](pass-through.md) for the full per-component reference.

## What `--cratis-*` tokens give you in fully unstyled mode

In fully unstyled mode the `pt` preset carries every PrimeReact visual, so you don't strictly need any `--cratis-*` token. However, a few Cratis surfaces are styled with token-driven CSS (FormElement addon, ObjectNavigationalBar bottom border, inline validation errors) — overriding the relevant tokens lets you tint those surfaces consistently with your preset:

```css
:root {
    --cratis-surface-border: theme('colors.slate.700');
    --cratis-text-color: theme('colors.slate.50');
    --cratis-text-color-secondary: theme('colors.slate.400');
    --cratis-red-500: theme('colors.red.500');
    --cratis-border-radius: 8px;
}
```

See [Cratis token reference](cratis-tokens.md) for the full list and which surface each token controls.
