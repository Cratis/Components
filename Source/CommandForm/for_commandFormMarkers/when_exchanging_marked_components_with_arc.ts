// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    CommandFormColumnDisplayName,
    CommandFormFieldDisplayName,
    isCommandFormColumn,
    isCommandFormField,
    markAsCommandFormColumn,
    markAsCommandFormField,
} from '../commandFormMarkers';

// The cross-package contract, and the only spec that can catch the two packages drifting apart.
//
// `@cratis/arc.react` writes the field marker this package reads, and reads the column marker this
// package writes. Neither imports the other's helper — the peer range spans versions that do not
// export one — so the contract is carried entirely by the property names below being identical in
// both packages. Nothing about that is enforced by the compiler: if one side changed shape (to a
// Symbol, say, or a differently spelled flag), both packages would keep compiling, every one of
// their own specs would keep passing, and the marker would simply stop crossing the boundary.
// A field whose displayName a build transform had rewritten would then bind in a bare CommandForm
// and silently unbind inside a CommandDialog — the exact failure the marker was added to prevent,
// surviving the fix.
//
// The literals here are therefore deliberate rather than lazy: they restate what
// @cratis/arc.react's commandFormMarkers module writes, so this spec reds if either side moves.
const asArcMarksAField = (): object => {
    const component = () => undefined;
    Object.assign(component, { isCommandFormField: true, displayName: CommandFormFieldDisplayName });
    return component;
};

const asArcMarksAColumn = (): object => {
    const component = () => undefined;
    Object.assign(component, { isCommandFormColumn: true, displayName: CommandFormColumnDisplayName });
    return component;
};

const overwriteDisplayName = (component: object, name: string): void => {
    (component as { displayName?: string }).displayName = name;
};

describe('when exchanging marked components with arc', () => {
    describe('and arc marked the component', () => {
        let field: object;
        let column: object;

        beforeEach(() => {
            field = asArcMarksAField();
            column = asArcMarksAColumn();
            // What react-docgen-typescript does by default to every component it processes,
            // which is what removes the legacy fallback and leaves only the marker.
            overwriteDisplayName(field, 'RenamedByABuildTransform');
            overwriteDisplayName(column, 'RenamedByABuildTransform');
        });

        it('should recognize the field', () => {
            isCommandFormField(field).should.be.true;
        });

        it('should recognize the column', () => {
            isCommandFormColumn(column).should.be.true;
        });
    });

    describe('and this package marked the component', () => {
        let field: object;
        let column: object;

        beforeEach(() => {
            field = markAsCommandFormField(() => undefined);
            column = markAsCommandFormColumn(() => undefined);
        });

        // Asserted as raw property access rather than through the helpers on purpose: this is the
        // half arc performs, and it has to hold without any code from this package running.
        it('should expose the field marker under the property name arc reads', () => {
            (field as Record<string, unknown>).isCommandFormField!.should.equal(true);
        });

        it('should expose the column marker under the property name arc reads', () => {
            (column as Record<string, unknown>).isCommandFormColumn!.should.equal(true);
        });

        it('should keep the legacy field display name for a version of arc predating the marker', () => {
            (field as Record<string, unknown>).displayName!.should.equal('CommandFormField');
        });

        it('should keep the legacy column display name for a version of arc predating the marker', () => {
            (column as Record<string, unknown>).displayName!.should.equal('CommandFormColumn');
        });
    });
});
