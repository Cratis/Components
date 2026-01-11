// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as PIXI from 'pixi.js';
import { CARD_GAP, CARD_PADDING, CARD_RADIUS } from './constants';
import type { CardSprite, CardColors } from './constants';

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
  cardRenderer: (item: TItem) => { title: string; labels: string[]; values: string[] },
  resolveId: (item: TItem, index: number) => string | number,
): CardSprite {
  if (spritePool.length > 0) {
    const sprite = spritePool.pop()!;
    if (sprite.container) {
      sprite.container.visible = true;
      sprite.container.alpha = 1;
      sprite.container.position.set(x, y);
    }
    sprite.itemId = id;
    sprite.targetX = x;
    sprite.targetY = y;
    sprite.currentX = x;
    sprite.currentY = y;

    // Reset animation state
    delete sprite.animationStartTime;
    delete sprite.animationDelay;
    delete sprite.startX;
    delete sprite.startY;

    // Reset cache
    sprite.lastSelectedId = null;
    sprite.lastCardColors = undefined;
    sprite.lastTitle = undefined;
    sprite.lastLabels = undefined;
    sprite.lastValues = undefined;

    // Recreate graphics if it was destroyed
    if (!sprite.graphics || sprite.graphics.destroyed) {
      sprite.graphics = new PIXI.Graphics();
      if (sprite.container) {
        sprite.container.addChildAt(sprite.graphics, 0);
      }
    }

    // Recreate text objects if they were destroyed
    const offsetX = CARD_GAP / 2;
    const offsetY = CARD_GAP / 2;
    
    if (!sprite.titleText || sprite.titleText.destroyed) {
      sprite.titleText = new PIXI.Text('', {
        fontSize: 13,
        fill: cardColors.text as string | number,
        fontWeight: '600',
        lineHeight: 18,
        wordWrap: false,
      } as PIXI.TextStyle);
      sprite.titleText.position.set(offsetX + CARD_PADDING, offsetY + CARD_PADDING);
      if (sprite.container) {
        sprite.container.addChild(sprite.titleText);
      }
    }

    if (!sprite.labelsText || sprite.labelsText.destroyed) {
      sprite.labelsText = new PIXI.Text('', {
        fontSize: 11,
        fill: cardColors.textSecondary as string | number,
        fontWeight: '400',
        lineHeight: 18,
      } as PIXI.TextStyle);
      sprite.labelsText.position.set(offsetX + CARD_PADDING, offsetY + CARD_PADDING + 40);
      if (sprite.container) {
        sprite.container.addChild(sprite.labelsText);
      }
    }

    if (!sprite.valuesText || sprite.valuesText.destroyed) {
      sprite.valuesText = new PIXI.Text('', {
        fontSize: 11,
        fill: cardColors.text as string | number,
        fontWeight: '500',
        lineHeight: 18,
        wordWrap: false,
      } as PIXI.TextStyle);
      sprite.valuesText.position.set(offsetX + CARD_PADDING + 65, offsetY + CARD_PADDING + 40);
      if (sprite.container) {
        sprite.container.addChild(sprite.valuesText);
      }
    }

    // Update event context
    if (sprite.container) {
      (sprite.container as unknown as { _eventContext: { items: TItem[]; onCardClick: (item: TItem, e: MouseEvent, id: number | string) => void; id: number | string; cardRenderer: (item: TItem) => { title: string; labels: string[]; values: string[] }; resolveId: (item: TItem, index: number) => string | number } })._eventContext = { items, onCardClick, id, cardRenderer, resolveId };
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
      cardHeight - CARD_GAP
  );

  console.log('[sprites] Container created with id:', id, 'eventMode:', container.eventMode, 'hitArea:', container.hitArea);

  // Store context for event handlers
  (container as unknown as { _eventContext: { items: TItem[]; onCardClick: (item: TItem, e: MouseEvent, id: number | string) => void; id: number | string; cardRenderer: (item: TItem) => { title: string; labels: string[]; values: string[] }; resolveId: (item: TItem, index: number) => string | number } })._eventContext = { items, onCardClick, id, cardRenderer, resolveId };

  const graphics = new PIXI.Graphics();

  const actualWidth = cardWidth - CARD_GAP;
  const actualHeight = cardHeight - CARD_GAP;
  const offsetX = CARD_GAP / 2;
  const offsetY = CARD_GAP / 2;

  const gradient = new PIXI.FillGradient(0, offsetY, 0, offsetY + actualHeight);
  gradient.addColorStop(0, cardColors.mid);
  gradient.addColorStop(1, cardColors.base);

  graphics.roundRect(offsetX, offsetY, actualWidth, actualHeight, CARD_RADIUS);
  graphics.fill(gradient);

  container.addChild(graphics);

  const titleText = new PIXI.Text('', {
    fontSize: 13,
    fill: cardColors.text as string | number,
    fontWeight: '600',
    lineHeight: 18,
    wordWrap: false,
  } as PIXI.TextStyle);
  titleText.position.set(offsetX + CARD_PADDING, offsetY + CARD_PADDING);
  container.addChild(titleText);

  const labelsText = new PIXI.Text('', {
    fontSize: 11,
    fill: cardColors.textSecondary as string | number,
    fontWeight: '400',
    lineHeight: 18,
  } as PIXI.TextStyle);
  labelsText.position.set(offsetX + CARD_PADDING, offsetY + CARD_PADDING + 40);
  container.addChild(labelsText);

  const valuesText = new PIXI.Text('', {
    fontSize: 11,
    fill: cardColors.text as string | number,
    fontWeight: '500',
    lineHeight: 18,
    wordWrap: false,
  } as PIXI.TextStyle);
  valuesText.position.set(offsetX + CARD_PADDING + 65, offsetY + CARD_PADDING + 40);
  container.addChild(valuesText);

  container.on('click', (e: PIXI.FederatedPointerEvent) => {
    e.stopPropagation();
    console.log('[sprites] Click handler fired for card id:', id);
    const ctx = (container as unknown as { _eventContext: { items: TItem[]; onCardClick: (item: TItem, e: MouseEvent, id: number | string) => void; id: number | string } })._eventContext;
    const itemsArray = ctx.items;
    const numericId = typeof ctx.id === 'number' ? ctx.id : Number(ctx.id);
    const item = itemsArray[numericId];
    console.log('[sprites] ctx.id:', ctx.id, 'numericId:', numericId, 'found:', Boolean(item));
    if (item) {
      ctx.onCardClick(item, e.nativeEvent as MouseEvent, ctx.id);
    }
  });

  container.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
    e.stopPropagation();
    // onPanStart(e.nativeEvent as MouseEvent);
  });

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

