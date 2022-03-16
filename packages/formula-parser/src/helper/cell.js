/**
 * Convert row label to index.
 *
 * @param {String} label Row label (eq. '1', '5')
 * @returns {Number} Returns -1 if label is not recognized otherwise proper row index.
 */
export function rowLabelToIndex(label) {
  let result = parseInt(label, 10);

  if (isNaN(result)) {
    result = -1;
  } else {
    result = Math.max(result - 1, -1);
  }

  return result;
}

/**
 * Convert row index to label.
 *
 * @param {Number} row Row index.
 * @returns {String} Returns row label (eq. '1', '7').
 */
export function rowIndexToLabel(row) {
  let result = '';

  if (row >= 0) {
    result = `${row + 1}`;
  }

  return result;
}

const COLUMN_LABEL_BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const COLUMN_LABEL_BASE_LENGTH = COLUMN_LABEL_BASE.length;

/**
 * Convert column label to index.
 *
 * @param {String} label Column label (eq. 'ABB', 'CNQ')
 * @returns {Number} Returns -1 if label is not recognized otherwise proper column index.
 */
export function columnLabelToIndex(label) {
  let result = 0;

  if (typeof label === 'string') {
    label = label.toUpperCase();

    for (let i = 0, j = label.length - 1; i < label.length; i += 1, j -= 1) {
      result += Math.pow(COLUMN_LABEL_BASE_LENGTH, j) * (COLUMN_LABEL_BASE.indexOf(label[i]) + 1);
    }
  }
  --result;

  return result;
}

/**
 * Convert column index to label.
 *
 * @param {Number} column Column index.
 * @returns {String} Returns column label (eq. 'ABB', 'CNQ').
 */
export function columnIndexToLabel(column) {
  let result = '';

  while (column >= 0) {
    result = String.fromCharCode((column % COLUMN_LABEL_BASE_LENGTH) + 97) + result;
    column = Math.floor(column / COLUMN_LABEL_BASE_LENGTH) - 1;
  }

  return result.toUpperCase();
}

const LABEL_EXTRACT_REGEXP = /^([$])?([A-Za-z]+)([$])?([0-9]+)$/;

/**
 * Extract cell coordinates.
 *
 * @param {String} label Cell coordinates (eq. 'A1', '$B6', '$N$98').
 * @returns {Array} Returns an array of objects.
 */
export function extractLabel(label) {
  if (typeof label !== 'string' || !LABEL_EXTRACT_REGEXP.test(label)) {
    return [];
  }
  const [, columnAbs, column, rowAbs, row] = label.toUpperCase().match(LABEL_EXTRACT_REGEXP);

  return [
    {
      index: rowLabelToIndex(row),
      label: row,
      isAbsolute: rowAbs === '$',
    },
    {
      index: columnLabelToIndex(column),
      label: column,
      isAbsolute: columnAbs === '$',
    },
  ];
}

/**
 * Convert row and column indexes into cell label.
 *
 * @param {Object} row Object with `index` and `isAbsolute` properties.
 * @param {Object} column Object with `index` and `isAbsolute` properties.
 * @returns {String} Returns cell label.
 */
export function toLabel(row, column) {
  const rowLabel = (row.isAbsolute ? '$' : '') + rowIndexToLabel(row.index);
  const columnLabel = (column.isAbsolute ? '$' : '') + columnIndexToLabel(column.index);

  return columnLabel + rowLabel;
}
