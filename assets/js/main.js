document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const sidebar = document.getElementById("sidebar");

  // Custom smooth scroll with ease
  function smoothScrollTo(targetPosition, duration = 1500) {
    const startPosition = window.scrollY || window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function easeInOutQuart(t) {
      return t < 0.5
        ? 8 * t * t * t * t
        : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }

    function animation(currentTime) {
      if (!startTime) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutQuart(progress);
      const scrollTo = startPosition + distance * ease;
      window.scrollTo(0, scrollTo);
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    }

    requestAnimationFrame(animation);
  }

  // Remove pre-load class after page load (sections only load once)
  window.addEventListener("load", () => {
    setTimeout(() => {
      body.classList.remove("is-preload");
    }, 100);
  });

  // IE Flexbox workaround (not needed in 2025 but kept for parity)
  const isIE = /MSIE|Trident/.test(window.navigator.userAgent);
  if (isIE) body.classList.add("is-ie");

  // // Activate .submit buttons inside forms
  // document.querySelectorAll("form .submit").forEach(btn => {
  //   btn.addEventListener("click", e => {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     btn.closest("form").submit();
  //   });
  // });

  // Sidebar behavior
  if (sidebar) {
    const links = sidebar.querySelectorAll("a[href^='#']");

    links.forEach(link => {
      link.classList.add("scrolly");

      link.addEventListener("click", e => {
        links.forEach(l => l.classList.remove("active"));
        link.classList.add("active", "active-locked");
      });

      const targetId = link.getAttribute("href");
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              targetSection.classList.remove("inactive");

              const locked = Array.from(links).some(l =>
                l.classList.contains("active-locked")
              );

              if (!locked) {
                links.forEach(l => l.classList.remove("active"));
                link.classList.add("active");
              } else if (link.classList.contains("active-locked")) {
                link.classList.remove("active-locked");
              }

              observer.unobserve(entry.target);
            }
          });
        }, {
          rootMargin: "-20% 0px -20% 0px",
          threshold: 0.1
        });

        observer.observe(targetSection);
      }
    });
  }

  // Smooth scrolling for .scrolly using custom smoothScrollTo
  document.querySelectorAll(".scrolly").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);
      if (target) {
        const offset = (window.innerWidth <= 1280 && window.innerWidth > 736 && sidebar)
          ? sidebar.offsetHeight
          : 0;

        const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;
        smoothScrollTo(targetPosition, 1500);
      }
    });
  });

  // Spotlights sections
  document.querySelectorAll(".spotlights > section").forEach(section => {
    section.classList.add("inactive");

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          section.classList.remove("inactive");
          observer.unobserve(entry.target); 
        }
      });
    }, {
      rootMargin: "-10% 0px -10% 0px",
      threshold: 0.1
    });

    observer.observe(section);

    // Handle background image
    const imageWrapper = section.querySelector(".image");
    const img = imageWrapper?.querySelector("img");
    if (imageWrapper && img) {
      imageWrapper.style.backgroundImage = `url(${img.getAttribute("src")})`;
      const pos = img.dataset.position;
      if (pos) imageWrapper.style.backgroundPosition = pos;
      img.style.display = "none";
    }
  });

  // Features sections. 
  document.querySelectorAll(".features").forEach(section => {
    section.classList.add("inactive");

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          section.classList.remove("inactive");
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: "-20% 0px -20% 0px",
      threshold: 0.1
    });

    observer.observe(section);
  });

  // --- Hamburger menu toggle ---
  const hamburger = document.getElementById('hamburgerBtn');
  if (hamburger) {
    hamburger.onclick = function() {
      document.body.classList.toggle('sidebar-open');
    };
  }
  // Optional: close sidebar when clicking outside
  document.addEventListener('click', function(e) {
    if (
      document.body.classList.contains('sidebar-open') &&
      !e.target.closest('#sidebar') &&
      !e.target.closest('.hamburger')
    ) {
      document.body.classList.remove('sidebar-open');
    }
  });

});

// --- Contact form ---

// Submit user message
document.addEventListener('DOMContentLoaded', () => { 
  const form = document.getElementById('contactForm');
  const formMessage = document.getElementById('formMessage');
  const submitButton = document.getElementById('submitButton');

  form.addEventListener('submit', async (e) => {
  e.preventDefault();

  submitButton.disabled = true;

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();
  const website = document.getElementById('website').value.trim();

  try {
    const response = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, message, website })
    });

    const data = await response.json();

    if (response.status === 200) {
      formMessage.style.color = 'green';
      formMessage.textContent = data.msg;
    } else if (response.status === 400) {
      formMessage.style.color = 'yellow';
      formMessage.textContent = data.msg;
    } else {
      formMessage.style.color = 'orange';
      formMessage.textContent = 'Something on the server is not working, please send message via email directly :)';
    }

    form.reset();

    } catch (err) {
      console.error('Error submitting form:', err);
      formMessage.style.color = 'red';
      formMessage.textContent = 'Failed to send message, please try again :(';
      form.reset();
    } finally {
      submitButton.disabled = false;
    }
  });
});
  
// --- Newsletter Modal ---

// Open modal
document.querySelector('.button.scrolly').addEventListener('click', function(event) {
  event.preventDefault(); 
  document.getElementById('newsletterModal').style.display = 'block';
});

// Close modal
document.querySelector('.close').addEventListener('click', function() {
  document.getElementById('newsletterModal').style.display = 'none';
});

// // OPTIONAL: Close modal if user clicks outside the content box
// window.addEventListener('click', function(event) {
//   const modal = document.getElementById('newsletterModal');
//   if (event.target === modal) {
//     modal.style.display = 'none';
//   }
// });

// Newsletter handling.
document.getElementById('newsletterForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const emailInput = document.getElementById('newsletterEmail');
  const formMessage = document.getElementById('newsletterMessage');
  const email = emailInput.value.trim();

  formMessage.textContent = '';
  submitButton.disabled = true;

  if (!email) {
    formMessage.textContent = 'Please enter an email address.';
    formMessage.style.color = 'red';
  }

  try {
    const response = await fetch('http://localhost:3000/api/newsletter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),  
    });

    const data = await response.json();

    if (response.status === 200) {
      formMessage.textContent = data.msgl
      formMessage.style.color = 'green';
      emailInput.value = '';
    } else {
      formMessage.textContent = data.msg || 'Something went wrong. Please try again later.';
      formMessage.style.color = 'orange';
    }
  } catch (err) {
    console.error('Newsletter error: ', err);
    formMessage.textContent = 'Could not subscribe. Please try again later or use the contact form below!';
    formMessage.style.color = 'red';
  }

  submitButton.disabled = false;
});
