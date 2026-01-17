/**
 * Main JavaScript
 * Navigation, theme toggle, and general functionality
 */

(function() {
    'use strict';

    /**
     * Navigation
     */
    class Navigation {
        constructor() {
            this.nav = document.querySelector('.nav');
            this.scrollThreshold = 100;

            this.init();
        }

        init() {
            // Handle scroll
            window.addEventListener('scroll', () => this.handleScroll());

            // Handle smooth scroll for anchor links
            document.querySelectorAll('a[href^="#"]').forEach(link => {
                link.addEventListener('click', (e) => this.handleAnchorClick(e));
            });
        }

        handleScroll() {
            if (window.scrollY > this.scrollThreshold) {
                this.nav.classList.add('scrolled');
            } else {
                this.nav.classList.remove('scrolled');
            }
        }

        handleAnchorClick(e) {
            const href = e.currentTarget.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    }

    /**
     * Theme Toggle
     */
    class ThemeToggle {
        constructor() {
            this.toggle = document.getElementById('theme-toggle');
            this.storageKey = 'theme-preference';

            this.init();
        }

        init() {
            // Load saved preference or detect system preference
            const savedTheme = localStorage.getItem(this.storageKey);
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

            if (savedTheme) {
                this.setTheme(savedTheme);
            } else if (!systemDark) {
                this.setTheme('light');
            }

            // Handle toggle click
            this.toggle?.addEventListener('click', () => this.toggleTheme());

            // Listen for system preference changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem(this.storageKey)) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }

        setTheme(theme) {
            if (theme === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        }

        toggleTheme() {
            const isDark = !document.documentElement.hasAttribute('data-theme');

            if (isDark) {
                this.setTheme('light');
                localStorage.setItem(this.storageKey, 'light');
            } else {
                this.setTheme('dark');
                localStorage.setItem(this.storageKey, 'dark');
            }
        }
    }

    /**
     * Style Toggle (Forge vs Letterpress)
     */
    class StyleToggle {
        constructor() {
            this.toggle = document.getElementById('style-toggle');
            this.icon = this.toggle?.querySelector('.style-icon');
            this.storageKey = 'style-preference';
            this.styles = {
                forge: { icon: '🔨', title: 'Forge Style (current)' },
                letterpress: { icon: '📜', title: 'Letterpress Style (current)' }
            };

            this.init();
        }

        init() {
            // Load saved preference (default to letterpress for preview)
            const savedStyle = localStorage.getItem(this.storageKey) || 'letterpress';
            this.setStyle(savedStyle);

            // Handle toggle click
            this.toggle?.addEventListener('click', () => this.toggleStyle());
        }

        setStyle(style) {
            const body = document.body;

            if (style === 'letterpress') {
                body.classList.add('letterpress-theme');
                body.classList.remove('forge-theme');
            } else {
                body.classList.add('forge-theme');
                body.classList.remove('letterpress-theme');
            }

            // Update icon
            if (this.icon) {
                this.icon.textContent = this.styles[style].icon;
            }
            if (this.toggle) {
                this.toggle.title = this.styles[style].title;
            }

            this.currentStyle = style;
        }

        toggleStyle() {
            const newStyle = this.currentStyle === 'forge' ? 'letterpress' : 'forge';
            this.setStyle(newStyle);
            localStorage.setItem(this.storageKey, newStyle);

            // Trigger re-animation for visible elements
            document.querySelectorAll('.section-title, .project-card, .skill-item, .review-card').forEach(el => {
                el.style.animation = 'none';
                el.offsetHeight; // Trigger reflow
                el.style.animation = '';
            });
        }
    }

    /**
     * Back to Top Button
     */
    class BackToTop {
        constructor() {
            this.button = document.getElementById('back-to-top');
            this.showThreshold = 500;

            this.init();
        }

        init() {
            // Handle scroll visibility
            window.addEventListener('scroll', () => this.handleScroll());

            // Handle click
            this.button?.addEventListener('click', () => this.scrollToTop());
        }

        handleScroll() {
            if (window.scrollY > this.showThreshold) {
                this.button?.classList.add('visible');
            } else {
                this.button?.classList.remove('visible');
            }
        }

        scrollToTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Blog Posts Loader
     * Loads blog posts from blog/posts.json
     */
    class BlogLoader {
        constructor() {
            this.container = document.getElementById('blog-posts');
            this.postsUrl = 'blog/posts.json';
            this.maxPosts = 3;

            this.init();
        }

        async init() {
            try {
                const response = await fetch(this.postsUrl);
                if (!response.ok) return;

                const posts = await response.json();
                this.renderPosts(posts.slice(0, this.maxPosts));
            } catch (error) {
                // Keep placeholder content if posts.json doesn't exist
                console.log('Blog posts not loaded:', error.message);
            }
        }

        renderPosts(posts) {
            if (!posts.length || !this.container) return;

            this.container.innerHTML = posts.map(post => `
                <article class="blog-card">
                    <div class="blog-meta">
                        <span class="blog-date">${this.formatDate(post.date)}</span>
                        <span class="blog-read-time">${post.readTime}</span>
                    </div>
                    <h3 class="blog-title">${post.title}</h3>
                    <p class="blog-excerpt">${post.excerpt}</p>
                    <a href="blog/${post.slug}.html" class="blog-link">Read →</a>
                </article>
            `).join('');

            // Re-apply reveal animation
            this.container.querySelectorAll('.blog-card').forEach(card => {
                card.classList.add('reveal');
                setTimeout(() => card.classList.add('active'), 100);
            });
        }

        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }

    /**
     * Typing Effect
     * Optional: adds typing animation to hero subtitle
     */
    class TypingEffect {
        constructor(element, text, speed = 50) {
            this.element = element;
            this.text = text;
            this.speed = speed;
            this.index = 0;
        }

        start() {
            this.element.textContent = '';
            this.type();
        }

        type() {
            if (this.index < this.text.length) {
                this.element.textContent += this.text.charAt(this.index);
                this.index++;
                setTimeout(() => this.type(), this.speed);
            }
        }
    }

    /**
     * Project Card Hover Effect
     * Adds tilt effect on hover
     */
    class ProjectTilt {
        constructor() {
            this.cards = document.querySelectorAll('.project-card');
            this.init();
        }

        init() {
            this.cards.forEach(card => {
                card.addEventListener('mousemove', (e) => this.handleMove(e, card));
                card.addEventListener('mouseleave', (e) => this.handleLeave(e, card));
            });
        }

        handleMove(e, card) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        }

        handleLeave(e, card) {
            card.style.transform = '';
        }
    }

    // Initialize all components
    document.addEventListener('DOMContentLoaded', () => {
        new Navigation();
        new ThemeToggle();
        new StyleToggle();
        new BackToTop();
        new BlogLoader();
        new ProjectTilt();
    });
})();
