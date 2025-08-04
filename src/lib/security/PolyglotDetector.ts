/**
 * Enterprise-grade polyglot file detection with HTML/XML parsing support
 * Prevents file type confusion attacks and polyglot exploits
 */

import { JSDOM } from 'jsdom';

interface PolyglotEvidence {
  type: string;
  confidence: number;
  location: number;
  description: string;
}

interface PolyglotResult {
  isPolyglot: boolean;
  evidence: PolyglotEvidence[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export class PolyglotDetector {
  private static readonly FILE_SIGNATURES = {
    // Image formats
    jpeg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    gif87a: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    gif89a: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
    webp: [0x52, 0x49, 0x46, 0x46], // followed by WEBP
    
    // Executable formats
    pe: [0x4D, 0x5A], // Windows PE
    elf: [0x7F, 0x45, 0x4C, 0x46], // Linux ELF
    
    // Archive formats
    zip: [0x50, 0x4B, 0x03, 0x04],
    rar: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07],
    
    // Script/markup
    html: [0x3C, 0x68, 0x74, 0x6D, 0x6C], // <html
    xml: [0x3C, 0x3F, 0x78, 0x6D, 0x6C], // <?xml
    
    // Office documents (ZIP-based)
    office: [0x50, 0x4B, 0x03, 0x04], // Same as ZIP, needs content analysis
  };

  private static readonly DANGEROUS_PATTERNS = [
    // Script injection patterns
    { pattern: /<script[^>]*>/gi, type: 'script_tag', confidence: 0.9 },
    { pattern: /javascript:/gi, type: 'javascript_protocol', confidence: 0.8 },
    { pattern: /vbscript:/gi, type: 'vbscript_protocol', confidence: 0.8 },
    { pattern: /data:text\/html/gi, type: 'data_uri_html', confidence: 0.9 },
    
    // Executable content
    { pattern: /\x4D\x5A/g, type: 'pe_executable', confidence: 0.95 },
    { pattern: /\x7F\x45\x4C\x46/g, type: 'elf_executable', confidence: 0.95 },
    
    // Embedded files
    { pattern: /\x50\x4B\x03\x04/g, type: 'embedded_zip', confidence: 0.7 },
    { pattern: /\xFF\xD8\xFF/g, type: 'embedded_jpeg', confidence: 0.6 },
    
    // Polyglot markers
    { pattern: /GIF8[79]a.*<script/gi, type: 'gif_script_polyglot', confidence: 0.95 },
    { pattern: /\xFF\xD8\xFF.*<html/gi, type: 'jpeg_html_polyglot', confidence: 0.9 },
    { pattern: /PNG.*javascript:/gi, type: 'png_js_polyglot', confidence: 0.85 },
  ];

  /**
   * Analyze buffer for polyglot file indicators
   */
  public static analyze(buffer: Buffer, maxAnalysisSize: number = 1024 * 1024): PolyglotResult {
    const evidence: PolyglotEvidence[] = [];
    const analysisSize = Math.min(buffer.length, maxAnalysisSize);
    
    try {
      // 1. Detect file signatures
      const signatures = this.detectFileSignatures(buffer);
      if (signatures.length > 1) {
        evidence.push({
          type: 'multiple_signatures',
          confidence: 0.8,
          location: 0,
          description: `Multiple file signatures detected: ${signatures.join(', ')}`
        });
      }

      // 2. Pattern-based detection
      const patternEvidence = this.detectDangerousPatterns(buffer, analysisSize);
      evidence.push(...patternEvidence);

      // 3. HTML/XML content analysis
      const markupEvidence = this.analyzeMarkupContent(buffer, analysisSize);
      evidence.push(...markupEvidence);

      // 4. Structure inconsistencies
      const structureEvidence = this.detectStructureInconsistencies(buffer);
      evidence.push(...structureEvidence);

      // Calculate risk level
      const riskLevel = this.calculateRiskLevel(evidence);
      
      return {
        isPolyglot: evidence.length > 0,
        evidence,
        riskLevel,
        recommendation: this.getRecommendation(riskLevel, evidence)
      };

    } catch (error) {
      // Fallback to basic detection on error
      const basicEvidence = this.detectDangerousPatterns(buffer, Math.min(4096, analysisSize));
      
      return {
        isPolyglot: basicEvidence.length > 0,
        evidence: basicEvidence,
        riskLevel: basicEvidence.length > 0 ? 'medium' : 'low',
        recommendation: 'Analysis completed with limited detection due to processing error'
      };
    }
  }

  private static detectFileSignatures(buffer: Buffer): string[] {
    const signatures: string[] = [];
    
    for (const [format, signature] of Object.entries(this.FILE_SIGNATURES)) {
      if (buffer.length >= signature.length) {
        const matches = signature.every((byte, index) => buffer[index] === byte);
        if (matches) {
          signatures.push(format);
        }
      }
    }

    return signatures;
  }

  private static detectDangerousPatterns(buffer: Buffer, analysisSize: number): PolyglotEvidence[] {
    const evidence: PolyglotEvidence[] = [];
    const content = buffer.toString('binary', 0, analysisSize);
    
    for (const pattern of this.DANGEROUS_PATTERNS) {
      const matches = Array.from(content.matchAll(pattern.pattern));
      
      for (const match of matches) {
        if (match.index !== undefined) {
          evidence.push({
            type: pattern.type,
            confidence: pattern.confidence,
            location: match.index,
            description: `Dangerous pattern detected: ${match[0].substring(0, 50)}...`
          });
        }
      }
    }

    return evidence;
  }

  private static analyzeMarkupContent(buffer: Buffer, analysisSize: number): PolyglotEvidence[] {
    const evidence: PolyglotEvidence[] = [];
    
    try {
      const content = buffer.toString('utf8', 0, analysisSize);
      
      // Look for HTML-like content
      if (content.includes('<') && content.includes('>')) {
        const htmlMatches = content.match(/<[^>]+>/g);
        if (htmlMatches && htmlMatches.length > 2) {
          // Use JSDOM to safely parse potential HTML
          const dom = new JSDOM(content, { 
            url: 'http://localhost',
            pretendToBeVisual: false,
            resources: 'usable'
          });
          
          const document = dom.window.document;
          
          // Check for script elements
          const scripts = document.querySelectorAll('script');
          if (scripts.length > 0) {
            evidence.push({
              type: 'embedded_scripts',
              confidence: 0.9,
              location: content.indexOf('<script'),
              description: `${scripts.length} script tags found in markup content`
            });
          }

          // Check for dangerous attributes
          const elementsWithEvents = document.querySelectorAll('[onclick], [onload], [onerror], [onmouseover]');
          if (elementsWithEvents.length > 0) {
            evidence.push({
              type: 'event_handlers',
              confidence: 0.85,
              location: 0,
              description: `Event handler attributes detected in markup`
            });
          }

          // Check for external resources
          const externalLinks = document.querySelectorAll('link[href], script[src], img[src]');
          if (externalLinks.length > 0) {
            evidence.push({
              type: 'external_resources',
              confidence: 0.6,
              location: 0,
              description: `External resources referenced in markup`
            });
          }
        }
      }

    } catch (error) {
      // DOM parsing failed, likely not valid HTML
      // This is actually good for file upload security
    }

    return evidence;
  }

  private static detectStructureInconsistencies(buffer: Buffer): PolyglotEvidence[] {
    const evidence: PolyglotEvidence[] = [];
    
    // Check for null bytes in unexpected locations (common in polyglots)
    const nullByteCount = buffer.filter(byte => byte === 0).length;
    if (nullByteCount > 10 && nullByteCount < buffer.length * 0.1) {
      evidence.push({
        type: 'suspicious_null_bytes',
        confidence: 0.6,
        location: buffer.indexOf(0),
        description: `Suspicious null byte pattern (${nullByteCount} null bytes)`
      });
    }

    // Check for high entropy regions (encrypted/compressed data mixed with text)
    const entropy = this.calculateEntropy(buffer.slice(0, Math.min(4096, buffer.length)));
    if (entropy > 7.5) {
      evidence.push({
        type: 'high_entropy',
        confidence: 0.7,
        location: 0,
        description: `High entropy content detected (${entropy.toFixed(2)})`
      });
    }

    return evidence;
  }

  private static calculateEntropy(buffer: Buffer): number {
    const frequencies = new Map<number, number>();
    
    for (const byte of buffer) {
      frequencies.set(byte, (frequencies.get(byte) || 0) + 1);
    }

    let entropy = 0;
    const length = buffer.length;

    for (const frequency of frequencies.values()) {
      const probability = frequency / length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }

  private static calculateRiskLevel(evidence: PolyglotEvidence[]): 'low' | 'medium' | 'high' | 'critical' {
    if (evidence.length === 0) return 'low';

    const maxConfidence = Math.max(...evidence.map(e => e.confidence));
    const criticalTypes = ['script_tag', 'pe_executable', 'elf_executable', 'gif_script_polyglot'];
    
    const hasCriticalEvidence = evidence.some(e => criticalTypes.includes(e.type));
    
    if (hasCriticalEvidence || maxConfidence >= 0.9) return 'critical';
    if (maxConfidence >= 0.8 || evidence.length >= 3) return 'high';
    if (maxConfidence >= 0.6 || evidence.length >= 2) return 'medium';
    
    return 'low';
  }

  private static getRecommendation(riskLevel: string, _evidence: PolyglotEvidence[]): string {
    switch (riskLevel) {
      case 'critical':
        return 'REJECT: File contains critical security threats and should be blocked immediately';
      case 'high':
        return 'QUARANTINE: File requires manual review before allowing upload';
      case 'medium':
        return 'SANITIZE: Consider additional processing or content filtering';
      case 'low':
      default:
        return 'ALLOW: File appears safe for upload with standard precautions';
    }
  }
}
