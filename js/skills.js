/**
 * Skills Module
 * Handles the 3-tier skills display with tooltips and animations
 */

(function() {
  'use strict';

  // State
  let skillsData = null;

  /**
   * Initialize skills module
   */
  async function init() {
    await loadSkillsData();
    renderSkills();
    bindEvents();
    console.log('[Skills] Initialized');
  }

  /**
   * Load skills data from JSON
   */
  async function loadSkillsData() {
    try {
      const response = await fetch('/data/skills.json');
      if (!response.ok) throw new Error('Failed to load skills data');
      skillsData = await response.json();
    } catch (error) {
      console.error('[Skills] Error loading data:', error);
      skillsData = { skills: [], categories: {} };
    }
  }

  /**
   * Render skills into their respective columns
   */
  function renderSkills() {
    const categories = ['strong', 'moderate', 'learning'];

    categories.forEach(category => {
      const container = document.querySelector(`.skills-list[data-category="${category}"]`);
      if (!container) return;

      const skills = skillsData.skills.filter(s => s.category === category);
      container.innerHTML = skills.map(skill => renderSkillItem(skill)).join('');
    });

    // Apply stagger animation
    document.querySelectorAll('.skill-item').forEach((item, index) => {
      item.style.animationDelay = `${index * 0.1}s`;
    });
  }

  /**
   * Render a single skill item
   * @param {Object} skill
   * @returns {string}
   */
  function renderSkillItem(skill) {
    const confidencePercent = Math.round(skill.confidence * 100);

    return `
      <div class="skill-item" data-skill-id="${skill.id}">
        <div class="skill-name">${skill.name}</div>
        <div class="skill-confidence">
          <div class="confidence-bar">
            <div class="confidence-fill" style="width: ${confidencePercent}%"></div>
          </div>
          <span class="confidence-value">${confidencePercent}%</span>
        </div>
        <div class="skill-tooltip">
          <div class="skill-tooltip-title">${skill.name}</div>
          <div class="skill-tooltip-text">${skill.honest_assessment}</div>
          ${skill.evidence ? `
            <div class="skill-tooltip-evidence">
              <strong>Evidence:</strong>
              <ul>${skill.evidence.map(e => `<li>${e}</li>`).join('')}</ul>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Bind event listeners
   */
  function bindEvents() {
    // Skill item click - open chat with context
    document.querySelectorAll('.skill-item').forEach(item => {
      item.addEventListener('click', () => {
        const skillId = item.dataset.skillId;
        const skill = skillsData.skills.find(s => s.id === skillId);
        if (skill && window.FabianChat) {
          window.FabianChat.openChat();
          // Pre-fill with a question about this skill
          const input = document.getElementById('chat-input');
          if (input) {
            input.value = `Tell me more about your ${skill.name} skills.`;
            input.focus();
          }
        }
      });
    });

    // Animate confidence bars on scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.confidence-fill').forEach(fill => {
            fill.style.width = fill.style.width; // Trigger animation
          });
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('.skills-column').forEach(col => {
      observer.observe(col);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.FabianSkills = { skillsData };

})();
