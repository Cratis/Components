// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { AnimatePresence, motion } from 'framer-motion';

type WithRecord<TItem> = TItem extends Record<string, unknown> ? TItem : never;

export interface DetailPanelProps<TItem extends object> {
  selectedItem: TItem | null;
  onClose: () => void;
}

export function DetailPanel<TItem extends object>({
  selectedItem,
  onClose,
}: DetailPanelProps<TItem>) {
  const selectedRecord = selectedItem as WithRecord<TItem> | null;

  const selectedContent = selectedRecord
    ? ((selectedRecord['content'] as Record<string, unknown> | undefined) ?? {})
    : {};

  const metadataEntries = selectedRecord
    ? (
        [
          ['Type', selectedRecord['type']],
          [
            'Occurred',
            selectedRecord['occurred'] instanceof Date
              ? (selectedRecord['occurred'] as Date).toLocaleString()
              : selectedRecord['occurred']
              ? new Date(String(selectedRecord['occurred'])).toLocaleString()
              : undefined,
          ],
          ['Service', selectedRecord['service']],
          ['Environment', selectedRecord['environment']],
          ['Tenant', selectedRecord['tenant']],
          ['Correlation Id', selectedRecord['correlationId']],
        ] as Array<[string, unknown]>
      ).filter(([, value]) => value !== undefined && value !== null)
    : [];

  const causation = Array.isArray(selectedRecord?.['causation'])
    ? (selectedRecord?.['causation'] as unknown[])
    : [];

  return (
    <AnimatePresence>
      {selectedRecord && (
        <motion.aside
          className="pv-detail-panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        >
          <header>
            <div>
              <h2>{String(selectedRecord['name'] ?? selectedRecord['type'] ?? 'Event')}</h2>
              {selectedRecord['type'] ? <p>{String(selectedRecord['type'])}</p> : null}
            </div>
            <button type="button" onClick={onClose} title="Close">
              ×
            </button>
          </header>
          <div className="pv-detail-panel-content">
            {metadataEntries.length > 0 && (
              <section className="pv-detail-meta">
                <h3>Metadata</h3>
                <dl>
                  {metadataEntries.map(([key, value]) => (
                    <div key={key}>
                      <dt>{key}</dt>
                      <dd>{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
            {causation.length > 0 && (
              <section className="pv-detail-causation">
                <h3>Causation</h3>
                <div className="pv-pill-row">
                  {causation.map((value, index) => (
                    <span key={`${value}-${index}`} className="pv-pill">
                      {String(value)}
                    </span>
                  ))}
                </div>
              </section>
            )}
            <section className="pv-detail-content">
              <h3>Content</h3>
              <dl>
                {Object.entries(selectedContent).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
