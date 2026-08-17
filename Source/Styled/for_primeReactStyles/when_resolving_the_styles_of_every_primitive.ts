// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { primeReactStyles } from '../primeReactStyles';

type Entry = { props: { styles?: { name: string; classes: unknown }; motionProps?: { name: string } } };

describe('when resolving the styles of every primitive', () => {
    const entries = Object.entries(primeReactStyles) as [string, Entry][];
    const roots = entries.filter(([, entry]) => entry.props.styles);
    const motionOnly = entries.filter(([, entry]) => !entry.props.styles);

    it('should have an entry for every primitive this library renders', () => {
        for (const name of [
            'Button', 'InputText', 'Textarea', 'InputPassword',
            'Checkbox.Root', 'RadioButton.Root', 'ToggleSwitch.Root', 'Slider.Root', 'Rating.Root',
            'InputNumber.Root', 'InputTags.Root', 'InputColor.Root', 'DatePicker.Root', 'Select.Root',
            'DataTable.Root', 'Dialog.Root', 'Popover.Root', 'Stepper.Root', 'Tooltip.Root',
            'Toast.Root', 'Toaster.Root', 'Message.Root', 'Tag', 'Badge', 'Chip.Root', 'Avatar.Root',
            'Skeleton', 'ProgressBar.Root', 'ProgressSpinner.Root', 'Timeline.Root',
        ]) {
            primeReactStyles.should.have.property(name);
        }
    });

    it('should give every root a named PrimeReact style with class names', () => {
        roots.should.not.be.empty;
        for (const [, entry] of roots) {
            entry.props.styles!.name.should.be.a('string').and.not.be.empty;
            entry.props.styles!.should.have.property('classes');
        }
    });

    it('should name the motion of every part that only animates', () => {
        motionOnly.should.not.be.empty;
        for (const [, entry] of motionOnly) {
            entry.props.motionProps!.name.should.match(/^p-/);
        }
    });

    it('should key every entry on a primitive component name', () => {
        for (const [name] of entries) {
            name.should.match(/^[A-Z][A-Za-z]+(\.[A-Z][A-Za-z]+)?$/);
        }
    });
});
