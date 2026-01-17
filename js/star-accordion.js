/**
 * STAR Accordion Module
 * Handles expandable STAR (Situation, Approach, Technical, Lessons) sections
 * for journey items. Lazy-loads content from JSON.
 */

(function() {
  'use strict';

  // State
  let starContent = null;
  let loadedRoles = new Set();

  /**
   * Initialize STAR accordion
   */
  async function init() {
    await loadStarContent();
    bindEvents();
    console.log('[STAR] Initialized');
  }

  /**
   * Load STAR content from JSON
   */
  async function loadStarContent() {
    try {
      const response = await fetch('/data/star-content.json');
      if (!response.ok) throw new Error('Failed to load STAR content');
      const data = await response.json();
      starContent = data.roles;
    } catch (error) {
      console.error('[STAR] Error loading content:', error);
      starContent = {};
    }
  }

  /**
   * Bind event listeners
   */
  function bindEvents() {
    // Journey ask buttons toggle accordion
    document.querySelectorAll('.journey-ask-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Prevent opening chat (if also bound)
        e.stopPropagation();
        toggleAccordion(btn.dataset.role);
      });
    });

    // STAR tab switching
    document.querySelectorAll('.star-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const accordion = e.target.closest('.star-accordion');
        const role = accordion.dataset.role;
        switchTab(accordion, tab.dataset.tab);
      });
    });
  }

  /**
   * Toggle accordion open/closed
   * @param {string} roleId
   */
  function toggleAccordion(roleId) {
    const accordion = document.querySelector(`.star-accordion[data-role="${roleId}"]`);
    if (!accordion) return;

    const isOpen = accordion.classList.contains('open');

    // Close all other accordions
    document.querySelectorAll('.star-accordion.open').forEach(acc => {
      acc.classList.remove('open');
    });

    if (!isOpen) {
      accordion.classList.add('open');

      // Load content if not already loaded
      if (!loadedRoles.has(roleId)) {
        loadRoleContent(roleId, accordion);
      }
    }
  }

  /**
   * Load content for a specific role
   * @param {string} roleId
   * @param {HTMLElement} accordion
   */
  function loadRoleContent(roleId, accordion) {
    const roleData = starContent[roleId];
    if (!roleData) {
      accordion.querySelector('.star-content').innerHTML = `
        <p class="star-error">Content not available for this role.</p>
      `;
      return;
    }

    // Mark as loaded
    loadedRoles.add(roleId);

    // Render the active tab (default: situation)
    const activeTab = accordion.querySelector('.star-tab.active');
    const tabName = activeTab?.dataset.tab || 'situation';
    renderTabContent(accordion, roleData.star, tabName);
  }

  /**
   * Switch to a different tab
   * @param {HTMLElement} accordion
   * @param {string} tabName
   */
  function switchTab(accordion, tabName) {
    const roleId = accordion.dataset.role;
    const roleData = starContent[roleId];
    if (!roleData) return;

    // Update active tab
    accordion.querySelectorAll('.star-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Render content
    renderTabContent(accordion, roleData.star, tabName);
  }

  /**
   * Render content for a specific tab
   * @param {HTMLElement} accordion
   * @param {Object} starData
   * @param {string} tabName
   */
  function renderTabContent(accordion, starData, tabName) {
    const contentEl = accordion.querySelector('.star-content');
    const data = starData[tabName];

    if (!data) {
      contentEl.innerHTML = '<p>Content not available.</p>';
      return;
    }

    let html = `<h4>${data.title}</h4>`;
    html += `<p>${data.content}</p>`;

    // Render additional data based on tab type
    if (tabName === 'situation' && data.metrics) {
      html += renderMetrics(data.metrics);
    }

    if (tabName === 'approach' && data.highlights) {
      html += renderList(data.highlights);
    }

    if (tabName === 'technical') {
      if (data.tools) {
        html += `<p><strong>Tools & Technologies:</strong></p>`;
        html += renderTags(data.tools);
      }
    }

    if (tabName === 'lessons' && data.takeaways) {
      html += `<p><strong>Key Takeaways:</strong></p>`;
      html += renderList(data.takeaways);
    }

    contentEl.innerHTML = html;

    // Trigger animation
    contentEl.style.opacity = '0';
    contentEl.style.transform = 'translateY(10px)';
    requestAnimationFrame(() => {
      contentEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      contentEl.style.opacity = '1';
      contentEl.style.transform = 'translateY(0)';
    });
  }

  /**
   * Render metrics object
   * @param {Object} metrics
   * @returns {string}
   */
  function renderMetrics(metrics) {
    const items = Object.entries(metrics)
      .map(([key, value]) => `<li><strong>${formatKey(key)}:</strong> ${value}</li>`)
      .join('');
    return `<ul class="star-metrics">${items}</ul>`;
  }

  /**
   * Render a list of items
   * @param {Array} items
   * @returns {string}
   */
  function renderList(items) {
    return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
  }

  /**
   * Render tags
   * @param {Array} tags
   * @returns {string}
   */
  function renderTags(tags) {
    return `<div class="star-tags">${tags.map(tag =>
      `<span class="star-tag">${tag}</span>`
    ).join('')}</div>`;
  }

  /**
   * Format object key for display
   * @param {string} key
   * @returns {string}
   */
  function formatKey(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.StarAccordion = { toggleAccordion };

})();
