/**
 * Chat Module - AI-powered conversational interface
 * Features:
 * - Streaming responses with forge animation
 * - Role-scoped context (when triggered from Journey section)
 * - Challenge mode toggle
 * - Session persistence
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    apiEndpoint: '/api/chat', // Will be Vercel function in production
    maxHistory: 20,
    sessionKey: 'fabian-chat-session'
  };

  // State
  const state = {
    isOpen: false,
    isLoading: false,
    roleContext: null,
    challengeMode: false,
    history: [],
    abortController: null
  };

  // DOM Elements (cached after init)
  let elements = {};

  /**
   * Initialize chat module
   */
  function init() {
    cacheElements();
    bindEvents();
    loadSession();
    console.log('[Chat] Initialized');
  }

  /**
   * Cache DOM elements for performance
   */
  function cacheElements() {
    elements = {
      modal: document.getElementById('chat-modal'),
      container: document.querySelector('.chat-container'),
      messages: document.getElementById('chat-messages'),
      form: document.getElementById('chat-form'),
      input: document.getElementById('chat-input'),
      closeBtn: document.getElementById('chat-close'),
      typing: document.getElementById('chat-typing'),
      context: document.getElementById('chat-context'),
      fab: document.getElementById('chat-fab'),
      triggerNav: document.getElementById('chat-trigger-nav'),
      triggerHero: document.getElementById('chat-trigger-hero'),
      modeButtons: document.querySelectorAll('.mode-btn'),
      suggestedQuestions: document.querySelectorAll('.suggested-q'),
      journeyAskButtons: document.querySelectorAll('.journey-ask-btn')
    };
  }

  /**
   * Bind all event listeners
   */
  function bindEvents() {
    // Open triggers
    elements.fab?.addEventListener('click', () => openChat());
    elements.triggerNav?.addEventListener('click', () => openChat());
    elements.triggerHero?.addEventListener('click', () => openChat());

    // Close triggers
    elements.closeBtn?.addEventListener('click', closeChat);
    elements.modal?.querySelector('.chat-modal-backdrop')?.addEventListener('click', closeChat);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.isOpen) closeChat();
    });

    // Form submission
    elements.form?.addEventListener('submit', handleSubmit);

    // Mode toggle
    elements.modeButtons?.forEach(btn => {
      btn.addEventListener('click', () => toggleMode(btn.dataset.mode));
    });

    // Suggested questions
    elements.suggestedQuestions?.forEach(btn => {
      btn.addEventListener('click', () => {
        sendMessage(btn.dataset.question);
      });
    });

    // Journey "Ask about this role" buttons
    elements.journeyAskButtons?.forEach(btn => {
      btn.addEventListener('click', () => {
        const role = btn.dataset.role;
        openChat(role);
      });
    });
  }

  /**
   * Open chat modal
   * @param {string|null} roleContext - Optional role ID to scope context
   */
  function openChat(roleContext = null) {
    state.roleContext = roleContext;
    state.isOpen = true;

    elements.modal.classList.add('open');
    elements.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Update context indicator
    if (roleContext) {
      const roleNames = {
        'teacher-tech-coordinator': 'Teaching Years',
        'sales-development': 'Early Sales',
        'tableau-ae': 'Tableau AE',
        'tableau-am': 'Tableau AM',
        'juniper-square': 'Juniper Square',
        'ai-builder': 'Building Now'
      };
      elements.context.textContent = roleNames[roleContext] || roleContext;
      elements.context.classList.add('role-scoped');
    } else {
      elements.context.textContent = 'General';
      elements.context.classList.remove('role-scoped');
    }

    // Focus input
    setTimeout(() => elements.input?.focus(), 100);

    // Trigger forge animation on container
    elements.container?.classList.add('forge-enter');
    setTimeout(() => elements.container?.classList.remove('forge-enter'), 600);
  }

  /**
   * Close chat modal
   */
  function closeChat() {
    state.isOpen = false;

    elements.modal.classList.remove('open');
    elements.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Abort any pending request
    if (state.abortController) {
      state.abortController.abort();
      state.abortController = null;
    }
  }

  /**
   * Toggle between helpful and challenge mode
   * @param {string} mode - 'helpful' or 'challenge'
   */
  function toggleMode(mode) {
    state.challengeMode = mode === 'challenge';

    elements.modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Update suggested questions based on mode
    updateSuggestedQuestions();
  }

  /**
   * Update suggested questions based on current mode
   */
  function updateSuggestedQuestions() {
    const questionsContainer = elements.messages.querySelector('.suggested-questions');
    if (!questionsContainer) return;

    const helpfulQuestions = [
      { q: "What makes you different from other career changers?", label: "What makes you different?" },
      { q: "Can you actually code?", label: "Can you actually code?" },
      { q: "What's your biggest weakness?", label: "Biggest weakness?" },
      { q: "What role are you looking for?", label: "What role do you want?" }
    ];

    const challengeQuestions = [
      { q: "What's your biggest professional failure?", label: "Biggest failure?" },
      { q: "What would your previous manager criticize about you?", label: "Manager criticism?" },
      { q: "Why should I NOT hire you?", label: "Why NOT hire you?" },
      { q: "What skill do you claim but haven't proven at scale?", label: "Unproven skills?" }
    ];

    const questions = state.challengeMode ? challengeQuestions : helpfulQuestions;

    questionsContainer.innerHTML = questions.map(({ q, label }) =>
      `<button class="suggested-q" data-question="${q}">${label}</button>`
    ).join('');

    // Re-bind events
    questionsContainer.querySelectorAll('.suggested-q').forEach(btn => {
      btn.addEventListener('click', () => sendMessage(btn.dataset.question));
    });
  }

  /**
   * Handle form submission
   * @param {Event} e
   */
  function handleSubmit(e) {
    e.preventDefault();
    const message = elements.input.value.trim();
    if (message && !state.isLoading) {
      sendMessage(message);
    }
  }

  /**
   * Send a message to the API
   * @param {string} message
   */
  async function sendMessage(message) {
    if (state.isLoading) return;

    // Hide welcome screen if visible
    const welcome = elements.messages.querySelector('.chat-welcome');
    if (welcome) welcome.style.display = 'none';

    // Add user message to UI
    appendMessage('user', message);
    elements.input.value = '';

    // Add to history
    state.history.push({ role: 'user', content: message });

    // Show loading
    state.isLoading = true;
    elements.typing.style.display = 'flex';
    elements.input.disabled = true;

    try {
      state.abortController = new AbortController();

      const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: state.history.slice(-CONFIG.maxHistory),
          roleContext: state.roleContext,
          challengeMode: state.challengeMode,
          stream: true
        }),
        signal: state.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let messageEl = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                assistantMessage += parsed.text;

                if (!messageEl) {
                  elements.typing.style.display = 'none';
                  messageEl = appendMessage('assistant', '', true);
                }

                messageEl.querySelector('.message-content').textContent = assistantMessage;
                scrollToBottom();
              }
            } catch (e) {
              // Ignore parsing errors for partial chunks
            }
          }
        }
      }

      // Finalize message
      if (messageEl) {
        messageEl.classList.remove('streaming');
        messageEl.classList.add('forged');
      }

      // Add to history
      state.history.push({ role: 'assistant', content: assistantMessage });
      saveSession();

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[Chat] Request aborted');
      } else {
        console.error('[Chat] Error:', error);
        appendMessage('assistant', 'Sorry, I encountered an error. Please try again.');
      }
    } finally {
      state.isLoading = false;
      elements.typing.style.display = 'none';
      elements.input.disabled = false;
      elements.input.focus();
      state.abortController = null;
    }
  }

  /**
   * Append a message to the chat
   * @param {string} role - 'user' or 'assistant'
   * @param {string} content
   * @param {boolean} streaming - Whether this is a streaming message
   * @returns {HTMLElement}
   */
  function appendMessage(role, content, streaming = false) {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${role}`;
    if (streaming) messageEl.classList.add('streaming');

    messageEl.innerHTML = `
      <div class="message-avatar">${role === 'user' ? '👤' : '💬'}</div>
      <div class="message-bubble">
        <div class="message-content">${escapeHtml(content)}</div>
      </div>
    `;

    elements.messages.appendChild(messageEl);
    scrollToBottom();

    // Trigger forge animation
    if (role === 'assistant' && !streaming) {
      messageEl.classList.add('forge-message');
    }

    return messageEl;
  }

  /**
   * Scroll chat to bottom
   */
  function scrollToBottom() {
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text
   * @returns {string}
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Save session to localStorage
   */
  function saveSession() {
    try {
      const sessionData = {
        history: state.history.slice(-CONFIG.maxHistory),
        timestamp: Date.now()
      };
      localStorage.setItem(CONFIG.sessionKey, JSON.stringify(sessionData));
    } catch (e) {
      console.warn('[Chat] Failed to save session:', e);
    }
  }

  /**
   * Load session from localStorage
   */
  function loadSession() {
    try {
      const saved = localStorage.getItem(CONFIG.sessionKey);
      if (saved) {
        const sessionData = JSON.parse(saved);
        // Only restore if less than 1 hour old
        if (Date.now() - sessionData.timestamp < 3600000) {
          state.history = sessionData.history || [];

          // Render existing messages
          if (state.history.length > 0) {
            const welcome = elements.messages.querySelector('.chat-welcome');
            if (welcome) welcome.style.display = 'none';

            state.history.forEach(msg => {
              appendMessage(msg.role, msg.content);
            });
          }
        } else {
          localStorage.removeItem(CONFIG.sessionKey);
        }
      }
    } catch (e) {
      console.warn('[Chat] Failed to load session:', e);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.FabianChat = { state, openChat, closeChat, sendMessage };

})();
