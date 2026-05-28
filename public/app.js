function initBufferLol() {
  document.documentElement.classList.add('js-enhanced');

  const SIMULATE_PROBE_LABEL = 'Simulate probe';
  const landingRoot = document.getElementById('main-content');
  const isLandingPage = Boolean(document.querySelector('.hero-section') || document.getElementById('probe-form'));

  if (!isLandingPage) {
    revealCurrentLandingContent();
    return;
  }

  if (landingRoot?.dataset.bufferLolInitialized === 'true') {
    revealCurrentLandingContent();
    return;
  }

  if (landingRoot) landingRoot.dataset.bufferLolInitialized = 'true';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const consoleBody = document.getElementById('console-body');
  const revealItems = document.querySelectorAll('.reveal-on-scroll');
  const animatedCountUps = new WeakSet();

  function formatCountUpValue(element, value) {
    const decimals = Number(element.dataset.countDecimals || 0);
    const prefix = element.dataset.countPrefix || '';
    const suffix = element.dataset.countSuffix || '';
    return `${prefix}${value.toFixed(decimals)}${suffix}`;
  }

  function animateCountUps(scope) {
    const counters = scope.querySelectorAll ? scope.querySelectorAll('[data-count-target]') : [];
    counters.forEach((counter) => {
      if (animatedCountUps.has(counter)) return;
      animatedCountUps.add(counter);

      const target = Number(counter.dataset.countTarget);
      if (!Number.isFinite(target)) return;

      if (prefersReducedMotion) {
        counter.textContent = formatCountUpValue(counter, target);
        return;
      }

      const startTime = performance.now();
      const duration = 950;

      function tick(now) {
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        counter.textContent = formatCountUpValue(counter, target * eased);
        if (progress < 1) window.requestAnimationFrame(tick);
      }

      window.requestAnimationFrame(tick);
    });
  }

  if (revealItems.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => {
        item.classList.add('is-visible');
        animateCountUps(item);
      });
    } else {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          animateCountUps(entry.target);
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
    line.className = `console-line ${className} is-new`;
    line.textContent = text;
    consoleBody.appendChild(line);
    window.setTimeout(() => line.classList.remove('is-new'), 360);

    if (consoleBody.children.length > 18) {
      consoleBody.removeChild(consoleBody.firstElementChild);
    }
  }

  const STORAGE_KEYS = {
    waitlist: 'buffer_lol_waitlist',
    probes: 'buffer_lol_probe_runs',
    statuses: 'buffer_lol_admin_statuses'
  };

  function readJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch (error) {
      console.warn(`Could not read ${key}`, error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }

  function normalizeWaitlistEntry(entry, index) {
    if (typeof entry === 'string') {
      return {
        id: `legacy_${index}_${entry}`,
        email: entry,
        source: 'public preview',
        createdAt: new Date(Date.now() - index * 86400000).toISOString(),
        status: 'new'
      };
    }

    return {
      id: entry.id || `signup_${index}_${entry.email}`,
      email: entry.email,
      source: entry.source || 'public preview',
      createdAt: entry.createdAt || new Date().toISOString(),
      status: entry.status || 'new'
    };
  }

  function getWaitlist() {
    const statuses = readJSON(STORAGE_KEYS.statuses, {});
    return readJSON(STORAGE_KEYS.waitlist, []).map(normalizeWaitlistEntry).map((entry) => ({
      ...entry,
      status: statuses[entry.email] || entry.status
    }));
  }

  function setWaitlistStatus(email, status) {
    const statuses = readJSON(STORAGE_KEYS.statuses, {});
    statuses[email] = status;
    writeJSON(STORAGE_KEYS.statuses, statuses);
  }

  function getProbeRuns() {
    return readJSON(STORAGE_KEYS.probes, []);
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
    ['[ok] DASH manifest variants sampled', 'success-line'],
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

  const probeForm = document.getElementById('probe-form');
  const probeUrl = document.getElementById('probe-url');
  const probeType = document.getElementById('probe-type');
  const probeRegion = document.getElementById('probe-region');
  const probeSubmit = document.getElementById('probe-submit');
  const probeStatusText = document.getElementById('probe-status-text');
  const probeStatusPill = document.getElementById('probe-status-pill');
  const probeStages = document.querySelectorAll('#probe-stages span');
  const probeMetrics = document.getElementById('probe-metrics');
  const probeLog = document.getElementById('probe-log');
  const reportTitle = document.getElementById('report-title');
  const reportStatus = document.getElementById('report-status');
  const reportChecks = document.getElementById('report-checks');
  const reportActions = document.getElementById('report-actions-list');
  const copyReport = document.getElementById('copy-report');
  const copyFeedback = document.getElementById('copy-feedback');
  let latestReportText = '';

  function addProbeLine(text, className = 'system-line') {
    if (!probeLog) return;
    const line = document.createElement('div');
    line.className = `console-line ${className} is-new`;
    line.textContent = text;
    probeLog.appendChild(line);
    window.setTimeout(() => line.classList.remove('is-new'), 360);
    probeLog.scrollTop = probeLog.scrollHeight;
  }

  function randomBetween(min, max, decimals = 0) {
    const value = Math.random() * (max - min) + min;
    return Number(value.toFixed(decimals));
  }

  function buildProbeRun() {
    const type = probeType ? probeType.value : 'HLS';
    const region = probeRegion ? probeRegion.value : 'US East';
    const metrics = {
      startupDelay: randomBetween(0.8, 5.9, 1),
      rebufferCount: Math.floor(randomBetween(0, 4.8)),
      liveLatency: Math.floor(randomBetween(240, 920)),
      manifestFetch: Math.floor(randomBetween(42, 280)),
      cdnResponse: Math.floor(randomBetween(28, 190)),
      bitrateVariants: Math.floor(randomBetween(3, 9.9))
    };

    let status = 'pass';
    let mainWarning = 'No major playback risk detected';
    if (metrics.startupDelay > 4.2 || metrics.rebufferCount >= 3 || metrics.cdnResponse > 155) {
      status = 'fail';
      mainWarning = metrics.cdnResponse > 155 ? 'CDN edge response degraded' : 'Playback stability risk detected';
    } else if (metrics.startupDelay > 2.8 || metrics.rebufferCount > 0 || metrics.liveLatency > 620 || metrics.manifestFetch > 180) {
      status = 'warn';
      mainWarning = metrics.liveLatency > 620 ? 'Live latency drift detected' : 'Startup buffer pressure detected';
    }

    return {
      id: `probe_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      url: probeUrl ? probeUrl.value.trim() : '',
      type,
      region,
      status,
      durationMs: Math.floor(randomBetween(2600, 5600)),
      metrics,
      mainWarning
    };
  }

  function renderProbeMetrics(run) {
    if (!probeMetrics) return;
    const values = [
      `${run.metrics.startupDelay.toFixed(1)}s`,
      String(run.metrics.rebufferCount),
      run.metrics.liveLatency ? `${run.metrics.liveLatency}ms` : 'n/a',
      `${run.metrics.manifestFetch}ms`,
      `${run.metrics.cdnResponse}ms`,
      String(run.metrics.bitrateVariants)
    ];
    probeMetrics.querySelectorAll('strong').forEach((item, index) => {
      item.textContent = values[index] || '--';
    });
  }

  function setStatusPill(element, status, label = status) {
    if (!element) return;
    element.textContent = label;
    element.className = `status-pill status-${status}`;
  }

  function renderReport(run) {
    if (!run || !reportTitle || !reportChecks || !reportActions) return;
    const checks = [
      ['pass', `${run.metrics.bitrateVariants} bitrate variants detected`],
      [run.metrics.manifestFetch > 180 ? 'warn' : 'pass', `Manifest fetched in ${run.metrics.manifestFetch}ms`],
      [run.metrics.cdnResponse > 155 ? 'fail' : run.metrics.cdnResponse > 110 ? 'warn' : 'pass', `CDN edge responded in ${run.metrics.cdnResponse}ms`],
      [run.metrics.rebufferCount > 2 ? 'fail' : run.metrics.rebufferCount > 0 ? 'warn' : 'pass', `${run.metrics.rebufferCount} rebuffer events sampled`]
    ];
    const actions = run.status === 'pass'
      ? ['Keep this route in baseline monitoring.', 'Compare against another region before launch.']
      : run.status === 'warn'
        ? ['Re-run from the weakest region.', 'Inspect CDN cache status and manifest freshness.']
        : ['Pause rollout for this route.', 'Check origin response time and segment availability.'];

    reportTitle.textContent = run.mainWarning;
    setStatusPill(reportStatus, run.status);
    reportChecks.innerHTML = checks.map(([state, text]) => `<li><span class="${state}">${state}</span>${text}</li>`).join('');
    reportActions.innerHTML = `<strong>Recommended next actions</strong>${actions.map((item) => `<p>${item}</p>`).join('')}`;
    latestReportText = [
      `buffer.lol sample report (${run.status.toUpperCase()})`,
      `${run.type} probe from ${run.region}`,
      `URL: ${run.url}`,
      `Finding: ${run.mainWarning}`,
      `Startup: ${run.metrics.startupDelay.toFixed(1)}s, Rebuffers: ${run.metrics.rebufferCount}, CDN: ${run.metrics.cdnResponse}ms`,
      `Next: ${actions.join(' ')}`
    ].join('\n');
  }

  if (probeForm) {
    probeForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!probeUrl || !probeUrl.value.trim()) return;

      const label = probeSubmit ? probeSubmit.querySelector('span') : null;
      if (probeSubmit) probeSubmit.disabled = true;
      if (label) label.textContent = 'Running...';
      if (probeStatusText) probeStatusText.textContent = 'running';
      setStatusPill(probeStatusPill, 'idle', 'running');
      if (probeLog) probeLog.innerHTML = '';
      probeStages.forEach((stage) => stage.classList.remove('is-active', 'is-complete'));

      const stageMessages = [
        ['[sys] fetching manifest and rendition list', 'system-line'],
        ['[sys] sampling CDN edge response from selected region', 'system-line'],
        ['[sys] measuring startup delay and live edge distance', 'system-line'],
        ['[sys] checking buffer stability under playback pressure', 'system-line']
      ];

      stageMessages.forEach(([message, className], index) => {
        window.setTimeout(() => {
          probeStages.forEach((stage, stageIndex) => {
            stage.classList.toggle('is-active', stageIndex === index);
            if (stageIndex < index) stage.classList.add('is-complete');
          });
          addProbeLine(message, className);
        }, prefersReducedMotion ? 0 : index * 620);
      });

      window.setTimeout(() => {
        const run = buildProbeRun();
        const saved = getProbeRuns();
        saved.unshift(run);
        writeJSON(STORAGE_KEYS.probes, saved.slice(0, 30));

        probeStages.forEach((stage) => {
          stage.classList.remove('is-active');
          stage.classList.add('is-complete');
        });
        renderProbeMetrics(run);
        if (probeStatusText) probeStatusText.textContent = run.mainWarning;
        setStatusPill(probeStatusPill, run.status);
        const statusLineClass = run.status === 'pass' ? 'success-line' : run.status === 'fail' ? 'fail-line' : 'warn-line';
        addProbeLine(`[${run.status}] ${run.mainWarning}`, statusLineClass);
        addConsoleLine(`[${run.status}] sample ${run.type.toLowerCase()} probe saved for ${run.region}`, statusLineClass);
        renderReport(run);
        if (probeSubmit) probeSubmit.disabled = false;
        if (label) label.textContent = SIMULATE_PROBE_LABEL;
      }, prefersReducedMotion ? 60 : 3000);
    });
  }

  if (copyReport) {
    copyReport.addEventListener('click', async () => {
      const text = latestReportText || 'Simulate a sample probe to generate a buffer.lol report preview.';
      try {
        if (!navigator.clipboard) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(text);
        setFeedback(copyFeedback, 'Report copied.', 'success');
      } catch (error) {
        setFeedback(copyFeedback, text, 'success');
      }
    });
  }

  const useCases = {
    live: {
      title: 'Live streaming',
      copy: 'Watch live edge distance, segment health, player startup, and drift before the audience sees the stall.',
      metrics: ['Live latency', 'Manifest age', 'Rebuffer count', 'CDN edge response'],
      failures: ['Stale manifest', 'Latency drift', 'Slow first segment']
    },
    manifests: {
      title: 'Manifest health',
      copy: 'Check public HLS and DASH manifests for delivery timing, redirects, and segment availability.',
      metrics: ['Manifest fetch', 'Redirect safety', 'Segment samples', 'Variant availability'],
      failures: ['Unsafe redirect', 'Oversized manifest', 'Missing segment']
    },
    courses: {
      title: 'Course platforms',
      copy: 'Check lesson startup and regional delivery before students run into broken playback.',
      metrics: ['Startup delay', 'Manifest response', 'Segment health', 'Variant availability'],
      failures: ['Slow lesson start', 'Caption mismatch', 'Expired asset URL']
    },
    creator: {
      title: 'Creator tools',
      copy: 'Preview stream delivery health before creators share a live or scheduled event with their audience.',
      metrics: ['Manifest response', 'Playback status', 'Live latency', 'Encoding ladder'],
      failures: ['Slow manifest', 'Segment missing', 'Ladder gap']
    },
    libraries: {
      title: 'Internal media libraries',
      copy: 'Spot delivery regressions across archived assets, private links, and internal training videos.',
      metrics: ['Asset response', 'Access status', 'CDN cache state', 'Playback checks'],
      failures: ['Expired token', 'Cache miss', 'Broken rendition']
    }
  };

  const tabButtons = document.querySelectorAll('.tab-button');
  const useCaseTitle = document.getElementById('use-case-title');
  const useCaseCopy = document.getElementById('use-case-copy');
  const useCaseMetrics = document.getElementById('use-case-metrics');
  const useCaseFailures = document.getElementById('use-case-failures');
  const useCasePanel = document.getElementById('use-case-panel');

  function renderUseCase(key, focusButton = false, animatePanel = true) {
    const item = useCases[key] || useCases.live;
    if (useCasePanel && animatePanel && !prefersReducedMotion) {
      useCasePanel.classList.add('is-switching');
    }
    if (useCaseTitle) useCaseTitle.textContent = item.title;
    if (useCaseCopy) useCaseCopy.textContent = item.copy;
    if (useCaseMetrics) useCaseMetrics.innerHTML = item.metrics.map((metric) => `<li>${metric}</li>`).join('');
    if (useCaseFailures) useCaseFailures.innerHTML = item.failures.map((failure) => `<li>${failure}</li>`).join('');
    tabButtons.forEach((button) => {
      const active = button.dataset.useCase === key;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      button.setAttribute('tabindex', active ? '0' : '-1');
      if (active && useCasePanel) useCasePanel.setAttribute('aria-labelledby', button.id);
      if (active && focusButton) button.focus();
    });
    if (useCasePanel && animatePanel && !prefersReducedMotion) {
      window.requestAnimationFrame(() => {
        useCasePanel.classList.remove('is-switching');
      });
    }
  }

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => renderUseCase(button.dataset.useCase));
    button.addEventListener('keydown', (event) => {
      const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();

      const buttons = Array.from(tabButtons);
      const currentIndex = buttons.indexOf(button);
      const lastIndex = buttons.length - 1;
      let nextIndex = currentIndex;

      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = lastIndex;
      if (event.key === 'ArrowLeft') nextIndex = currentIndex <= 0 ? lastIndex : currentIndex - 1;
      if (event.key === 'ArrowRight') nextIndex = currentIndex >= lastIndex ? 0 : currentIndex + 1;

      renderUseCase(buttons[nextIndex].dataset.useCase, true);
    });
  });
  renderUseCase('live', false, false);

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
  let modalReturnFocus = null;

  function setFeedback(target, message, type) {
    if (!target) return;
    target.textContent = message;
    target.classList.toggle('is-success', type === 'success');
    target.classList.toggle('is-error', type === 'error');
  }

  function isLocalPreview() {
    return window.location.protocol === 'file:'
      || ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  }

  function redactEmail(email) {
    const [name, domain] = email.split('@');
    if (!domain) return '[redacted]';
    return `${name.slice(0, 2)}...@${domain}`;
  }

  function saveLocalWaitlist(email) {
    const saved = readJSON(STORAGE_KEYS.waitlist, []);
    const normalized = saved.map(normalizeWaitlistEntry);
    if (!normalized.some((entry) => entry.email.toLowerCase() === email.toLowerCase())) {
      saved.push({
        id: `signup_${Date.now().toString(36)}`,
        email,
        source: 'local preview',
        createdAt: new Date().toISOString(),
        status: 'new'
      });
      writeJSON(STORAGE_KEYS.waitlist, saved);
    }
  }

  async function registerEmail(email, form) {
    const endpoint = form.dataset.signupEndpoint ? form.dataset.signupEndpoint.trim() : '';

    if (endpoint && window.location.protocol !== 'file:') {
      const body = new URLSearchParams(new FormData(form));
      body.set('email', email);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      });

      if (!response.ok) throw new Error(`Signup failed with ${response.status}`);
      return 'remote';
    }

    if (isLocalPreview()) {
      saveLocalWaitlist(email);
      return 'local';
    }

    throw new Error('Signup endpoint is not configured');
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
        const mode = await registerEmail(email, form);
        input.value = '';
        addConsoleLine(`[ok] alpha request staged for ${redactEmail(email)}`, 'success-line');
        setFeedback(
          feedbackTarget,
          mode === 'remote'
            ? 'Request received. We will follow up when your alpha slot opens.'
            : 'Request saved locally for this browser preview. Production submissions require the configured form endpoint.',
          'success'
        );
      } catch (error) {
        console.error(error);
        addConsoleLine('[warn] waitlist request failed', 'warn-line');
        setFeedback(feedbackTarget, 'Could not send that request. Please try again or email hello@buffer.lol.', 'error');
      } finally {
        button.disabled = false;
        input.disabled = false;
        if (label) label.textContent = originalLabel;
      }
    });
  }

  bindSignupForm(signupForm, emailInput, submitButton, feedback);
  bindSignupForm(modalForm, modalEmailInput, modalSubmitButton, modalFeedback);

  const adminGate = document.getElementById('admin-gate');
  const adminDashboard = document.getElementById('admin-dashboard');
  const adminGateForm = document.getElementById('admin-gate-form');
  const adminPassword = document.getElementById('admin-password');
  const adminGateFeedback = document.getElementById('admin-gate-feedback');
  const adminLock = document.getElementById('admin-lock');
  const waitlistTable = document.getElementById('waitlist-table');
  const waitlistSearch = document.getElementById('waitlist-search');
  const waitlistFilter = document.getElementById('waitlist-filter');
  const exportCsv = document.getElementById('export-csv');
  const clearDemoData = document.getElementById('clear-demo-data');
  const probeActivity = document.getElementById('probe-activity');
  const diagnosticsQueue = document.getElementById('diagnostics-queue');
  let adminTransitionTimer;

  const seedWaitlist = [
    { id: 'seed_1', email: 'ops@northstar.video', source: 'demo seed', createdAt: '2026-05-18T15:12:00.000Z', status: 'new' },
    { id: 'seed_2', email: 'media@courseforge.test', source: 'demo seed', createdAt: '2026-05-20T18:44:00.000Z', status: 'contacted' },
    { id: 'seed_3', email: 'infra@creatorhub.test', source: 'demo seed', createdAt: '2026-05-22T11:08:00.000Z', status: 'invited' }
  ];

  const seedProbes = [
    {
      id: 'seed_probe_1',
      createdAt: '2026-05-23T13:10:00.000Z',
      url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
      type: 'HLS',
      region: 'US East',
      status: 'warn',
      durationMs: 4200,
      metrics: { startupDelay: 2.9, rebufferCount: 1, liveLatency: 674, manifestFetch: 122, cdnResponse: 88, bitrateVariants: 6 },
      mainWarning: 'Live latency drift detected'
    },
    {
      id: 'seed_probe_2',
      createdAt: '2026-05-22T20:26:00.000Z',
      url: 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd',
      type: 'DASH',
      region: 'EU West',
      status: 'pass',
      durationMs: 3300,
      metrics: { startupDelay: 1.6, rebufferCount: 0, liveLatency: 0, manifestFetch: 74, cdnResponse: 51, bitrateVariants: 4 },
      mainWarning: 'No major playback risk detected'
    }
  ];

  function getAdminWaitlist() {
    const saved = getWaitlist();
    const byEmail = new Map(seedWaitlist.map((entry) => [entry.email, entry]));
    saved.forEach((entry) => byEmail.set(entry.email, entry));
    return Array.from(byEmail.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function getAdminProbes() {
    const byId = new Map(seedProbes.map((entry) => [entry.id, entry]));
    getProbeRuns().forEach((entry) => byId.set(entry.id, entry));
    return Array.from(byId.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function renderAdminMetrics(waitlist, probes) {
    const warningCount = probes.filter((probe) => probe.status !== 'pass').length;
    const avgStartup = probes.length ? probes.reduce((sum, probe) => sum + probe.metrics.startupDelay, 0) / probes.length : 0;
    const avgCdn = probes.length ? probes.reduce((sum, probe) => sum + probe.metrics.cdnResponse, 0) / probes.length : 0;
    const metricMap = {
      'metric-signups': waitlist.length,
      'metric-probes': probes.length,
      'metric-warning-rate': probes.length ? `${Math.round((warningCount / probes.length) * 100)}%` : '0%',
      'metric-startup': `${avgStartup.toFixed(1)}s`,
      'metric-cdn': `${Math.round(avgCdn)}ms`
    };
    Object.entries(metricMap).forEach(([id, value]) => {
      const target = document.getElementById(id);
      if (target) target.textContent = value;
    });
  }

  function renderWaitlistTable(waitlist) {
    if (!waitlistTable) return;
    const query = waitlistSearch ? waitlistSearch.value.trim().toLowerCase() : '';
    const filter = waitlistFilter ? waitlistFilter.value : 'all';
    const rows = waitlist.filter((entry) => {
      const matchesQuery = !query || entry.email.toLowerCase().includes(query);
      const matchesFilter = filter === 'all' || entry.status === filter;
      return matchesQuery && matchesFilter;
    });

    waitlistTable.innerHTML = rows.length ? rows.map((entry) => `
      <tr>
        <td>${escapeHTML(entry.email)}</td>
        <td>${escapeHTML(entry.source)}</td>
        <td>${formatDate(entry.createdAt)}</td>
        <td><span class="status-pill status-${entry.status}">${entry.status}</span></td>
        <td>
          <button type="button" data-status-email="${escapeHTML(entry.email)}" data-status-value="contacted">Contacted</button>
          <button type="button" data-status-email="${escapeHTML(entry.email)}" data-status-value="invited">Invited</button>
        </td>
      </tr>
    `).join('') : '<tr><td colspan="5">No signups match this view.</td></tr>';
  }

  function renderProbeActivity(probes) {
    if (!probeActivity) return;
    probeActivity.innerHTML = probes.slice(0, 8).map((probe) => `
      <article>
        <span class="status-pill status-${probe.status}">${probe.status}</span>
        <div>
          <strong>${escapeHTML(probe.mainWarning)}</strong>
          <p>${escapeHTML(probe.region)} / ${escapeHTML(probe.type)} / ${(probe.durationMs / 1000).toFixed(1)}s / ${formatDate(probe.createdAt)}</p>
        </div>
      </article>
    `).join('');
  }

  function renderQueue(probes) {
    if (!diagnosticsQueue) return;
    const queue = [
      ['running', 'APAC HLS live-edge sample'],
      ['pending', 'US West DASH manifest replay'],
      ['completed', `${probes[0] ? probes[0].region : 'US East'} ${probes[0] ? probes[0].type : 'HLS'} report packaging`],
      ['pending', 'EU West CDN edge comparison']
    ];
    diagnosticsQueue.innerHTML = queue.map(([status, label]) => `
      <article>
        <span class="status-pill status-${status}">${status}</span>
        <strong>${label}</strong>
      </article>
    `).join('');
  }

  function renderAdmin() {
    if (!adminDashboard) return;
    const waitlist = getAdminWaitlist();
    const probes = getAdminProbes();
    renderAdminMetrics(waitlist, probes);
    renderWaitlistTable(waitlist);
    renderProbeActivity(probes);
    renderQueue(probes);
  }

  function setAdminUnlocked(unlocked, animate = false) {
    if (!adminGate || !adminDashboard) return;
    window.clearTimeout(adminTransitionTimer);
    adminGate.classList.remove('is-leaving');
    adminDashboard.classList.remove('is-entering');
    if (adminLock) adminLock.hidden = !unlocked;
    if (!unlocked) {
      adminGate.style.removeProperty('height');
      adminGate.style.removeProperty('min-height');
      adminGate.hidden = false;
      adminDashboard.hidden = true;
      return;
    }

    renderAdmin();
    adminDashboard.hidden = false;

    if (!animate || prefersReducedMotion) {
      adminGate.style.removeProperty('height');
      adminGate.style.removeProperty('min-height');
      adminGate.hidden = true;
      adminDashboard.scrollIntoView({ block: 'start' });
      return;
    }

    adminGate.hidden = false;
    adminGate.style.height = `${adminGate.getBoundingClientRect().height}px`;
    adminGate.style.minHeight = '0';
    adminGate.classList.add('is-leaving');
    adminDashboard.classList.add('is-entering');
    window.requestAnimationFrame(() => {
      adminGate.style.height = '0';
    });

    adminTransitionTimer = window.setTimeout(() => {
      adminGate.hidden = true;
      adminGate.style.removeProperty('height');
      adminGate.style.removeProperty('min-height');
      adminGate.classList.remove('is-leaving');
      adminDashboard.classList.remove('is-entering');
    }, 680);
  }

  if (adminGate && adminDashboard) {
    setAdminUnlocked(sessionStorage.getItem('buffer_lol_admin_unlocked') === 'true');

    if (adminGateForm) {
      adminGateForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (adminPassword && adminPassword.value === 'buffer') {
          sessionStorage.setItem('buffer_lol_admin_unlocked', 'true');
          setAdminUnlocked(true, true);
        } else {
          setFeedback(adminGateFeedback, 'Use the demo password: buffer', 'error');
        }
      });
    }

    if (adminLock) {
      adminLock.addEventListener('click', () => {
        sessionStorage.removeItem('buffer_lol_admin_unlocked');
        setAdminUnlocked(false);
      });
    }

    [waitlistSearch, waitlistFilter].forEach((control) => {
      if (control) control.addEventListener('input', renderAdmin);
    });

    if (waitlistTable) {
      waitlistTable.addEventListener('click', (event) => {
        const button = event.target.closest('[data-status-email]');
        if (!button) return;
        setWaitlistStatus(button.dataset.statusEmail, button.dataset.statusValue);
        renderAdmin();
      });
    }

    if (exportCsv) {
      exportCsv.addEventListener('click', () => {
        const rows = getAdminWaitlist();
        const csv = [
          ['email', 'source', 'signup_date', 'status'],
          ...rows.map((entry) => [entry.email, entry.source, entry.createdAt, entry.status])
        ].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'buffer-lol-waitlist-demo.csv';
        link.click();
        URL.revokeObjectURL(url);
      });
    }

    if (clearDemoData) {
      clearDemoData.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEYS.waitlist);
        localStorage.removeItem(STORAGE_KEYS.probes);
        localStorage.removeItem(STORAGE_KEYS.statuses);
        renderAdmin();
      });
    }
  }

  function openModal() {
    if (!modal) return;
    modalReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : modalOpenButton;
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
    if (modalReturnFocus) modalReturnFocus.focus();
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

    if (event.key !== 'Tab' || !modal || !modal.classList.contains('is-open')) return;

    const focusable = modal.querySelectorAll([
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(','));
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

window.initBufferLol = initBufferLol;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBufferLol);
} else {
  initBufferLol();
}

function revealCurrentLandingContent() {
  document.querySelectorAll('.reveal-on-scroll:not(.is-visible)').forEach((item) => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.08) item.classList.add('is-visible');
  });
}

window.addEventListener('pageshow', revealCurrentLandingContent);

const routeRevealObserver = new MutationObserver(() => {
  window.requestAnimationFrame(revealCurrentLandingContent);
});

routeRevealObserver.observe(document.documentElement, {
  childList: true,
  subtree: true
});
