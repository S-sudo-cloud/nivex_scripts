/**
 * NIVEX SCRIPTS — Interactive Portfolio Engine
 * High-performance 3D Parallax, Web Audio Synthesis & Scroll Orchestration
 */

(function () {
  'use strict';

  // --- Environment & Preferences Detection ---
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasMouseSupport = window.matchMedia('(pointer: fine)').matches;

  // --- Core DOM References ---
  const fxCanvas = document.getElementById('fxCanvas');
  const fCtx = fxCanvas.getContext('2d');
  const preloader = document.getElementById('preloader');
  const hudOverlay = document.getElementById('hudOverlay');
  const scrollProgressFill = document.getElementById('scrollProgressFill');
  const navToggle = document.getElementById('navToggle');
  const hudMenu = document.getElementById('hudMenu');
  const ambientToggle = document.getElementById('ambientToggle');

  // --- Scroll & State Variables ---
  let currentScrollFraction = 0;
  let targetScrollFraction = 0;
  const sectionKeys = ['#home', '#projects', '#skills', '#about', '#contact'];
  let currentSectionIdx = 0;
  let isSplittingText = false;
  let pendingSectionIdx = null;
  let navScrolling = false;
  let navScrollTimer = null;

  /* =========================================================
     1. THEME CONTROLLER (PERMANENT DARK CYBERPUNK)
     ========================================================= */
  function initTheme() {
    document.documentElement.setAttribute('data-theme', 'dark');
    try {
      localStorage.removeItem('nivexTheme');
    } catch (e) {
      // Storage unavailable or restricted
    }
  }

  /* =========================================================
     2. BACKGROUND MUSIC CONTROLLER (2.MP3) & AUDIO CONTEXT
     ========================================================= */
  let ambientCtx = null;
  let ambientPlaying = false;

  // Background Audio reference (2.mp3)
  let bgMusic = document.getElementById('bgMusic');
  if (!bgMusic) {
    bgMusic = new Audio('./2.mp3');
    bgMusic.id = 'bgMusic';
    bgMusic.loop = true;
    bgMusic.preload = 'auto';
  }
  bgMusic.loop = true;
  bgMusic.volume = 0.55;

  function initAudioContext() {
    if (!ambientCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        ambientCtx = new AudioContextClass();
      }
    }
    if (ambientCtx && ambientCtx.state === 'suspended') {
      ambientCtx.resume();
    }
  }

  function startAmbient() {
    initAudioContext();
    if (!bgMusic) return;

    const playPromise = bgMusic.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        ambientPlaying = true;
        if (ambientToggle) {
          ambientToggle.classList.add('playing');
          ambientToggle.setAttribute('title', 'Pause Music (2.mp3)');
        }
      }).catch(err => {
        console.warn('Audio playback error or prevented by browser:', err);
        ambientPlaying = false;
        if (ambientToggle) ambientToggle.classList.remove('playing');
      });
    }
  }

  function stopAmbient() {
    if (!bgMusic) return;
    bgMusic.pause();
    ambientPlaying = false;
    if (ambientToggle) {
      ambientToggle.classList.remove('playing');
      ambientToggle.setAttribute('title', 'Play Music (2.mp3)');
    }
  }

  if (bgMusic) {
    bgMusic.addEventListener('play', () => {
      ambientPlaying = true;
      if (ambientToggle) {
        ambientToggle.classList.add('playing');
        ambientToggle.setAttribute('title', 'Pause Music (2.mp3)');
      }
    });
    bgMusic.addEventListener('pause', () => {
      ambientPlaying = false;
      if (ambientToggle) {
        ambientToggle.classList.remove('playing');
        ambientToggle.setAttribute('title', 'Play Music (2.mp3)');
      }
    });
    bgMusic.addEventListener('ended', () => {
      ambientPlaying = false;
      if (ambientToggle) ambientToggle.classList.remove('playing');
    });
  }

  let sfxCtx = null;
  function playBlip(freq = 520, duration = 0.08) {
    try {
      if (!sfxCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) sfxCtx = new AudioContextClass();
      }
      if (sfxCtx && sfxCtx.state === 'suspended') sfxCtx.resume();
      if (!sfxCtx) return;

      const osc = sfxCtx.createOscillator();
      const gain = sfxCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, sfxCtx.currentTime);
      gain.gain.setValueAtTime(0.05, sfxCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0008, sfxCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(sfxCtx.destination);
      osc.start();
      osc.stop(sfxCtx.currentTime + duration);
    } catch (e) {}
  }

  /* =========================================================
     3. INTERACTIVE CANVAS PARTICLE ENGINE (CYAN & PURPLE)
     ========================================================= */
  const particles = [];
  const CONNECT_OPACITY_MAX = 0.28;

  class AmbientParticle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * window.innerWidth;
      this.y = initial ? Math.random() * window.innerHeight : window.innerHeight + Math.random() * 40;
      this.size = Math.random() * 3 + 1;
      this.speedY = Math.random() * 1.1 + 0.35;
      this.speedX = (Math.random() - 0.5) * 0.7;
      this.opacity = Math.random() * 0.5 + 0.15;
      this.fade = Math.random() * 0.002 + 0.0008;
      this.pulse = Math.random() * Math.PI * 2;
      this.pulseSpeed = Math.random() * 0.04 + 0.01;

      // Color spectrum from Nivex Scripts logo: Cyan, Bright Sky, Neon Purple, White
      const colors = ['#00f0ff', '#38bdf8', '#a855f7', '#c084fc', '#e0f2fe'];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.y -= this.speedY;
      this.x += this.speedX + Math.sin(this.y * 0.01) * 0.35;
      this.pulse += this.pulseSpeed;

      this.currentOpacity = Math.max(0, this.opacity + Math.sin(this.pulse) * 0.15);
      this.opacity -= this.fade;

      if (this.y < -20 || this.opacity <= 0) {
        this.reset(false);
      }
    }

    draw() {
      fCtx.save();
      fCtx.globalAlpha = Math.max(0, this.currentOpacity);
      fCtx.fillStyle = this.color;
      fCtx.shadowBlur = this.size * 4;
      fCtx.shadowColor = this.color;
      fCtx.beginPath();
      fCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      fCtx.fill();
      fCtx.restore();
    }
  }

  function drawParticleConnections(ctx, particlesArray) {
    const isMobile = window.matchMedia('(max-width: 700px)').matches;
    const connectDist = isMobile ? 140 : 250;
    for (let i = 0; i < particlesArray.length; i++) {
      for (let j = i + 1; j < particlesArray.length; j++) {
        const p1 = particlesArray[i];
        const p2 = particlesArray[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectDist) {
          const p1Alpha = p1.currentOpacity !== undefined ? p1.currentOpacity : 1;
          const p2Alpha = p2.currentOpacity !== undefined ? p2.currentOpacity : 1;
          const fadeAlpha = Math.min(p1Alpha, p2Alpha);
          const opacity = (1 - dist / connectDist) * CONNECT_OPACITY_MAX * fadeAlpha;

          ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }
  }

  function initParticles() {
    if (!fxCanvas) return;
    fxCanvas.width = window.innerWidth;
    fxCanvas.height = window.innerHeight;

    const isMobile = window.matchMedia('(max-width: 700px)').matches;
    const baseCount = isMobile ? 22 : 46;
    const count = reducedMotion ? Math.max(4, Math.floor(baseCount * 0.2)) : baseCount;

    particles.length = 0;
    for (let i = 0; i < count; i++) {
      particles.push(new AmbientParticle());
    }
  }

  function animateParticles() {
    fCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    particles.forEach(p => p.update());
    drawParticleConnections(fCtx, particles);
    particles.forEach(p => p.draw());
  }

  /* =========================================================
     4. CONTINUOUS MONARCH IDLE ANIMATION ENGINE
     Folder: nivex2_100_transparent_frames (150 frames, 20 FPS)
     Always grounded, fluid continuous loop with zero descent delay!
     ========================================================= */
  const heroEntranceCanvas = document.getElementById('heroEntranceCanvas');
  const heroEntranceCtx = heroEntranceCanvas ? heroEntranceCanvas.getContext('2d') : null;
  const heroMascotEl = document.getElementById('heroMascot');
  const heroGroundShadowEl = document.getElementById('heroGroundShadow');

  // Home Screen Continuous Loop (frame_001 to frame_150, 150 frames)
  const LOOP_FRAMES_COUNT = 150;
  const LOOP_START_NUM = 1;
  const LOOP_FRAME_MS = 50; // ~20 FPS smooth cinematic monarch idle loop (150 frames = 7.5s cycle)
  const characterLoopFrames = new Array(LOOP_FRAMES_COUNT);
  let idleLoopStartTime = null;

  // Helper to load a single frame with WebP priority and PNG fallback
  function loadFrameImage(folder, frameNum, onDone) {
    const padNum = String(frameNum).padStart(3, '0');
    const img = new Image();
    img.decoding = 'async';
    let resolved = false;

    function handleSuccess() {
      if (!resolved) {
        resolved = true;
        if (onDone) onDone(img);
      }
    }

    img.onload = handleSuccess;
    img.onerror = () => {
      // Automatic fallback to PNG if WebP fails or is missing
      img.onerror = handleSuccess;
      img.src = `./${folder}/frame_${padNum}.png`;
    };
    img.src = `./${folder}/frame_${padNum}.webp`;
    return img;
  }

  // Progressive Priority Preloader for Continuous Idle Loop:
  // 1. Critical Startup: Loads the initial 12 frames of nivex2_100_transparent_frames.
  //    Takes under 1.5MB in WebP and unlocks the preloader almost instantly (~0.3s - 0.5s)!
  // 2. Background Stream: Smoothly streams the remaining loop frames (13 to 150) in small background chunks.
  function preloadCharacterLoop(onProgress, onDone) {
    const CRITICAL_LOOP_COUNT = 12;
    let criticalLoaded = 0;
    let criticalComplete = false;

    function checkCriticalCompletion() {
      if (criticalComplete) return;
      criticalLoaded++;
      if (onProgress) {
        onProgress(Math.min(criticalLoaded, CRITICAL_LOOP_COUNT), CRITICAL_LOOP_COUNT);
      }
      if (criticalLoaded >= CRITICAL_LOOP_COUNT) {
        criticalComplete = true;
        if (onDone) onDone();
        startBackgroundStreaming();
      }
    }

    // Safety timeout: Never keep the visitor waiting longer than 1.0s on preloader!
    setTimeout(() => {
      if (!criticalComplete) {
        criticalComplete = true;
        if (onDone) onDone();
        startBackgroundStreaming();
      }
    }, 1000);

    // 1. Preload initial critical loop frames (frame_001 to frame_012)
    for (let i = 0; i < CRITICAL_LOOP_COUNT; i++) {
      const frameNum = LOOP_START_NUM + i;
      characterLoopFrames[i] = loadFrameImage('nivex2_100_transparent_frames', frameNum, checkCriticalCompletion);
    }

    // 2. Staggered background streaming queue for remaining loop frames (13 to 150)
    function startBackgroundStreaming() {
      let loopIdx = CRITICAL_LOOP_COUNT;

      function streamNextLoopChunk() {
        if (loopIdx >= LOOP_FRAMES_COUNT) return;

        const chunkEnd = Math.min(loopIdx + 6, LOOP_FRAMES_COUNT);
        let chunkLoaded = 0;
        const chunkSize = chunkEnd - loopIdx;

        for (let i = loopIdx; i < chunkEnd; i++) {
          const frameNum = LOOP_START_NUM + i;
          characterLoopFrames[i] = loadFrameImage('nivex2_100_transparent_frames', frameNum, () => {
            chunkLoaded++;
            if (chunkLoaded >= chunkSize) {
              loopIdx = chunkEnd;
              if (window.requestIdleCallback) {
                window.requestIdleCallback(streamNextLoopChunk, { timeout: 120 });
              } else {
                setTimeout(streamNextLoopChunk, 20);
              }
            }
          });
        }
      }

      if (window.requestIdleCallback) {
        window.requestIdleCallback(streamNextLoopChunk, { timeout: 100 });
      } else {
        setTimeout(streamNextLoopChunk, 20);
      }
    }
  }

  // Handle high-DPI canvas sizing
  function resizeEntranceCanvas() {
    if (!heroEntranceCanvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    heroEntranceCanvas.width = Math.round(w * dpr);
    heroEntranceCanvas.height = Math.round(h * dpr);
    heroEntranceCanvas.style.width = w + 'px';
    heroEntranceCanvas.style.height = h + 'px';
    if (heroEntranceCtx) {
      heroEntranceCtx.setTransform(1, 0, 0, 1, 0, 0);
      heroEntranceCtx.scale(dpr, dpr);
    }
  }

  // Render Character on Canvas: Continuous Monarch Idle Loop
  function renderHeroCharacter(timestamp) {
    if (!heroEntranceCanvas || !heroEntranceCtx) return;
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    heroEntranceCtx.clearRect(0, 0, cw, ch);

    // Responsive scaling: unified character height ensures head and boots are locked at identical positions
    const isMobile = cw <= 768;
    const targetCharHeight = isMobile ? Math.min(ch * 0.84, 620) : Math.min(ch * 0.88, 920);

    const groundY = isMobile ? ch - 6 : ch - 8;

    // Geometric alignment:
    const charScale = targetCharHeight / 1060;
    const renderW = 1920 * charScale;
    const renderH = 1080 * charScale;
    const charBaseX = (cw / 2) - (960 * charScale);
    const charBaseY = groundY - (1079 * charScale);

    // Exact sub-pixel calibration for idle loop art
    const phase2bOffsetX = 12 * charScale;
    const phase2bOffsetY = 1 * charScale;

    // Mouse parallax tracking
    const parallaxX = mouseCurrX * 12;
    const rawParallaxY = mouseCurrY * 5;

    // Keep ground shadow stable under boots
    if (heroGroundShadowEl && !heroGroundShadowEl.style.transform.includes('scale(1)')) {
      heroGroundShadowEl.style.transform = 'translateX(-50%) scale(1.0)';
      heroGroundShadowEl.style.opacity = '1';
    }

    // Smooth 20 FPS continuous loop (50ms per frame, 150 frames = 7.5s cycle)
    const loopElapsed = idleLoopStartTime ? (timestamp - idleLoopStartTime) : timestamp;
    const loopFrameIdx = Math.floor((loopElapsed / LOOP_FRAME_MS) % LOOP_FRAMES_COUNT);

    let imgToDraw = characterLoopFrames[loopFrameIdx];

    const drawX = charBaseX + phase2bOffsetX + parallaxX;
    const drawY = charBaseY + phase2bOffsetY + rawParallaxY;
    const drawW = renderW;
    const drawH = renderH;

    // Smart Playhead Fallback:
    // If the targeted frame is still downloading, find the closest previously completed frame in sequence.
    // This guarantees 100% fluid, zero-flicker, rock-solid rendering on any network connection!
    if (!imgToDraw || !imgToDraw.complete || imgToDraw.naturalWidth === 0) {
      for (let f = loopFrameIdx - 1; f >= 0; f--) {
        const cand = characterLoopFrames[f];
        if (cand && cand.complete && cand.naturalWidth > 0) {
          imgToDraw = cand;
          break;
        }
      }
      if (!imgToDraw || !imgToDraw.complete || imgToDraw.naturalWidth === 0) {
        if (characterLoopFrames[0] && characterLoopFrames[0].complete && characterLoopFrames[0].naturalWidth > 0) {
          imgToDraw = characterLoopFrames[0];
        }
      }
    }

    // Draw character frame (animated flame eyes, dagger, cloak motion)
    if (imgToDraw && imgToDraw.complete && imgToDraw.naturalWidth > 0) {
      heroEntranceCtx.drawImage(imgToDraw, drawX, drawY, drawW, drawH);
    }
  }

  function drawRestingHeroPose() {
    renderHeroCharacter(performance.now());
  }

  function updateHeroMascot() {
    if (!heroMascotEl) return;
    // Keep character fully active and 100% visible across all tabs (no fading!)
    if (!heroMascotEl.classList.contains('canvas-active')) {
      heroMascotEl.classList.add('canvas-active');
    }
    heroMascotEl.style.opacity = '1';
  }



  /* =========================================================
     5. MOUSE PARALLAX & RETICLE TRACKING
     ========================================================= */
  let mouseTargetX = 0, mouseTargetY = 0;
  let mouseCurrX = 0, mouseCurrY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseTargetX = (e.clientX / window.innerWidth - 0.5);
    mouseTargetY = (e.clientY / window.innerHeight - 0.5);
  });

  function updateMouseParallax() {
    if (reducedMotion || !hasMouseSupport) return;
    mouseCurrX += (mouseTargetX - mouseCurrX) * 0.06;
    mouseCurrY += (mouseTargetY - mouseCurrY) * 0.06;

    const moveX = mouseCurrX * 18;
    const moveY = mouseCurrY * 18;
    const rotY = mouseCurrX * 6;
    const rotX = -mouseCurrY * 4;
    if (hudOverlay) {
      hudOverlay.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) rotateY(${rotY}deg) rotateX(${rotX}deg)`;
    }

    const gridOverlay = document.querySelector('.grid-overlay');
    if (gridOverlay) {
      gridOverlay.style.transform = `translate(${(moveX * -0.35).toFixed(2)}px, ${(moveY * -0.35).toFixed(2)}px)`;
    }
  }

  /* =========================================================
     6. SPLIT-APART BACKGROUND TEXT & SECTION CONTROLLER
     ========================================================= */
  function releaseSplitLock() {
    isSplittingText = false;
    const next = pendingSectionIdx;
    pendingSectionIdx = null;
    if (next !== null && next !== currentSectionIdx) {
      changeBgTextSplit(next);
    }
  }

  function sectionFromScroll() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 50) return currentSectionIdx;
    const f = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    return Math.min(4, Math.floor(f * 4.99));
  }

  function syncSectionToScroll() {
    const idx = sectionFromScroll();
    if (idx !== currentSectionIdx) changeBgTextSplit(idx);
  }

  function endNavScroll() {
    clearTimeout(navScrollTimer);
    navScrolling = false;
  }

  function triggerScanSweep(sectionEl) {
    if (!sectionEl) return;
    const sweep = sectionEl.querySelector('.scan-sweep');
    if (!sweep) return;
    sweep.classList.remove('active');
    void sweep.offsetWidth;
    sweep.classList.add('active');
    playBlip(380, 0.1);
  }

  function changeBgTextSplit(targetIdx) {
    if (targetIdx === currentSectionIdx) return;
    if (isSplittingText) {
      pendingSectionIdx = targetIdx;
      return;
    }

    const bgWrapper = document.getElementById('bgTextWrapper');
    const bgLeft = document.getElementById('bgTextLeft');
    const bgRight = document.getElementById('bgTextRight');
    const hudOverlayEl = document.getElementById('hudOverlay');

    const sections = [
      null, // Home has no glass panel
      document.getElementById('section-projects'),
      document.getElementById('section-skills'),
      document.getElementById('section-about'),
      document.getElementById('section-contact')
    ];

    if (!bgWrapper || !bgLeft || !bgRight) return;

    isSplittingText = true;
    currentSectionIdx = targetIdx;
    const targetHash = sectionKeys[targetIdx];

    // Update nav link active state
    document.querySelectorAll('.hud-nav-link').forEach(link => {
      if (link.getAttribute('href') === targetHash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Hide currently active sections
    sections.forEach(sec => {
      if (sec && !sec.classList.contains('split-out')) {
        sec.classList.add('split-out');
      }
    });

    // Smoothly shift character into open screen space (right side for Projects & About, left side for Skills & Contact)
    if (heroMascotEl) {
      heroMascotEl.classList.remove('shift-right', 'shift-left');
      if (targetIdx === 1 || targetIdx === 3) {
        // Projects & About: panel is on left -> character glides to the right open space
        heroMascotEl.classList.add('shift-right');
      } else if (targetIdx === 2 || targetIdx === 4) {
        // Skills & Contact: panel is on right -> character glides to the left open space
        heroMascotEl.classList.add('shift-left');
      }
    }

    if (targetIdx === 0) {
      // Return to HOME: Join NI and VEX typography halves back into view
      bgLeft.textContent = 'NI';
      bgRight.textContent = 'VEX';

      bgWrapper.classList.add('prep-split');
      bgWrapper.classList.remove('split-out');
      if (hudOverlayEl) {
        hudOverlayEl.classList.add('prep-split');
        hudOverlayEl.classList.remove('split-out');
      }

      void bgWrapper.offsetWidth;
      if (hudOverlayEl) void hudOverlayEl.offsetWidth;

      setTimeout(() => {
        bgWrapper.classList.remove('prep-split');
        if (hudOverlayEl) hudOverlayEl.classList.remove('prep-split');
        setTimeout(releaseSplitLock, 600);
      }, 50);
    } else {
      // Fly typography apart to the edges and slide target glass panel in
      bgWrapper.classList.add('split-out');
      if (hudOverlayEl) hudOverlayEl.classList.add('split-out');

      const targetSection = sections[targetIdx];
      if (targetSection) {
        targetSection.classList.add('prep-split');
        targetSection.classList.remove('split-out');
        void targetSection.offsetWidth;

        setTimeout(() => {
          targetSection.classList.remove('prep-split');
          triggerScanSweep(targetSection);
        }, 50);
      }

      setTimeout(releaseSplitLock, 600);
    }
  }

  /* =========================================================
     7. 3D PANEL INTERACTIVE MOUSE TILT
     ========================================================= */
  function init3DPanelTilt() {
    if (reducedMotion || !hasMouseSupport) return;

    document.querySelectorAll('.section-glass-panel').forEach(panel => {
      let tiltX = 0, tiltY = 0;
      let targetTiltX = 0, targetTiltY = 0;
      let tiltRaf = null;

      function smoothTilt() {
        tiltX += (targetTiltX - tiltX) * 0.1;
        tiltY += (targetTiltY - tiltY) * 0.1;
        panel.style.setProperty('--tiltX', `${tiltX.toFixed(2)}deg`);
        panel.style.setProperty('--tiltY', `${tiltY.toFixed(2)}deg`);

        if (Math.abs(targetTiltX - tiltX) > 0.05 || Math.abs(targetTiltY - tiltY) > 0.05) {
          tiltRaf = requestAnimationFrame(smoothTilt);
        } else {
          tiltRaf = null;
        }
      }

      panel.addEventListener('mousemove', e => {
        const rect = panel.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        targetTiltX = (x - 0.5) * 20;
        targetTiltY = (y - 0.5) * -14;
        if (!tiltRaf) tiltRaf = requestAnimationFrame(smoothTilt);
      });

      panel.addEventListener('mouseleave', () => {
        targetTiltX = 0;
        targetTiltY = 0;
        if (!tiltRaf) tiltRaf = requestAnimationFrame(smoothTilt);
      });
    });
  }

  /* =========================================================
     8. SCROLL & ANIMATION RENDER LOOP
     ========================================================= */
  function updateScrollProgress() {
    const scrollTop = window.scrollY || window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (scrollProgressFill) {
      scrollProgressFill.style.height = percent + '%';
    }
  }

  function updateTargetFrame() {
    const scrollTop = window.scrollY || window.pageYOffset;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    targetScrollFraction = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;

    updateScrollProgress();

    if (!navScrolling && maxScroll > 50) {
      const sectionIndex = Math.min(4, Math.floor(targetScrollFraction * 4.99));
      if (sectionIndex !== currentSectionIdx) {
        changeBgTextSplit(sectionIndex);
      }
    }
  }

  function animationLoop(timestamp) {
    currentScrollFraction += (targetScrollFraction - currentScrollFraction) * 0.08;
    updateHeroMascot(currentScrollFraction);

    renderHeroCharacter(timestamp);
    animateParticles();
    updateMouseParallax();

    requestAnimationFrame(animationLoop);
  }

  /* =========================================================
     9. BOOT SEQUENCE & PRELOADER ORCHESTRATION
     ========================================================= */
  function runBootSequence(onComplete) {
    const bootEl = document.getElementById('bootSequence');
    if (bootEl) bootEl.classList.add('hidden');
    onComplete();
  }

  /* =========================================================
     10. INITIALIZATION & LIFECYCLE
     ========================================================= */
  let siteRevealed = false;

  function revealSite() {
    if (siteRevealed) return;
    siteRevealed = true;

    setTimeout(() => {
      if (preloader) preloader.classList.add('hidden');
    }, 200);

    initParticles();
    resizeEntranceCanvas();
    init3DPanelTilt();

    window.addEventListener('resize', () => {
      initParticles();
      resizeEntranceCanvas();
    });
    window.addEventListener('scroll', updateTargetFrame, { passive: true });
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('scrollend', () => { if (navScrolling) endNavScroll(); });

    updateTargetFrame();
    updateScrollProgress();
    currentScrollFraction = targetScrollFraction;
    requestAnimationFrame(animationLoop);

    // Continuous Monarch idle loop active from initial launch
    if (heroMascotEl) {
      heroMascotEl.classList.add('canvas-active');
      heroMascotEl.style.opacity = '1';
    }
    if (heroGroundShadowEl) {
      heroGroundShadowEl.style.transform = 'translateX(-50%) scale(1)';
      heroGroundShadowEl.style.opacity = '1';
    }
    idleLoopStartTime = performance.now();
    drawRestingHeroPose();
  }

  function startBootFlow() {
    runBootSequence(revealSite);
  }

  // --- Document Ready Handlers ---
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    // Start preloading character loop frames immediately
    preloadCharacterLoop((loaded, total) => {
      const pct = Math.floor((loaded / total) * 100);
      const loaderText = document.getElementById('loaderText');
      if (loaderText) {
        loaderText.textContent = `SYSTEM INITIALIZING // ASSETS ${pct}%`;
      }
    }, () => {
      const loaderText = document.getElementById('loaderText');
      if (loaderText) {
        loaderText.textContent = 'MONARCH READY // SYSTEM ONLINE';
      }
      revealSite();
    });

    // Return to Top on Brand Title Click
    const hudBrand = document.querySelector('.hud-brand');
    if (hudBrand) {
      hudBrand.style.cursor = 'pointer';
      hudBrand.setAttribute('title', 'NIVEX SCRIPTS // Return to Top');
      hudBrand.addEventListener('click', () => {
        playBlip(640, 0.08);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        changeBgTextSplit(0);
      });
    }

    // Ambient Audio / Music Toggle Listener
    if (ambientToggle) {
      ambientToggle.addEventListener('click', () => {
        playBlip(540, 0.06);
        if (ambientPlaying || (bgMusic && !bgMusic.paused)) {
          stopAmbient();
        } else {
          startAmbient();
        }
      });
    }

    // Discord Handle Copy Interaction
    const contactDiscordEl = document.getElementById('contactDiscord');
    if (contactDiscordEl) {
      contactDiscordEl.addEventListener('click', (e) => {
        const discordTag = '@naruto_uzumaki_2026';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(discordTag).catch(() => {});
        }
        playBlip(680, 0.08);
        const textSpan = contactDiscordEl.querySelector('.c-text');
        if (textSpan) {
          const originalText = textSpan.textContent;
          textSpan.textContent = 'COPIED TO CLIPBOARD: ' + discordTag;
          setTimeout(() => {
            textSpan.textContent = originalText;
          }, 2400);
        }
      });
    }

    // Mobile Hamburger Toggle
    if (navToggle && hudMenu) {
      navToggle.addEventListener('click', () => {
        playBlip(460, 0.04);
        const isOpen = hudMenu.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', isOpen);
      });
    }

    // Navigation Link Click Handlers
    document.querySelectorAll('.hud-nav-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (hudMenu) hudMenu.classList.remove('open');
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');

        playBlip(580, 0.06);
        const targetHash = link.getAttribute('href');
        const targetIdx = sectionKeys.indexOf(targetHash);

        if (targetIdx !== -1) {
          navScrolling = true;
          clearTimeout(navScrollTimer);
          navScrollTimer = setTimeout(endNavScroll, 1400);
          changeBgTextSplit(targetIdx);

          if (heroMascotEl) {
            heroMascotEl.classList.add('canvas-active');
            heroMascotEl.style.opacity = '1';
          }

          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          const targetScrollTop = (targetIdx / (sectionKeys.length - 1)) * maxScroll;
          window.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
        }
      });
    });

    // Fallback timer if assets take long to load
    setTimeout(startBootFlow, 1800);
  });

  window.addEventListener('load', startBootFlow);

})();
