// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it } from 'vitest';
import { CANVAS_SURFACE_CLASS, isClaimedByAnotherSurface } from '../isClaimedByAnotherSurface';

const surface = () => {
    const element = document.createElement('div');
    element.className = CANVAS_SURFACE_CLASS;
    return element;
};

describe('when deciding who a gesture over a canvas belongs to', () => {
    let canvas: HTMLElement;
    let item: HTMLElement;
    let nested: HTMLElement;
    let nestedItem: HTMLElement;
    let floating: HTMLElement;
    let dialog: HTMLElement;
    let dialogCanvas: HTMLElement;
    let dialogField: HTMLElement;
    let dialogAroundCanvas: HTMLElement;
    let canvasInDialog: HTMLElement;

    beforeEach(() => {
        canvas = surface();
        item = document.createElement('div');
        nested = surface();
        nestedItem = document.createElement('div');
        nested.append(nestedItem);
        canvas.append(item, nested);
        floating = document.createElement('div');
        dialog = document.createElement('div');
        dialog.setAttribute('aria-modal', 'true');
        dialogCanvas = surface();
        dialogField = document.createElement('input');
        dialog.append(dialogCanvas, dialogField);
        dialogAroundCanvas = document.createElement('div');
        dialogAroundCanvas.setAttribute('data-cratis-dialog-id', 'example');
        canvasInDialog = surface();
        dialogAroundCanvas.append(canvasInDialog);
        document.body.append(canvas, floating, dialog, dialogAroundCanvas);
    });

    afterEach(() => document.body.replaceChildren());

    it('should leave a gesture over the canvas itself to the canvas', () => isClaimedByAnotherSurface(item, canvas).should.be.false);
    it('should leave a gesture over its own portalled content to the canvas', () => isClaimedByAnotherSurface(floating, canvas).should.be.false);
    it('should give a gesture over a canvas nested in it to the nested canvas', () => isClaimedByAnotherSurface(nestedItem, canvas).should.be.true);
    it('should give a gesture over a canvas in a dialog in front of it to that canvas', () => isClaimedByAnotherSurface(dialogCanvas, canvas).should.be.true);
    it('should give a gesture over the rest of a modal dialog in front of it to the dialog', () => isClaimedByAnotherSurface(dialogField, canvas).should.be.true);
    it('should leave a gesture to a canvas inside the dialog it is in', () => isClaimedByAnotherSurface(canvasInDialog, canvasInDialog).should.be.false);
    it('should leave a gesture without a target to the canvas', () => isClaimedByAnotherSurface(null, canvas).should.be.false);
});
