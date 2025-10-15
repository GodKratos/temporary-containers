import { expect } from 'chai';
import { loadBackground } from './setup';

describe('Utils', () => {
  describe('sameDomain', () => {
    let background: any;

    beforeEach(async () => {
      const result = await loadBackground();
      background = result.tmp;
    });

    it('should return true for same regular domains', () => {
      expect(background.utils.sameDomain('example.com', 'example.com')).to.be.true;
      expect(background.utils.sameDomain('sub.example.com', 'other.example.com')).to.be.true;
      expect(background.utils.sameDomain('example.com', 'sub.example.com')).to.be.true;
    });

    it('should return false for different regular domains', () => {
      expect(background.utils.sameDomain('example.com', 'different.com')).to.be.false;
      expect(background.utils.sameDomain('sub.example.com', 'sub.different.com')).to.be.false;
    });

    // Validate localhost can be detected as a domain
    it('should return true for localhost domains (fixes issue #29)', () => {
      // These should be considered the same domain
      expect(background.utils.sameDomain('localhost', 'localhost')).to.be.true;
      expect(background.utils.sameDomain('localhost:8000', 'localhost:8000')).to.be.true;
    });

    it('should treat different ports as different domains', () => {
      // Different ports represent different services, so should be different domains
      expect(background.utils.sameDomain('localhost:8000', 'localhost:3000')).to.be.false;
      expect(background.utils.sameDomain('127.0.0.1:8000', '127.0.0.1:3000')).to.be.false;
      expect(background.utils.sameDomain('example.com:8080', 'example.com:9000')).to.be.false;
    });

    it('should handle port vs no port correctly', () => {
      // No port vs explicit port should be different
      expect(background.utils.sameDomain('localhost', 'localhost:8000')).to.be.false;
      expect(background.utils.sameDomain('localhost:8000', 'localhost')).to.be.false;
      expect(background.utils.sameDomain('example.com', 'example.com:8080')).to.be.false;
    });

    it('should return true for IP address domains with same ports', () => {
      expect(background.utils.sameDomain('127.0.0.1', '127.0.0.1')).to.be.true;
      expect(background.utils.sameDomain('192.168.1.1', '192.168.1.1')).to.be.true;
      expect(background.utils.sameDomain('10.0.0.1', '10.0.0.1')).to.be.true;
      expect(background.utils.sameDomain('127.0.0.1:8000', '127.0.0.1:8000')).to.be.true;
    });

    it('should return false for different IP addresses', () => {
      expect(background.utils.sameDomain('127.0.0.1', '192.168.1.1')).to.be.false;
      expect(background.utils.sameDomain('192.168.1.1', '10.0.0.1')).to.be.false;
    });

    it('should handle localhost vs IP addresses correctly', () => {
      // localhost and 127.0.0.1 are different from domain perspective
      expect(background.utils.sameDomain('localhost', '127.0.0.1')).to.be.false;
      expect(background.utils.sameDomain('127.0.0.1', 'localhost')).to.be.false;
    });

    it('should handle edge cases', () => {
      // These should not crash and return false for invalid inputs
      expect(background.utils.sameDomain('', '')).to.be.false;
      expect(background.utils.sameDomain('about:blank', 'about:blank')).to.be.false;
    });

    it('should handle non-PSL domains correctly', () => {
      // Domains that PSL doesn't recognize should still work by hostname comparison
      expect(background.utils.sameDomain('custom', 'custom')).to.be.true;
      expect(background.utils.sameDomain('custom:8000', 'custom:8000')).to.be.true;
      expect(background.utils.sameDomain('custom:8000', 'custom:3000')).to.be.false; // Different ports
      expect(background.utils.sameDomain('custom', 'different')).to.be.false;
    });
  });
});
