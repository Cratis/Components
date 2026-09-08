// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import {
    createRef,
    forwardRef,
    type ComponentType,
    type InputHTMLAttributes,
} from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import sinon from 'sinon';
import { describe, it } from 'vitest';
import { Button, type ButtonProps } from '../../Common/Button';
import { Checkbox, type CheckboxProps } from '../../Common/Checkbox';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { IconButton, type IconButtonProps } from '../../Common/IconButton';
import { Radio, type RadioProps } from '../../Common/Radio';
import { Surface, type SurfaceProps } from '../../Common/Surface';
import { Switch, type SwitchProps } from '../../Common/Switch';
import { TextArea, type TextAreaProps } from '../../Common/TextArea';
import { TextInput, type TextInputProps } from '../../Common/TextInput';
import {
    mountPrimitive,
    unmountPrimitive,
} from '../../Common/for_Primitives/given/a_primitive_dom';
import { ProgressBar, type ProgressBarProps } from '../../Display/ProgressBar';
import {
    unstable_AdapterError,
    unstable_adapterErrorCodes,
    type unstable_SlotMap,
} from '..';
import { buttonSlot, createTestLibrary } from '../for_resolution/testLibrary';

const allPresentationControls = (
    <>
        <Button label='Save' />
        <IconButton icon={<span>+</span>} aria-label='Add item' />
        <TextInput defaultValue='Sample' />
        <TextArea defaultValue='Sample' />
        <Checkbox label='Choice' />
        <Radio name='sample' value='one' label='Choice' />
        <Switch label='Choice' />
        <ProgressBar value={42} />
        <Surface>Content</Surface>
    </>
);

const presentationDeclaration = <Props extends object>(
    render: ComponentType<Props>,
) => ({ mode: 'presentation' as const, fidelity: 'native' as const, render });

const countingAdapter = <Props extends object>(
    slotId: string,
    counts: Record<string, number>,
): ComponentType<Props> =>
    function CountingAdapter() {
        counts[slotId] = (counts[slotId] ?? 0) + 1;
        return <div data-adapter-slot={slotId} />;
    };

