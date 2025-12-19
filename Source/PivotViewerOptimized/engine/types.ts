/**
 * Efficient data structures for pivot operations on large datasets
 */

export type ItemId = number;

export type FieldValue = string | number | boolean | null;

export interface FieldDef {
  name: string;
  kind: 'string' | 'number' | 'boolean';
}

export interface StringField {
  kind: 'string';
  values: string[];
}

export interface NumberField {
  kind: 'number';
  values: Float64Array;
}

export interface BooleanField {
  kind: 'boolean';
  values: Uint8Array;
}

export type Field = StringField | NumberField | BooleanField;

/**
 * Columnar data store for efficient scanning
 */
export interface PivotStore {
  count: number;
  ids: Uint32Array;
  fields: Map<string, Field>;

  /** Original items for rendering - indexed by ItemId */
  items: unknown[];
}

/**
 * Facet index for categorical fields
 */
export interface CategoricalIndex {
  /** Map from value to sorted array of item IDs */
  valueToIds: Map<string, Uint32Array>;

  /** All unique values in this field */
  values: string[];
}

/**
 * Index for numeric fields - pre-sorted for range queries
 */
export interface NumericIndex {
  /** Values sorted ascending */
  values: Float64Array;

  /** Item IDs parallel to values */
  ids: Uint32Array;

  /** Min/max for quick bounds */
  min: number;
  max: number;
}

/**
 * All indexes for fast filtering and pivoting
 */
export interface PivotIndexes {
  categorical: Map<string, CategoricalIndex>;
  numeric: Map<string, NumericIndex>;
}

/**
 * Filter specification
 */
export interface FilterSpec {
  field: string;
  type: 'categorical' | 'numeric';

  /** For categorical: selected values */
  values?: Set<string>;

  /** For numeric: min/max range (inclusive) */
  range?: { min: number; max: number };
}

/**
 * Result of filter operation
 */
export interface FilterResult {
  /** Sorted array of visible item IDs */
  visibleIds: Uint32Array;

  /** Number of items */
  count: number;
}

/**
 * Grouping specification
 */
export interface GroupSpec {
  field: string;

  /** For numeric fields: number of buckets */
  buckets?: number;
}

/**
 * A single group result
 */
export interface GroupResult {
  /** Group key (value or bucket label) */
  key: string;

  /** Display label */
  label: string;

  /** Original value */
  value: FieldValue;

  /** Item IDs in this group (sorted) */
  ids: Uint32Array;

  /** Count */
  count: number;
}

/**
 * Result of grouping operation
 */
export interface GroupingResult {
  groups: GroupResult[];
  ungrouped?: Uint32Array;
}

/**
 * Layout specification
 */
export interface LayoutSpec {
  viewMode: 'collection' | 'grouped';
  cardWidth: number;
  cardHeight: number;
  cardsPerColumn: number;
  groupSpacing: number;
  containerWidth: number;
  containerHeight?: number;
}

/**
 * Position for a single item
 */
export interface ItemPosition {
  x: number;
  y: number;
  groupIndex: number;
}

/**
 * Layout result - positions for all visible items
 */
export interface LayoutResult {
  /** Positions indexed by ItemId */
  positions: Map<ItemId, ItemPosition>;

  /** Total width of layout */
  totalWidth: number;

  /** Total height of layout */
  totalHeight: number;

  /** Width of each bucket (only for grouped layout) */
  bucketWidths?: number[];
}

/**
 * Message to worker: build indexes
 */
export interface BuildIndexesMessage {
  type: 'buildIndexes';
  store: PivotStore;
  fields: string[];
}

/**
 * Message from worker: indexes ready
 */
export interface IndexesReadyMessage {
  type: 'indexesReady';
  indexes: PivotIndexes;
}

/**
 * Message to worker: apply filters
 */
export interface ApplyFiltersMessage {
  type: 'applyFilters';
  filters: FilterSpec[];
}

/**
 * Message from worker: filter result
 */
export interface FilterResultMessage {
  type: 'filterResult';
  result: FilterResult;
}

/**
 * Message to worker: compute grouping
 */
export interface ComputeGroupingMessage {
  type: 'computeGrouping';
  visibleIds: Uint32Array;
  groupBy: GroupSpec;
}

/**
 * Message from worker: grouping result
 */
export interface GroupingResultMessage {
  type: 'groupingResult';
  result: GroupingResult;
}

export type WorkerInMessage =
  | BuildIndexesMessage
  | ApplyFiltersMessage
  | ComputeGroupingMessage
  | SortMessage;

export type WorkerOutMessage =
  | IndexesReadyMessage
  | FilterResultMessage
  | GroupingResultMessage
  | SortResultMessage;

/**
 * Message to worker: sort ids
 */
export interface SortMessage {
  type: 'sort';
  ids: Uint32Array;
  sortBy: string;
}

/**
 * Message from worker: sort result
 */
export interface SortResultMessage {
  type: 'sortResult';
  result: Uint32Array;
}
