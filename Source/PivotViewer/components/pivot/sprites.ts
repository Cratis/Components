// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as PIXI from 'pixi.js';
import { CARD_GAP, CARD_PADDING, CARD_RADIUS } from './constants';
import type { CardSprite, CardColors } from './constants';
import { ellipsizeBlock, ellipsizeLine } from './ellipsize';

/** How far the value column is inset from the card's text origin, matching where it is drawn. */
const VALUES_INSET = 65;

/** Measures a candidate string with the style the sprite draws it in. */
const measureWith = (candidate: string, style: PIXI.TextStyle) =>
    PIXI.CanvasTextMetrics.measureText(candidate, style).width;

const spritePool: CardSprite[] = [];

export function createCardSprite<TItem extends object>(
    id: number | string,
    x: number,
    y: number,
    items: TItem[],
    onCardClick: (item: TItem, e: MouseEvent, id: number | string) => void,
    onPanStart: (e: MouseEvent) => void,
    cardWidth: number,
    cardHeight: number,
    cardColors: CardColors,
    cardRenderer: (item: TItem) => {
        title: string;
        labels?: string[];
        values?: string[];
    },
    resolveId: (item: TItem, index: number) => string | number,
): CardSprite {
    if (spritePool.length > 0) {
        const sprite = spritePool.pop()!;
        resetPooledSprite(sprite, id, x, y);
        ensureGraphics(sprite);
        restoreTextObjects(sprite, cardColors);
        if (sprite.container) {
            eventContainer<TItem>(sprite.container)._eventContext = { items, onCardClick, id, cardRenderer, resolveId };
        }

        return sprite;
    }

    const container = new PIXI.Container();
    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.position.set(x, y);

    // Define hit area to match the visible card size (excluding gaps)
    // This ensures the entire card is clickable and avoids issues with text blocking hits
    container.hitArea = new PIXI.Rectangle(
        CARD_GAP / 2,
        CARD_GAP / 2,
        cardWidth - CARD_GAP,
        cardHeight - CARD_GAP,
    );

    // Container configured for pointer interactions; hitArea matches visible card.

    eventContainer<TItem>(container)._eventContext = { items, onCardClick, id, cardRenderer, resolveId };

    const graphics = new PIXI.Graphics();

    paintCard(graphics, { width: cardWidth, height: cardHeight }, cardColors);

    container.addChild(graphics);

    const titleText = createTitleText(cardColors);
    container.addChild(titleText);
    const labelsText = createLabelsText(cardColors);
    container.addChild(labelsText);
    const valuesText = createValuesText(cardColors);
    container.addChild(valuesText);
    bindPointerEvents<TItem>(container);

    return {
        container,
        graphics,
        titleText,
        labelsText,
        valuesText,
        itemId: id,
        targetX: x,
        targetY: y,
        currentX: x,
        currentY: y,
    };
}

export function destroySprite(sprite: CardSprite) {
    if (sprite.container && sprite.container.parent) {
        sprite.container.parent.removeChild(sprite.container);
    }
    // Reset visibility to ensure it doesn't ghost if something goes wrong
    if (sprite.container) {
        sprite.container.visible = false;
    }
    spritePool.push(sprite);
}

// Internal diagnostic for the browser teardown regression; not exported from the package entry point.
export function getSpritePoolSize() {
    return spritePool.length;
}

export function clearSpritePool() {
    for (const sprite of spritePool) {
        try {
            sprite.graphics?.destroy();
            sprite.titleText?.destroy();
            sprite.labelsText?.destroy();
            sprite.valuesText?.destroy();
            sprite.container?.destroy();
        } catch (e) {
            void e;
        }
    }
    spritePool.length = 0;
}

/** Refreshes every existing Pixi text fill after a public color override changes. */
export function updateCardTextColors(sprite: CardSprite, colors: CardColors) {
    if (sprite.titleText?.style) {
        sprite.titleText.style.fill = colors.text;
    }
    if (sprite.labelsText?.style) {
        sprite.labelsText.style.fill = colors.textSecondary;
    }
    if (sprite.valuesText?.style) {
        sprite.valuesText.style.fill = colors.text;
    }
}

