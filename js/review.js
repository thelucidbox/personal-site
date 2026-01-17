/**
 * Review Interface Module (Art of Fact Pattern)
 * Auto-generated browsable interface from resume data
 */

(function() {
  'use strict';

  // State
  let resumeItems = null;
  let currentFilter = 'all';
  let currentSort = 'most-interesting';
  let jobFitAnalysis = null;

  /**
   * Initialize review module
   */
  async function init() {
    await loadResumeItems();
    renderGrid();
    bindEvents();
    console.log('[Review] Initialized');
  }

  /**
   * Load resume items from JSON
   */
  async function loadResumeItems() {
    try {
      const response = await fetch('/data/resume-items.json');
      if (!response.ok) throw new Error('Failed to load resume items');
      resumeItems = await response.json();
    } catch (error) {
      console.error('[Review] Error loading data:', error);
      resumeItems = { items: [], categories: [] };
    }
  }

  /**
   * Bind event listeners
   */
  function bindEvents() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setFilter(btn.dataset.filter);
      });
    });

    // Sort select
    const sortSelect = document.getElementById('sort-select');
    sortSelect?.addEventListener('change', (e) => {
      setSort(e.target.value);
    });

    // Listen for job fit analysis
    window.addEventListener('jobfit:analyzed', (e) => {
      jobFitAnalysis = e.detail.analysis;
      if (currentSort === 'most-relevant') {
        renderGrid();
      }
    });

    // Card clicks for detail view
    document.getElementById('review-grid')?.addEventListener('click', (e) => {
      const card = e.target.closest('.review-card');
      if (card) {
        openDetailView(card.dataset.itemId);
      }
    });

    // Close detail view
    document.getElementById('review-detail')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('detail-close') ||
          e.target.classList.contains('review-detail')) {
        closeDetailView();
      }
    });
  }

  /**
   * Set active filter
   * @param {string} filter
   */
  function setFilter(filter) {
    currentFilter = filter;

    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    renderGrid();
  }

  /**
   * Set sort order
   * @param {string} sort
   */
  function setSort(sort) {
    currentSort = sort;
    renderGrid();
  }

  /**
   * Get filtered and sorted items
   * @returns {Array}
   */
  function getFilteredItems() {
    let items = [...resumeItems.items];

    // Apply filter
    if (currentFilter !== 'all') {
      items = items.filter(item => item.type === currentFilter);
    }

    // Apply sort
    switch (currentSort) {
      case 'latest':
        items.sort((a, b) => {
          const yearA = extractYear(a.period);
          const yearB = extractYear(b.period);
          return yearB - yearA;
        });
        break;

      case 'most-relevant':
        if (jobFitAnalysis?.relevantItems) {
          const relevanceMap = new Map(
            jobFitAnalysis.relevantItems.map(r => [r.itemId, r.relevanceScore])
          );
          items.sort((a, b) => {
            const scoreA = relevanceMap.get(a.id) || 0;
            const scoreB = relevanceMap.get(b.id) || 0;
            return scoreB - scoreA;
          });
        }
        break;

      case 'most-interesting':
      default:
        // Keep original order (curated)
        break;
    }

    return items;
  }

  /**
   * Extract year from period string
   * @param {string} period
   * @returns {number}
   */
  function extractYear(period) {
    const match = period?.match(/(\d{4})/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Render the grid of cards
   */
  function renderGrid() {
    const grid = document.getElementById('review-grid');
    if (!grid) return;

    const items = getFilteredItems();

    grid.innerHTML = items.map((item, index) => renderCard(item, index)).join('');

    // Apply stagger animation
    grid.querySelectorAll('.review-card').forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
      card.classList.add('forge-stagger-item');
    });
  }

  /**
   * Render a single card
   * @param {Object} item
   * @param {number} index
   * @returns {string}
   */
  function renderCard(item, index) {
    const typeLabels = {
      experience: 'Experience',
      project: 'Project',
      skill: 'Skill'
    };

    const relevanceScore = getRelevanceScore(item.id);

    return `
      <article class="review-card" data-item-id="${item.id}" data-type="${item.type}">
        <div class="review-card-type">${typeLabels[item.type] || item.type}</div>
        <h3 class="review-card-title">${item.title}</h3>
        <p class="review-card-subtitle">${item.subtitle}</p>
        ${item.quote ? `
          <p class="review-card-quote">"${item.quote}"</p>
        ` : ''}
        <div class="review-card-footer">
          <span class="review-card-cta">Dive deeper →</span>
          ${relevanceScore !== null ? `
            <span class="review-card-relevance">${Math.round(relevanceScore * 100)}% match</span>
          ` : ''}
        </div>
      </article>
    `;
  }

  /**
   * Get relevance score for an item
   * @param {string} itemId
   * @returns {number|null}
   */
  function getRelevanceScore(itemId) {
    if (!jobFitAnalysis?.relevantItems) return null;
    const relevant = jobFitAnalysis.relevantItems.find(r => r.itemId === itemId);
    return relevant?.relevanceScore || null;
  }

  /**
   * Open detail view for an item
   * @param {string} itemId
   */
  function openDetailView(itemId) {
    const item = resumeItems.items.find(i => i.id === itemId);
    if (!item) return;

    const detailContainer = document.getElementById('review-detail');
    if (!detailContainer) return;

    detailContainer.innerHTML = renderDetailView(item);
    detailContainer.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close detail view
   */
  function closeDetailView() {
    const detailContainer = document.getElementById('review-detail');
    if (!detailContainer) return;

    detailContainer.style.display = 'none';
    document.body.style.overflow = '';
  }

  /**
   * Render detail view content
   * @param {Object} item
   * @returns {string}
   */
  function renderDetailView(item) {
    return `
      <div class="detail-backdrop"></div>
      <div class="detail-content">
        <button class="detail-close" aria-label="Close">×</button>

        <div class="detail-header">
          <span class="detail-type">${item.type}</span>
          <h2 class="detail-title">${item.title}</h2>
          <p class="detail-subtitle">${item.subtitle}</p>
          ${item.period ? `<span class="detail-period">${item.period}</span>` : ''}
        </div>

        ${item.quote ? `
          <blockquote class="detail-quote">"${item.quote}"</blockquote>
        ` : ''}

        ${item.highlights?.length ? `
          <div class="detail-section">
            <h4>Highlights</h4>
            <ul>
              ${item.highlights.map(h => `<li>${h}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${item.skills?.length ? `
          <div class="detail-section">
            <h4>Related Skills</h4>
            <div class="detail-tags">
              ${item.skills.map(s => `<span class="detail-tag">${formatSkillName(s)}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${item.fitIndicators ? `
          <div class="detail-section">
            <h4>Fit Indicators</h4>
            <div class="fit-indicators">
              ${Object.entries(item.fitIndicators).map(([key, value]) => `
                <div class="fit-indicator">
                  <span class="fit-indicator-label">${formatKey(key)}</span>
                  <div class="fit-indicator-bar">
                    <div class="fit-indicator-fill" style="width: ${value * 100}%"></div>
                  </div>
                  <span class="fit-indicator-value">${Math.round(value * 100)}%</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${item.starRef ? `
          <div class="detail-section">
            <button class="btn btn-secondary detail-star-btn" data-star-ref="${item.starRef}">
              View STAR Breakdown
            </button>
          </div>
        ` : ''}

        ${item.voiceClip ? `
          <div class="detail-section">
            <button class="detail-voice-btn" data-audio="${item.voiceClip}">
              🎙️ Hear me tell this story
            </button>
          </div>
        ` : ''}

        <div class="detail-actions">
          <button class="btn btn-primary detail-chat-btn" data-item-id="${item.id}">
            Ask me about this
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Format skill ID to display name
   * @param {string} skillId
   * @returns {string}
   */
  function formatSkillName(skillId) {
    return skillId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format key for display
   * @param {string} key
   * @returns {string}
   */
  function formatKey(key) {
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.FabianReview = { resumeItems, setFilter, setSort };

})();
