/* eslint-disable import/prefer-default-export */
/**
 * Trim value by cutting character starting from the beginning and ending at the same time.
 *
 * @param {String} string String to trimming.
 * @param {Number} [margin=1] Number of character to cut.
 * @returns {String}
 */
export function trimEdges(string, margin = 1) {
  string = string.substring(margin, string.length - margin);

  return string;
}
