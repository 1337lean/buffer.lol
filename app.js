document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const consoleBody = document.getElementById('console-body');
  const revealItems = document.querySelectorAll('.reveal-on-scroll');

  if (revealItems.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
    } else {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, {
        threshold: 0.16,
        rootMargin: '0px 0px -8% 0px'
      });

      revealItems.forEach((item) => revealObserver.observe(item));
    }
  }

  function addConsoleLine(text, className = 'system-line') {
    if (!consoleBody) return;

    const line = document.createElement('div');
    line.className = `console-line ${className}`;
    line.textContent = text;
    consoleBody.appendChild(line);

    if (consoleBody.children.length > 18) {
      consoleBody.removeChild(consoleBody.firstElementChild);
    }
  }

  const percentageCounter = document.getElementById('percentage-counter');
  const bufferFill = document.getElementById('buffer-fill');
  const statusMain = document.getElementById('status-main');
  const bufferButton = document.getElementById('buffer-button');
  const circumference = 327;
  const statuses = [
    'initializing probe',
    'fetching manifest',
    'sampling edge route',
    'measuring live latency',
    'buffer stable'
  ];
  let progress = 0;
  let loaderTimer;

  function renderProgress(value) {
    const rounded = Math.min(99, Math.floor(value));
    if (percentageCounter) percentageCounter.textContent = String(rounded).padStart(2, '0');
    if (bufferFill) bufferFill.style.strokeDashoffset = circumference - (circumference * rounded / 100);
    if (statusMain) {
      const index = Math.min(statuses.length - 1, Math.floor((rounded / 100) * statuses.length));
      statusMain.textContent = statuses[index];
    }
  }

  function runLoader(reset = false) {
    if (loaderTimer) window.clearTimeout(loaderTimer);
    if (reset) progress = 0;

    if (prefersReducedMotion) {
      progress = 87;
      renderProgress(progress);
      return;
    }

    const step = () => {
      const increment = progress < 58 ? Math.random() * 5 + 2 : Math.random() * 1.8 + 0.4;
      progress = Math.min(87, progress + increment);
      renderProgress(progress);

      if (progress < 87) {
        loaderTimer = window.setTimeout(step, progress < 58 ? 90 : 180);
      } else {
        addConsoleLine('[ok] stream buffer entered watch mode', 'success-line');
      }
    };

    step();
  }

  if (bufferButton) {
    bufferButton.addEventListener('click', () => {
      addConsoleLine('[sys] replaying stream buffer probe', 'system-line');
      runLoader(true);
    });
  }

  runLoader();

  const logPool = [
    ['[sys] hls manifest fetched in 96ms', 'system-line'],
    ['[ok] segment buffer holding at 2.4s', 'success-line'],
    ['[sys] cdn edge iad-04 responded in 41ms', 'system-line'],
    ['[warn] live latency drift detected: +320ms', 'warn-line'],
    ['[ok] upload transcode moved to packaging', 'success-line'],
    ['[sys] bitrate ladder switched to 1080p', 'system-line']
  ];

  function cycleLogs() {
    const [text, type] = logPool[Math.floor(Math.random() * logPool.length)];
    addConsoleLine(text, type);
    window.setTimeout(cycleLogs, Math.random() * 3200 + 2200);
  }

  if (!prefersReducedMotion) {
    window.setTimeout(cycleLogs, 1400);
  }

  const canvas = document.getElementById('particle-canvas');
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: Math.min(72, Math.floor(window.innerWidth / 18)) }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        size: Math.random() * 1.4 + 0.4
      }));
    }

    function drawParticles() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0) particle.x = window.innerWidth;
        if (particle.x > window.innerWidth) particle.x = 0;
        if (particle.y < 0) particle.y = window.innerHeight;
        if (particle.y > window.innerHeight) particle.y = 0;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(35, 199, 217, 0.22)';
        ctx.fill();
      });
      window.requestAnimationFrame(drawParticles);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    drawParticles();
  }

  const signupForm = document.getElementById('signup-form');
  const emailInput = document.getElementById('email-input');
  const feedback = document.getElementById('form-feedback');
  const submitButton = document.getElementById('submit-btn');
  const modal = document.getElementById('waitlist-modal');
  const modalOpenButton = document.getElementById('waitlist-modal-open');
  const modalForm = document.getElementById('modal-signup-form');
  const modalEmailInput = document.getElementById('modal-email-input');
  const modalFeedback = document.getElementById('modal-form-feedback');
  const modalSubmitButton = document.getElementById('modal-submit-btn');

  function setFeedback(target, message, type) {
    if (!target) return;
    target.textContent = message;
    target.classList.toggle('is-success', type === 'success');
    target.classList.toggle('is-error', type === 'error');
  }

  function redactEmail(email) {
    const [name, domain] = email.split('@');
    if (!domain) return '[redacted]';
    return `${name.slice(0, 2)}...@${domain}`;
  }

  async function registerEmail(email, endpoint) {
    if (endpoint) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'buffer.lol' })
      });

      if (!response.ok) throw new Error(`Signup failed with ${response.status}`);
      return 'remote';
    }

    const saved = JSON.parse(localStorage.getItem('buffer_lol_waitlist') || '[]');
    if (!saved.includes(email)) {
      saved.push(email);
      localStorage.setItem('buffer_lol_waitlist', JSON.stringify(saved));
    }
    return 'local';
  }

  function bindSignupForm(form, input, button, feedbackTarget) {
    if (!form || !input || !button) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = input.value.trim();
      if (!email) return;

      const label = button.querySelector('span');
      const originalLabel = label ? label.textContent : '';
      button.disabled = true;
      input.disabled = true;
      if (label) label.textContent = 'Requesting...';
      setFeedback(feedbackTarget, 'Saving your request...', '');

      try {
        const mode = await registerEmail(email, form.dataset.signupEndpoint.trim());
        input.value = '';
        addConsoleLine(`[ok] alpha request staged for ${redactEmail(email)}`, 'success-line');
        setFeedback(
          feedbackTarget,
          mode === 'remote'
            ? 'Request received. We will follow up when your alpha slot opens.'
            : 'Request saved in this preview. Connect a signup endpoint before launch.',
          'success'
        );
      } catch (error) {
        console.error(error);
        addConsoleLine('[warn] waitlist request failed', 'warn-line');
        setFeedback(feedbackTarget, 'Could not save that request. Try again in a moment.', 'error');
      } finally {
        button.disabled = false;
        input.disabled = false;
        if (label) label.textContent = originalLabel;
      }
    });
  }

  bindSignupForm(signupForm, emailInput, submitButton, feedback);
  bindSignupForm(modalForm, modalEmailInput, modalSubmitButton, modalFeedback);

  function openModal() {
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    modal.removeAttribute('inert');
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => {
      if (modalEmailInput) modalEmailInput.focus();
    }, 60);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('inert', '');
    document.body.style.overflow = '';
    if (modalOpenButton) modalOpenButton.focus();
  }

  if (modalOpenButton) {
    modalOpenButton.addEventListener('click', openModal);
  }

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target.closest('[data-modal-close]')) closeModal();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
});
