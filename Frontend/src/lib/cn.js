import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names with Tailwind-aware deduplication.
 * Use this in every component instead of string concatenation.
 *
 * @param  {...any} inputs - clsx-compatible inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
