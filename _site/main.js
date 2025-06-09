// Main JavaScript for the blog
document.addEventListener('DOMContentLoaded', () => {
  initializeSearch();
  initializeTagFilter();
  initializeMobileMenu();
  initializeScrollEffects();

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Add active class to current nav link
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });

  // Highlight code blocks
  document.querySelectorAll('pre code').forEach(block => {
    if (window.hljs) {
      hljs.highlightElement(block);
    }
  });

  // Add copy button to code blocks
  document.querySelectorAll('pre').forEach(block => {
    if (!block.querySelector('.copy-button')) {
      const button = document.createElement('button');
      button.className = 'copy-button';
      button.textContent = 'Copy';
      
      button.addEventListener('click', async () => {
        const code = block.querySelector('code');
        if (code) {
          try {
            await navigator.clipboard.writeText(code.textContent);
            button.textContent = 'Copied!';
            setTimeout(() => {
              button.textContent = 'Copy';
            }, 2000);
          } catch (err) {
            console.error('Failed to copy text:', err);
          }
        }
      });
      
      block.style.position = 'relative';
      block.appendChild(button);
    }
  });

  // Lazy load images
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    if ('loading' in HTMLImageElement.prototype) {
      img.loading = 'lazy';
    } else {
      // Fallback for browsers that don't support lazy loading
      const lazyImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            observer.unobserve(img);
          }
        });
      });
      lazyImageObserver.observe(img);
    }
  });

  // Add scroll to top button
  const scrollToTopButton = document.createElement('button');
  scrollToTopButton.className = 'scroll-to-top';
  scrollToTopButton.innerHTML = '↑';
  scrollToTopButton.style.display = 'none';
  document.body.appendChild(scrollToTopButton);

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      scrollToTopButton.style.display = 'block';
    } else {
      scrollToTopButton.style.display = 'none';
    }
  });

  scrollToTopButton.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // Add styles for the new elements
  const style = document.createElement('style');
  style.textContent = `
    .copy-button {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      background: var(--light-gray);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .copy-button:hover {
      background: var(--border-color);
      color: var(--text-primary);
    }

    .scroll-to-top {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 40px;
      height: 40px;
      background: var(--accent-color);
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 1.25rem;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 1000;
      opacity: 0.8;
    }

    .scroll-to-top:hover {
      opacity: 1;
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      .scroll-to-top {
        bottom: 1rem;
        right: 1rem;
        width: 35px;
        height: 35px;
        font-size: 1rem;
      }
    }
  `;
  document.head.appendChild(style);
});

// Search functionality
function initializeSearch() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const postsList = document.getElementById('posts-list');
  
  if (!searchInput || !window.posts) return;
  
  let searchTimeout;
  
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const query = this.value.toLowerCase().trim();
      
      if (query.length === 0) {
        showAllPosts();
        hideSearchResults();
        return;
      }
      
      if (query.length < 2) return;
      
      const results = searchPosts(query);
      displaySearchResults(results);
    }, 300);
  });
  
  function searchPosts(query) {
    return window.posts.filter(post => {
      const titleMatch = post.title.toLowerCase().includes(query);
      const tagMatch = post.tags.some(tag => tag.toLowerCase().includes(query));
      const excerptMatch = post.excerpt.toLowerCase().includes(query);
      
      return titleMatch || tagMatch || excerptMatch;
    });
  }
  
  function displaySearchResults(results) {
    if (results.length === 0) {
      searchResults.innerHTML = '<p class="no-results">No posts found matching your search.</p>';
      searchResults.style.display = 'block';
      postsList.style.display = 'none';
      return;
    }
    
    const resultsHTML = results.map(post => `
      <article class="post-preview">
        <h2><a href="${post.url}">${post.title}</a></h2>
        <p class="post-meta">
          <time>${post.date}</time>
          ${post.tags.length > 0 ? `
            <span class="tags">
              ${post.tags.map(tag => `<span class="tag" data-tag="${tag}">${tag}</span>`).join('')}
            </span>
          ` : ''}
        </p>
        <p class="post-excerpt">${post.excerpt}</p>
        <a href="${post.url}" class="read-more">Read more →</a>
      </article>
    `).join('');
    
    searchResults.innerHTML = resultsHTML;
    searchResults.style.display = 'block';
    postsList.style.display = 'none';
  }
  
  function showAllPosts() {
    if (postsList) {
      postsList.style.display = 'block';
    }
  }
  
  function hideSearchResults() {
    if (searchResults) {
      searchResults.style.display = 'none';
    }
  }
}

