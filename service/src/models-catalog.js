// Phoenix Models Catalog — Isolated Curated Model Recommendations
//
// This module defines curated local AI models recommended for Phoenix users.
// It is completely decoupled from core server, supervisor, and database logic,
// allowing recommendations and requirements to be updated independently.

export const RECOMMENDED_MODELS = [
  {
    id: 'llama3.2:1b',
    name: 'Llama 3.2 1B',
    tag: 'llama3.2:1b',
    purpose: 'chat_local',
    recommended: true,
    description: 'Fast, lightweight on-device assistant designed for standard PCs',
    estimatedDownloadSize: '~1.3 GB (estimate)',
    estimatedMemoryUsage: '~2.5 GB RAM (estimate)',
    minRecommendedRamGb: 8,
    publisher: 'Meta'
  },
  {
    id: 'llama3.2:3b',
    name: 'Llama 3.2 3B',
    tag: 'llama3.2:3b',
    purpose: 'chat_local',
    recommended: false,
    description: 'Higher reasoning and writing quality for systems with 12GB+ RAM',
    estimatedDownloadSize: '~2.0 GB (estimate)',
    estimatedMemoryUsage: '~4.5 GB RAM (estimate)',
    minRecommendedRamGb: 12,
    publisher: 'Meta'
  },
  {
    id: 'qwen2.5:1.5b',
    name: 'Qwen 2.5 1.5B',
    tag: 'qwen2.5:1.5b',
    purpose: 'chat_local',
    recommended: false,
    description: 'Ultra-compact model with strong multilingual and coding capabilities',
    estimatedDownloadSize: '~1.0 GB (estimate)',
    estimatedMemoryUsage: '~2.0 GB RAM (estimate)',
    minRecommendedRamGb: 8,
    publisher: 'Alibaba'
  }
];

export const RECOMMENDED_EMBEDDING_MODELS = [
  {
    id: 'nomic-embed-text',
    name: 'Nomic Embed Text',
    tag: 'nomic-embed-text',
    purpose: 'embedding',
    description: 'High-accuracy vector embeddings for local note & memory search',
    estimatedDownloadSize: '~274 MB (estimate)',
    estimatedMemoryUsage: '~500 MB RAM (estimate)'
  }
];

export function getRecommendedModelById(id) {
  return RECOMMENDED_MODELS.find(m => m.id === id || m.tag === id) || null;
}

export const getRecommendedModel = getRecommendedModelById;

export function getDefaultRecommendedModel() {
  return RECOMMENDED_MODELS.find(m => m.recommended) || RECOMMENDED_MODELS[0];
}
