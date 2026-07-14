import { format, formatDistanceToNow, isValid } from 'date-fns';

/**
 * Format a date for display, e.g. "March 15, 2025".
 * @param {Date|string} date
 * @returns {string}
 */
export const formatDate = (date) => {
    const d = new Date(date);
    return isValid(d) ? format(d, 'MMMM d, yyyy') : 'Invalid date';
};

/**
 * Format a date with time, e.g. "March 15, 2025 at 3:00 PM".
 * @param {Date|string} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
    const d = new Date(date);
    return isValid(d) ? format(d, "MMMM d, yyyy 'at' h:mm a") : 'Invalid date';
};

/**
 * Format a date as relative from now, e.g. "in 3 days" or "2 hours ago".
 * @param {Date|string} date
 * @returns {string}
 */
export const formatRelative = (date) => {
    const d = new Date(date);
    return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : 'Unknown';
};

/**
 * Format a date as a short string, e.g. "Mar 15".
 * @param {Date|string} date
 * @returns {string}
 */
export const formatShort = (date) => {
    const d = new Date(date);
    return isValid(d) ? format(d, 'MMM d') : '';
};

/**
 * Format a date for ISO datetime-local inputs (e.g. "2025-03-15T14:30").
 * @param {Date|string} date
 * @returns {string}
 */
export const toInputDatetime = (date) => {
    const d = new Date(date);
    return isValid(d) ? format(d, "yyyy-MM-dd'T'HH:mm") : '';
};
