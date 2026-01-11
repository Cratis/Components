// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CardSprite } from './constants';
import type * as PIXI from 'pixi.js';

export function updatePositions(sprites: Map<unknown, CardSprite>, isViewTransitionRef: { current: boolean }, animationSpeed = 0.15) {
  let isAnimating = false;
  const threshold = 0.5;
  const shouldAnimate = isViewTransitionRef.current;
  const now = Date.now();
  const DURATION = 600; // ms

  for (const sprite of sprites.values()) {
    // Handle explicit time-based animation (view transitions)
    if (sprite.animationStartTime !== undefined) {
      const elapsed = now - sprite.animationStartTime;
      const delay = sprite.animationDelay || 0;

      if (elapsed < delay) {
        isAnimating = true;
        continue;
      }

      const progress = Math.min(1, (elapsed - delay) / DURATION);
      // Ease out cubic: 1 - (1-t)^3
      const t = 1 - Math.pow(1 - progress, 3);

      if (sprite.startX !== undefined && sprite.startY !== undefined) {
        sprite.currentX = sprite.startX + (sprite.targetX - sprite.startX) * t;
        sprite.currentY = sprite.startY + (sprite.targetY - sprite.startY) * t;
      }

      sprite.container.position.set(sprite.currentX, sprite.currentY);

      if (progress < 1) {
        isAnimating = true;
      } else {
        // Animation finished, clean up
        sprite.currentX = sprite.targetX;
        sprite.currentY = sprite.targetY;
        delete sprite.animationStartTime;
        delete sprite.animationDelay;
        delete sprite.startX;
        delete sprite.startY;
      }
      continue;
    }

    const dx = sprite.targetX - sprite.currentX;
    const dy = sprite.targetY - sprite.currentY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (shouldAnimate && distance > threshold) {
      sprite.currentX += dx * animationSpeed;
      sprite.currentY += dy * animationSpeed;
      sprite.container.position.set(sprite.currentX, sprite.currentY);
      isAnimating = true;
    } else if (distance > 0) {
      sprite.currentX = sprite.targetX;
      sprite.currentY = sprite.targetY;
      sprite.container.position.set(sprite.currentX, sprite.currentY);
    }
  }

  if (!isAnimating && isViewTransitionRef.current) {
    isViewTransitionRef.current = false;
  }

  return isAnimating;
}

export function startAnimationLoop(
  refs: {
    mountedRef: { current: boolean };
    appRef: { current: PIXI.Application | null };
    animationFrameRef: { current: number };
    isAnimatingRef: { current: boolean };
    needsRenderRef: { current: boolean };
    spritesRef: { current: Map<unknown, CardSprite> };
    isViewTransitionRef: { current: boolean };
  },
  animationSpeed = 0.15,
) {
  const { mountedRef, appRef, animationFrameRef, isAnimatingRef, needsRenderRef, spritesRef, isViewTransitionRef } = refs;

  const animate = () => {
    if (!mountedRef.current) return;

    const stillAnimating = updatePositions(spritesRef.current, isViewTransitionRef, animationSpeed);

    if (stillAnimating || needsRenderRef.current) {
      appRef.current?.renderer.render(appRef.current.stage);
      needsRenderRef.current = false;
    }

    if (stillAnimating) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      isAnimatingRef.current = false;
    }
  };

  // Always restart animation when called to ensure animations continue
  // Cancel any existing animation frame and start fresh
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current);
  }
  isAnimatingRef.current = true;
  animate();
}