// Tag filtering functionality
function initializeTagFilter() {
  const tagButtonsContainer = document.getElementById('tag-buttons');
  const postsList = document.getElementById('posts-list');
  
  if (!tagButtonsContainer || !window.posts) return;
  
  // Collect all unique tags
  const allTags = new Set();
  window.posts.forEach(post => {
    post.tags.forEach(tag => allTags.add(tag));
  });
  
  // Create tag filter buttons
  const sortedTags = Array.from(allTags).sort();
  
  // Add "All" button
  const allButton = document.createElement('button');
  allButton.className = 'tag-button active';
  allButton.textContent = 'All';
  allButton.addEventListener('click', () => filterByTag(null, allButton));
  tagButtonsContainer.appendChild(allButton);
  
  // Add individual tag buttons
  sortedTags.forEach(tag => {
    const button = document.createElement('button');
    button.className = 'tag-button';
    button.textContent = tag;
    button.addEventListener('click', () => filterByTag(tag, button));
    tagButtonsContainer.appendChild(button);
  });
  
  function filterByTag(selectedTag, clickedButton) {
    // Update active button
    document.querySelectorAll('.tag-button').forEach(btn => {
      btn.classList.remove('active');
    });
    clickedButton.classList.add('active');
    
    // Clear search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = '';
    }
    
    // Filter posts
    if (selectedTag === null) {
      showAllPosts();
    } else {
      const filteredPosts = window.posts.filter(post => 
        post.tags.includes(selectedTag)
      );
      displayFilteredPosts(filteredPosts);
    }
  }
  
  function displayFilteredPosts(posts) {
    const searchResults = document.getElementById('search-results');
    
    if (posts.length === 0) {
      searchResults.innerHTML = '<p class="no-results">No posts found with this tag.</p>';
      searchResults.style.display = 'block';
      postsList.style.display = 'none';
      return;
    }
    
    const postsHTML = posts.map(post => `
      <article class="post-preview">
        <h2><a href="${post.url}">${post.title}</a></h2>
        <p class="post-meta">
          <time>${post.date}</time>
          ${post.tags.length > 0 ? `
            <span class="tags">
              ${post.tags.map(tag => `<span class="tag" data-tag="${tag}">${tag}</span>`).join('')}
            </span>
          ` : ''}
        </p>
        <p class="post-excerpt">${post.excerpt}</p>
        <a href="${post.url}" class="read-more">Read more →</a>
      </article>
    `).join('');
    
    searchResults.innerHTML = postsHTML;
    searchResults.style.display = 'block';
    postsList.style.display = 'none';
  }
  
  function showAllPosts() {
    const searchResults = document.getElementById('search-results');
    if (searchResults) {
      searchResults.style.display = 'none';
    }
    if (postsList) {
      postsList.style.display = 'block';
    }
  }
}

// Mobile menu functionality
function initializeMobileMenu() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (!mobileMenuToggle || !navLinks) return;
  
  mobileMenuToggle.addEventListener('click', function() {
    navLinks.classList.toggle('mobile-open');
    this.classList.toggle('active');
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', function(event) {
    if (!mobileMenuToggle.contains(event.target) && !navLinks.contains(event.target)) {
      navLinks.classList.remove('mobile-open');
      mobileMenuToggle.classList.remove('active');
    }
  });
}

// Scroll effects
function initializeScrollEffects() {
  // Add scroll-based animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);
  
  // Observe post previews
  document.querySelectorAll('.post-preview').forEach(post => {
    observer.observe(post);
  });
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Copy to clipboard function (used in post layout)
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() {
      showCopySuccess();
    }).catch(function() {
      fallbackCopyToClipboard(text);
    });
  } else {
    fallbackCopyToClipboard(text);
  }
}

function fallbackCopyToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    showCopySuccess();
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
  
  document.body.removeChild(textArea);
}

function showCopySuccess() {
  // This function is called from the post layout
  const btn = event.target.closest('.copy-link');
  if (btn) {
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    btn.classList.add('copied');
    
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove('copied');
    }, 2000);
  }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  .post-preview {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  
  .post-preview.animate-in {
    opacity: 1;
    transform: translateY(0);
  }
  
  .no-results {
    text-align: center;
    color: var(--text-secondary);
    font-style: italic;
    padding: 2rem;
    background: var(--bg-secondary);
    border-radius: var(--border-radius);
  }
  
  @media (max-width: 768px) {
    .nav-links {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-top: none;
      flex-direction: column;
      padding: 1rem;
      transform: translateY(-100%);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }
    
    .nav-links.mobile-open {
      transform: translateY(0);
      opacity: 1;
      visibility: visible;
    }
    
    .mobile-menu-toggle.active span:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }
    
    .mobile-menu-toggle.active span:nth-child(2) {
      opacity: 0;
    }
    
    .mobile-menu-toggle.active span:nth-child(3) {
      transform: rotate(-45deg) translate(7px, -6px);
    }
  }
`;
document.head.appendChild(style);

