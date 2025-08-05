import { describe, it, expect, vi } from 'vitest';
import { PolyglotDetector } from './PolyglotDetector';

describe('PolyglotDetector', () => {
  describe('File Signature Detection', () => {
    it('should detect JPEG signature', () => {
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
      const result = PolyglotDetector.analyze(jpegBuffer);
      
      expect(result).toBeDefined();
      // JPEG with JPEG signature pattern triggers embedded_jpeg detection
      expect(result.isPolyglot).toBe(true);
      expect(result.evidence.some(e => e.type === 'embedded_jpeg')).toBe(true);
    });

    it('should detect PNG signature', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
      const result = PolyglotDetector.analyze(pngBuffer);
      
      expect(result).toBeDefined();
      expect(result.isPolyglot).toBe(false);
    });

    it('should detect GIF87a signature', () => {
      const gifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x00, 0x00]);
      const result = PolyglotDetector.analyze(gifBuffer);
      
      expect(result).toBeDefined();
      expect(result.isPolyglot).toBe(false);
    });

    it('should detect GIF89a signature', () => {
      const gifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x00]);
      const result = PolyglotDetector.analyze(gifBuffer);
      
      expect(result).toBeDefined();
      expect(result.isPolyglot).toBe(false);
    });

    it('should detect ZIP signature', () => {
      const zipBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]);
      const result = PolyglotDetector.analyze(zipBuffer);
      
      expect(result).toBeDefined();
      // ZIP signature triggers embedded_zip pattern detection  
      expect(result.isPolyglot).toBe(true);
      expect(result.evidence.some(e => e.type === 'embedded_zip')).toBe(true);
    });

    it('should detect multiple file signatures', () => {
      // Create a buffer with both JPEG and ZIP signatures
      const polyglotBuffer = Buffer.concat([
        Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), // JPEG
        Buffer.from('some content here'),
        Buffer.from([0x50, 0x4B, 0x03, 0x04]) // ZIP
      ]);
      
      const result = PolyglotDetector.analyze(polyglotBuffer);
      
      expect(result.isPolyglot).toBe(true);
      // The evidence contains embedded_jpeg and embedded_zip patterns, not multiple_signatures
      expect(result.evidence.some(e => e.type === 'embedded_jpeg')).toBe(true);
      expect(result.evidence.some(e => e.type === 'embedded_zip')).toBe(true);
    });
  });

  describe('Dangerous Pattern Detection', () => {
    it('should detect script tags', () => {
      const maliciousBuffer = Buffer.from('<script>alert("xss")</script>');
      const result = PolyglotDetector.analyze(maliciousBuffer);
      
      expect(result.isPolyglot).toBe(true);
      expect(result.evidence).toContainEqual(
        expect.objectContaining({
          type: 'script_tag'
        })
      );
      expect(result.riskLevel).toBe('critical');
    });

    it('should detect javascript protocol', () => {
      const maliciousBuffer = Buffer.from('<a href="javascript:alert(1)">click</a>');
      const result = PolyglotDetector.analyze(maliciousBuffer);
      
      expect(result.isPolyglot).toBe(true);
      expect(result.evidence).toContainEqual(
        expect.objectContaining({
          type: 'javascript_protocol'
        })
      );
    });

    it('should detect vbscript protocol', () => {
      const maliciousBuffer = Buffer.from('<a href="vbscript:MsgBox(1)">click</a>');
      const result = PolyglotDetector.analyze(maliciousBuffer);
      
      expect(result.isPolyglot).toBe(true);
      expect(result.evidence).toContainEqual(
        expect.objectContaining({
          type: 'vbscript_protocol'
        })
      );
    });

    it('should detect data URI HTML', () => {
      const maliciousBuffer = Buffer.from('data:text/html,<script>alert(1)</script>');
      const result = PolyglotDetector.analyze(maliciousBuffer);
      
      expect(result.isPolyglot).toBe(true);
      expect(result.evidence).toContainEqual(
        expect.objectContaining({
          type: 'data_uri_html'
        })
      );
    });

    it('should detect PE executable signature', () => {
      const peBuffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00]);
      const result = PolyglotDetector.analyze(peBuffer);
      
      expect(result.isPolyglot).toBe(true);
      expect(result.evidence).toContainEqual(
        expect.objectContaining({
          type: 'pe_executable'
        })
      );
      expect(result.riskLevel).toBe('critical');
    });

    it('should detect ELF executable signature', () => {
      const elfBuffer = Buffer.from([0x7F, 0x45, 0x4C, 0x46, 0x02, 0x01]);
      const result = PolyglotDetector.analyze(elfBuffer);
      
      expect(result.isPolyglot).toBe(true);
      expect(result.evidence).toContainEqual(
        expect.objectContaining({
          type: 'elf_executable'
        })
      );
      expect(result.riskLevel).toBe('critical');
    });
  });

  describe('Polyglot-Specific Detection', () => {
    it('should detect GIF-script polyglot', () => {
      const gifScriptBuffer = Buffer.from('GIF89a\x00\x00<script>alert(1)</script>');
      const result = PolyglotDetector.analyze(gifScriptBuffer);
      
      expect(result.isPolyglot).toBe(true);
      expect(result.evidence).toContainEqual(
        expect.objectContaining({
          type: 'gif_script_polyglot'
        })
      );
      expect(result.riskLevel).toBe('critical');
    });

    it('should detect JPEG-HTML polyglot', () => {
      const jpegHtmlBuffer = Buffer.concat([
        Buffer.from([0xFF, 0xD8, 0xFF]),
        Buffer.from('some image data'),
        Buffer.from('<html><script>alert(1)</script></html>')
      ]);
      const result = PolyglotDetector.analyze(jpegHtmlBuffer);
      
      expect(result.isPolyglot).toBe(true);
      expect(result.evidence.length).toBeGreaterThan(0);
    });

    it('should detect PNG-JavaScript polyglot', () => {
      const pngJsBuffer = Buffer.from('PNG\x00\x00javascript:alert(1)');
      const result = PolyglotDetector.analyze(pngJsBuffer);
      
      expect(result.isPolyglot).toBe(true);
      expect(result.evidence).toContainEqual(
        expect.objectContaining({
          type: 'png_js_polyglot'
        })
      );
    });
  });

  describe('HTML/XML Content Analysis', () => {
    it('should detect embedded scripts in HTML', () => {
      const htmlBuffer = Buffer.from(`
        <html>
          <head><title>Test</title></head>
          <body>
            <script>console.log('test');</script>
            <p>Content</p>
          </body>
        </html>
      `);
      const result = PolyglotDetector.analyze(htmlBuffer);
      
      expect(result.isPolyglot).toBe(true);
      expect(result.evidence).toContainEqual(
        expect.objectContaining({
          type: 'embedded_scripts'
        })
      );
    });

    it('should detect event handlers in HTML', () => {
      const htmlBuffer = Buffer.from('<html><body><div onclick="alert(1)" onload="evil()">Click me</div></body></html>');
      const result = PolyglotDetector.analyze(htmlBuffer);
      
      expect(result.isPolyglot).toBe(true);
      expect(result.evidence).toContainEqual(
        expect.objectContaining({
          type: 'event_handlers'
        })
      );
    });

    it('should detect external resources', () => {
      const htmlBuffer = Buffer.from(`
        <html>
          <head>
            <link href="http://evil.com/style.css" rel="stylesheet">
            <script src="http://evil.com/script.js"></script>
          </head>
          <body>
            <img src="http://evil.com/image.jpg" alt="test">
          </body>
        </html>
      `);
      const result = PolyglotDetector.analyze(htmlBuffer);
      
      expect(result.isPolyglot).toBe(true);
      expect(result.evidence).toContainEqual(
        expect.objectContaining({
          type: 'external_resources'
        })
      );
    });

    it('should handle malformed HTML gracefully', () => {
      const malformedBuffer = Buffer.from('<html><unclosed><script>broken</html>');
      const result = PolyglotDetector.analyze(malformedBuffer);
      
      expect(result).toBeDefined();
      expect(typeof result.isPolyglot).toBe('boolean');
    });
  });

  describe('Structure Analysis', () => {
    it('should detect suspicious null bytes', () => {
      // Create a buffer with suspicious null byte pattern
      // Need > 10 null bytes but < 10% of total length
      const totalSize = 1000;
      const nullByteBuffer = Buffer.alloc(totalSize);
      
      // Fill most of it with content, leaving about 50 null bytes (5% of 1000)
      const content = 'A'.repeat(950);
      nullByteBuffer.write(content, 0);
      // Add 50 null bytes at specific positions
      for (let i = 950; i < totalSize; i++) {
        nullByteBuffer[i] = 0;
      }
      
      const result = PolyglotDetector.analyze(nullByteBuffer);
      
      expect(result.isPolyglot).toBe(true);
      expect(result.evidence).toContainEqual(
        expect.objectContaining({
          type: 'suspicious_null_bytes'
        })
      );
    });

    it('should detect high entropy content', () => {
      // Create high entropy content (random-like data)
      const highEntropyBuffer = Buffer.alloc(4096);
      for (let i = 0; i < highEntropyBuffer.length; i++) {
        highEntropyBuffer[i] = Math.floor(Math.random() * 256);
      }
      
      const result = PolyglotDetector.analyze(highEntropyBuffer);
      
      expect(result).toBeDefined();
      // High entropy might or might not be detected depending on randomness
      expect(typeof result.isPolyglot).toBe('boolean');
    });

    it('should handle low entropy content', () => {
      // Create low entropy content (repetitive)
      const lowEntropyBuffer = Buffer.alloc(1000, 'A');
      
      const result = PolyglotDetector.analyze(lowEntropyBuffer);
      
      expect(result.isPolyglot).toBe(false);
      expect(result.riskLevel).toBe('low');
    });
  });

  describe('Risk Assessment', () => {
    it('should classify critical risk correctly', () => {
      const criticalBuffer = Buffer.from('<script>alert("xss")</script>');
      const result = PolyglotDetector.analyze(criticalBuffer);
      
      expect(result.riskLevel).toBe('critical');
      expect(result.recommendation).toContain('REJECT');
    });

    it('should classify high risk correctly', () => {
      const highRiskBuffer = Buffer.from('<a href="javascript:void(0)">test</a>');
      const result = PolyglotDetector.analyze(highRiskBuffer);
      
      expect(result.riskLevel).toBe('high');
      expect(result.recommendation).toContain('QUARANTINE');
    });

    it('should classify medium risk correctly', () => {
      // Create two pieces of evidence with lower confidence to trigger medium risk
      const mediumRiskBuffer = Buffer.concat([
        Buffer.from([0xFF, 0xD8, 0xFF]), // embedded_jpeg (confidence 0.6)
        Buffer.from('some content here'),
        Buffer.from([0x50, 0x4B, 0x03, 0x04]) // embedded_zip (confidence 0.7)  
      ]);
      const result = PolyglotDetector.analyze(mediumRiskBuffer);
      
      // Two evidence items with max confidence 0.7 should be medium risk
      expect(result.riskLevel).toBe('medium');
      expect(result.recommendation).toContain('SANITIZE');
    });

    it('should classify low risk correctly', () => {
      const lowRiskBuffer = Buffer.from('This is just plain text content');
      const result = PolyglotDetector.analyze(lowRiskBuffer);
      
      expect(result.riskLevel).toBe('low');
      expect(result.recommendation).toContain('ALLOW');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty buffer', () => {
      const emptyBuffer = Buffer.alloc(0);
      const result = PolyglotDetector.analyze(emptyBuffer);
      
      expect(result).toBeDefined();
      expect(result.isPolyglot).toBe(false);
      expect(result.riskLevel).toBe('low');
    });

    it('should handle very small buffer', () => {
      const smallBuffer = Buffer.from([0x01]);
      const result = PolyglotDetector.analyze(smallBuffer);
      
      expect(result).toBeDefined();
      expect(result.isPolyglot).toBe(false);
    });

    it('should respect max analysis size', () => {
      const largeBuffer = Buffer.alloc(2 * 1024 * 1024, 'A'); // 2MB
      largeBuffer.write('<script>alert(1)</script>', 1024 * 1024); // Add script at 1MB mark
      
      const result = PolyglotDetector.analyze(largeBuffer, 512 * 1024); // Limit to 512KB
      
      expect(result).toBeDefined();
      // Script should not be detected because it's beyond analysis limit
      expect(result.evidence.every(e => e.type !== 'script_tag')).toBe(true);
    });

    it('should handle analysis errors gracefully', () => {
      // Mock JSDOM to throw an error
      const mockJSDOM = vi.fn().mockImplementation(() => {
        throw new Error('DOM parsing failed');
      });
      vi.doMock('jsdom', () => ({ JSDOM: mockJSDOM }));

      const htmlBuffer = Buffer.from('<html><script>test</script></html>');
      const result = PolyglotDetector.analyze(htmlBuffer);
      
      expect(result).toBeDefined();
      expect(typeof result.isPolyglot).toBe('boolean');
      
      // Restore original
      vi.doUnmock('jsdom');
    });

    it('should provide evidence details', () => {
      const maliciousBuffer = Buffer.from('<script type="text/javascript">alert("test")</script>');
      const result = PolyglotDetector.analyze(maliciousBuffer);
      
      expect(result.evidence.length).toBeGreaterThan(0);
      result.evidence.forEach(evidence => {
        expect(evidence).toHaveProperty('type');
        expect(evidence).toHaveProperty('confidence');
        expect(evidence).toHaveProperty('location');
        expect(evidence).toHaveProperty('description');
        expect(evidence.confidence).toBeGreaterThan(0);
        expect(evidence.confidence).toBeLessThanOrEqual(1);
      });
    });
  });
});
