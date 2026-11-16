// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CratisComponentsConfig } from '../CratisComponentsProvider';
import { withLegacyLocaleMessages } from '../legacyLocaleMessages';

describe('when folding a legacy locale into messages', () => {
    const legacyConfig = (messages: CratisComponentsConfig['messages']): CratisComponentsConfig => ({
        locale: 'nb-NO',
        locales: {
            'nb-NO': {
                today: 'I dag',
                clear: 'Tøm',
                aria: {
                    navigation: 'Sidenavigasjon',
                    firstPageLabel: 'Første',
                    prevPageLabel: 'Forrige',
                    nextPageLabel: 'Neste',
                    lastPageLabel: 'Siste',
                },
            },
        },
        messages,
    });

    it('should return the same config when the active locale has no legacy entry', () => {
        const config: CratisComponentsConfig = { locale: 'sv-SE', locales: {} };
        withLegacyLocaleMessages(config, undefined).should.equal(config);
    });

    it('should return the same config when no locale is set', () => {
        const config: CratisComponentsConfig = { locales: { 'nb-NO': { today: 'I dag' } } };
        withLegacyLocaleMessages(config, undefined).should.equal(config);
    });

    it('should take paginator labels from the legacy aria entry', () => {
        const merged = withLegacyLocaleMessages(legacyConfig({ paginator: { navigation: 'Pages' } }), undefined);
        merged.messages!.paginator!.should.deep.equal({
            navigation: 'Sidenavigasjon',
            first: 'Første',
            previous: 'Forrige',
            next: 'Neste',
            last: 'Siste',
        });
    });

    it('should prefer explicit paginator labels over the legacy entry', () => {
        const merged = withLegacyLocaleMessages(legacyConfig(undefined), { paginator: { first: 'Explicit first' } });
        merged.messages!.paginator!.first!.should.equal('Explicit first');
        merged.messages!.paginator!.last!.should.equal('Siste');
    });

    it('should take today and clear from the legacy entry and keep the other date picker messages', () => {
        const merged = withLegacyLocaleMessages(
            legacyConfig({ datePicker: { today: 'Today', openCalendar: 'Open', label: 'Date' } }),
            undefined,
        );
        merged.messages!.datePicker!.today!.should.equal('I dag');
        merged.messages!.datePicker!.clear!.should.equal('Tøm');
        merged.messages!.datePicker!.openCalendar!.should.equal('Open');
        (merged.messages!.datePicker as Record<string, unknown>).label!.should.equal('Date');
    });

    it('should prefer explicit date picker labels over the legacy entry', () => {
        const merged = withLegacyLocaleMessages(legacyConfig(undefined), {
            datePicker: { today: 'Explicit today', nextMonth: 'Next' },
        });
        merged.messages!.datePicker!.today!.should.equal('Explicit today');
        merged.messages!.datePicker!.nextMonth!.should.equal('Next');
    });
});
