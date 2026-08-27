// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback } from 'react';
import { useMessenger } from '@cratis/arc.react/messaging';

/**
 * The publish half of a resolved Arc messenger, or `undefined` when none is resolvable — the shape
 * canvas shapes hold their opt-in messaging through, so a shape can publish with a bare
 * `publish?.(message)` and be inert everywhere a messenger is missing. Generic over the message type,
 * matching `IMessenger.publish`'s own `<TMessage extends object>` constraint, rather than a bare
 * `object` parameter that would tell callers nothing about the message they are publishing.
 */
export type OptionalPublish = <TMessage extends object>(message: TMessage) => void;

/**
 * Internal: resolves the nearest Arc messenger without ever requiring one to exist, returning its
 * publish function — or `undefined` when no messenger is resolvable, in which case callers must do
 * nothing at all. This is what lets every canvas shape's messaging stay strictly opt-in: a Storybook
 * story (or any consumer) rendering with no `ArcContext.Provider` mounted must not throw and must
 * not need Arc wired up.
 *
 * Why calling `useMessenger()` here is safe with no provider mounted, verified against
 * `@cratis/arc.react`'s source: the hook is nothing but two `useContext` reads
 * (`useContext(MessengerScopeContext) ?? useContext(ArcContext).messenger!`), and `ArcContext` is
 * created with a module-level default value that carries a live fallback `Messenger`. `useContext`
 * on a provider-less context returns that default — it never throws — so with no Arc at all this
 * resolves the default configuration's fallback messenger, which nothing in an Arc-less tree
 * subscribes to: publishes flow into it and are observed by no one. The hook's `!` is purely a
 * compile-time assertion; the one genuinely undefined case is a host mounting its own
 * `ArcContext.Provider` whose configuration leaves the optional `messenger` field unset — calling
 * `publish` on that would throw at the call site, and that is exactly what the null-check below
 * turns into "no messenger, stay silent".
 *
 * Going through `useMessenger()` (rather than reading `ArcContext` directly) is also what honors
 * `MessengerScope`: the hook resolves the nearest scoped messenger first, exactly like every other
 * Arc consumer. `MessengerScopeContext` itself is not reachable through the package's exports map,
 * so the hook is the only supported way to get that nearest-scope resolution.
 * @returns A stable publish function bound to the resolved messenger, or `undefined` when no
 * messenger is resolvable.
 */
export function useOptionalMessenger(): OptionalPublish | undefined {
    const messenger = useMessenger() as ReturnType<typeof useMessenger> | undefined;

    const publish = useCallback(
        <TMessage extends object>(message: TMessage) => {
            messenger?.publish(message);
        },
        [messenger],
    );

    return messenger ? publish : undefined;
}
