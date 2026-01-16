/**
 * Visual Effects
 * Cursor trail, particles, and interactive effects
 */

(function() {
    'use strict';

    /**
     * Cursor Trail Effect
     */
    class CursorTrail {
        constructor() {
            this.container = document.getElementById('cursor-trail');
            this.dots = [];
            this.maxDots = 20;
            this.mouseX = 0;
            this.mouseY = 0;

            this.init();
        }

        init() {
            // Create dot elements
            for (let i = 0; i < this.maxDots; i++) {
                const dot = document.createElement('div');
                dot.className = 'cursor-dot';
                this.container.appendChild(dot);
                this.dots.push({
                    element: dot,
                    x: 0,
                    y: 0
                });
            }

            // Track mouse position
            document.addEventListener('mousemove', (e) => {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
            });

            // Start animation
            this.animate();
        }

        animate() {
            let x = this.mouseX;
            let y = this.mouseY;

            this.dots.forEach((dot, index) => {
                const nextDot = this.dots[index + 1] || this.dots[0];

                dot.x = x;
                dot.y = y;

                dot.element.style.left = `${dot.x}px`;
                dot.element.style.top = `${dot.y}px`;
                dot.element.style.opacity = (1 - index / this.maxDots) * 0.5;
                dot.element.style.transform = `translate(-50%, -50%) scale(${1 - index / this.maxDots})`;

                x += (nextDot.x - dot.x) * 0.3;
                y += (nextDot.y - dot.y) * 0.3;
            });

            requestAnimationFrame(() => this.animate());
        }
    }

    /**
     * Floating Particles
     */
    class Particles {
        constructor() {
            this.container = document.getElementById('particles');
            this.particleCount = 30;

            this.init();
        }

        init() {
            for (let i = 0; i < this.particleCount; i++) {
                this.createParticle();
            }
        }

        createParticle() {
            const particle = document.createElement('div');
            particle.className = 'particle';

            // Random properties
            const size = Math.random() * 4 + 2;
            const x = Math.random() * 100;
            const duration = Math.random() * 20 + 20;
            const delay = Math.random() * 20;

            // Alternate colors
            const isCyan = Math.random() > 0.5;
            particle.style.background = isCyan
                ? 'var(--cyan)'
                : 'var(--magenta)';
            particle.style.boxShadow = isCyan
                ? '0 0 10px var(--cyan-glow)'
                : '0 0 10px var(--magenta-glow)';

            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${x}%`;
            particle.style.animation = `particleFloat ${duration}s linear ${delay}s infinite`;

            this.container.appendChild(particle);
        }
    }

    /**
     * Avatar Interaction
     */
    class AvatarInteraction {
        constructor() {
            this.avatar = document.getElementById('avatar');
            this.frame = this.avatar?.querySelector('.avatar-frame');

            if (this.avatar && this.frame) {
                this.init();
            }
        }

        init() {
            this.avatar.addEventListener('click', () => this.handleClick());
        }

        handleClick() {
            // Spin animation
            this.frame.classList.add('avatar-spin');
            setTimeout(() => {
                this.frame.classList.remove('avatar-spin');
            }, 600);

            // Create confetti
            this.createConfetti();
        }

        createConfetti() {
            const rect = this.avatar.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            for (let i = 0; i < 20; i++) {
                const confetti = document.createElement('div');
                confetti.className = `confetti ${Math.random() > 0.5 ? 'confetti-cyan' : 'confetti-magenta'}`;

                // Random position around avatar
                const angle = (Math.PI * 2 * i) / 20;
                const distance = 50 + Math.random() * 50;
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;

                confetti.style.left = `${x}px`;
                confetti.style.top = `${y}px`;
                confetti.style.animation = `confettiFall ${0.5 + Math.random() * 0.5}s ease-out forwards`;

                document.body.appendChild(confetti);

                // Remove after animation
                setTimeout(() => confetti.remove(), 1000);
            }
        }
    }

    /**
     * Scroll Reveal
     */
    class ScrollReveal {
        constructor() {
            this.elements = document.querySelectorAll('.section-title, .project-card, .blog-card, .stat-card, .social-link');
            this.init();
        }

        init() {
            // Add reveal class to elements
            this.elements.forEach(el => {
                el.classList.add('reveal');
            });

            // Create intersection observer
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('active');
                        }
                    });
                },
                {
                    threshold: 0.1,
                    rootMargin: '0px 0px -50px 0px'
                }
            );

            this.elements.forEach(el => observer.observe(el));
        }
    }

    /**
     * Staggered Grid Animation
     */
    class StaggeredGrid {
        constructor() {
            this.grids = document.querySelectorAll('.projects-grid, .blog-grid, .social-links');
            this.init();
        }

        init() {
            this.grids.forEach(grid => {
                grid.classList.add('stagger-children');
            });

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('active');
                        }
                    });
                },
                {
                    threshold: 0.2
                }
            );

            this.grids.forEach(grid => observer.observe(grid));
        }
    }

    // Initialize effects when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        // Only enable cursor trail on non-touch devices
        if (!('ontouchstart' in window)) {
            new CursorTrail();
        }

        new Particles();
        new AvatarInteraction();
        new ScrollReveal();
        new StaggeredGrid();
    });
})();