// Updated: Text objects now recreated when recycling pooled sprites
export function updateCardContent<TItem extends object>(
  sprite: CardSprite,
  item: TItem,
  selectedId: string | number | null,
  cardWidth: number,
  cardHeight: number,
  cardColors: CardColors,
  cardRenderer: (item: TItem) => { title: string; labels: string[]; values: string[] },
) {
  if (!item) return;

  console.log('[updateCardContent] sprite.itemId:', sprite.itemId, 'selectedId:', selectedId, 'match:', sprite.itemId === selectedId);

  const colors = cardColors;
  const cardData = cardRenderer(item);
  const titleDisplay = cardData.title;
  const labelsText = cardData.labels.join('\n');
  const valuesText = cardData.values.join('\n');
  const colorsChanged = sprite.lastCardColors !== colors;

  // Ensure text objects exist before using them
  if (!sprite.titleText || sprite.titleText.destroyed) return;
  if (!sprite.labelsText || sprite.labelsText.destroyed) return;
  if (!sprite.valuesText || sprite.valuesText.destroyed) return;

  if (sprite.lastTitle !== titleDisplay) {
    sprite.titleText.text = titleDisplay;
    sprite.lastTitle = titleDisplay;
  }

    if (sprite.lastLabels !== labelsText) {
    sprite.labelsText.text = labelsText;
    sprite.lastLabels = labelsText;
  }

  if (colorsChanged && sprite.labelsText.style) {
    (sprite.labelsText.style as unknown as { fill: string | number }).fill = colors.textSecondary;
  }

  if (sprite.lastValues !== valuesText) {
    sprite.valuesText.text = valuesText;
    sprite.lastValues = valuesText;
  }

  if (colorsChanged && sprite.valuesText.style) {
    (sprite.valuesText.style as unknown as { fill: string | number }).fill = colors.text;
  }

  sprite.titleText.visible = true;
  sprite.labelsText.visible = true;
  sprite.valuesText.visible = true;

  const isSelected = sprite.itemId === selectedId;

  // Only redraw graphics if selection state or colors changed
  if (sprite.lastSelectedId === selectedId && !colorsChanged && sprite.graphics) {
    return;
  }

  sprite.lastSelectedId = selectedId;
  sprite.lastCardColors = cardColors;

  // Ensure graphics exists before attempting to use it
  if (!sprite.graphics || sprite.graphics.destroyed) {
    sprite.graphics = new PIXI.Graphics();
    if (sprite.container) {
      sprite.container.addChildAt(sprite.graphics, 0);
    }
  } else {
    sprite.graphics.clear();
  }

  const actualWidth = cardWidth - CARD_GAP;
  const actualHeight = cardHeight - CARD_GAP;
  const offsetX = CARD_GAP / 2;
  const offsetY = CARD_GAP / 2;

  const gradient = new PIXI.FillGradient(0, offsetY, 0, offsetY + actualHeight);
  if (isSelected) {
    gradient.addColorStop(0, colors.gradient);
    gradient.addColorStop(1, colors.mid);
  } else {
    gradient.addColorStop(0, colors.mid);
    gradient.addColorStop(1, colors.base);
  }

  sprite.graphics.roundRect(offsetX, offsetY, actualWidth, actualHeight, CARD_RADIUS);
  
  // Ensure graphics is still valid before filling
  if (sprite.graphics && !sprite.graphics.destroyed) {
    sprite.graphics.fill(gradient);
  }

  if (isSelected) {
    if (sprite.graphics && !sprite.graphics.destroyed) {
      sprite.graphics.stroke({ width: 2, color: colors.border });
    }
  } else {
    if (sprite.graphics && !sprite.graphics.destroyed) {
      sprite.graphics.stroke({ width: 1, color: colors.border, alpha: 0.35 });
    }
  }
}
