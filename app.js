/* ==========================================================================
   CLEAR_SEE - Interactive Frontend Controller & Simulation Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- State Variables ---
  let activeTab = 'overview';
  let activeRegion = 'shillong';
  let activeModel = 'diffusion';
  let reconstructionFidelity = 90;
  let sarWeight = 75;
  let showCloudMask = false;
  let showSarGuidance = true;
  let isDraggingSlider = false;
  let sliderPosition = 50; // percentage from left (0 to 100)

  // --- DOM Elements ---
  const navItems = document.querySelectorAll('.nav-menu .nav-item');
  const tabContents = document.querySelectorAll('.tab-content');
  const dynamicPageTitle = document.getElementById('dynamic-page-title');
  const dynamicPageDesc = document.getElementById('dynamic-page-desc');
  
  const regionSelector = document.getElementById('region-selector');
  const modelBtns = document.querySelectorAll('.model-btn');
  const sliderFidelity = document.getElementById('slider-fidelity');
  const sliderFidelityVal = document.getElementById('slider-fidelity-val');
  const sliderSar = document.getElementById('slider-sar');
  const sliderSarVal = document.getElementById('slider-sar-val');
  const toggleCloudMask = document.getElementById('toggle-cloud-mask');
  const toggleSarGuide = document.getElementById('toggle-sar-guide');
  const btnReconstruct = document.getElementById('btn-reconstruct');
  
  const sliderContainer = document.getElementById('slider-container');
  const sliderOverlay = document.getElementById('slider-overlay');
  const sliderDivider = document.getElementById('slider-divider');
  const rightLabelName = document.getElementById('right-label-name');
  
  const canvasCloudy = document.getElementById('canvas-cloudy');
  const canvasReconstructed = document.getElementById('canvas-reconstructed');
  
  const infoRegionName = document.getElementById('info-region-name');
  const infoCoords = document.getElementById('info-coords');
  
  // Processing Overlay Elements
  const processingOverlay = document.getElementById('processing-overlay');
  const processingStatusText = document.getElementById('processing-status-text');
  
  // Quantitative Metrics Elements
  const valSsim = document.getElementById('val-ssim');
  const valPsnr = document.getElementById('val-psnr');
  const valSam = document.getElementById('val-sam');
  const valF1 = document.getElementById('val-f1');

  // --- Page Definitions ---
  const pageTitles = {
    overview: {
      title: 'Overview & Context',
      desc: 'CLEAR_SEE: See through every cloud — Generative AI-based Cloud Removal & Surface Reconstruction'
    },
    agent: {
      title: 'Problem AI Agent | AeroSense-10',
      desc: 'Autonomous intelligence agent explaining optical cloud degradation, Mie scattering, SAR penetration physics, and generative inpainting challenges'
    },
    sandbox: {
      title: 'Interactive Sandbox Simulator',
      desc: 'Simulate, adjust, and compare Generative AI reconstructions using multi-modal sensor inputs'
    },
    architectures: {
      title: 'Deep Learning Model Architectures',
      desc: 'Technical structure of Latent Diffusion Models, Transformers, and GANs utilized in LISS-IV recovery'
    },
    metrics: {
      title: 'Quantitative Performance Analytics',
      desc: 'Spectral consistency curves, SSIM/PSNR comparisons, and Land Use-Land Cover classification enhancement metrics'
    },
    details: {
      title: 'Technical Specs & Satellite Details',
      desc: 'Detailed specifications of ISRO LISS-IV cameras, Sentinel-1 SAR configurations, and NER constraints'
    },
    threedee: {
      title: '3D Depth & Terrestrial Dehazing',
      desc: 'Interactive 3D elevation wireframe rendering and single-image terrestrial dehazing parallax'
    }
  };

  // --- Region Coords Map ---
  const regionCoords = {
    shillong: { name: 'Shillong (Valley & Forest)', coords: '25.5788° N, 91.8931° E' },
    cherrapunji: { name: 'Cherrapunji (Extreme Clouds)', coords: '25.2702° N, 91.7323° E' },
    guwahati: { name: 'Guwahati (Urban / Brahmaputra)', coords: '26.1445° N, 91.7362° E' },
    gangtok: { name: 'Gangtok (Mountain Snow Peaks)', coords: '27.3314° N, 88.6138° E' }
  };

  // --- Background Image Mapping for Tabs ---
  const tabBackgrounds = {
    overview: '/bg_overview.jpg',
    agent: '/bg_overview.jpg',
    sandbox: '/bg_sandbox.jpg',
    threedee: '/bg_threedee.png',
    architectures: '/bg_threedee.png',
    metrics: '/bg_sandbox.jpg',
    details: '/bg_overview.jpg'
  };

  const bgLayer = document.getElementById('parallax-bg-layer');

  function updateTabBackground(tabId) {
    if (!bgLayer) return;
    const bgImg = tabBackgrounds[tabId] || '/bg_overview.jpg';
    bgLayer.style.backgroundImage = `url('${bgImg}')`;
  }

  // --- Smooth Parallax Mouse & Scroll Movement ---
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  window.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5);
    targetY = (e.clientY / window.innerHeight - 0.5);
  });

  function updateParallaxPosition() {
    mouseX += (targetX - mouseX) * 0.1;
    mouseY += (targetY - mouseY) * 0.1;

    const scrollY = window.scrollY || document.documentElement.scrollTop;
    
    if (bgLayer) {
      bgLayer.style.transform = `translate3d(${mouseX * -75}px, ${mouseY * -55 - scrollY * 0.18}px, 0) scale(1.08)`;
    }

    requestAnimationFrame(updateParallaxPosition);
  }

  updateParallaxPosition();

  // --- Tab Navigation Logic ---
  window.switchTab = function(tabId) {
    activeTab = tabId;
    updateTabBackground(tabId);
    
    // Update active tab link styling
    navItems.forEach(item => {
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Toggle tab visibility
    tabContents.forEach(content => {
      if (content.id === tabId) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    // Update headers
    if (pageTitles[tabId]) {
      if (dynamicPageTitle) dynamicPageTitle.innerText = pageTitles[tabId].title;
      if (dynamicPageDesc) dynamicPageDesc.innerText = pageTitles[tabId].desc;
    }

    // Update floating agent context
    if (typeof updateFloatingAgentContext === 'function') {
      updateFloatingAgentContext(tabId);
    }

    // Trigger Problem AI Agent initialization if selected
    if (tabId === 'agent') {
      setTimeout(initAgentTab, 50);
    }

    // Trigger canvas resize and rendering if sandbox is selected
    if (tabId === 'sandbox') {
      setTimeout(resizeCanvases, 100);
    }
    
    // Trigger chart animation if metrics is selected
    if (tabId === 'metrics') {
      animateLulcCharts();
    }

    // Trigger 3D and Dehazing init if threedee is selected
    if (tabId === 'threedee') {
      setTimeout(initThreeDeeTab, 100);
    }
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // --- Setup Canvas Resizing ---
  function resizeCanvases() {
    if (!sliderContainer) return;
    const rect = sliderContainer.getBoundingClientRect();
    
    // Adjust canvas elements size to match CSS container
    [canvasCloudy, canvasReconstructed].forEach(canvas => {
      if (canvas) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    });

    renderSandboxVisuals();
    updateComparisonSlider();
  }

  window.addEventListener('resize', () => {
    if (activeTab === 'sandbox') {
      resizeCanvases();
    }
  });

  // --- Procedural Canvas Image Generator ---
  // Generates realistic satellite features (Forests, Rivers, Urban grids, Mountains, Clouds)
  function renderSandboxVisuals() {
    if (!canvasCloudy || !canvasReconstructed) return;
    const width = canvasCloudy.width;
    const height = canvasCloudy.height;

    const ctxCloudy = canvasCloudy.getContext('2d');
    const ctxReconstructed = canvasReconstructed.getContext('2d');

    if (width === 0 || height === 0) return;

    // Clear canvases
    ctxCloudy.clearRect(0, 0, width, height);
    ctxReconstructed.clearRect(0, 0, width, height);

    // 1. Draw Base Clear Optical Ground Truth (Reconstructed Canvas base)
    drawGroundTruth(ctxReconstructed, activeRegion);

    // 2. If Generative artifacts apply, morph the reconstructed canvas
    applyModelReconstructionEffects(ctxReconstructed, width, height, activeModel, reconstructionFidelity);

    // 3. Draw SAR Guidance overlay on Reconstructed if toggled
    if (showSarGuidance) {
      drawSarGridOverlay(ctxReconstructed, width, height);
    }

    // 4. Draw Cloudy canvas: starts with the clear base ground truth
    drawGroundTruth(ctxCloudy, activeRegion);

    // Add Clouds and Shadows to Cloudy canvas
    drawCloudsAndShadows(ctxCloudy, activeRegion, showCloudMask);
  }

  // --- Draw Landscape Features ---
  function drawGroundTruth(ctx, region) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Base background colors (vegetation green or valley brown)
    let fillStyle = '#143d22'; // Deep forest
    if (region === 'gangtok') fillStyle = '#2f3d32'; // High pine forest/rock
    if (region === 'guwahati') fillStyle = '#2d4c1b'; // agricultural green
    if (region === 'cherrapunji') fillStyle = '#1b3823'; // dark wet gorges
    
    ctx.fillStyle = fillStyle;
    ctx.fillRect(0, 0, w, h);

    // Draw mountains, ridges, valleys
    ctx.shadowBlur = 0;
    
    if (region === 'shillong' || region === 'cherrapunji' || region === 'gangtok') {
      // Draw mountain folds
      ctx.fillStyle = 'rgba(25, 48, 30, 0.5)';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.3);
      ctx.lineTo(w * 0.4, h * 0.1);
      ctx.lineTo(w * 0.8, h * 0.5);
      ctx.lineTo(w, h * 0.2);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Opposite mountain ridge (casting shadow)
      ctx.fillStyle = 'rgba(10, 24, 15, 0.6)';
      ctx.beginPath();
      ctx.moveTo(w, h * 0.6);
      ctx.lineTo(w * 0.6, h * 0.8);
      ctx.lineTo(w * 0.2, h * 0.4);
      ctx.lineTo(0, h * 0.7);
      ctx.lineTo(0, h);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    }

    // Draw rivers/water bodies (rivers are dark blue/cyan with sandbanks)
    if (region === 'guwahati') {
      // Brahmaputra is a massive, wide winding river
      ctx.strokeStyle = '#1d4ed8'; // deep blue
      ctx.lineWidth = 90;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-50, h * 0.4);
      ctx.bezierCurveTo(w * 0.3, h * 0.2, w * 0.6, h * 0.7, w + 50, h * 0.45);
      ctx.stroke();

      // Sandbanks inside river (Brahmaputra chars)
      ctx.fillStyle = '#b45309'; // Sand brown
      ctx.beginPath();
      ctx.ellipse(w * 0.25, h * 0.31, 40, 15, Math.PI / 10, 0, Math.PI * 2);
      ctx.ellipse(w * 0.6, h * 0.52, 60, 20, -Math.PI / 8, 0, Math.PI * 2);
      ctx.ellipse(w * 0.78, h * 0.49, 30, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rivers are light blue/green details
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 80;
      ctx.beginPath();
      ctx.moveTo(-50, h * 0.4);
      ctx.bezierCurveTo(w * 0.3, h * 0.2, w * 0.6, h * 0.7, w + 50, h * 0.45);
      ctx.stroke();
    } else {
      // Normal winding mountain rivers
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-10, h * 0.1);
      ctx.lineTo(w * 0.3, h * 0.25);
      ctx.lineTo(w * 0.45, h * 0.5);
      ctx.lineTo(w * 0.7, h * 0.6);
      ctx.lineTo(w + 10, h * 0.95);
      ctx.stroke();

      // River branch
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(w * 0.45, h * 0.5);
      ctx.lineTo(w * 0.2, h * 0.75);
      ctx.lineTo(w * 0.1, h * 0.99);
      ctx.stroke();
    }

    // Draw Urban Settlements (grids of red/grey/yellow pixels)
    if (region === 'guwahati') {
      // Guwahati city blocks (large urban grids)
      drawCityBlocks(ctx, w * 0.15, h * 0.6, 120, 100);
      drawCityBlocks(ctx, w * 0.7, h * 0.15, 150, 120);
      drawCityBlocks(ctx, w * 0.5, h * 0.75, 100, 90);
    } else if (region === 'shillong') {
      // Scattered town clusters in valleys
      drawCityBlocks(ctx, w * 0.2, h * 0.35, 60, 50);
      drawCityBlocks(ctx, w * 0.55, h * 0.65, 80, 60);
    } else if (region === 'gangtok') {
      // Mountain village terracing
      drawCityBlocks(ctx, w * 0.35, h * 0.55, 45, 40);
    }

    // Draw Snow Capped Peaks for Gangtok
    if (region === 'gangtok') {
      ctx.fillStyle = 'rgba(241, 245, 249, 0.95)'; // Snow white
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Peak 1
      ctx.moveTo(w * 0.1, h * 0.1);
      ctx.lineTo(w * 0.25, h * 0.05);
      ctx.lineTo(w * 0.4, h * 0.25);
      ctx.lineTo(w * 0.3, h * 0.3);
      ctx.lineTo(w * 0.18, h * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Peak 2 (Highest)
      ctx.beginPath();
      ctx.moveTo(w * 0.75, h * 0.2);
      ctx.lineTo(w * 0.88, h * 0.08);
      ctx.lineTo(w * 0.98, h * 0.25);
      ctx.lineTo(w * 0.9, h * 0.35);
      ctx.lineTo(w * 0.82, h * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Draw Agricultural fields (regular rectangular patches)
    if (region === 'guwahati' || region === 'shillong') {
      ctx.fillStyle = 'rgba(190, 242, 100, 0.25)'; // Light lime green
      ctx.strokeStyle = 'rgba(163, 230, 53, 0.3)';
      ctx.lineWidth = 1;
      
      const fieldCount = region === 'guwahati' ? 12 : 5;
      const startX = region === 'guwahati' ? w * 0.1 : w * 0.7;
      const startY = region === 'guwahati' ? h * 0.15 : h * 0.2;
      
      for (let i = 0; i < fieldCount; i++) {
        const row = Math.floor(i / 4);
        const col = i % 4;
        ctx.fillRect(startX + col * 25, startY + row * 18, 22, 15);
        ctx.strokeRect(startX + col * 25, startY + row * 18, 22, 15);
      }
    }
  }

  // Draw grid cluster of urban rectangles
  function drawCityBlocks(ctx, x, y, width, height) {
    ctx.save();
    ctx.translate(x, y);
    
    const size = 6;
    const gap = 2;
    const cols = Math.floor(width / (size + gap));
    const rows = Math.floor(height / (size + gap));
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Render 85% density of buildings
        if (Math.random() > 0.15) {
          const buildingColors = ['#94a3b8', '#cbd5e1', '#b45309', '#f97316', '#78716c'];
          ctx.fillStyle = buildingColors[Math.floor(Math.random() * buildingColors.length)];
          ctx.fillRect(c * (size + gap), r * (size + gap), size, size);
        }
      }
    }
    ctx.restore();
  }

  // --- Render Clouds and Shadows (for the Cloudy Canvas) ---
  function drawCloudsAndShadows(ctx, region, overlayMask) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Define cloud clusters based on region severity
    let cloudClusters = [];
    
    if (region === 'shillong') {
      cloudClusters = [
        { cx: w * 0.2, cy: h * 0.3, r: 85 },
        { cx: w * 0.3, cy: h * 0.25, r: 60 },
        { cx: w * 0.7, cy: h * 0.6, r: 90 },
        { cx: w * 0.75, cy: h * 0.7, r: 75 },
        { cx: w * 0.8, cy: h * 0.55, r: 60 }
      ];
    } else if (region === 'cherrapunji') {
      // Extremely heavy clouds cover almost everything
      cloudClusters = [
        { cx: w * 0.15, cy: h * 0.2, r: 120 },
        { cx: w * 0.3, cy: h * 0.35, r: 150 },
        { cx: w * 0.45, cy: h * 0.25, r: 110 },
        { cx: w * 0.6, cy: h * 0.55, r: 140 },
        { cx: w * 0.75, cy: h * 0.7, r: 160 },
        { cx: w * 0.85, cy: h * 0.4, r: 120 },
        { cx: w * 0.5, cy: h * 0.8, r: 130 }
      ];
    } else if (region === 'guwahati') {
      // Scattered smaller clouds
      cloudClusters = [
        { cx: w * 0.1, cy: h * 0.5, r: 50 },
        { cx: w * 0.15, cy: h * 0.52, r: 40 },
        { cx: w * 0.5, cy: h * 0.3, r: 70 },
        { cx: w * 0.85, cy: h * 0.75, r: 65 }
      ];
    } else if (region === 'gangtok') {
      // Moderate sized clouds (blends in with snow)
      cloudClusters = [
        { cx: w * 0.22, cy: h * 0.18, r: 75 }, // overlays Peak 1 snow
        { cx: w * 0.45, cy: h * 0.65, r: 95 },
        { cx: w * 0.55, cy: h * 0.7, r: 70 },
        { cx: w * 0.8, cy: h * 0.25, r: 80 } // overlays Peak 2 snow
      ];
    }

    // Sun illumination direction offset for shadows: shifted down (+dy) and right (+dx)
    const dx = 25;
    const dy = 30;

    // 1. Draw Cloud Shadows first (semi-transparent black with soft edges)
    cloudClusters.forEach(c => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(c.cx + dx, c.cy + dy, c.r * 1.05, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.restore();
    });

    // 2. Draw Cloud Puffs (white gradients, soft boundaries)
    cloudClusters.forEach(c => {
      ctx.save();
      const radGrad = ctx.createRadialGradient(
        c.cx - c.r * 0.2, c.cy - c.r * 0.2, c.r * 0.1,
        c.cx, c.cy, c.r
      );
      radGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');      // saturated white center
      radGrad.addColorStop(0.2, 'rgba(250, 250, 250, 0.95)');
      radGrad.addColorStop(0.7, 'rgba(235, 240, 245, 0.85)'); // light gray core
      radGrad.addColorStop(1, 'rgba(220, 230, 240, 0)');     // transparent fluffy edge

      ctx.beginPath();
      ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
      ctx.fillStyle = radGrad;
      ctx.fill();
      ctx.restore();
    });

    // 3. Draw Segmentation Cloud Mask Overlay if toggled (yellow/orange overlay boundary)
    if (overlayMask) {
      cloudClusters.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.cx + dx*0.5, c.cy + dy*0.5, c.r * 1.08, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)'; // amber fill
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)'; // amber dashed boundary
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }
  }

  // --- Apply Model Reconstruction Artefacts to Output Canvas ---
  function applyModelReconstructionEffects(ctx, w, h, model, fidelity) {
    const scale = fidelity / 100;
    
    if (model === 'diffusion') {
      // Latent Diffusion - Near perfect reconstruction.
      if (scale < 0.95) {
        // Just very minor noise at lower slider values
        addSpeckleNoise(ctx, w, h, (1 - scale) * 0.05);
      }
    } 
    else if (model === 'transformer') {
      // Transformer - Good reconstruction, but blocky patch artifacts if fidelity is not 100%
      const patchGrid = 16; // 16x16 pixel patches
      const opacity = (1 - scale) * 0.4;
      
      if (opacity > 0) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.15})`;
        ctx.lineWidth = 0.5;
        for (let x = 0; x < w; x += patchGrid) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += patchGrid) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Apply slight grid blur
        ctx.save();
        ctx.filter = `blur(${(1 - scale) * 2}px)`;
        ctx.drawImage(ctx.canvas, 0, 0);
        ctx.restore();
      }
    } 
    else if (model === 'cyclegan') {
      // CycleGAN - Unpaired translation, exhibits blurring and slight color distortion
      ctx.save();
      // Apply blur proportional to inverse fidelity
      const blurAmount = (1 - scale) * 6 + 1.5; // at 90% = 2.1px, at 50% = 4.5px
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.drawImage(ctx.canvas, 0, 0);
      ctx.restore();

      // CycleGAN color shifts (spectral mismatch) - shifting overall hue towards yellow/green tint
      ctx.fillStyle = `rgba(163, 230, 53, ${(1 - scale) * 0.15 + 0.05})`; // yellow green overlay tint
      ctx.globalCompositeOperation = 'color';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over'; // restore
    }
  }

  // Draw speckle noise on canvas (resembles minor reconstruction artifacts)
  function addSpeckleNoise(ctx, w, h, amount) {
    if (amount <= 0) return;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const limit = amount * 255;
    
    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() < amount) {
        const noise = (Math.random() - 0.5) * limit;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));     // R
        data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise)); // G
        data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise)); // B
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // --- Draw Sentinel-1 SAR Guidance Scan Lines overlay ---
  function drawSarGridOverlay(ctx, w, h) {
    ctx.save();
    // Green HUD overlay showing SAR radar penetration grid
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.04)'; // faint green grid
    ctx.lineWidth = 1;
    const gridSize = 40;
    
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw little SAR crosshair markers in the corners
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.lineWidth = 1.5;
    const padding = 15;
    const size = 10;
    
    // Top Left
    ctx.beginPath();
    ctx.moveTo(padding, padding + size);
    ctx.lineTo(padding, padding);
    ctx.lineTo(padding + size, padding);
    ctx.stroke();

    // Top Right
    ctx.beginPath();
    ctx.moveTo(w - padding, padding + size);
    ctx.lineTo(w - padding, padding);
    ctx.lineTo(w - padding - size, padding);
    ctx.stroke();

    // Bottom Left
    ctx.beginPath();
    ctx.moveTo(padding, h - padding - size);
    ctx.lineTo(padding, h - padding);
    ctx.lineTo(padding + size, h - padding);
    ctx.stroke();

    // Bottom Right
    ctx.beginPath();
    ctx.moveTo(w - padding, h - padding - size);
    ctx.lineTo(w - padding, h - padding);
    ctx.lineTo(w - padding - size, h - padding);
    ctx.stroke();

    ctx.restore();
  }

  // --- Interactive Slider Handle Logic ---
  function updateComparisonSlider() {
    if (!sliderDivider || !sliderOverlay) return;
    if (sliderPosition < 0) sliderPosition = 0;
    if (sliderPosition > 100) sliderPosition = 100;
    
    // Move divider bar
    sliderDivider.style.left = `${sliderPosition}%`;
    
    // Crop overlay width (Reconstructed side is right side)
    sliderOverlay.style.clipPath = `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`;
  }

  // Handle Dragging Events
  function getMouseX(e) {
    if (!sliderContainer) return 0;
    const rect = sliderContainer.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return clientX - rect.left;
  }

  function handleSliderMove(e) {
    if (!isDraggingSlider || !sliderContainer) return;
    const mouseX = getMouseX(e);
    const containerWidth = sliderContainer.getBoundingClientRect().width;
    if (containerWidth === 0) return;
    sliderPosition = (mouseX / containerWidth) * 100;
    updateComparisonSlider();
  }

  if (sliderContainer) {
    sliderContainer.addEventListener('mousedown', (e) => {
      isDraggingSlider = true;
      const mouseX = getMouseX(e);
      const containerWidth = sliderContainer.getBoundingClientRect().width;
      if (containerWidth > 0) {
        sliderPosition = (mouseX / containerWidth) * 100;
        updateComparisonSlider();
      }
      e.preventDefault();
    });

    sliderContainer.addEventListener('touchstart', (e) => {
      isDraggingSlider = true;
      const mouseX = getMouseX(e);
      const containerWidth = sliderContainer.getBoundingClientRect().width;
      if (containerWidth > 0) {
        sliderPosition = (mouseX / containerWidth) * 100;
        updateComparisonSlider();
      }
    });
  }

  window.addEventListener('mousemove', handleSliderMove);
  window.addEventListener('mouseup', () => { isDraggingSlider = false; });
  window.addEventListener('touchmove', handleSliderMove);
  window.addEventListener('touchend', () => { isDraggingSlider = false; });

  // --- Run Reconstruction Trigger Simulation ---
  if (btnReconstruct) {
    btnReconstruct.addEventListener('click', () => {
      if (!processingOverlay) return;
      // Show loading overlay
      processingOverlay.classList.add('visible');
      btnReconstruct.disabled = true;

      // Reset processing steps UI styling
      const steps = [
        document.getElementById('step-0'),
        document.getElementById('step-1'),
        document.getElementById('step-2'),
        document.getElementById('step-3')
      ];
      
      steps.forEach(s => {
        if (s) s.classList.remove('active', 'completed');
      });

      // Step 0: Segments
      if (steps[0]) steps[0].classList.add('active');
      if (processingStatusText) processingStatusText.innerText = "Step 1/4: Cloud Mask Segment Extraction...";
      
      setTimeout(() => {
        if (steps[0]) { steps[0].classList.remove('active'); steps[0].classList.add('completed'); }
        if (steps[1]) steps[1].classList.add('active');
        if (processingStatusText) processingStatusText.innerText = "Step 2/4: Fusing Sentinel-1 SAR Polarizations...";
        
        setTimeout(() => {
          if (steps[1]) { steps[1].classList.remove('active'); steps[1].classList.add('completed'); }
          if (steps[2]) steps[2].classList.add('active');
          if (processingStatusText) processingStatusText.innerText = "Step 3/4: Fetching Multi-temporal References...";
          
          setTimeout(() => {
            if (steps[2]) { steps[2].classList.remove('active'); steps[2].classList.add('completed'); }
            if (steps[3]) steps[3].classList.add('active');
            if (processingStatusText) processingStatusText.innerText = `Step 4/4: Denoising via ${getModelFriendlyName(activeModel)}...`;
            
            setTimeout(() => {
              if (steps[3]) { steps[3].classList.remove('active'); steps[3].classList.add('completed'); }
              
              // Hide overlay
              processingOverlay.classList.remove('visible');
              btnReconstruct.disabled = false;
              
              // Re-render visuals
              renderSandboxVisuals();
              updateQuantitativeMetrics();
              
              // Slide divider automatically left to right to display reconstructed output
              animateDividerTransition();
            }, 800);
          }, 550);
        }, 650);
      }, 500);
    });
  }

  // Slider swipe animation after reconstruction run
  function animateDividerTransition() {
    sliderPosition = 100;
    updateComparisonSlider();
    
    let currentPos = 100;
    const targetPos = 40;
    
    const interval = setInterval(() => {
      if (currentPos <= targetPos) {
        clearInterval(interval);
      } else {
        currentPos -= 2.5;
        sliderPosition = currentPos;
        updateComparisonSlider();
      }
    }, 16);
  }

  function getModelFriendlyName(model) {
    if (model === 'diffusion') return "Latent Diffusion Model";
    if (model === 'transformer') return "Multi-modal Transformer";
    if (model === 'cyclegan') return "Spectral CycleGAN";
    return "";
  }

  // --- Event Listeners for UI Controllers ---
  if (regionSelector) {
    regionSelector.addEventListener('change', (e) => {
      activeRegion = e.target.value;
      if (regionCoords[activeRegion]) {
        if (infoRegionName) infoRegionName.innerText = regionCoords[activeRegion].name;
        if (infoCoords) infoCoords.innerText = regionCoords[activeRegion].coords;
      }
      renderSandboxVisuals();
      updateQuantitativeMetrics();
    });
  }

  modelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modelBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeModel = btn.getAttribute('data-model');
      if (rightLabelName) rightLabelName.innerText = `RECONSTRUCTED (${activeModel.toUpperCase()})`;
      renderSandboxVisuals();
      updateQuantitativeMetrics();
    });
  });

  if (sliderFidelity) {
    sliderFidelity.addEventListener('input', (e) => {
      reconstructionFidelity = parseInt(e.target.value);
      if (sliderFidelityVal) sliderFidelityVal.innerText = `${reconstructionFidelity}%`;
      renderSandboxVisuals();
      updateQuantitativeMetrics();
    });
  }

  if (sliderSar) {
    sliderSar.addEventListener('input', (e) => {
      sarWeight = parseInt(e.target.value);
      if (sliderSarVal) sliderSarVal.innerText = `${sarWeight}%`;
      renderSandboxVisuals();
      updateQuantitativeMetrics();
    });
  }

  if (toggleCloudMask) {
    toggleCloudMask.addEventListener('change', (e) => {
      showCloudMask = e.target.checked;
      renderSandboxVisuals();
    });
  }

  if (toggleSarGuide) {
    toggleSarGuide.addEventListener('change', (e) => {
      showSarGuidance = e.target.checked;
      renderSandboxVisuals();
      updateQuantitativeMetrics();
    });
  }

  // --- Update Quantitative performance Metrics Panel ---
  function updateQuantitativeMetrics() {
    if (!valSsim || !valPsnr || !valSam || !valF1) return;

    let ssim = 0.948;
    let psnr = 29.4;
    let sam = 0.052;
    let f1 = 0.965;

    if (activeModel === 'diffusion') {
      ssim = 0.948;
      psnr = 29.4;
      sam = 0.052;
      f1 = 0.965;
    } else if (activeModel === 'transformer') {
      ssim = 0.902;
      psnr = 26.8;
      sam = 0.068;
      f1 = 0.941;
    } else if (activeModel === 'cyclegan') {
      ssim = 0.801;
      psnr = 22.4;
      sam = 0.145;
      f1 = 0.884;
    }

    const fidelityScale = reconstructionFidelity / 100;
    ssim *= (0.8 + 0.2 * fidelityScale);
    psnr -= (1 - fidelityScale) * 4.0;
    sam += (1 - fidelityScale) * 0.08;

    if (!showSarGuidance) {
      ssim -= 0.12;
      psnr -= 5.2;
      sam += 0.05;
      f1 -= 0.08;
    }

    const sarWeightScale = sarWeight / 100;
    if (showSarGuidance) {
      const deviation = Math.abs(sarWeightScale - 0.75);
      ssim -= deviation * 0.05;
      psnr -= deviation * 1.5;
    }

    valSsim.innerText = ssim.toFixed(3);
    valPsnr.innerText = `${psnr.toFixed(1)} dB`;
    valSam.innerText = `${sam.toFixed(3)} rad`;
    valF1.innerText = f1.toFixed(3);

    updateSpectralBandGraph(ssim, psnr, sam);
  }

  function updateSpectralBandGraph(ssim, psnr, sam) {
    const dots = document.querySelectorAll('.spectral-dot.reconstructed');
    if (dots.length < 3) return;

    let deviation = (1 - ssim) * 100;

    dots[0].style.bottom = `${35 + (activeModel === 'cyclegan' ? 6 : 2) * (Math.random() > 0.5 ? 1 : -1) * (deviation * 0.2)}%`;
    dots[1].style.bottom = `${25 + (activeModel === 'cyclegan' ? 8 : 1) * (Math.random() > 0.5 ? 1 : -1) * (deviation * 0.2)}%`;
    dots[2].style.bottom = `${65 + (activeModel === 'cyclegan' ? 12 : 3) * (Math.random() > 0.5 ? 1 : -1) * (deviation * 0.2)}%`;

    dots[0].setAttribute('data-value', `LDM Reconstructed: ${(parseFloat(dots[0].style.bottom) / 100).toFixed(2)}`);
    dots[1].setAttribute('data-value', `LDM Reconstructed: ${(parseFloat(dots[1].style.bottom) / 100).toFixed(2)}`);
    dots[2].setAttribute('data-value', `LDM Reconstructed: ${(parseFloat(dots[2].style.bottom) / 100).toFixed(2)}`);
  }

  function animateLulcCharts() {
    const barsCloudy = document.querySelectorAll('.bar-item.cloudy');
    const barsRecon = document.querySelectorAll('.bar-item.reconstructed');

    const originalCloudyHeights = ['38%', '25%', '48%', '52%', '30%'];
    let originalReconHeights = ['94%', '91%', '88%', '95%', '82%'];
    if (activeModel === 'transformer') {
      originalReconHeights = ['88%', '86%', '80%', '90%', '76%'];
    } else if (activeModel === 'cyclegan') {
      originalReconHeights = ['78%', '74%', '70%', '82%', '64%'];
    }

    barsCloudy.forEach((bar, i) => {
      bar.style.height = '0%';
      setTimeout(() => {
        bar.style.height = originalCloudyHeights[i];
      }, 50);
    });

    barsRecon.forEach((bar, i) => {
      bar.style.height = '0%';
      setTimeout(() => {
        bar.style.height = originalReconHeights[i];
      }, 100);
    });
  }

  // --- 3D Tab & Terrestrial Dehazing Variables ---
  let threeDeeInitialized = false;
  let threeDeeAnimationId = null;
  let rotationX = -0.6; // Pitch angle
  let rotationY = 0.7;  // Yaw angle
  let autoRotate3d = true;
  let show3dClouds = true;
  let cloud3dAlt = 120;
  let elevationScale = 1.2;
  
  // 3D Terrain Grid heights (40x40 mesh)
  const gridPoints = 40;
  const terrainZ = [];
  
  for (let x = 0; x < gridPoints; x++) {
    terrainZ[x] = [];
    for (let y = 0; y < gridPoints; y++) {
      const dx = (x - 20) / 10;
      const dy = (y - 20) / 10;
      let z = Math.sin(dx * 0.8) * Math.cos(dy * 0.8) * 3;
      z += Math.cos(dx * 0.3) * Math.sin(dy * 0.4) * 4;
      z += Math.sin(dx * 2.2) * Math.cos(dy * 1.8) * 0.5;
      terrainZ[x][y] = z;
    }
  }

  let isDraggingDehazing = false;
  let dehazingPosition = 50;
  let dehazingImgLoaded = false;
  
  const dehazingImg = new Image();
  dehazingImg.src = '/dehazing_demo.jpg';
  dehazingImg.onload = () => {
    dehazingImgLoaded = true;
    if (activeTab === 'threedee') {
      renderDehazingCanvases();
    }
  };

  // --- Initialize 3D Surface & Dehazing Tab ---
  function initThreeDeeTab() {
    const canvas3d = document.getElementById('canvas-3d');
    const btnDecloud = document.getElementById('btn-3d-decloud');
    const btnRotate = document.getElementById('btn-3d-rotate');
    const sliderAlt = document.getElementById('slider-3d-alt');
    const sliderAltVal = document.getElementById('slider-3d-alt-val');
    const sliderHeight = document.getElementById('slider-3d-height');
    const sliderHeightVal = document.getElementById('slider-3d-height-val');

    const dehazingSliderContainer = document.getElementById('dehazing-slider-container');
    const parallaxContainer = document.getElementById('parallax-container');
    const canvasParaBg = document.getElementById('canvas-parallax-bg');
    const canvasParaFg = document.getElementById('canvas-parallax-fg');

    if (!canvas3d) return;

    const rect3d = canvas3d.parentElement ? canvas3d.parentElement.getBoundingClientRect() : { width: 600, height: 420 };
    canvas3d.width = rect3d.width || 600;
    canvas3d.height = rect3d.height || 420;

    if (dehazingSliderContainer) {
      const rectDehaze = dehazingSliderContainer.getBoundingClientRect();
      const canvasDehazeHazy = document.getElementById('canvas-dehazing-hazy');
      const canvasDehazeClear = document.getElementById('canvas-dehazing-clear');
      
      if (canvasDehazeHazy && canvasDehazeClear) {
        canvasDehazeHazy.width = rectDehaze.width || 500;
        canvasDehazeHazy.height = rectDehaze.height || 420;
        canvasDehazeClear.width = rectDehaze.width || 500;
        canvasDehazeClear.height = rectDehaze.height || 420;
      }
    }

    if (parallaxContainer && canvasParaBg && canvasParaFg) {
      const rectPara = parallaxContainer.getBoundingClientRect();
      canvasParaBg.width = rectPara.width || 400;
      canvasParaBg.height = rectPara.height || 260;
      canvasParaFg.width = rectPara.width || 400;
      canvasParaFg.height = rectPara.height || 260;
    }

    renderDehazingCanvases();

    if (!threeDeeInitialized) {
      if (btnDecloud) {
        btnDecloud.addEventListener('click', () => {
          show3dClouds = !show3dClouds;
          btnDecloud.style.background = show3dClouds ? '' : 'rgba(245, 158, 11, 0.15)';
          btnDecloud.style.borderColor = show3dClouds ? '' : 'rgba(245, 158, 11, 0.3)';
          const labelSpan = btnDecloud.querySelector('span');
          if (labelSpan) labelSpan.innerText = show3dClouds ? "Hide Cloud Layer" : "Reconstruct Surface (De-cloud)";
        });
      }

      if (btnRotate) {
        btnRotate.addEventListener('click', () => {
          autoRotate3d = !autoRotate3d;
          const labelSpan = btnRotate.querySelector('span');
          if (labelSpan) labelSpan.innerText = `Auto Rotate: ${autoRotate3d ? "ON" : "OFF"}`;
          btnRotate.style.borderColor = autoRotate3d ? 'var(--border-color)' : 'rgba(6, 182, 212, 0.4)';
        });
      }

      if (sliderAlt) {
        sliderAlt.addEventListener('input', (e) => {
          cloud3dAlt = parseInt(e.target.value);
          if (sliderAltVal) sliderAltVal.innerText = `${cloud3dAlt}m`;
        });
      }

      if (sliderHeight) {
        sliderHeight.addEventListener('input', (e) => {
          elevationScale = parseInt(e.target.value) / 10;
          if (sliderHeightVal) sliderHeightVal.innerText = `${elevationScale.toFixed(1)}x`;
        });
      }

      let isDragging3d = false;
      let prevMouseX = 0;
      let prevMouseY = 0;

      canvas3d.addEventListener('mousedown', (e) => {
        isDragging3d = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
        autoRotate3d = false;
        if (btnRotate) {
          const labelSpan = btnRotate.querySelector('span');
          if (labelSpan) labelSpan.innerText = "Auto Rotate: OFF";
        }
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging3d) return;
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        rotationY += deltaX * 0.007;
        rotationX += deltaY * 0.007;
        rotationX = Math.max(-1.3, Math.min(-0.15, rotationX));
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      });

      window.addEventListener('mouseup', () => {
        isDragging3d = false;
      });

      if (dehazingSliderContainer) {
        function getDehazeMouseX(e) {
          const rect = dehazingSliderContainer.getBoundingClientRect();
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          return clientX - rect.left;
        }

        dehazingSliderContainer.addEventListener('mousedown', (e) => {
          isDraggingDehazing = true;
          const mouseX = getDehazeMouseX(e);
          const w = dehazingSliderContainer.getBoundingClientRect().width;
          if (w > 0) dehazingPosition = (mouseX / w) * 100;
          updateDehazingSlider();
          e.preventDefault();
        });

        dehazingSliderContainer.addEventListener('touchstart', (e) => {
          isDraggingDehazing = true;
          const mouseX = getDehazeMouseX(e);
          const w = dehazingSliderContainer.getBoundingClientRect().width;
          if (w > 0) dehazingPosition = (mouseX / w) * 100;
          updateDehazingSlider();
        });
      }

      window.addEventListener('mousemove', (e) => {
        if (!isDraggingDehazing || !dehazingSliderContainer) return;
        const rect = dehazingSliderContainer.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const mouseX = clientX - rect.left;
        const w = rect.width;
        if (w > 0) dehazingPosition = (mouseX / w) * 100;
        updateDehazingSlider();
      });

      window.addEventListener('mouseup', () => {
        isDraggingDehazing = false;
      });
      window.addEventListener('touchend', () => {
        isDraggingDehazing = false;
      });

      if (parallaxContainer && canvasParaBg && canvasParaFg) {
        parallaxContainer.addEventListener('mousemove', (e) => {
          const rect = parallaxContainer.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
          const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
          
          canvasParaBg.style.transform = `translate(${mouseX * -10}px, ${mouseY * -10}px) scale(1.08)`;
          canvasParaFg.style.transform = `translate(${mouseX * 18}px, ${mouseY * 18}px) scale(1.12)`;
        });

        parallaxContainer.addEventListener('mouseleave', () => {
          canvasParaBg.style.transform = 'translate(0px, 0px) scale(1.08)';
          canvasParaFg.style.transform = 'translate(0px, 0px) scale(1.12)';
        });
      }

      threeDeeInitialized = true;
    }

    if (threeDeeAnimationId) {
      cancelAnimationFrame(threeDeeAnimationId);
    }
    
    function animate3d() {
      if (activeTab !== 'threedee') return;
      
      if (autoRotate3d) {
        rotationY += 0.003;
      }

      draw3dTerrainMesh(canvas3d);
      threeDeeAnimationId = requestAnimationFrame(animate3d);
    }

    animate3d();
    updateDehazingSlider();
  }

  // --- Procedural 3D Mesh Draw logic ---
  function draw3dTerrainMesh(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    if (w === 0 || h === 0) return;

    ctx.clearRect(0, 0, w, h);
    ctx.lineJoin = 'round';

    const centerX = w / 2;
    const centerY = h / 2;

    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);
    const cosX = Math.cos(rotationX);
    const sinX = Math.sin(rotationX);

    const screenCoords = [];

    // 1. Calculate projected positions of mountain terrain points
    for (let x = 0; x < gridPoints; x++) {
      screenCoords[x] = [];
      for (let y = 0; y < gridPoints; y++) {
        const gx = (x - 20) * 11.5;
        const gy = (y - 20) * 11.5;
        const gz = terrainZ[x][y] * elevationScale * 2.5;

        const rx = gx * cosY - gy * sinY;
        const ry = gx * sinY + gy * cosY;

        const px = rx;
        const py = ry * cosX - gz * sinX;

        screenCoords[x][y] = {
          x: centerX + px,
          y: centerY + py - 35,
          z: gz
        };
      }
    }

    // 2. Draw Cloud Shadows onto terrain (if toggled)
    if (show3dClouds) {
      const sdx = 15;
      const sdy = 20;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      
      const shadowCenters = [
        {x: -70, y: -50, r: 85},
        {x: 60, y: 70, r: 100},
        {x: -40, y: 90, r: 75}
      ];

      shadowCenters.forEach(c => {
        const rx = c.x * cosY - c.y * sinY;
        const ry = c.x * sinY + c.y * cosY;
        const px = rx + sdx;
        const py = ry * cosX + sdy;
        
        ctx.beginPath();
        ctx.ellipse(centerX + px, centerY + py - 35, c.r * 0.9, c.r * 0.45 * cosX, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 3. Draw Wireframe Grid Lines
    for (let x = 0; x < gridPoints; x++) {
      for (let y = 0; y < gridPoints; y++) {
        const A = screenCoords[x][y];
        
        if (A.z > 10.5) {
          ctx.strokeStyle = 'rgba(241, 245, 249, 0.55)'; // Snow peaks
        } else if (A.z > 2.5) {
          ctx.strokeStyle = 'rgba(163, 230, 53, 0.3)';   // Mountain slopes
        } else {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.22)';    // Valleys
        }

        ctx.lineWidth = A.z > 10.5 ? 1.5 : 0.8;

        if (x < gridPoints - 1) {
          const B = screenCoords[x+1][y];
          ctx.beginPath();
          ctx.moveTo(A.x, A.y);
          ctx.lineTo(B.x, B.y);
          ctx.stroke();
        }

        if (y < gridPoints - 1) {
          const C = screenCoords[x][y+1];
          ctx.beginPath();
          ctx.moveTo(A.x, A.y);
          ctx.lineTo(C.x, C.y);
          ctx.stroke();
        }
      }
    }

    // 4. Draw Floating Clouds
    if (show3dClouds) {
      const cz = cloud3dAlt * 0.65;
      const cloudPuffs = [
        {x: -70, y: -50, r: 85},
        {x: 60, y: 70, r: 100},
        {x: -40, y: 90, r: 75}
      ];

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1.2;

      cloudPuffs.forEach(c => {
        const rx = c.x * cosY - c.y * sinY;
        const ry = c.x * sinY + c.y * cosY;
        const px = rx;
        const py = ry * cosX - cz * sinX;

        ctx.beginPath();
        ctx.ellipse(centerX + px, centerY + py - 35, c.r, c.r * 0.5 * cosX, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(centerX + px - 10, centerY + py - 40, c.r * 0.6, c.r * 0.3 * cosX, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
      });
    }
  }

  // --- Crop Dehazing Images & Parallax layers ---
  function renderDehazingCanvases() {
    if (!dehazingImgLoaded) return;

    const canvasHazy = document.getElementById('canvas-dehazing-hazy');
    const canvasClear = document.getElementById('canvas-dehazing-clear');
    const canvasParaBg = document.getElementById('canvas-parallax-bg');
    const canvasParaFg = document.getElementById('canvas-parallax-fg');

    if (!canvasHazy || !canvasClear || !canvasParaBg || !canvasParaFg) return;

    const ctxHazy = canvasHazy.getContext('2d');
    const ctxClear = canvasClear.getContext('2d');
    const ctxParaBg = canvasParaBg.getContext('2d');
    const ctxParaFg = canvasParaFg.getContext('2d');

    const wSrc = dehazingImg.width;
    const hSrc = dehazingImg.height;

    [ctxHazy, ctxClear, ctxParaBg, ctxParaFg].forEach(ctx => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    });

    ctxHazy.drawImage(
      dehazingImg, 
      0, 0, wSrc / 2, hSrc - 60,
      0, 0, canvasHazy.width, canvasHazy.height
    );

    ctxClear.drawImage(
      dehazingImg, 
      wSrc / 2, 0, wSrc / 2, hSrc - 60,
      0, 0, canvasClear.width, canvasClear.height
    );

    ctxParaBg.drawImage(
      dehazingImg, 
      wSrc / 2, 0, wSrc / 2, hSrc - 60,
      0, 0, canvasParaBg.width, canvasParaBg.height
    );

    const wDest = canvasParaFg.width;
    const hDest = canvasParaFg.height;

    ctxParaFg.strokeStyle = '#052e16';
    ctxParaFg.lineWidth = 5;
    ctxParaFg.lineCap = 'round';
    
    ctxParaFg.beginPath();
    ctxParaFg.moveTo(0, hDest * 0.15);
    ctxParaFg.quadraticCurveTo(wDest * 0.28, hDest * 0.28, wDest * 0.18, hDest * 0.7);
    ctxParaFg.stroke();

    ctxParaFg.lineWidth = 3.5;
    ctxParaFg.beginPath();
    ctxParaFg.moveTo(0, hDest * 0.45);
    ctxParaFg.quadraticCurveTo(wDest * 0.16, hDest * 0.52, wDest * 0.32, hDest * 0.56);
    ctxParaFg.stroke();

    const foliageCluster = [
      {x: wDest * 0.12, y: hDest * 0.2, r: 20},
      {x: wDest * 0.22, y: hDest * 0.29, r: 26},
      {x: wDest * 0.18, y: hDest * 0.42, r: 22},
      {x: wDest * 0.14, y: hDest * 0.62, r: 28},
      {x: wDest * 0.24, y: hDest * 0.52, r: 18},
      {x: wDest * 0.31, y: hDest * 0.56, r: 20},
      {x: wDest * 0.05, y: hDest * 0.32, r: 24},
      {x: wDest * 0.42, y: hDest * 0.08, r: 16},
      {x: wDest * 0.55, y: hDest * 0.05, r: 22},
      {x: wDest * 0.68, y: hDest * 0.14, r: 18}
    ];

    foliageCluster.forEach(l => {
      ctxParaFg.fillStyle = '#14532d';
      ctxParaFg.beginPath();
      ctxParaFg.arc(l.x, l.y, l.r, 0, Math.PI * 2);
      ctxParaFg.fill();

      ctxParaFg.fillStyle = '#22c55e';
      ctxParaFg.beginPath();
      ctxParaFg.arc(l.x - l.r * 0.2, l.y - l.r * 0.2, l.r * 0.65, 0, Math.PI * 2);
      ctxParaFg.fill();
      
      ctxParaFg.fillStyle = '#4ade80';
      ctxParaFg.beginPath();
      ctxParaFg.arc(l.x - l.r * 0.35, l.y - l.r * 0.35, l.r * 0.3, 0, Math.PI * 2);
      ctxParaFg.fill();
    });
  }

  function updateDehazingSlider() {
    const divider = document.getElementById('dehazing-slider-divider');
    const overlay = document.getElementById('dehazing-slider-overlay');
    if (!divider || !overlay) return;
    
    divider.style.left = `${dehazingPosition}%`;
    overlay.style.clipPath = `polygon(${dehazingPosition}% 0, 100% 0, 100% 100%, ${dehazingPosition}% 100%)`;
  }

  /* ==========================================================================
     PROBLEM AI AGENT CONTROLLER & KNOWLEDGE ENGINE
     ========================================================================== */

  let agentVoiceEnabled = false;
  let agentChatInitialized = false;
  let isAgentTyping = false;

  // Comprehensive Knowledge Repository on the Problem
  const AGENT_PROBLEM_KNOWLEDGE = {
    'welcome': {
      title: 'Mission Problem Briefing: CLEAR_SEE Optical Degradation',
      html: `
        <p>Greetings, Commander. I am <strong>AeroSense-10</strong>, your Autonomous Remote Sensing Physicist & Problem Diagnostic Agent.</p>
        <p style="margin-top: 0.5rem;">The problem we are addressing is <strong>critical</strong>: India's high-resolution optical satellite, <strong>ISRO LISS-IV</strong> (5.8m spatial resolution), is effectively blinded across the North Eastern Region (NER) for up to <strong>80% of the year</strong> due to persistent, impenetrable cloud cover.</p>
        <p style="margin-top: 0.5rem;">This creates three major crises:</p>
        <ul>
          <li><strong>Zero Optical Visibility:</strong> Visible/NIR sunlight is extinguished by Mie scattering.</li>
          <li><strong>Disaster Monitoring Failure:</strong> Cloud shadows mimic deep floodwaters, corrupting relief efforts.</li>
          <li><strong>Temporal Obsolescence:</strong> By the time a clear pass occurs 4–5 months later, ground reality has completely transformed.</li>
        </ul>
        <p style="margin-top: 0.5rem; color: var(--color-primary);">Select any prompt chip above, type your question below, or run the live scene auditor on the right!</p>
      `,
      speech: "Greetings. I am AeroSense-10. The problem we address is that ISRO LISS-IV optical satellites are blinded across North East India for up to eighty percent of the year due to persistent cloud cover. This causes optical blackout, false flood classifications, and leaves disaster response teams without real-time data."
    },
    'core-problem': {
      title: 'The Core Remote Sensing Crisis',
      html: `
        <h4>The Core Problem: Optical Sensor Blindness & Information Void</h4>
        <p>The <strong>Resourcesat-2/2A LISS-IV sensor</strong> operates in three multi-spectral bands: <code>Green (0.52–0.59 µm)</code>, <code>Red (0.62–0.68 µm)</code>, and <code>Near-Infrared (0.77–0.86 µm)</code> at a fine 5.8m ground resolution.</p>
        <p style="margin-top: 0.5rem;">However, optical remote sensing relies entirely on reflected solar irradiance. When clouds obstruct the line of sight:</p>
        <ul>
          <li><strong>Direct Transmission Extinction:</strong> Cloud optical thickness $\\tau > 50$, meaning transmission <code>T(x) = exp(-τ) ≈ 0.0000</code>.</li>
          <li><strong>Complete Information Loss:</strong> Ground pixels receive 0 direct illumination, replaced by saturated cloud-top diffuse reflection.</li>
          <li><strong>Critical Coverage Blackouts:</strong> Agricultural monitoring, border defense surveillance, and landslide tracking in the North East are halted during the entire 5-month monsoon season.</li>
        </ul>
        <p style="margin-top: 0.5rem;"><strong>The Solution:</strong> Conditioning generative latent diffusion on cloud-penetrating Sentinel-1 SAR C-band microwave radar data to reconstruct the missing spectral bands.</p>
      `,
      speech: "The core problem is optical sensor blindness. ISRO LISS-IV relies on sunlight. When dense clouds cover the terrain, optical transmission drops to zero. This halts agricultural monitoring, border surveillance, and disaster response during the five-month monsoon season."
    },
    'ner-monsoon': {
      title: 'Why North East India (NER) is Uniquely Vulnerable',
      html: `
        <h4>Geographical & Orographic Trap in North East India</h4>
        <p>The North Eastern Region (NER)—encompassing Assam, Meghalaya, Arunachal Pradesh, Sikkim, Nagaland, and Manipur—is an extreme planetary hotspot for cloud cover:</p>
        <ul>
          <li><strong>Orographic Uplift:</strong> Strong moisture-laden winds from the Bay of Bengal slam into the steep Meghalaya plateau (Cherrapunji & Mawsynram) and the Himalayan foothills, forcing air upward and creating near-continuous condensation.</li>
          <li><strong>World's Highest Rainfall:</strong> Cherrapunji averages over 11,700 mm of annual rainfall, producing thick convective cumulonimbus layers reaching 12 km altitude.</li>
          <li><strong>Unbroken Cloud Canopy:</strong> Satellite analysis shows cloud frequency exceeds <strong>75% to 88%</strong> between May and September. In a typical monsoon month, there are zero completely cloud-free optical passes.</li>
        </ul>
        <p style="margin-top: 0.5rem; color: var(--color-warning);">Without cloud removal or radar fusion, high-resolution optical earth observation is rendered useless for 8 months of the year.</p>
      `,
      speech: "North East India is uniquely vulnerable because moisture from the Bay of Bengal is forced upward by the steep Meghalaya plateau and Himalayas. Cherrapunji experiences the world's highest rainfall. Cloud cover exceeds eighty percent from May to September, leaving zero cloud-free satellite passes for months."
    },
    'optical-physics': {
      title: 'Atmospheric Physics: Mie Scattering Extinction',
      html: `
        <h4>Why Optical Light Cannot Penetrate Cloud Droplets</h4>
        <p>Atmospheric scattering behavior is governed by the <strong>Size Parameter</strong>: <code>x = 2πr / λ</code>, where <code>r</code> is particle radius and <code>λ</code> is electromagnetic wavelength.</p>
        <ul>
          <li><strong>Cloud Water Droplet Size:</strong> Droplet radii range from <code>10 µm to 30 µm</code>.</li>
          <li><strong>Optical Visible/NIR Wavelength:</strong> <code>λ = 0.5 µm to 0.86 µm</code>.</li>
          <li><strong>Mie Scattering Regime:</strong> Because <code>x ≈ 70 to 350 >> 1</code>, we are squarely in the non-selective Mie scattering domain.</li>
          <li><strong>Scattering Cross-Section:</strong> Photons undergo hundreds of random diffuse scattering bounces. Radiative transfer models confirm zero forward ballistic transmission.</li>
        </ul>
        <p style="margin-top: 0.5rem;">By contrast, <strong>C-band SAR microwave radar</strong> has a wavelength of <code>λ = 5.6 cm (56,000 µm)</code>. For radar, <code>x ≈ 0.002 << 1</code> (Rayleigh limit), meaning cloud droplets create negligible attenuation (&lt; 0.15 dB/km).</p>
      `,
      speech: "Optical light cannot penetrate clouds due to Mie scattering. Cloud water droplets are twenty times larger than visible wavelengths. Photons scatter randomly in all directions. Conversely, Sentinel-1 radar uses microwaves with a 5.6 centimeter wavelength, allowing signals to pass through clouds unimpeded."
    },
    'shadow-deception': {
      title: 'Cloud Shadow Deception & False Flood Disaster Alerts',
      html: `
        <h4>The Downstream Catastrophe: False Water Bodies</h4>
        <p>Clouds do not just block the sky; their towering vertical heights cast vast, dark <strong>cloud shadows</strong> across valleys and floodplains.</p>
        <ul>
          <li><strong>Spectrally Identical to Deep Water:</strong> In LISS-IV optical bands, shadowed vegetation and shadowed concrete reflect less than <code>2% to 3%</code> of NIR and Red irradiance—virtually identical to the spectral reflectance of open standing water!</li>
          <li><strong>Automated Water Index Failure:</strong> Indices like <code>NDWI = (Green - NIR) / (Green + NIR)</code> produce high positive values inside cloud shadows, tricking automated flood-mapping pipelines.</li>
          <li><strong>Massive False Alarms:</strong> During catastrophic Brahmaputra floods in Assam, uncorrected optical imagery misidentifies thousands of dry villages as inundated, directing disaster relief teams to the wrong locations.</li>
        </ul>
        <p style="margin-top: 0.5rem;">Our SAR fusion solves this: SAR radar backscatter differentiates smooth specular water from rough shadowed ground in decibels.</p>
      `,
      speech: "Cloud shadows create a dangerous downstream deception. They reduce optical reflectance to under three percent, mimicking open water. Automated disaster pipelines misclassify shadows as flooded land. SAR radar backscatter eliminates this by differentiating water smoothness from land roughness."
    },
    'sar-radar': {
      title: 'Sentinel-1 SAR: The Cloud-Penetrating Backbone',
      html: `
        <h4>Why Sentinel-1 SAR Radar is the Solution</h4>
        <p><strong>Synthetic Aperture Radar (SAR)</strong> is an active microwave sensor. Sentinel-1 transmits at <code>5.405 GHz (C-band)</code> with dual polarization: <code>VV</code> (vertical transmit, vertical receive) and <code>VH</code> (vertical transmit, horizontal receive).</p>
        <ul>
          <li><strong>All-Weather, Day-or-Night:</strong> SAR provides its own electromagnetic illumination and easily penetrates rain, thick cumulonimbus, fog, and nighttime conditions.</li>
          <li><strong>Physical Surface Geometry:</strong> While SAR lacks color, it measures surface roughness, dielectric permittivity, building corner reflectors, and topographic slopes.</li>
          <li><strong>The Information Asymmetry Dilemma:</strong> Optical has rich multi-spectral color (Green, Red, NIR) but 0 cloud penetration. SAR has 100% cloud penetration but 0 color.</li>
          <li><strong>Generative AI Fusion:</strong> Latent Diffusion models learn the cross-modal translation, using SAR geometry to ground the inpainting of multi-spectral optical reflectance.</li>
        </ul>
      `,
      speech: "Sentinel-1 SAR operates at 5.4 gigahertz in the microwave spectrum. It penetrates all clouds day or night. While SAR has zero color, it captures physical geometry, surface roughness, and buildings. Our AI fuses SAR geometry with optical models to reconstruct the missing colors."
    },
    'hallucination': {
      title: 'The AI Hallucination Dilemma in Earth Observation',
      html: `
        <h4>Preventing AI Hallucinations in Critical Satellite Imagery</h4>
        <p>If you feed a cloudy image into a generic generative AI model (such as an unconditional Stable Diffusion or CycleGAN), it will produce a visually pleasant image—but it may <strong>hallucinate</strong> buildings that don't exist, remove real roads, or fabricate fictitious rivers.</p>
        <ul>
          <li><strong>High Stakes in Remote Sensing:</strong> A hallucinated bridge or misaligned river boundary in ISRO satellite data can lead to catastrophic urban planning and military intelligence errors.</li>
          <li><strong>Physical Grounding via Cross-Attention:</strong> In CLEAR_SEE, our Latent Diffusion Model conditions its reverse diffusion steps directly on Sentinel-1 SAR feature maps.</li>
          <li><strong>Strict Bounds:</strong> If the SAR radar shows high double-bounce backscatter (a building), the generative model is constrained to generate a structural settlement pixel, preventing spatial hallucination.</li>
        </ul>
      `,
      speech: "The danger of using generative AI is hallucination. A naive model might invent fake roads or nonexistent villages. In CLEAR_SEE, we constrain the diffusion process with real-time Sentinel-1 SAR radar backscatter, ensuring every generated pixel is physically grounded in true terrain geometry."
    },
    'mosaicking': {
      title: 'Why Multi-Temporal Mosaicking Fails in Monsoons',
      html: `
        <h4>The Failure of Multi-Temporal Clear Image Compositing</h4>
        <p>A common suggestion is: <em>"Why not just copy clear pixels from last month's satellite pass?"</em></p>
        <ul>
          <li><strong>Zero Cloud-Free Passes for Months:</strong> In places like Cherrapunji and upper Assam, optical satellites do not obtain a single cloud-free acquisition between late May and mid-September (120+ days).</li>
          <li><strong>Rapidly Evolving Terrain:</strong> Monsoons bring rapid flash flooding, river course migration along the Brahmaputra, and sudden crop germination. A 90-day-old clear reference image represents a completely different reality.</li>
          <li><strong>Phenological Mismatch:</strong> Pasture greenness and forest canopy reflectance shift dramatically between seasons. Pasting old pixels creates jarring temporal frankenstein artifacts.</li>
        </ul>
      `,
      speech: "Multi-temporal mosaicking fails because during monsoons, no cloud-free passes occur for up to four months. By the time a clear pass arrives, crop stages and floodwaters have changed completely. Pasting old images produces false, outdated maps."
    },
    'dehazing-vs-cloud': {
      title: 'Terrestrial Dehazing vs Satellite Cloud Removal',
      html: `
        <h4>Dehazing vs Cloud Removal: A Critical Physical Distinction</h4>
        <p>Ground-level photo dehazing (like the brick building comparison in our 3D tab) is <strong>fundamentally different</strong> from satellite cloud removal:</p>
        <ul>
          <li><strong>Terrestrial Atmospheric Haze:</strong> Composed of tiny aerosol particles (smoke, dust, humidity). Optical transmission is attenuated but remains non-zero: <code>0 &lt; T(x) &lt; 1</code>. Low-frequency outlines and high-contrast edges are still partially visible.</li>
          <li><strong>Satellite Cumulus & Cumulonimbus Clouds:</strong> Water droplets are massive, creating dense optical depths <code>τ > 50</code> and transmission <code>T(x) = 0</code>. Not a single photon from the surface reaches the satellite detector.</li>
          <li><strong>Mathematical Impossibility:</strong> Single-image dehazing methods (Dark Channel Prior) rely on inverting the attenuation formula: <code>J(x) = (I(x) - A) / T(x)</code>. When <code>T(x) = 0</code>, division by zero occurs! You cannot dehaze an opaque cloud without a secondary penetrating sensor (SAR).</li>
        </ul>
      `,
      speech: "Terrestrial photo dehazing works because haze preserves some light transmission. But satellite clouds have zero optical transmission. Inverting the haze equation results in division by zero. That is why satellite cloud removal mathematically requires cloud-penetrating radar."
    }
  };

  // Agent Natural Language Matcher
  function resolveAgentQuery(rawQuery) {
    const q = rawQuery.toLowerCase().trim();
    if (!q) return AGENT_PROBLEM_KNOWLEDGE['core-problem'];

    if (q.includes('ner') || q.includes('north east') || q.includes('india') || q.includes('cherrapunji') || q.includes('shillong') || q.includes('assam') || q.includes('monsoon')) {
      return AGENT_PROBLEM_KNOWLEDGE['ner-monsoon'];
    }
    if (q.includes('physic') || q.includes('mie') || q.includes('scattering') || q.includes('rayleigh') || q.includes('wavelength') || q.includes('droplet') || q.includes('optic')) {
      return AGENT_PROBLEM_KNOWLEDGE['optical-physics'];
    }
    if (q.includes('shadow') || q.includes('water') || q.includes('flood') || q.includes('lulc') || q.includes('misclassif') || q.includes('dark')) {
      return AGENT_PROBLEM_KNOWLEDGE['shadow-deception'];
    }
    if (q.includes('sar') || q.includes('radar') || q.includes('sentinel') || q.includes('c-band') || q.includes('microwave') || q.includes('penetrat')) {
      return AGENT_PROBLEM_KNOWLEDGE['sar-radar'];
    }
    if (q.includes('hallucin') || q.includes('fake') || q.includes('risk') || q.includes('invent') || q.includes('fictitious') || q.includes('ground')) {
      return AGENT_PROBLEM_KNOWLEDGE['hallucination'];
    }
    if (q.includes('mosaic') || q.includes('past') || q.includes('month') || q.includes('clear photo') || q.includes('composite') || q.includes('old') || q.includes('history')) {
      return AGENT_PROBLEM_KNOWLEDGE['mosaicking'];
    }
    if (q.includes('dehaz') || q.includes('haze') || q.includes('fog') || q.includes('terrestrial') || q.includes('dcp') || q.includes('building')) {
      return AGENT_PROBLEM_KNOWLEDGE['dehazing-vs-cloud'];
    }
    if (q.includes('liss') || q.includes('isro') || q.includes('problem') || q.includes('core') || q.includes('clear_see') || q.includes('what is')) {
      return AGENT_PROBLEM_KNOWLEDGE['core-problem'];
    }

    // Default intelligent custom response
    return {
      title: `Analysis of Inquiry: "${rawQuery}"`,
      html: `
        <h4>AeroSense Diagnostic Assessment</h4>
        <p>You asked: <em>"${rawQuery}"</em></p>
        <p style="margin-top: 0.5rem;">From a satellite remote sensing physics standpoint, this connects directly to the core bottleneck of <strong>ISRO LISS-IV optical degradation</strong> in cloudy environments:</p>
        <ul>
          <li><strong>Physical Blockage:</strong> Cloud water droplets extinguish visible/NIR radiance via Mie scattering, leaving zero ground surface radiance on optical sensors.</li>
          <li><strong>Downstream Misinterpretation:</strong> Dark cloud shadows are misclassified as floodwater; bright cloud peaks saturate radiometric wells.</li>
          <li><strong>Multi-Modal Solution:</strong> Combining <strong>Sentinel-1 SAR C-band microwave radar (5.6 cm)</strong> with Generative AI (Latent Diffusion) reconstructs the hidden ground geometry without spatial hallucinations.</li>
        </ul>
        <p style="margin-top: 0.5rem; color: var(--color-primary);">Click any of the suggested prompt chips above for an in-depth scientific breakdown!</p>
      `,
      speech: `Regarding your question, the key remote sensing problem is that optical sensors like LISS-IV are physically blocked by cloud droplets, leading to massive data blackouts and shadow water misclassifications, which requires multi-modal SAR fusion to solve.`
    };
  }

  // Voice Speech Synthesizer
  function speakAgentText(text) {
    if (!agentVoiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
      if (preferred) utterance.voice = preferred;

      const voiceBtn = document.getElementById('btn-agent-voice-toggle');
      utterance.onstart = () => {
        if (voiceBtn) voiceBtn.classList.add('active');
      };
      utterance.onend = () => {
        if (voiceBtn) voiceBtn.classList.remove('active');
      };
      utterance.onerror = () => {
        if (voiceBtn) voiceBtn.classList.remove('active');
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  // Append Message to Chat Feed with Typing Effect
  function appendAgentMessage(knowledgeItem) {
    const feed = document.getElementById('agent-chat-feed');
    if (!feed) return;

    const msgEl = document.createElement('div');
    msgEl.className = 'chat-msg agent';

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msgEl.innerHTML = `
      <div class="chat-avatar">AI</div>
      <div class="chat-bubble">
        <div class="bubble-content-wrap">
          <div class="typing-dots"><span></span><span></span><span></span></div>
        </div>
        <div class="chat-bubble-footer">
          <span>AeroSense-10 • ${timeStr}</span>
          <button class="btn-speak-bubble" title="Listen to response">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            <span>Listen</span>
          </button>
        </div>
      </div>
    `;

    feed.appendChild(msgEl);
    feed.scrollTop = feed.scrollHeight;

    // Simulate typing delay
    setTimeout(() => {
      const contentWrap = msgEl.querySelector('.bubble-content-wrap');
      if (contentWrap) {
        contentWrap.innerHTML = knowledgeItem.html;
      }
      feed.scrollTop = feed.scrollHeight;

      // Connect speak button
      const speakBtn = msgEl.querySelector('.btn-speak-bubble');
      if (speakBtn) {
        speakBtn.addEventListener('click', () => {
          speakAgentText(knowledgeItem.speech || knowledgeItem.title);
        });
      }

      // Auto-speak if voice briefing is active
      if (agentVoiceEnabled) {
        speakAgentText(knowledgeItem.speech || knowledgeItem.title);
      }
    }, 400);
  }

  function appendUserMessage(text) {
    const feed = document.getElementById('agent-chat-feed');
    if (!feed) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-msg user';
    msgEl.innerHTML = `
      <div class="chat-avatar">U</div>
      <div class="chat-bubble">
        <p>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        <div class="chat-bubble-footer" style="justify-content: flex-end;">
          <span>You • ${timeStr}</span>
        </div>
      </div>
    `;

    feed.appendChild(msgEl);
    feed.scrollTop = feed.scrollHeight;
  }

  // Interactive Scenario Problem Auditor
  function runSceneProblemAudit() {
    const regionSelect = document.getElementById('auditor-region');
    const cloudSlider = document.getElementById('auditor-cloud-range');
    const scannerBar = document.getElementById('hud-scanner-bar');
    
    const extinctionEl = document.getElementById('hud-extinction');
    const shadowRiskEl = document.getElementById('hud-shadow-risk');
    const blindnessEl = document.getElementById('hud-blindness');
    const sarCuesEl = document.getElementById('hud-sar-cues');
    const diagnosisTextEl = document.getElementById('hud-diagnosis-text');
    const timestampEl = document.getElementById('hud-timestamp');

    if (!regionSelect || !cloudSlider) return;

    const region = regionSelect.value;
    const cloudCoverage = parseInt(cloudSlider.value, 10);

    // Trigger visual scan effect
    if (scannerBar) {
      scannerBar.classList.add('scanning');
      setTimeout(() => scannerBar.classList.remove('scanning'), 1600);
    }

    if (timestampEl) {
      timestampEl.innerText = new Date().toLocaleTimeString();
    }

    // Physics calculations
    const extinctionDb = (-(12 + (cloudCoverage / 100) * 32)).toFixed(1);
    const blindnessPct = Math.min(99.5, (cloudCoverage * 1.02)).toFixed(1);
    const shadowRiskPct = Math.min(96.0, (30 + cloudCoverage * 0.65)).toFixed(1);
    const sarCuesPct = (99.2 - (cloudCoverage * 0.02)).toFixed(1);

    if (extinctionEl) extinctionEl.innerText = `${extinctionDb} dB`;
    if (blindnessEl) blindnessEl.innerText = `${blindnessPct}%`;
    if (shadowRiskEl) shadowRiskEl.innerText = `${shadowRiskPct}%`;
    if (sarCuesEl) sarCuesEl.innerText = `${sarCuesPct}%`;

    // Region customized problem verdict
    const regionNames = {
      shillong: 'Shillong Plateau (Dense Pine Forests & Valley Ridges)',
      cherrapunji: 'Cherrapunji / Sohra (World Extreme Orographic Barrier)',
      guwahati: 'Guwahati (Riverine Brahmaputra Basin & Urban Grid)',
      gangtok: 'Gangtok / Kanchenjunga (High Snow Peaks & Mountain Passes)'
    };

    let verdict = '';
    if (cloudCoverage > 75) {
      verdict = `CRITICAL DEGRADATION: At ${cloudCoverage}% cloud occlusion in ${regionNames[region]}, optical transmittance is effectively 0. Mie scattering obliterates all 3 LISS-IV bands. Cloud shadows create a ${shadowRiskPct}% risk of false-positive flood water detection. Standard optical models fail completely; Sentinel-1 C-band SAR radar backscatter (VV/VH) is MANDATORY to bypass cloud particles.`;
    } else if (cloudCoverage > 40) {
      verdict = `MODERATE-TO-HEAVY CONTAMINATION: At ${cloudCoverage}% cloud cover, fractured cumulus clouds cast localized shadows across ${regionNames[region]}. Normalized Difference Vegetation Index (NDVI) values in shadows fall by up to 60%, misclassifying healthy canopy as stressed or dead. Multi-modal cross-attention fusion is required.`;
    } else {
      verdict = `MILD CIRRUS HAZE: At ${cloudCoverage}% thin cirrus in ${regionNames[region]}, low-frequency terrain contours remain partially detectable, but radiometric accuracy is attenuated by ${extinctionDb} dB. Dark channel prior baseline can assist, but multi-modal SAR fusion ensures exact spectral fidelity.`;
    }

    if (diagnosisTextEl) {
      diagnosisTextEl.innerText = verdict;
    }

    if (agentVoiceEnabled) {
      speakAgentText(`Audit complete for ${regionNames[region]}. At ${cloudCoverage} percent cloud cover, optical loss is ${extinctionDb} decibels. ${verdict}`);
    }
  }

  // Initialize Problem Agent Tab
  function initAgentTab() {
    if (!agentChatInitialized) {
      agentChatInitialized = true;
      const feed = document.getElementById('agent-chat-feed');
      if (feed && feed.children.length === 0) {
        appendAgentMessage(AGENT_PROBLEM_KNOWLEDGE['welcome']);
      }

      // Inquiry Chip Listeners
      const chips = document.querySelectorAll('.agent-chip');
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          const key = chip.getAttribute('data-query');
          const promptText = chip.innerText.trim();
          appendUserMessage(promptText);
          const response = AGENT_PROBLEM_KNOWLEDGE[key] || resolveAgentQuery(promptText);
          appendAgentMessage(response);
        });
      });

      // Chat Input Field
      const inputField = document.getElementById('agent-user-input');
      const sendBtn = document.getElementById('btn-agent-send');

      const handleUserSubmit = () => {
        if (!inputField) return;
        const query = inputField.value.trim();
        if (!query) return;
        inputField.value = '';
        appendUserMessage(query);
        const response = resolveAgentQuery(query);
        appendAgentMessage(response);
      };

      if (sendBtn) sendBtn.addEventListener('click', handleUserSubmit);
      if (inputField) {
        inputField.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') handleUserSubmit();
        });
      }

      // Voice Toggle Button
      const voiceToggleBtn = document.getElementById('btn-agent-voice-toggle');
      const voiceBtnText = document.getElementById('agent-voice-btn-text');
      if (voiceToggleBtn) {
        voiceToggleBtn.addEventListener('click', () => {
          agentVoiceEnabled = !agentVoiceEnabled;
          if (agentVoiceEnabled) {
            voiceToggleBtn.classList.add('active');
            if (voiceBtnText) voiceBtnText.innerText = 'Voice Briefing: ON';
            speakAgentText('Voice briefing activated. AeroSense is ready to explain the remote sensing problem.');
          } else {
            voiceToggleBtn.classList.remove('active');
            if (voiceBtnText) voiceBtnText.innerText = 'Voice Briefing: OFF';
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
          }
        });
      }

      // Reset Briefing Button
      const resetBtn = document.getElementById('btn-agent-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          const chatFeed = document.getElementById('agent-chat-feed');
          if (chatFeed) chatFeed.innerHTML = '';
          appendAgentMessage(AGENT_PROBLEM_KNOWLEDGE['welcome']);
        });
      }

      // Scenario Auditor Controls
      const auditorRange = document.getElementById('auditor-cloud-range');
      const auditorRangeLbl = document.getElementById('auditor-cloud-type-label');
      const btnAudit = document.getElementById('btn-run-audit');

      if (auditorRange) {
        auditorRange.addEventListener('input', (e) => {
          const val = parseInt(e.target.value, 10);
          if (auditorRangeLbl) {
            if (val > 80) {
              auditorRangeLbl.innerText = `Deep Convective Cumulonimbus (${val}%)`;
              auditorRangeLbl.style.color = '#ef4444';
            } else if (val > 45) {
              auditorRangeLbl.innerText = `Cumulus Mediocris (${val}%)`;
              auditorRangeLbl.style.color = '#fbbf24';
            } else {
              auditorRangeLbl.innerText = `Thin Cirrus Haze (${val}%)`;
              auditorRangeLbl.style.color = '#38bdf8';
            }
          }
        });
      }

      if (btnAudit) {
        btnAudit.addEventListener('click', runSceneProblemAudit);
      }
    }
  }

  // Floating Mini-Agent Context Updates
  window.updateFloatingAgentContext = function(tabId) {
    const contextEl = document.getElementById('floating-context-text');
    if (!contextEl) return;

    const contexts = {
      overview: 'Overview context: 80%+ of North East India is obscured by cloud cover during monsoons, rendering optical satellite passes useless for up to 8 months.',
      agent: 'Agent Command Center: Interactive mission briefing on optical degradation, Mie scattering, and multi-modal SAR reconstruction physics.',
      sandbox: 'Sandbox Simulator context: Notice how thick clouds produce 0% direct optical transmission, necessitating Sentinel-1 SAR microwave guidance.',
      architectures: 'Model Architectures context: The core challenge is preventing generative AI from hallucinating fictional structures without SAR guidance.',
      metrics: 'Quantitative Analysis context: Unmitigated cloud shadows cause up to 68% false-positive water body misclassifications in flood mapping.',
      details: 'Satellite Specs context: LISS-IV 5.8m optical bands (Green, Red, NIR) are blocked by water droplets, while 5.6cm C-band radar penetrates unimpeded.',
      threedee: '3D Depth & Dehazing context: Satellite clouds have zero optical transmission (T ≈ 0), whereas ground haze retains partial light transmission.'
    };

    contextEl.innerText = contexts[tabId] || contexts.overview;
  };

  // Floating Mini-Agent Drawer Controls
  const floatingTrigger = document.getElementById('btn-floating-agent-trigger');
  const floatingDrawer = document.getElementById('floating-agent-drawer');
  const floatingClose = document.getElementById('btn-close-floating-agent');
  const floatingGotoFull = document.getElementById('btn-goto-full-agent');
  const floatingRespBox = document.getElementById('floating-response-box');

  if (floatingTrigger && floatingDrawer) {
    floatingTrigger.addEventListener('click', () => {
      floatingDrawer.classList.toggle('hidden');
    });
  }

  if (floatingClose && floatingDrawer) {
    floatingClose.addEventListener('click', () => {
      floatingDrawer.classList.add('hidden');
    });
  }

  if (floatingGotoFull) {
    floatingGotoFull.addEventListener('click', () => {
      if (floatingDrawer) floatingDrawer.classList.add('hidden');
      switchTab('agent');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Floating Prompt Buttons
  const floatingPrompts = document.querySelectorAll('.floating-prompt-btn');
  floatingPrompts.forEach(btn => {
    btn.addEventListener('click', () => {
      const qKey = btn.getAttribute('data-query');
      const item = AGENT_PROBLEM_KNOWLEDGE[qKey];
      if (item && floatingRespBox) {
        floatingRespBox.innerHTML = `
          <strong style="color: #38bdf8; display: block; margin-bottom: 4px;">${item.title}</strong>
          <div>${item.speech || item.html}</div>
        `;
        if (agentVoiceEnabled) {
          speakAgentText(item.speech || item.title);
        }
      }
    });
  });

  // --- Initial Setup Execution ---
  setTimeout(() => {
    switchTab('overview');
    resizeCanvases();
    updateQuantitativeMetrics();
    updateFloatingAgentContext('overview');
  }, 100);

});
