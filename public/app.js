function initBufferLol() {
  document.documentElement.classList.add('js-enhanced');

  const landingRoot = document.getElementById('main-content');
  const isLandingPage = Boolean(document.getElementById('speed-test-form'));

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
  const revealItems = document.querySelectorAll('.reveal-on-scroll');
  const animatedCountUps = new WeakSet();
  const STORAGE_KEY = 'buffer_lol_speed_runs';
  const circumference = 327;

  const speedForm = document.getElementById('speed-test-form');
  const speedProfile = document.getElementById('speed-profile');
  const startButton = document.getElementById('start-speed-test');
  const heroStart = document.getElementById('speed-start-hero');
  const gaugeButton = document.getElementById('buffer-button');
  const percentageCounter = document.getElementById('percentage-counter');
  const bufferFill = document.getElementById('buffer-fill');
  const statusMain = document.getElementById('status-main');
  const statusText = document.getElementById('speed-status-text');
  const statusPill = document.getElementById('speed-status-pill');
  const qualityPill = document.getElementById('speed-quality-pill');
  const stages = document.querySelectorAll('#speed-stages span');
  const metrics = document.getElementById('speed-metrics');
  const speedLog = document.getElementById('speed-log');
  const consoleBody = document.getElementById('console-body');
  const summaryTitle = document.getElementById('speed-summary-title');
  const summaryStatus = document.getElementById('speed-summary-status');
  const summaryChecks = document.getElementById('speed-summary-checks');
  const summaryActions = document.getElementById('speed-summary-actions');
  const copyButton = document.getElementById('copy-results');
  const copyFeedback = document.getElementById('copy-feedback');
  let latestReportText = '';
  let isRunning = false;

  function revealCurrentLandingContent() {
    document.querySelectorAll('.reveal-on-scroll').forEach((item) => {
      item.classList.add('is-visible');
    });
  }

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

  function readRuns() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (error) {
      console.warn('Could not read speed history', error);
      return [];
    }
  }

  function writeRuns(runs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs.slice(0, 12)));
  }

  function setFeedback(target, message, type) {
    if (!target) return;
    target.textContent = message;
    target.classList.toggle('is-success', type === 'success');
    target.classList.toggle('is-error', type === 'error');
  }

  function addLine(target, text, className = 'system-line') {
    if (!target) return;
    const line = document.createElement('div');
    line.className = `console-line ${className} is-new`;
    line.textContent = text;
    target.appendChild(line);
    window.setTimeout(() => line.classList.remove('is-new'), 360);

    if (target.children.length > 18) {
      target.removeChild(target.firstElementChild);
    }

    target.scrollTop = target.scrollHeight;
  }

  function addSpeedLine(text, className = 'system-line') {
    addLine(speedLog, text, className);
  }

  function addHistoryLine(text, className = 'system-line') {
    addLine(consoleBody, text, className);
  }

  function setStatusPill(element, status, label = status) {
    if (!element) return;
    element.textContent = label;
    element.className = `status-pill status-${status}`;
  }

  function setProgress(value, label) {
    const rounded = Math.max(0, Math.min(100, Math.floor(value)));
    if (percentageCounter) percentageCounter.textContent = String(rounded).padStart(2, '0');
    if (bufferFill) bufferFill.style.strokeDashoffset = circumference - (circumference * rounded / 100);
    if (statusMain && label) statusMain.textContent = label;
  }

  function setActiveStage(index) {
    stages.forEach((stage, stageIndex) => {
      stage.classList.toggle('is-active', stageIndex === index);
      stage.classList.toggle('is-complete', stageIndex < index);
    });
  }

  function completeStages() {
    stages.forEach((stage) => {
      stage.classList.remove('is-active');
      stage.classList.add('is-complete');
    });
  }

  function clearStages() {
    stages.forEach((stage) => stage.classList.remove('is-active', 'is-complete'));
  }

  function profileConfig() {
    const value = speedProfile ? speedProfile.value : 'standard';
    if (value === 'light') {
      return { downloadBytes: 1.5 * 1024 * 1024, uploadBytes: 512 * 1024, downloads: 2, label: 'light' };
    }
    if (value === 'heavy') {
      return { downloadBytes: 6 * 1024 * 1024, uploadBytes: 4 * 1024 * 1024, downloads: 3, label: 'heavy' };
    }
    return { downloadBytes: 3 * 1024 * 1024, uploadBytes: 2 * 1024 * 1024, downloads: 3, label: 'standard' };
  }

  function formatMbps(value) {
    if (!Number.isFinite(value)) return '--';
    if (value >= 100) return value.toFixed(0);
    if (value >= 10) return value.toFixed(1);
    return value.toFixed(2);
  }

  function classifyRun(run) {
    if (run.downloadMbps >= 100 && run.uploadMbps >= 20 && run.pingMs < 35 && run.jitterMs < 12) {
      return {
        status: 'pass',
        title: 'Fast, responsive connection',
        actions: ['You have enough headroom for 4K streaming, video calls, and large downloads.', 'If an app still feels slow, check the app or VPN rather than raw bandwidth.']
      };
    }

    if (run.downloadMbps >= 25 && run.uploadMbps >= 8 && run.pingMs < 65 && run.jitterMs < 25) {
      return {
        status: 'pass',
        title: 'Solid everyday connection',
        actions: ['This should handle streaming, browsing, calls, and most work without much friction.', 'Retest during your busiest evening window if buffering happens at peak hours.']
      };
    }

    if (run.downloadMbps >= 10 && run.uploadMbps >= 3 && run.pingMs < 100) {
      return {
        status: 'warn',
        title: 'Usable, but with limited headroom',
        actions: ['Reduce simultaneous streams, cloud backups, or VPN hops during calls.', 'Move closer to the router and compare the result before blaming the plan.']
      };
    }

    return {
      status: 'fail',
      title: 'Connection may feel constrained',
      actions: ['Try wired Ethernet or test near the router to separate Wi-Fi issues from provider issues.', 'If repeat tests stay low, compare against your advertised plan before calling support.']
    };
  }

  function renderMetrics(run) {
    if (!metrics) return;
    const values = [
      `${formatMbps(run.downloadMbps)} Mbps`,
      `${formatMbps(run.uploadMbps)} Mbps`,
      `${Math.round(run.pingMs)} ms`,
      `${Math.round(run.jitterMs)} ms`,
      window.location.host || 'local',
      String(readRuns().length)
    ];

    metrics.querySelectorAll('strong').forEach((item, index) => {
      item.textContent = values[index] || '--';
    });
  }

  function renderSummary(run) {
    if (!summaryTitle || !summaryChecks || !summaryActions) return;
    const quality = classifyRun(run);
    const checks = [
      [run.downloadMbps >= 25 ? 'pass' : run.downloadMbps >= 10 ? 'warn' : 'fail', `Download ${formatMbps(run.downloadMbps)} Mbps`],
      [run.uploadMbps >= 10 ? 'pass' : run.uploadMbps >= 3 ? 'warn' : 'fail', `Upload ${formatMbps(run.uploadMbps)} Mbps`],
      [run.pingMs < 40 ? 'pass' : run.pingMs < 90 ? 'warn' : 'fail', `Ping ${Math.round(run.pingMs)} ms`],
      [run.jitterMs < 20 ? 'pass' : run.jitterMs < 45 ? 'warn' : 'fail', `Jitter ${Math.round(run.jitterMs)} ms`]
    ];

    summaryTitle.textContent = quality.title;
    setStatusPill(summaryStatus, quality.status);
    setStatusPill(qualityPill, quality.status, quality.status === 'pass' ? 'healthy' : quality.status);
    summaryChecks.innerHTML = checks.map(([state, text]) => `<li><span class="${state}">${state}</span>${text}</li>`).join('');
    summaryActions.innerHTML = `<strong>Helpful next checks</strong>${quality.actions.map((item) => `<p>${item}</p>`).join('')}`;
    latestReportText = [
      `buffer.lol speed test (${quality.status.toUpperCase()})`,
      `Download: ${formatMbps(run.downloadMbps)} Mbps`,
      `Upload: ${formatMbps(run.uploadMbps)} Mbps`,
      `Ping: ${Math.round(run.pingMs)} ms`,
      `Jitter: ${Math.round(run.jitterMs)} ms`,
      `Server: ${window.location.host || 'local'}`,
      `Profile: ${run.profile}`,
      `Summary: ${quality.title}`
    ].join('\n');
  }

  function renderHistory() {
    if (!consoleBody) return;
    const runs = readRuns();
    consoleBody.innerHTML = '';

    if (!runs.length) {
      addHistoryLine('[sys] run a speed test to start local history');
      return;
    }

    runs.slice(0, 8).forEach((run) => {
      const quality = classifyRun(run);
      addHistoryLine(
        `[${quality.status}] ${formatMbps(run.downloadMbps)} down / ${formatMbps(run.uploadMbps)} up / ${Math.round(run.pingMs)}ms ping`,
        quality.status === 'pass' ? 'success-line' : quality.status === 'fail' ? 'fail-line' : 'warn-line'
      );
    });
  }

  async function timedFetch(url, options) {
    const startedAt = performance.now();
    const response = await fetch(url, {
      cache: 'no-store',
      ...options,
      headers: {
        ...(options && options.headers ? options.headers : {}),
        'Cache-Control': 'no-store'
      }
    });
    const body = await response.arrayBuffer();
    const endedAt = performance.now();

    if (!response.ok) {
      throw new Error(`Speed endpoint returned ${response.status}`);
    }

    return {
      bytes: body.byteLength,
      ms: endedAt - startedAt
    };
  }

  async function measurePing(samples) {
    const timings = [];

    for (let index = 0; index < samples; index += 1) {
      const result = await timedFetch(`/api/speed-test?bytes=1024&ping=${Date.now()}-${index}`);
      timings.push(result.ms);
      addSpeedLine(`[sys] ping sample ${index + 1}: ${Math.round(result.ms)}ms`);
    }

    const average = timings.reduce((sum, value) => sum + value, 0) / timings.length;
    const jitter = timings.reduce((sum, value, index) => {
      if (index === 0) return sum;
      return sum + Math.abs(value - timings[index - 1]);
    }, 0) / Math.max(1, timings.length - 1);

    return { pingMs: average, jitterMs: jitter };
  }

  async function measureDownload(config) {
    let totalBytes = 0;
    let totalMs = 0;

    for (let index = 0; index < config.downloads; index += 1) {
      const bytes = Math.floor(config.downloadBytes);
      const result = await timedFetch(`/api/speed-test?bytes=${bytes}&download=${Date.now()}-${index}`);
      totalBytes += result.bytes;
      totalMs += result.ms;
      addSpeedLine(`[sys] download chunk ${index + 1}: ${(result.bytes / 1024 / 1024).toFixed(1)}MB`);
    }

    return (totalBytes * 8) / (totalMs / 1000) / 1000000;
  }

  async function measureUpload(config) {
    const bytes = Math.floor(config.uploadBytes);
    const payload = new Uint8Array(bytes);

    for (let index = 0; index < payload.length; index += 1) {
      payload[index] = index % 251;
    }

    const startedAt = performance.now();
    const response = await fetch('/api/speed-test', {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/octet-stream'
      },
      body: payload
    });
    const endedAt = performance.now();

    if (!response.ok) {
      throw new Error(`Upload test returned ${response.status}`);
    }

    addSpeedLine(`[sys] upload payload: ${(bytes / 1024 / 1024).toFixed(1)}MB`);
    return (bytes * 8) / ((endedAt - startedAt) / 1000) / 1000000;
  }

  async function runSpeedTest() {
    if (isRunning) return;

    isRunning = true;
    const config = profileConfig();
    const buttonLabel = startButton ? startButton.querySelector('span') : null;
    if (buttonLabel) buttonLabel.textContent = 'Testing...';
    if (startButton) startButton.disabled = true;
    if (speedProfile) speedProfile.disabled = true;
    if (speedLog) speedLog.innerHTML = '';
    setFeedback(copyFeedback, '', '');
    clearStages();
    setProgress(4, 'starting test');
    if (statusText) statusText.textContent = 'running';
    setStatusPill(statusPill, 'running', 'running');
    setStatusPill(qualityPill, 'running', 'measuring');
    addSpeedLine(`[sys] ${config.label} speed test started`);

    try {
      setActiveStage(0);
      setProgress(15, 'sampling ping');
      const latency = await measurePing(prefersReducedMotion ? 2 : 4);

      setActiveStage(1);
      setProgress(42, 'measuring download');
      const downloadMbps = await measureDownload(config);

      setActiveStage(2);
      setProgress(72, 'measuring upload');
      const uploadMbps = await measureUpload(config);

      const run = {
        id: `speed_${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
        profile: config.label,
        downloadMbps,
        uploadMbps,
        pingMs: latency.pingMs,
        jitterMs: latency.jitterMs
      };

      const runs = readRuns();
      runs.unshift(run);
      writeRuns(runs);

      setActiveStage(3);
      completeStages();
      setProgress(100, 'test complete');
      renderMetrics(run);
      renderSummary(run);
      renderHistory();
      const quality = classifyRun(run);
      if (statusText) statusText.textContent = quality.title;
      setStatusPill(statusPill, quality.status);
      addSpeedLine(`[${quality.status}] ${quality.title}`, quality.status === 'pass' ? 'success-line' : quality.status === 'fail' ? 'fail-line' : 'warn-line');
      addHistoryLine(`[ok] saved run ${formatMbps(downloadMbps)} down / ${formatMbps(uploadMbps)} up`, 'success-line');
    } catch (error) {
      console.error(error);
      setProgress(0, 'test failed');
      clearStages();
      if (statusText) statusText.textContent = 'test failed';
      setStatusPill(statusPill, 'fail', 'error');
      setStatusPill(qualityPill, 'fail', 'error');
      addSpeedLine('[fail] speed test could not complete', 'fail-line');
      setFeedback(copyFeedback, 'The test could not complete. Check your connection and try again.', 'error');
    } finally {
      isRunning = false;
      if (buttonLabel) buttonLabel.textContent = 'Start speed test';
      if (startButton) startButton.disabled = false;
      if (speedProfile) speedProfile.disabled = false;
    }
  }

  if (speedForm) {
    speedForm.addEventListener('submit', (event) => {
      event.preventDefault();
      runSpeedTest();
    });
  }

  if (gaugeButton) {
    gaugeButton.addEventListener('click', runSpeedTest);
  }

  if (heroStart) {
    heroStart.addEventListener('click', () => {
      window.setTimeout(runSpeedTest, 160);
    });
  }

  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      const text = latestReportText || 'Run a buffer.lol speed test to generate shareable results.';
      try {
        if (!navigator.clipboard) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(text);
        setFeedback(copyFeedback, 'Results copied.', 'success');
      } catch (error) {
        setFeedback(copyFeedback, text, 'success');
      }
    });
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

  setProgress(0, 'ready to test');
  renderHistory();
}

function revealCurrentLandingContent() {
  document.querySelectorAll('.reveal-on-scroll').forEach((item) => {
    item.classList.add('is-visible');
  });
}

window.initBufferLol = initBufferLol;