// Updated: Text objects now recreated when recycling pooled sprites
export function updateCardContent<TItem extends object>(
    sprite: CardSprite,
    item: TItem,
    selectedId: string | number | null,
    cardWidth: number,
    cardHeight: number,
    cardColors: CardColors,
    cardRenderer: (item: TItem) => {
        title: string;
        labels?: string[];
        values?: string[];
    },
) {
    if (!item) return;

    // Selection rendering depends on sprite.itemId matching selectedId

    const cardData = cardRenderer(item);
    const colorsChanged = sprite.lastCardColors !== cardColors;

    // Ensure text objects exist before using them
    if (!hasLiveText(sprite)) return;

    updateTextContent(sprite, cardData, cardWidth, cardColors);

    const isSelected = sprite.itemId === selectedId;

    // Only redraw graphics if selection state or colors changed
    if (!needsGraphicsRedraw(sprite, selectedId, colorsChanged)) return;

    sprite.lastSelectedId = selectedId;
    sprite.lastCardColors = cardColors;

    prepareGraphics(sprite);
    paintCard(sprite.graphics, { width: cardWidth, height: cardHeight }, cardColors, isSelected);
}

interface CardData {
    title: string;
    labels?: string[];
    values?: string[];
}

interface SpriteEventContext<TItem> {
    items: TItem[];
    onCardClick: (item: TItem, e: MouseEvent, id: number | string) => void;
    id: number | string;
    cardRenderer: (item: TItem) => CardData;
    resolveId: (item: TItem, index: number) => string | number;
}

function eventContainer<TItem>(container: PIXI.Container) {
    // SAFETY: Pixi containers permit application-owned metadata, assigned before binding handlers.
    return container as PIXI.Container & { _eventContext: SpriteEventContext<TItem> };
}

function bindPointerEvents<TItem>(container: PIXI.Container) {
    container.on('click', (e: PIXI.FederatedPointerEvent) => {
        e.stopPropagation();
        const context = eventContainer<TItem>(container)._eventContext;
        const numericId = typeof context.id === 'number' ? context.id : Number(context.id);
        const item = context.items[numericId];
        if (item) context.onCardClick(item, e.nativeEvent as MouseEvent, context.id);
    });
    container.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
        e.stopPropagation();
        // onPanStart(e.nativeEvent as MouseEvent);
    });
}

function resetPooledSprite(sprite: CardSprite, id: number | string, x: number, y: number) {
    if (sprite.container) {
        sprite.container.visible = true;
        sprite.container.alpha = 1;
        sprite.container.position.set(x, y);
    }
    sprite.itemId = id;
    sprite.targetX = sprite.currentX = x;
    sprite.targetY = sprite.currentY = y;
    // A recycled sprite must start a new hidden grace period if it leaves the viewport.
    delete (sprite as CardSprite & { __lastHiddenAt?: number }).__lastHiddenAt;
    delete sprite.animationStartTime;
    delete sprite.animationDelay;
    delete sprite.startX;
    delete sprite.startY;
    sprite.lastSelectedId = null;
    sprite.lastCardColors = undefined;
    sprite.lastTitle = undefined;
    sprite.lastLabels = undefined;
    sprite.lastValues = undefined;
}

function ensureGraphics(sprite: CardSprite) {
    if (sprite.graphics && !sprite.graphics.destroyed) return;
    sprite.graphics = new PIXI.Graphics();
    if (sprite.container) sprite.container.addChildAt(sprite.graphics, 0);
}

function createTitleText(colors: CardColors) {
    return textAt({ fontSize: 13, fill: colors.text, fontWeight: '600', lineHeight: 18, wordWrap: false }, 0, 0);
}

function createLabelsText(colors: CardColors) {
    return textAt({ fontSize: 11, fill: colors.textSecondary, fontWeight: '400', lineHeight: 18 }, 0, 40);
}

function createValuesText(colors: CardColors) {
    return textAt({ fontSize: 11, fill: colors.text, fontWeight: '500', lineHeight: 18, wordWrap: false }, VALUES_INSET, 40);
}

function textAt(style: PIXI.TextOptions['style'], x: number, y: number) {
    const text = new PIXI.Text({ text: '', style });
    text.position.set(CARD_GAP / 2 + CARD_PADDING + x, CARD_GAP / 2 + CARD_PADDING + y);
    return text;
}

