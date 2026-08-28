// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { renderToStaticMarkup } from 'react-dom/server';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import {
    unstable_useCapability,
    unstable_useOverlayEnvironment,
    unstable_useRendererId,
} from '..';
import { buttonSlot, createTestLibrary, FirstButton } from './testLibrary';

const RendererProbe = () => {
    const rendererId = unstable_useRendererId();
    const canRender = unstable_useCapability('slot.render');
    return <span data-renderer={rendererId}>{String(canRender)}</span>;
};

describe('when using renderer provider setup', () => {
    it('should preserve zero-config static markup exactly', () => {
        const html = renderToStaticMarkup(
            <CratisComponentsProvider>
                <span>unchanged</span>
            </CratisComponentsProvider>,
        );

        html.should.equal('<span>unchanged</span>');
    });

    it('should expose capabilities and renderer identity from the same source context', () => {
        const library = createTestLibrary('sample-renderer', buttonSlot(FirstButton));
        const html = renderToStaticMarkup(
            <CratisComponentsProvider library={library}>
                <RendererProbe />
            </CratisComponentsProvider>,
        );

        html.should.contain('data-renderer="sample-renderer"');
        html.should.contain('>true</span>');
    });

    it('should wrap children with the selected library Provider exactly once', () => {
        let providerRenders = 0;
        const LibraryProvider = ({ children }: { children: React.ReactNode }) => {
            providerRenders += 1;
            return <section data-library-provider>{children}</section>;
        };
        const library = createTestLibrary('wrapped', buttonSlot(FirstButton), {
            Provider: LibraryProvider,
        });

        const html = renderToStaticMarkup(
            <CratisComponentsProvider library={library}>
                <span>child</span>
            </CratisComponentsProvider>,
        );

        providerRenders.should.equal(1);
        (html.match(/data-library-provider/g) ?? []).should.have.lengthOf(1);
    });

    it('should pass only frozen non-secret boolean setup attestations to a library provider', () => {
        let observedSetup: Readonly<Record<string, boolean>> | undefined;
        const LibraryProvider = ({
            children,
            setup,
        }: {
            children: React.ReactNode;
            setup: Readonly<Record<string, boolean>>;
        }) => {
            observedSetup = setup;
            return <>{children}</>;
        };
        const library = createTestLibrary('configured', buttonSlot(FirstButton), {
            Provider: LibraryProvider,
        });

        renderToStaticMarkup(
            <CratisComponentsProvider
                library={library}
                rendererSetup={{ 'sample.license-configured': true }}
            >
                <span />
            </CratisComponentsProvider>,
        );

        observedSetup!.should.deep.equal({ 'sample.license-configured': true });
        Object.isFrozen(observedSetup).should.equal(true);
    });

    it('should not invoke the overlay environment during render without document', () => {
        let invocations = 0;
        const overlayEnvironment = {
            getContainer: () => {
                invocations += 1;
                return null;
            },
        };
        const OverlayProbe = () => {
            unstable_useOverlayEnvironment();
            return <span>server-safe</span>;
        };

        const html = renderToStaticMarkup(
            <CratisComponentsProvider overlayEnvironment={overlayEnvironment}>
                <OverlayProbe />
            </CratisComponentsProvider>,
        );

        html.should.equal('<span>server-safe</span>');
        invocations.should.equal(0);
        (typeof document).should.equal('undefined');
    });
});
