// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { type HTMLAttributes, type Key, type ReactNode } from 'react';
import {
    Tab as AriaTab,
    TabList as AriaTabList,
    TabPanel as AriaTabPanel,
    Tabs as AriaTabs,
} from 'react-aria-components/Tabs';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';

/** Attributes a consumer may hand to one {@link Tabs} part: class, style, title and data attributes. */
export type TabsPartAttributes = Pick<
    HTMLAttributes<HTMLElement>,
    'className' | 'style' | 'title'
> & {
    [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
};

/** One tab in a {@link Tabs} set. */
export interface TabItem {
    /** Value identifying this tab. */
    id: string;
    /** Visible label. */
    label: ReactNode;
    /** Content revealed when this tab is selected. */
    content: ReactNode;
    /** Whether the tab cannot be selected. */
    disabled?: boolean;
}

/** Stable Cratis-owned parts for styling a {@link Tabs} set. */
export interface TabsParts {
    /** The element wrapping list and panels. */
    root?: TabsPartAttributes;
    /** The tab list. */
    list?: TabsPartAttributes;
    /** One tab. */
    tab?: TabsPartAttributes;
    /** One panel. */
    panel?: TabsPartAttributes;
}

const tabsPartsMatchManifest: ExactPartKeys<TabsParts, PartsOf<'Tabs'>> = true;
void tabsPartsMatchManifest;

/** Props for {@link Tabs}. */
export interface TabsProps {
    /** The tabs, in display order. */
    tabs: TabItem[];
    /** Id of the selected tab. */
    value: string;
    /** Called with the newly selected tab's id. */
    onChange: (value: string) => void;
    /** Whether every tab is disabled. */
    disabled?: boolean;
    /** Accessible name for the tab list, when no visible heading names it. */
    'aria-label'?: string;
    /** Id of the element naming the tab list. */
    'aria-labelledby'?: string;
    /** Extra class name for the root element. */
    className?: string;
    /** Cratis-owned per-part attributes. */
    pt?: TabsParts;
}

const classNames = (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(' ');

/**
 * A tab set: a list of tabs, each optionally revealing a panel.
 *
 * Arrow keys move between tabs and Home/End jump to the ends, with one tab stop for the whole list,
 * which is what the `tablist` role promises and a row of ordinary buttons does not keep. Each tab is
 * wired to its panel through `aria-controls`.
 *
 * Every tab owns a panel: the selected tab points at one, so a tab set without panels would name an
 * element that is not there. When the choice drives a view rendered elsewhere it is a *value* rather
 * than a panel — reach for `ToggleGroup`, which says so to assistive technology.
 */
export const Tabs = ({
    tabs,
    value,
    onChange,
    disabled = false,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    className,
    pt,
}: TabsProps) => (
    <AriaTabs
        {...pt?.root}
        selectedKey={value}
        onSelectionChange={(key: Key) => onChange(String(key))}
        isDisabled={disabled}
        className={classNames('cratis-tabs', pt?.root?.className, className)}
        data-cratis-part='root'
        data-disabled={disabled || undefined}
    >
        <AriaTabList
            {...pt?.list}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            className={classNames('cratis-tabs__list', pt?.list?.className)}
            data-cratis-part='list'
        >
            {tabs.map((tab) => (
                <AriaTab
                    key={tab.id}
                    {...pt?.tab}
                    id={tab.id}
                    isDisabled={tab.disabled}
                    className={classNames('cratis-tabs__tab', pt?.tab?.className)}
                    data-cratis-part='tab'
                    data-selected={tab.id === value || undefined}
                    data-disabled={disabled || tab.disabled || undefined}
                >
                    {tab.label}
                </AriaTab>
            ))}
        </AriaTabList>
        {tabs.map((tab) => (
            <AriaTabPanel
                key={tab.id}
                {...pt?.panel}
                id={tab.id}
                className={classNames('cratis-tabs__panel', pt?.panel?.className)}
                data-cratis-part='panel'
                data-selected={tab.id === value || undefined}
            >
                {tab.content}
            </AriaTabPanel>
        ))}
    </AriaTabs>
);