describe('when routing presentation slots', () => {
    it('should route each of the nine presentation facades exactly once without Core output', () => {
        const counts: Record<string, number> = {};
        const slots: unstable_SlotMap = {
            'common.button': presentationDeclaration(
                countingAdapter<ButtonProps>('common.button', counts),
            ),
            'common.iconButton': presentationDeclaration(
                countingAdapter<IconButtonProps>('common.iconButton', counts),
            ),
            'common.textInput': presentationDeclaration(
                countingAdapter<TextInputProps>('common.textInput', counts),
            ),
            'common.textArea': presentationDeclaration(
                countingAdapter<TextAreaProps>('common.textArea', counts),
            ),
            'common.checkbox': presentationDeclaration(
                countingAdapter<CheckboxProps>('common.checkbox', counts),
            ),
            'common.radio': presentationDeclaration(
                countingAdapter<RadioProps>('common.radio', counts),
            ),
            'common.switch': presentationDeclaration(
                countingAdapter<SwitchProps>('common.switch', counts),
            ),
            'common.progress': presentationDeclaration(
                countingAdapter<ProgressBarProps>('common.progress', counts),
            ),
            'common.surface': presentationDeclaration(
                countingAdapter<SurfaceProps>('common.surface', counts),
            ),
        };
        const library = createTestLibrary('all-presentation-slots', slots);

        const html = renderToStaticMarkup(
            <CratisComponentsProvider library={library}>
                {allPresentationControls}
            </CratisComponentsProvider>,
        );
        const container = document.createElement('div');
        container.innerHTML = html;

        expect(container.querySelectorAll('[data-adapter-slot]')).to.have.lengthOf(9);
        expect(container.querySelectorAll('[data-cratis-part]')).to.have.lengthOf(0);
        expect(Object.keys(counts)).to.have.lengthOf(9);
        expect(Object.values(counts)).to.deep.equal(Array(9).fill(1));
    });

    it('should render the external adapter exactly once, skip Core, and bridge its real ref', async () => {
        let adapterRenderCount = 0;
        const AdapterButton = forwardRef<HTMLButtonElement, ButtonProps>(
            function AdapterButton({ label }, ref) {
                adapterRenderCount++;
                return (
                    <button ref={ref} data-adapter-button='true'>
                        {label}
                    </button>
                );
            },
        );
        const library = createTestLibrary('external-button', buttonSlot(AdapterButton));
        const ref = createRef<HTMLButtonElement>();
        const mounted = await mountPrimitive(
            <CratisComponentsProvider library={library}>
                <Button ref={ref} label='Adapter action' />
            </CratisComponentsProvider>,
        );

        try {
            const adapterButton = mounted.container.querySelector(
                'button[data-adapter-button="true"]',
            );
            expect(adapterRenderCount).to.equal(1);
            expect(mounted.container.querySelectorAll('.cratis-button')).to.have
                .lengthOf(0);
            expect(adapterButton).to.equal(ref.current);
            expect(ref.current).to.be.instanceOf(HTMLButtonElement);
        } finally {
            await unmountPrimitive(mounted);
        }
    });

    it('should use a local Core implementation once and report one partial-adapter fallback', async () => {
        let adapterRenderCount = 0;
        let coreClassNameReads = 0;
        const AdapterButton = forwardRef<HTMLButtonElement, ButtonProps>(
            function AdapterButton({ label }, ref) {
                adapterRenderCount++;
                return <button ref={ref}>{label}</button>;
            },
        );
        const library = createTestLibrary('partial-adapter', buttonSlot(AdapterButton));
        const rootPart: InputHTMLAttributes<HTMLInputElement> = {};
        Object.defineProperty(rootPart, 'className', {
            configurable: true,
            get: () => {
                coreClassNameReads++;
                return undefined;
            },
        });
        const consoleError = sinon.stub(console, 'error');
        const mounted = await mountPrimitive(
            <CratisComponentsProvider library={library}>
                <Button label='External' />
                <TextInput pt={{ root: rootPart }} defaultValue='Core' />
            </CratisComponentsProvider>,
        );

        try {
            expect(adapterRenderCount).to.equal(1);
            expect(coreClassNameReads).to.equal(1);
            expect(mounted.container.querySelectorAll('.cratis-text-input')).to.have
                .lengthOf(1);
            expect(consoleError.callCount).to.equal(1);
            expect(String(consoleError.firstCall.firstArg)).to.contain(
                unstable_adapterErrorCodes.strictProfileFallback,
            );
            expect(String(consoleError.firstCall.firstArg)).to.contain(
                'common.textInput',
            );
        } finally {
            await unmountPrimitive(mounted);
            consoleError.restore();
        }
    });

    it('should keep the zero-configuration local Core path silent after mount', async () => {
        const consoleError = sinon.stub(console, 'error');
        const mounted = await mountPrimitive(
            <CratisComponentsProvider>{allPresentationControls}</CratisComponentsProvider>,
        );

        try {
            expect(consoleError.callCount).to.equal(0);
        } finally {
            await unmountPrimitive(mounted);
            consoleError.restore();
        }
    });

    it('should reject every local Core fallback at a throw terminal', () => {
        let error: unknown;

        try {
            renderToStaticMarkup(
                <CratisComponentsProvider rendererFallback='throw'>
                    <Button label='Rejected fallback' />
                </CratisComponentsProvider>,
            );
        } catch (caught: unknown) {
            error = caught;
        }

        expect(error).to.be.instanceOf(unstable_AdapterError);
        expect((error as unstable_AdapterError).code).to.equal(
            unstable_adapterErrorCodes.strictProfileFallback,
        );
        expect((error as unstable_AdapterError).diagnostic.slotId).to.equal(
            'common.button',
        );
    });

    it('should never recurse through an external Button from Core IconButtonImplementation', () => {
        let externalButtonRenderCount = 0;
        const AdapterButton = forwardRef<HTMLButtonElement, ButtonProps>(
            function AdapterButton(_props, ref) {
                externalButtonRenderCount++;
                return <button ref={ref}>External button</button>;
            },
        );
        const library = createTestLibrary(
            'button-with-core-icon-button',
            buttonSlot(AdapterButton),
            { profileSlots: ['common.button'] },
        );

        const html = renderToStaticMarkup(
            <CratisComponentsProvider library={library}>
                <IconButton icon={<span>+</span>} aria-label='Core icon action' />
            </CratisComponentsProvider>,
        );

        expect(externalButtonRenderCount).to.equal(0);
        expect(html).to.contain('class="cratis-button"');
        expect(html.match(/<button/g)).to.have.lengthOf(1);
    });
});
