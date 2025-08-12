/**
 * Input sanitization and validation middleware
 * Prevents XSS attacks and validates input data
 */

import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

interface SanitizationConfig {
  allowedTags: string[];
  allowedAttributes: { [key: string]: string[] };
  maxLength: number;
  stripEmpty: boolean;
  trimWhitespace: boolean;
}

const defaultSanitizationConfig: SanitizationConfig = {
  allowedTags: [],
  allowedAttributes: {},
  maxLength: 10000,
  stripEmpty: true,
  trimWhitespace: true
};

const htmlSanitizationConfig: SanitizationConfig = {
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
  allowedAttributes: {},
  maxLength: 50000,
  stripEmpty: false,
  trimWhitespace: true
};

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(
  input: string, 
  config: SanitizationConfig = defaultSanitizationConfig
): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Always remove script/style blocks with their contents before any further processing
  // This ensures dangerous code is fully stripped even when keeping other tag contents
  sanitized = sanitized
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');

  // Trim whitespace if configured
  if (config.trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // Check length limits
  if (sanitized.length > config.maxLength) {
    sanitized = sanitized.substring(0, config.maxLength);
  }

  // Strip empty strings if configured
  if (config.stripEmpty && sanitized.length === 0) {
    return '';
  }

  // Use DOMPurify for HTML sanitization
  if (config.allowedTags.length > 0) {
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: config.allowedTags,
      ALLOWED_ATTR: Object.keys(config.allowedAttributes),
      KEEP_CONTENT: true,
    });
  } else {
    // Strip all HTML tags for plain text, keeping user-visible text for non-script/style tags
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
  }

  return sanitized;
}

/**
 * Sanitize email addresses
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') {
    return null;
  }

  const cleaned = email.trim().toLowerCase();
  
  if (!validator.isEmail(cleaned)) {
    return null;
  }

  if (cleaned.length > 254) { // RFC 5321 limit
    return null;
  }

  return validator.normalizeEmail(cleaned) || null;
}

/**
 * Sanitize URL inputs
 */
export function sanitizeUrl(url: string, allowedProtocols: string[] = ['http', 'https']): string | null {
  if (typeof url !== 'string') {
    return null;
  }

  const cleaned = url.trim();
  
  if (!validator.isURL(cleaned, {
    protocols: allowedProtocols,
    require_protocol: true,
    require_host: true,
    require_valid_protocol: true,
    allow_query_components: true,
    allow_fragments: true,
    allow_protocol_relative_urls: false
  })) {
    return null;
  }

  // Additional security check for suspicious patterns
  const suspiciousPatterns = [
    /javascript:/gi,
    /data:/gi,
    /vbscript:/gi,
    /file:/gi,
    /ftp:/gi
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(cleaned)) {
      return null;
    }
  }

  return cleaned;
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string | null {
  if (typeof filename !== 'string') {
    return null;
  }

  let cleaned = filename.trim();

  // Remove path traversal attempts
  cleaned = cleaned.replace(/\.\./g, '');
  cleaned = cleaned.replace(/[\/\\]/g, '');
  
  // Remove dangerous characters
  cleaned = cleaned.replace(/[<>:"|?*\x00-\x1f\x80-\x9f]/g, '');
  
  // Remove leading/trailing dots and spaces
  cleaned = cleaned.replace(/^[\.\s]+|[\.\s]+$/g, '');
  
  // Check for reserved names (Windows)
  const reservedNames = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
  if (reservedNames.test(cleaned.split('.')[0])) {
    return null;
  }

  // Length limits
  if (cleaned.length === 0 || cleaned.length > 255) {
    return null;
  }

  return cleaned;
}

/**
 * Recursively sanitize object properties
 */
export function sanitizeObject(
  obj: any, 
  config: SanitizationConfig = defaultSanitizationConfig
): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj, config);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, config));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize the key itself (preserve literal tag names like '<key>' as 'key')
      // Extracts tag names from HTML-like keys (e.g., "<div>" or "</div>" becomes "div")
      const tagNameExtractor = /<\/?\s*([a-z0-9\-:_]+)[^>]*>/gi;
      const replaced = key.replace(tagNameExtractor, '$1');
      const sanitizedKey = sanitizeString(replaced, { 
        ...defaultSanitizationConfig, 
        maxLength: 100 
      });
      
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeObject(value, config);
      }
    }
    
    return sanitized;
  }

  return obj;
}

/**
 * Validate and sanitize request body
 */
export function sanitizeRequestBody(
  body: any,
  maxDepth: number = 10,
  maxKeys: number = 100
): { sanitized: any; violations: string[] } {
  const violations: string[] = [];
  
  // Check depth and key limits
  function checkLimits(obj: any, depth: number = 0): boolean {
    if (depth > maxDepth) {
      violations.push(`Object depth exceeds limit of ${maxDepth}`);
      return false;
    }

    if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj);
      if (keys.length > maxKeys) {
        violations.push(`Object has too many keys (${keys.length} > ${maxKeys})`);
        return false;
      }

      for (const value of Object.values(obj)) {
        if (!checkLimits(value, depth + 1)) {
          return false;
        }
      }
    }

    return true;
  }

  if (!checkLimits(body)) {
    return { sanitized: null, violations };
  }

  const sanitized = sanitizeObject(body, defaultSanitizationConfig);
  
  return { sanitized, violations };
}

/**
 * Rate-limit specific input validation
 */
export function validateInputRate(
  input: string,
  maxLength: number = 1000,
  pattern?: RegExp
): { valid: boolean; error?: string } {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Input must be a string' };
  }

  if (input.length > maxLength) {
    return { valid: false, error: `Input exceeds maximum length of ${maxLength}` };
  }

  if (pattern && !pattern.test(input)) {
    return { valid: false, error: 'Input format is invalid' };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script[^>]*>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /expression\s*\(/gi,
    /vbscript:/gi
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      return { valid: false, error: 'Input contains potentially dangerous content' };
    }
  }

  return { valid: true };
}

/**
 * Export sanitization configs for different use cases
 */
export const sanitizationConfigs = {
  default: defaultSanitizationConfig,
  html: htmlSanitizationConfig,
  strict: {
    ...defaultSanitizationConfig,
    maxLength: 500,
    stripEmpty: true
  },
  permissive: {
    ...htmlSanitizationConfig,
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'blockquote'],
    allowedAttributes: { a: ['href', 'title'] }
  }
};
