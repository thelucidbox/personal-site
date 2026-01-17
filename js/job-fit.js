/**
 * Job Fit Assessment Module
 * Handles JD parsing and fit analysis
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    apiEndpoint: '/api/job-fit',
    minJDLength: 50
  };

  // State
  let lastAnalysis = null;

  /**
   * Initialize job fit module
   */
  function init() {
    bindEvents();
    console.log('[JobFit] Initialized');
  }

  /**
   * Bind event listeners
   */
  function bindEvents() {
    const analyzeBtn = document.getElementById('analyze-job-btn');
    const textarea = document.getElementById('job-description-input');

    analyzeBtn?.addEventListener('click', handleAnalyze);

    // Enable submit on Enter + Ctrl/Cmd
    textarea?.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleAnalyze();
      }
    });
  }

  /**
   * Handle analyze button click
   */
  async function handleAnalyze() {
    const textarea = document.getElementById('job-description-input');
    const btn = document.getElementById('analyze-job-btn');
    const resultsContainer = document.getElementById('job-fit-results');

    const jobDescription = textarea?.value.trim();

    if (!jobDescription || jobDescription.length < CONFIG.minJDLength) {
      showError('Please provide a complete job description (at least 50 characters).');
      return;
    }

    // Show loading state
    setLoading(btn, true);
    resultsContainer.style.display = 'none';

    try {
      const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.analysis) {
        lastAnalysis = data.analysis;
        renderResults(data.analysis);
        enableRelevanceSort();
      } else {
        showError(data.error || 'Failed to analyze job description.');
      }

    } catch (error) {
      console.error('[JobFit] Error:', error);
      showError('Failed to analyze job description. Please try again.');
    } finally {
      setLoading(btn, false);
    }
  }

  /**
   * Set button loading state
   * @param {HTMLElement} btn
   * @param {boolean} loading
   */
  function setLoading(btn, loading) {
    if (!btn) return;
    const textEl = btn.querySelector('.btn-text');
    const loadingEl = btn.querySelector('.btn-loading');

    if (loading) {
      textEl.style.display = 'none';
      loadingEl.style.display = 'inline-flex';
      btn.disabled = true;
    } else {
      textEl.style.display = 'inline';
      loadingEl.style.display = 'none';
      btn.disabled = false;
    }
  }

  /**
   * Show error message
   * @param {string} message
   */
  function showError(message) {
    const resultsContainer = document.getElementById('job-fit-results');
    resultsContainer.innerHTML = `
      <div class="fit-error">
        <p>${message}</p>
      </div>
    `;
    resultsContainer.style.display = 'block';
  }

  /**
   * Render analysis results
   * @param {Object} analysis
   */
  function renderResults(analysis) {
    const resultsContainer = document.getElementById('job-fit-results');

    const html = `
      ${renderScoreCard(analysis.overallFit)}
      ${renderMatchedRequirements(analysis.matchedRequirements)}
      ${renderGaps(analysis.gaps)}
      ${renderUniqueValue(analysis.uniqueValue)}
      ${renderConcerns(analysis.honestConcerns)}
      ${renderRecommendation(analysis.recommendation)}
    `;

    resultsContainer.innerHTML = html;
    resultsContainer.style.display = 'block';

    // Animate score
    animateScore(analysis.overallFit.score);
  }

  /**
   * Render score card
   * @param {Object} fit
   * @returns {string}
   */
  function renderScoreCard(fit) {
    return `
      <div class="fit-score-card">
        <div class="fit-score-visual">
          <div class="fit-score-circle" style="--score: ${fit.score}"></div>
          <div class="fit-score-number">${fit.score}</div>
        </div>
        <div class="fit-score-info">
          <div class="fit-label">${fit.label}</div>
          <p class="fit-summary">${fit.summary}</p>
        </div>
      </div>
    `;
  }

  /**
   * Animate score circle
   * @param {number} score
   */
  function animateScore(score) {
    const circle = document.querySelector('.fit-score-circle');
    const number = document.querySelector('.fit-score-number');

    if (!circle || !number) return;

    let current = 0;
    const duration = 1000;
    const start = performance.now();

    function animate(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);

      // Easing
      const eased = 1 - Math.pow(1 - progress, 3);

      current = Math.round(score * eased);
      circle.style.setProperty('--score', current);
      number.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }

  /**
   * Render matched requirements
   * @param {Array} requirements
   * @returns {string}
   */
  function renderMatchedRequirements(requirements) {
    if (!requirements?.length) return '';

    return `
      <div class="fit-section">
        <h4 class="fit-section-title">✓ What I Bring</h4>
        <div class="fit-items">
          ${requirements.map(req => `
            <div class="fit-item">
              <div class="fit-item-header">
                <span class="fit-item-requirement">${req.requirement}</span>
                <span class="fit-item-strength ${req.strength}">${req.strength}</span>
              </div>
              <p class="fit-item-evidence">${req.candidateEvidence}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render gaps
   * @param {Array} gaps
   * @returns {string}
   */
  function renderGaps(gaps) {
    if (!gaps?.length) return '';

    return `
      <div class="fit-section">
        <h4 class="fit-section-title">⚠ Honest Gaps</h4>
        <div class="fit-items">
          ${gaps.map(gap => `
            <div class="fit-item">
              <div class="fit-item-header">
                <span class="fit-item-requirement">${gap.requirement}</span>
                <span class="fit-gap-severity ${gap.severity}">${gap.severity}</span>
              </div>
              <p class="fit-item-evidence">${gap.currentState}</p>
              ${gap.mitigationPath ? `
                <p class="fit-gap-mitigation">→ ${gap.mitigationPath}</p>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render unique value
   * @param {Object} uniqueValue
   * @returns {string}
   */
  function renderUniqueValue(uniqueValue) {
    if (!uniqueValue) return '';

    return `
      <div class="fit-section">
        <h4 class="fit-section-title">★ What Makes Me Different</h4>
        <div class="fit-item">
          <p class="fit-item-evidence">${uniqueValue.narrative}</p>
          ${uniqueValue.differentiators?.length ? `
            <ul style="margin-top: 0.5rem;">
              ${uniqueValue.differentiators.map(d => `<li>${d}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render concerns
   * @param {Array} concerns
   * @returns {string}
   */
  function renderConcerns(concerns) {
    if (!concerns?.length) return '';

    return `
      <div class="fit-section">
        <h4 class="fit-section-title">🤔 You Might Wonder</h4>
        <div class="fit-item">
          <ul>
            ${concerns.map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Render recommendation
   * @param {Object} recommendation
   * @returns {string}
   */
  function renderRecommendation(recommendation) {
    if (!recommendation) return '';

    const className = recommendation.shouldApply ? 'apply' : 'consider';

    return `
      <div class="fit-recommendation ${className}">
        <h4 class="fit-recommendation-title">
          ${recommendation.shouldApply ? '✓ Worth Applying' : '⚡ Stretch Opportunity'}
        </h4>
        <p>${recommendation.reasoning}</p>
        ${recommendation.suggestedApproach ? `
          <p style="margin-top: 0.5rem;"><strong>Suggested approach:</strong> ${recommendation.suggestedApproach}</p>
        ` : ''}
      </div>
    `;
  }

  /**
   * Enable "Most Relevant" sort option in review section
   */
  function enableRelevanceSort() {
    const sortSelect = document.getElementById('sort-select');
    if (!sortSelect) return;

    const relevantOption = sortSelect.querySelector('option[value="most-relevant"]');
    if (relevantOption) {
      relevantOption.disabled = false;
      relevantOption.textContent = 'Most Relevant';

      // Dispatch event so review.js can use the analysis
      window.dispatchEvent(new CustomEvent('jobfit:analyzed', {
        detail: { analysis: lastAnalysis }
      }));
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.FabianJobFit = { lastAnalysis };

})();
