/*
 * util.js (vanilla JavaScript version)
 * Refactored to remove jQuery dependencies
 */

/**
 * Generate an indented list of links from a nav
 * @param {HTMLElement} navElement - The nav element to extract links from
 * @returns {string} - HTML string of links
 */
function navList(navElement) {
  const links = navElement.querySelectorAll('a');
  const result = [];

  links.forEach(link => {
    const indent = Math.max(0, link.closest('li') ? link.closest('li').parentNode.querySelectorAll('li').length - 1 : 0);
    const href = link.getAttribute('href') || '';
    const target = link.getAttribute('target') || '';

    result.push(`
      <a class="link depth-${indent}"${target ? ` target="${target}"` : ''}${href ? ` href="${href}"` : ''}>
        <span class="indent-${indent}"></span>
        ${link.textContent}
      </a>`);
  });

  return result.join('');
}

/**
 * Apply panel behavior to a single element
 * @param {HTMLElement} element - The panel element
 * @param {Object} config - Configuration options
 */
function panel(element, config = {}) {
  const body = document.body;
  const defaultConfig = {
    delay: 0,
    hideOnClick: false,
    hideOnEscape: false,
    hideOnSwipe: false,
    resetScroll: false,
    resetForms: false,
    side: null,
    target: element,
    visibleClass: 'visible'
  };

  config = { ...defaultConfig, ...config };

  function hidePanel(event) {
    if (!config.target.classList.contains(config.visibleClass)) return;
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    config.target.classList.remove(config.visibleClass);
    setTimeout(() => {
      if (config.resetScroll) element.scrollTop = 0;
      if (config.resetForms) {
        element.querySelectorAll('form').forEach(form => form.reset());
      }
    }, config.delay);
  }

  // Hide on link click
  if (config.hideOnClick) {
    element.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', event => {
        const href = a.getAttribute('href');
        const target = a.getAttribute('target');
        if (!href || href === '#' || href === `#${element.id}`) return;
        event.preventDefault();
        hidePanel();
        setTimeout(() => {
          if (target === '_blank') window.open(href);
          else window.location.href = href;
        }, config.delay + 10);
      });
    });
  }

  // Swipe handling
  let touchStartX = null;
  let touchStartY = null;

  element.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].pageX;
    touchStartY = e.touches[0].pageY;
  });

  element.addEventListener('touchmove', e => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = touchStartX - e.touches[0].pageX;
    const diffY = touchStartY - e.touches[0].pageY;

    const boundary = 20;
    const delta = 50;
    let result = false;

    if (config.hideOnSwipe) {
      switch (config.side) {
        case 'left': result = Math.abs(diffY) < boundary && diffX > delta; break;
        case 'right': result = Math.abs(diffY) < boundary && diffX < -delta; break;
        case 'top': result = Math.abs(diffX) < boundary && diffY > delta; break;
        case 'bottom': result = Math.abs(diffX) < boundary && diffY < -delta; break;
      }
      if (result) {
        hidePanel();
        touchStartX = touchStartY = null;
        return;
      }
    }

    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const height = element.offsetHeight;
    if ((scrollTop <= 0 && diffY < 0) || (scrollTop + height >= scrollHeight && diffY > 0)) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  // Prevent bubbling inside panel
  ['click', 'touchend', 'touchstart', 'touchmove'].forEach(eventType => {
    element.addEventListener(eventType, e => e.stopPropagation());
  });

  // Toggle on link click
  body.addEventListener('click', e => {
    if (e.target.matches(`a[href="#${element.id}"]`)) {
      e.preventDefault();
      e.stopPropagation();
      config.target.classList.toggle(config.visibleClass);
    } else {
      hidePanel(e);
    }
  });

  // Escape key
  if (config.hideOnEscape) {
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') hidePanel(e);
    });
  }

  // Public hide method
  element._hide = hidePanel;

  return element;
}

/**
 * Placeholder polyfill (not needed in modern browsers, but here for legacy support)
 * @param {HTMLFormElement} form
 */
function applyPlaceholders(form) {
  if ('placeholder' in document.createElement('input')) return; // Native support

  form.querySelectorAll('input[type="text"], textarea').forEach(el => {
    if (!el.value || el.value === el.placeholder) {
      el.classList.add('polyfill-placeholder');
      el.value = el.placeholder;
    }

    el.addEventListener('blur', () => {
      if (!el.value) {
        el.classList.add('polyfill-placeholder');
        el.value = el.placeholder;
      }
    });

    el.addEventListener('focus', () => {
      if (el.value === el.placeholder) {
        el.classList.remove('polyfill-placeholder');
        el.value = '';
      }
    });
  });
}

/**
 * Prioritize DOM elements conditionally
 * @param {NodeList|HTMLElement[]} elements - Elements to prioritize
 * @param {boolean} condition - If true, move to top of parent, else restore original position
 */
function prioritize(elements, condition) {
  const key = '__prioritize';

  elements.forEach(el => {
    const parent = el.parentElement;
    if (!parent) return;

    if (!el.dataset[key]) {
      if (!condition) return;

      const prev = el.previousElementSibling;
      if (!prev) return;

      el.dataset[key] = prev;
      parent.insertBefore(el, parent.firstChild);
    } else {
      if (condition) return;

      const placeholder = el.dataset[key];
      if (placeholder && placeholder.nextSibling) {
        parent.insertBefore(el, placeholder.nextSibling);
      } else {
        parent.appendChild(el);
      }

      delete el.dataset[key];
    }
  });
}
