/**
 * Slugify Utility
 * 
 * This utility provides functions to generate URL-friendly slugs from text:
 * - Removes accents and special characters
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes multiple consecutive hyphens
 * - Ensures slug format compliance
 * 
 * @author Webhook Redistributor Team
 * @version 1.0.0
 */

/**
 * Removes accents from a string
 * @param {string} str - String to remove accents from
 * @returns {string} String without accents
 */
const removeAccents = (str) => {
  const accents = {
    'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a', 'å': 'a',
    'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
    'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
    'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
    'ç': 'c', 'ñ': 'n',
    'Á': 'A', 'À': 'A', 'Ã': 'A', 'Â': 'A', 'Ä': 'A', 'Å': 'A',
    'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
    'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I',
    'Ó': 'O', 'Ò': 'O', 'Õ': 'O', 'Ô': 'O', 'Ö': 'O',
    'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U',
    'Ç': 'C', 'Ñ': 'N'
  };
  
  return str.replace(/[áàãâäåéèêëíìîïóòõôöúùûüçñÁÀÃÂÄÅÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑ]/g, (char) => accents[char] || char);
};

/**
 * Generates a URL-friendly slug from a string
 * @param {string} text - Text to convert to slug
 * @param {Object} options - Options for slug generation
 * @param {string} options.separator - Separator character (default: '-')
 * @param {boolean} options.lowercase - Convert to lowercase (default: true)
 * @param {boolean} options.trim - Trim whitespace (default: true)
 * @returns {string} Generated slug
 */
const slugify = (text, options = {}) => {
  const {
    separator = '-',
    lowercase = true,
    trim = true
  } = options;

  if (!text || typeof text !== 'string') {
    return '';
  }

  let slug = text;

  // Trim whitespace
  if (trim) {
    slug = slug.trim();
  }

  // Convert to lowercase
  if (lowercase) {
    slug = slug.toLowerCase();
  }

  // Remove accents
  slug = removeAccents(slug);

  // Replace spaces and special characters with separator
  slug = slug.replace(/[^a-z0-9\s-]/g, '');

  // Replace multiple spaces with single separator
  slug = slug.replace(/\s+/g, separator);

  // Replace multiple separators with single separator
  slug = slug.replace(new RegExp(`\\${separator}+`, 'g'), separator);

  // Remove leading and trailing separators
  slug = slug.replace(new RegExp(`^\\${separator}+|\\${separator}+$`, 'g'), '');

  return slug;
};

/**
 * Validates if a string is a valid slug format
 * @param {string} slug - Slug to validate
 * @returns {boolean} True if valid slug format
 */
const isValidSlug = (slug) => {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  // Must contain only lowercase letters, numbers, and hyphens
  // Must not start or end with hyphen
  // Must not have consecutive hyphens
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  
  return slugRegex.test(slug) && slug.length > 0 && slug.length <= 100;
};

/**
 * Generates a unique slug by appending a number if needed
 * @param {string} baseText - Base text to generate slug from
 * @param {Function} checkExists - Function to check if slug exists (should return Promise<boolean>)
 * @param {Object} options - Options for slug generation
 * @returns {Promise<string>} Unique slug
 */
const generateUniqueSlug = async (baseText, checkExists, options = {}) => {
  let baseSlug = slugify(baseText, options);
  
  if (!baseSlug) {
    throw new Error('Cannot generate slug from empty text');
  }

  // Check if base slug is available
  let isAvailable = !(await checkExists(baseSlug));
  
  if (isAvailable) {
    return baseSlug;
  }

  // Try with numbers appended
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (await checkExists(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
    
    // Prevent infinite loop
    if (counter > 999) {
      throw new Error('Unable to generate unique slug after 999 attempts');
    }
  }
  
  return uniqueSlug;
};

/**
 * Sanitizes a slug by ensuring it meets format requirements
 * @param {string} slug - Slug to sanitize
 * @returns {string} Sanitized slug
 */
const sanitizeSlug = (slug) => {
  if (!slug || typeof slug !== 'string') {
    return '';
  }

  // Convert to lowercase
  let sanitized = slug.toLowerCase().trim();

  // Remove invalid characters
  sanitized = sanitized.replace(/[^a-z0-9-]/g, '');

  // Remove multiple consecutive hyphens
  sanitized = sanitized.replace(/-+/g, '-');

  // Remove leading and trailing hyphens
  sanitized = sanitized.replace(/^-+|-+$/g, '');

  // Ensure it's not empty
  if (!sanitized) {
    return 'endpoint';
  }

  return sanitized;
};

module.exports = {
  slugify,
  removeAccents,
  isValidSlug,
  generateUniqueSlug,
  sanitizeSlug
};
