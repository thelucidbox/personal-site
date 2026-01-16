/**
 * Page Loader
 * Handles the initial loading animation and page transitions
 */

(function() {
    'use strict';

    const loader = document.getElementById('page-loader');

    // Hide loader when page is fully loaded
    function hideLoader() {
        document.body.classList.remove('loading');
        loader.classList.add('hidden');

        // Remove from DOM after animation
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }

    // Show loader initially
    document.body.classList.add('loading');

    // Wait for all resources to load
    window.addEventListener('load', () => {
        // Minimum display time for loader (so it doesn't flash)
        setTimeout(hideLoader, 1500);
    });

    // Fallback: hide loader after max wait time
    setTimeout(hideLoader, 4000);

    /**
     * Page Transition Handler
     * Shows loader when navigating to internal links
     */
    function handlePageTransition(e) {
        const link = e.currentTarget;
        const href = link.getAttribute('href');

        // Skip for external links, anchors, and special links
        if (!href ||
            href.startsWith('#') ||
            href.startsWith('http') ||
            href.startsWith('mailto:') ||
            link.hasAttribute('target')) {
            return;
        }

        e.preventDefault();

        // Show transition loader
        loader.style.display = 'flex';
        loader.classList.remove('hidden');
        document.body.classList.add('loading');

        // Navigate after animation
        setTimeout(() => {
            window.location.href = href;
        }, 500);
    }

    // Attach transition handler to internal links
    document.addEventListener('DOMContentLoaded', () => {
        const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="./"]');
        internalLinks.forEach(link => {
            link.addEventListener('click', handlePageTransition);
        });
    });

    // Handle browser back/forward navigation
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            hideLoader();
        }
    });
})();