function restoreTextObjects(sprite: CardSprite, colors: CardColors) {
    restoreTextObject(sprite, 'titleText', () => createTitleText(colors));
    restoreTextObject(sprite, 'labelsText', () => createLabelsText(colors));
    restoreTextObject(sprite, 'valuesText', () => createValuesText(colors));
}

function restoreTextObject(sprite: CardSprite, key: 'titleText' | 'labelsText' | 'valuesText', create: () => PIXI.Text) {
    if (sprite[key] && !sprite[key].destroyed) return;
    sprite[key] = create();
    if (sprite.container) sprite.container.addChild(sprite[key]);
}

function hasLiveText(sprite: CardSprite) {
    return [sprite.titleText, sprite.labelsText, sprite.valuesText].every(text => !!text && !text.destroyed);
}

function needsGraphicsRedraw(sprite: CardSprite, selectedId: number | string | null, colorsChanged: boolean) {
    return sprite.lastSelectedId !== selectedId || colorsChanged || !sprite.graphics;
}

function prepareGraphics(sprite: CardSprite) {
    if (!sprite.graphics || sprite.graphics.destroyed) ensureGraphics(sprite);
    else sprite.graphics.clear();
}

function paintCard(
    graphics: PIXI.Graphics,
    size: { width: number; height: number },
    colors: CardColors,
    selected?: boolean,
) {
    const offset = CARD_GAP / 2;
    const height = size.height - CARD_GAP;
    const gradient = new PIXI.FillGradient({
        type: 'linear',
        start: { x: 0, y: offset },
        end: { x: 0, y: offset + height },
        colorStops: selected
            ? [{ offset: 0, color: colors.gradient }, { offset: 1, color: colors.mid }]
            : [{ offset: 0, color: colors.mid }, { offset: 1, color: colors.base }],
    });
    graphics.roundRect(offset, offset, size.width - CARD_GAP, height, CARD_RADIUS);
    if (!graphics.destroyed) graphics.fill(gradient);
    // Newly created sprites are filled before selection is first applied by updateCardContent.
    if (selected === undefined || graphics.destroyed) return;
    if (selected) graphics.stroke({ width: 2, color: colors.border });
    else graphics.stroke({ width: 1, color: colors.border, alpha: 0.35 });
}

function fitCardText(sprite: CardSprite, title: string, values: string, innerWidth: number) {
    // Text does not wrap: fit each column to the card's inner width less its inset.
    const source = `${title}\u0000${values}`;
    if (sprite.lastFittedSource === source && sprite.lastFittedWidth === innerWidth) return;
    sprite.lastFittedSource = source;
    sprite.lastFittedWidth = innerWidth;
    sprite.fittedTitle = ellipsizeLine(title, innerWidth,
        candidate => measureWith(candidate, sprite.titleText.style));
    sprite.fittedValues = ellipsizeBlock(values, innerWidth - VALUES_INSET,
        candidate => measureWith(candidate, sprite.valuesText.style));
}

function updateTextContent(sprite: CardSprite, data: CardData, width: number, colors: CardColors) {
    const labels = (data.labels || []).join('\n');
    const values = (data.values || []).join('\n');
    fitCardText(sprite, data.title, values, width - CARD_GAP - CARD_PADDING * 2);
    const titleDisplay = sprite.fittedTitle ?? data.title;
    const valuesDisplay = sprite.fittedValues ?? values;
    if (sprite.lastTitle !== titleDisplay) {
        sprite.titleText.text = titleDisplay;
        sprite.lastTitle = titleDisplay;
    }
    if (sprite.lastLabels !== labels) {
        sprite.labelsText.text = labels;
        sprite.lastLabels = labels;
    }
    if (sprite.lastCardColors !== colors) updateCardTextColors(sprite, colors);
    if (sprite.lastValues !== valuesDisplay) {
        sprite.valuesText.text = valuesDisplay;
        sprite.lastValues = valuesDisplay;
    }
    sprite.titleText.visible = true;
    sprite.labelsText.visible = true;
    sprite.valuesText.visible = true;
}
