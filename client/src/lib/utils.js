import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS class names safely, resolving conflicts.
 * @param {...(string|undefined|null|false)} inputs
 * @returns {string}
 */
export const cn = (...inputs) => twMerge(clsx(inputs));
