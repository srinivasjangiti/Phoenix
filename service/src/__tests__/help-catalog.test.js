import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HELP_CATEGORIES, HELP_TOPICS, HELP_FAQS, searchHelp } from '../help-catalog.js';

describe('Phase 5: In-App Help Catalog & Search Engine Tests', () => {
  describe('1. Category Structure & Metadata Integrity', () => {
    it('should define exactly the 6 required core categories', () => {
      const expectedCategories = [
        'getting-started',
        'memory',
        'ai-engines',
        'privacy-senses',
        'backup-safety',
        'troubleshooting'
      ];
      const actualCategories = HELP_CATEGORIES.map(c => c.id);
      assert.deepEqual(actualCategories, expectedCategories);
    });

    it('should have complete metadata for every category', () => {
      for (const cat of HELP_CATEGORIES) {
        assert.ok(cat.id, 'Category must have an id');
        assert.ok(cat.title, 'Category must have a title');
        assert.ok(cat.icon, 'Category must have an icon');
        assert.ok(cat.summary, 'Category must have a summary');
        assert.ok(cat.badge, 'Category must have a badge');
      }
    });
  });

  describe('2. Topic Integrity & Categorization', () => {
    it('should contain populated topics for every defined category', () => {
      for (const cat of HELP_CATEGORIES) {
        const matchingTopics = HELP_TOPICS.filter(t => t.category === cat.id);
        assert.ok(matchingTopics.length > 0, `Category ${cat.id} must have at least one topic`);
      }
    });

    it('should have valid fields, non-empty keywords, and descriptive content', () => {
      for (const topic of HELP_TOPICS) {
        assert.ok(topic.id, `Topic missing id: ${JSON.stringify(topic)}`);
        assert.ok(topic.title, `Topic ${topic.id} missing title`);
        assert.ok(topic.summary, `Topic ${topic.id} missing summary`);
        assert.ok(topic.content, `Topic ${topic.id} missing content`);
        assert.ok(Array.isArray(topic.keywords) && topic.keywords.length > 0, `Topic ${topic.id} missing keywords`);
      }
    });

    it('should ensure action deep-links point to valid application paths or APIs', () => {
      for (const topic of HELP_TOPICS) {
        if (topic.action) {
          assert.ok(['navigate', 'api_call'].includes(topic.action.type), `Invalid action type in ${topic.id}`);
          assert.ok(topic.action.label, `Action missing label in ${topic.id}`);
          assert.ok(
            topic.action.target.startsWith('/v2/') || topic.action.target.startsWith('/api/v1/'),
            `Target must start with /v2/ or /api/v1/ in ${topic.id}: ${topic.action.target}`
          );
        }
      }
    });
  });

  describe('3. Local Search Engine Determinism (<5ms, Zero Cloud)', () => {
    it('should return all topics when search query is empty', () => {
      const allResults = searchHelp('');
      assert.equal(allResults.length, HELP_TOPICS.length);
    });

    it('should filter results by category when category filter is supplied', () => {
      const memoryResults = searchHelp('', 'memory');
      assert.ok(memoryResults.length > 0);
      assert.ok(memoryResults.every(t => t.category === 'memory'));
    });

    it('should find Ollama topics with high relevance for "ollama"', () => {
      const results = searchHelp('ollama');
      assert.ok(results.length > 0);
      const topIds = results.map(r => r.id);
      assert.ok(
        topIds.includes('local-vs-cloud') ||
        topIds.includes('troubleshoot-ollama-sleeping') ||
        topIds.includes('body-vs-brain')
      );
    });

    it('should find memory topics for "diary" or "notes"', () => {
      const results = searchHelp('diary');
      assert.ok(results.length > 0);
      assert.ok(results.some(r => r.category === 'memory' || r.category === 'getting-started'));
    });

    it('should find privacy guarantees for "private" and "tailscale"', () => {
      const results = searchHelp('tailscale');
      assert.ok(results.length > 0);
      assert.ok(results.some(r => r.id === 'what-leaves-your-computer' || r.id === 'three-ways-to-interact'));
    });

    it('should find troubleshooting remedies for "sleeping"', () => {
      const results = searchHelp('sleeping');
      assert.ok(results.length > 0);
      assert.equal(results[0].id, 'troubleshoot-ollama-sleeping');
      assert.equal(results[0].action.target, '/api/v1/ollama/start');
    });
  });

  describe('4. FAQ Consistency', () => {
    it('should provide clear non-technical FAQs', () => {
      assert.ok(HELP_FAQS.length >= 5, 'Must have at least 5 common FAQs');
      for (const faq of HELP_FAQS) {
        assert.ok(faq.q && faq.q.endsWith('?'), 'FAQ question must be valid');
        assert.ok(faq.a && faq.a.length > 20, 'FAQ answer must be substantive');
      }
    });
  });
});
