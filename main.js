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
     4. CINEMATIC ENTRANCE & CONTINUOUS LOOP ENGINE
     Phase 1: 10s Descent entrance (nivex_frames_transparent, 99 frames)
     Phase 2B: Continuous Home Loop (new nivex frame_001 -> 150, 20 FPS)
     ========================================================= */
  const heroEntranceCanvas = document.getElementById('heroEntranceCanvas');
  const heroEntranceCtx = heroEntranceCanvas ? heroEntranceCanvas.getContext('2d') : null;
  const heroMascotEl = document.getElementById('heroMascot');
  const heroGroundShadowEl = document.getElementById('heroGroundShadow');
  const heroLandingShockwaveEl = document.getElementById('heroLandingShockwave');

  // Entrance Sequence (Original: frame_002 to frame_100, 99 frames)
  const ENTRANCE_FRAMES_COUNT = 99;
  const ENTRANCE_START_NUM = 2;
  const ENTRANCE_DURATION_MS = 10000; // 10.0s original cinematic descent & landing
  const characterEntranceFrames = new Array(ENTRANCE_FRAMES_COUNT);

  // Home Screen Continuous Loop (frame_001 to frame_150, 150 frames)
  const LOOP_FRAMES_COUNT = 150;
  const LOOP_START_NUM = 1;
  const LOOP_FRAME_MS = 50; // ~20 FPS smooth cinematic monarch idle loop (150 frames = 7.5s cycle)
  const characterLoopFrames = new Array(LOOP_FRAMES_COUNT);

  let entranceActive = false;
  let entranceStartTime = null;
  let entranceCompleted = false;
  let landingTriggered = false;
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
      // Automatic fallback to original PNG if WebP fails or is missing
      img.onerror = handleSuccess;
      img.src = `./${folder}/frame_${padNum}.png`;
    };
    img.src = `./${folder}/frame_${padNum}.webp`;
    return img;
  }

  // Progressive Priority Preloader:
  // 1. Critical Startup: Loads the initial entrance frames (16 frames) + resting hero frame.
  //    Takes under 500KB in WebP and unlocks the preloader in ~0.5s!
  // 2. Background Stream: Smoothly streams the remaining entrance frames ahead of playback,
  //    and pre-caches the 150 idle loop frames during the 10-second entrance!
  function preloadCharacterEntrance(onProgress, onDone) {
    const CRITICAL_ENTRANCE_COUNT = Math.min(16, ENTRANCE_FRAMES_COUNT);
    let criticalLoaded = 0;
    const criticalTotal = CRITICAL_ENTRANCE_COUNT + 1; // +1 for hero resting loop frame
    let criticalComplete = false;

    function checkCriticalCompletion() {
      if (criticalComplete) return;
      criticalLoaded++;
      if (onProgress) {
        onProgress(Math.min(criticalLoaded, criticalTotal), criticalTotal);
      }
      if (criticalLoaded >= criticalTotal) {
        criticalComplete = true;
        if (onDone) onDone();
        startBackgroundStreaming();
      }
    }

    // Safety timeout: Never keep the visitor waiting longer than 1.2s on preloader!
    setTimeout(() => {
      if (!criticalComplete) {
        criticalComplete = true;
        if (onDone) onDone();
        startBackgroundStreaming();
      }
    }, 1200);

    // 1. Preload hero resting loop frame (frame_001) for instant mascot visibility
    characterLoopFrames[0] = loadFrameImage('nivex2_100_transparent_frames', LOOP_START_NUM, checkCriticalCompletion);

    // 2. Preload the initial critical entrance frames
    for (let i = 0; i < CRITICAL_ENTRANCE_COUNT; i++) {
      const frameNum = ENTRANCE_START_NUM + i;
      characterEntranceFrames[i] = loadFrameImage('nivex_frames_transparent', frameNum, checkCriticalCompletion);
    }

    // 3. Staggered background streaming queue
    function startBackgroundStreaming() {
      let entranceIdx = CRITICAL_ENTRANCE_COUNT;
      let loopIdx = 1;

      // Stream remaining entrance frames (frames 16 to 98) in small priority chunks
      function streamNextEntranceChunk() {
        if (entranceIdx >= ENTRANCE_FRAMES_COUNT) {
          // Entrance fully loaded; now stream idle loop frames (1 to 149)
          streamNextLoopChunk();
          return;
        }

        const chunkEnd = Math.min(entranceIdx + 4, ENTRANCE_FRAMES_COUNT);
        let chunkLoaded = 0;
        const chunkSize = chunkEnd - entranceIdx;

        for (let i = entranceIdx; i < chunkEnd; i++) {
          const frameNum = ENTRANCE_START_NUM + i;
          characterEntranceFrames[i] = loadFrameImage('nivex_frames_transparent', frameNum, () => {
            chunkLoaded++;
            if (chunkLoaded >= chunkSize) {
              entranceIdx = chunkEnd;
              if (window.requestIdleCallback) {
                window.requestIdleCallback(streamNextEntranceChunk, { timeout: 100 });
              } else {
                setTimeout(streamNextEntranceChunk, 16);
              }
            }
          });
        }
      }

      // Stream loop frames in small background chunks
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
                window.requestIdleCallback(streamNextLoopChunk, { timeout: 150 });
              } else {
                setTimeout(streamNextLoopChunk, 20);
              }
            }
          });
        }
      }

      // Start streaming remaining frames
      if (window.requestIdleCallback) {
        window.requestIdleCallback(streamNextEntranceChunk, { timeout: 100 });
      } else {
        setTimeout(streamNextEntranceChunk, 20);
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

  // Deep cyber bass sound on monarch landing
  function playTouchdownSound() {
    try {
      initAudioContext();
      if (!ambientCtx) return;
      const now = ambientCtx.currentTime;
      const osc = ambientCtx.createOscillator();
      const gain = ambientCtx.createGain();
      const filter = ambientCtx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.9);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.9);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ambientCtx.destination);

      osc.start(now);
      osc.stop(now + 1.3);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // Determine if entrance animation should run (link open or refresh on home)
  function shouldRunEntranceAnimation() {
    const isHomeHash = window.location.hash === '' || window.location.hash === '#home';
    const isTopScroll = (window.scrollY || window.pageYOffset || 0) <= 150;
    return isHomeHash && isTopScroll;
  }

  // Start the 10-second entrance animation
  function startHeroEntranceAnimation() {
    if (reducedMotion) {
      entranceCompleted = true;
      transitionCompleted = true;
      if (heroMascotEl) heroMascotEl.classList.add('canvas-active');
      drawRestingHeroPose();
      return;
    }

    if (heroMascotEl) {
      heroMascotEl.classList.add('canvas-active');
      heroMascotEl.style.opacity = '1';
    }
    resizeEntranceCanvas();

    entranceActive = true;
    entranceCompleted = false;
    landingTriggered = false;
    idleLoopStartTime = null;
    entranceStartTime = performance.now();

    // Prepare ground shadow for touchdown
    if (heroGroundShadowEl) {
      heroGroundShadowEl.style.transform = 'translateX(-50%) scale(0.18)';
      heroGroundShadowEl.style.opacity = '0.1';
    }
  }

  // Render Character on Canvas: Entrance -> Eye Awakening -> Continuous Loop
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
    // ALL phases share the EXACT same scale and ground coordinates.
    // Ground level, center X, and character height are 100% locked so the character NEVER shifts, jumps, or resizes.
    const charScale = targetCharHeight / 1060;
    const renderW = 1920 * charScale;
    const renderH = 1080 * charScale;
    const charBaseX = (cw / 2) - (960 * charScale);
    const charBaseY = groundY - (1079 * charScale);

    // Exact sub-pixel calibration between Phase 1 final stance and Phase 2B idle loop art
    // In the raw 1920x1080 assets, Phase 2B's spine and head are drawn 12px to the left of Phase 1 frame_100.
    // By offsetting Phase 2B by +12 * charScale (X) and +1 * charScale (Y),
    // Phase 2B lands on the EXACT same screen pixels as Phase 1 with ZERO perceivable shift!
    const phase2bOffsetX = 12 * charScale;
    const phase2bOffsetY = 1 * charScale;

    // Mouse parallax tracking
    const parallaxX = mouseCurrX * 12;
    const rawParallaxY = mouseCurrY * 5;

    let imgToDraw = null;
    let currentOffsetY = 0;
    let drawX = charBaseX + parallaxX;
    let drawY = charBaseY + rawParallaxY;
    let drawW = renderW;
    let drawH = renderH;

    // Cross-fade state for imperceptible smooth transitions between phases
    let isCrossFading = false;
    let crossFadeImageA = null;
    let crossFadeImageB = null;
    let crossFadeAlphaB = 0;
    let crossFadeAX = drawX;
    let crossFadeAY = drawY;
    let crossFadeBX = drawX + phase2bOffsetX;
    let crossFadeBY = drawY + phase2bOffsetY;
    let entranceProgress = 0;

    if (entranceActive && entranceStartTime !== null) {
      // ==========================================================
      // PHASE 1: 10-SECOND CINEMATIC DESCENT, LANDING & STAND-UP
      // Folder: nivex_frames_transparent (99 frames)
      // ==========================================================
      const elapsed = timestamp - entranceStartTime;
      const progress = Math.min(1, elapsed / ENTRANCE_DURATION_MS);
      entranceProgress = progress;

      let frameIdx = 98; // frame_100

      if (progress < 0.38) {
        // 1. Fall from sky: frames 0 to 42 (aerial descent)
        const p = progress / 0.38;
        frameIdx = Math.floor(p * 42);

        // Smooth cubic ease-out descent
        const maxOffset = -(charBaseY + 140);
        const ease = 1 - Math.pow(1 - p, 3);
        currentOffsetY = maxOffset * (1 - ease);

        // Ground shadow scales up as he approaches ground
        if (heroGroundShadowEl) {
          const shadowScale = 0.25 + ease * 0.75;
          heroGroundShadowEl.style.transform = `translateX(-50%) scale(${shadowScale.toFixed(3)})`;
          heroGroundShadowEl.style.opacity = (0.25 + ease * 0.75).toFixed(3);
        }

        drawX = charBaseX + parallaxX;
        drawY = charBaseY + currentOffsetY + rawParallaxY;
        frameIdx = Math.min(ENTRANCE_FRAMES_COUNT - 1, Math.max(0, frameIdx));
        imgToDraw = characterEntranceFrames[frameIdx];

      } else if (progress < 0.54) {
        // 2. Touchdown & Flare (3.8s - 5.4s): frames 42 to 68
        const p = (progress - 0.38) / 0.16;
        frameIdx = 42 + Math.floor(p * 26);
        currentOffsetY = 0;

        // Trigger landing impact FX once at touchdown
        if (!landingTriggered) {
          landingTriggered = true;
          playTouchdownSound();
          if (heroGroundShadowEl) {
            heroGroundShadowEl.style.transform = 'translateX(-50%) scale(1.22)';
            heroGroundShadowEl.style.opacity = '1';
            setTimeout(() => {
              if (heroGroundShadowEl) heroGroundShadowEl.style.transform = 'translateX(-50%) scale(1.0)';
            }, 500);
          }
          if (heroLandingShockwaveEl) {
            heroLandingShockwaveEl.classList.remove('active');
            void heroLandingShockwaveEl.offsetWidth; // trigger reflow
            heroLandingShockwaveEl.classList.add('active');
          }
        }

        drawX = charBaseX + parallaxX;
        drawY = charBaseY + rawParallaxY;
        frameIdx = Math.min(ENTRANCE_FRAMES_COUNT - 1, Math.max(0, frameIdx));
        imgToDraw = characterEntranceFrames[frameIdx];

      } else if (progress < 0.985) {
        // 3. Smooth continuous rise into standing stance (5.4s - 9.85s): frames 68 to 98 (CONTINUOUS FLUID MOTION!)
        const p = (progress - 0.54) / 0.445;
        frameIdx = 68 + Math.floor(p * 30);
        currentOffsetY = 0;

        drawX = charBaseX + parallaxX;
        drawY = charBaseY + rawParallaxY;
        frameIdx = Math.min(ENTRANCE_FRAMES_COUNT - 1, Math.max(0, frameIdx));
        imgToDraw = characterEntranceFrames[frameIdx];

      } else {
        // 4. 9.85s - 10.0s: Imperceptible 150ms micro-handoff directly into Phase 2B idle cycle
        // Eliminates slow ghosting/dissolve, keeping the character fully opaque and continuously alive!
        const t = (progress - 0.985) / 0.015;
        const s = t * t * (3 - 2 * t);

        isCrossFading = true;
        crossFadeImageA = characterEntranceFrames[98];
        crossFadeImageB = characterLoopFrames[0];
        crossFadeAlphaB = s;
        crossFadeAX = charBaseX + parallaxX;
        crossFadeAY = charBaseY + rawParallaxY;
        crossFadeBX = charBaseX + phase2bOffsetX + parallaxX;
        crossFadeBY = charBaseY + phase2bOffsetY + rawParallaxY;
      }

      // Seamless direct hand-off from Phase 1 landing straight into Phase 2B idle loop
      if (progress >= 1.0) {
        entranceActive = false;
        entranceCompleted = true;
        idleLoopStartTime = timestamp;
      }

    } else {
      // ==========================================================
      // PHASE 2B: CONTINUOUS MONARCH IDLE LOOP (150 FRAMES)
      // Plays continuously on home at ~20 FPS (calm, majestic continuous loop)
      // Character is placed at the exact same screen position where Phase 1 ended!
      // ==========================================================
      currentOffsetY = 0;
      if (heroGroundShadowEl && !heroGroundShadowEl.style.transform.includes('1.22')) {
        heroGroundShadowEl.style.transform = 'translateX(-50%) scale(1.0)';
        heroGroundShadowEl.style.opacity = '1';
      }

      // Smooth 20 FPS continuous loop (50ms per frame, 150 frames = 7.5s cycle)
      const loopElapsed = idleLoopStartTime ? (timestamp - idleLoopStartTime) : timestamp;
      const loopFrameIdx = Math.floor((loopElapsed / LOOP_FRAME_MS) % LOOP_FRAMES_COUNT);

      imgToDraw = characterLoopFrames[loopFrameIdx];

      drawX = charBaseX + phase2bOffsetX + parallaxX;
      drawY = charBaseY + phase2bOffsetY + rawParallaxY;
      drawW = renderW;
      drawH = renderH;
    }

    // Render pass
    if (isCrossFading) {
      if (crossFadeImageA && crossFadeImageA.complete && crossFadeImageA.naturalWidth > 0) {
        heroEntranceCtx.globalAlpha = Math.max(0, 1 - crossFadeAlphaB);
        heroEntranceCtx.drawImage(crossFadeImageA, crossFadeAX, crossFadeAY, drawW, drawH);
      }
      if (crossFadeImageB && crossFadeImageB.complete && crossFadeImageB.naturalWidth > 0) {
        heroEntranceCtx.globalAlpha = Math.min(1, crossFadeAlphaB);
        heroEntranceCtx.drawImage(crossFadeImageB, crossFadeBX, crossFadeBY, drawW, drawH);
      }
      heroEntranceCtx.globalAlpha = 1.0;
    } else {
      // Smart Playhead Fallback:
      // If the targeted frame is still downloading, find the closest previously completed frame in sequence.
      // This guarantees 100% fluid, zero-flicker, rock-solid rendering on any network connection!
      if (!imgToDraw || !imgToDraw.complete || imgToDraw.naturalWidth === 0) {
        if (entranceActive && entranceStartTime !== null) {
          for (let f = frameIdx - 1; f >= 0; f--) {
            const cand = characterEntranceFrames[f];
            if (cand && cand.complete && cand.naturalWidth > 0) {
              imgToDraw = cand;
              break;
            }
          }
        } else {
          for (let f = loopFrameIdx - 1; f >= 0; f--) {
            const cand = characterLoopFrames[f];
            if (cand && cand.complete && cand.naturalWidth > 0) {
              imgToDraw = cand;
              break;
            }
          }
        }

        if (!imgToDraw || !imgToDraw.complete || imgToDraw.naturalWidth === 0) {
          if (characterLoopFrames[0] && characterLoopFrames[0].complete && characterLoopFrames[0].naturalWidth > 0) {
            imgToDraw = characterLoopFrames[0];
            drawX = charBaseX + phase2bOffsetX + parallaxX;
            drawY = charBaseY + phase2bOffsetY + rawParallaxY;
          } else if (characterEntranceFrames[98] && characterEntranceFrames[98].complete && characterEntranceFrames[98].naturalWidth > 0) {
            imgToDraw = characterEntranceFrames[98];
            drawX = charBaseX + parallaxX;
            drawY = charBaseY + rawParallaxY;
          }
        }
      }

      // Draw character frame (animated flame, eyes, dynamic motion)
      if (imgToDraw && imgToDraw.complete && imgToDraw.naturalWidth > 0) {
        heroEntranceCtx.drawImage(imgToDraw, drawX, drawY, drawW, drawH);
      }
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

    // When navigating to any section, ensure Phase 2B continuous idle animation is active and looping
    if (targetIdx !== 0 && entranceActive) {
      entranceActive = false;
      entranceCompleted = true;
      idleLoopStartTime = performance.now();
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

    // If at Home (first link open or refresh on home), trigger the 10-second entrance!
    if (shouldRunEntranceAnimation()) {
      startHeroEntranceAnimation();
    } else {
      if (heroMascotEl) heroMascotEl.classList.add('canvas-active');
      entranceActive = false;
      entranceCompleted = true;
      idleLoopStartTime = performance.now();
      drawRestingHeroPose();
    }
  }

  function startBootFlow() {
    runBootSequence(revealSite);
  }

  // --- Document Ready Handlers ---
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    // Start preloading character frames immediately
    preloadCharacterEntrance((loaded, total) => {
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

    // Replay Entrance on Brand Title Click
    const hudBrand = document.querySelector('.hud-brand');
    if (hudBrand) {
      hudBrand.style.cursor = 'pointer';
      hudBrand.setAttribute('title', 'Replay Character Entrance Animation');
      hudBrand.addEventListener('click', () => {
        playBlip(640, 0.08);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        changeBgTextSplit(0);
        setTimeout(startHeroEntranceAnimation, 300);
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
