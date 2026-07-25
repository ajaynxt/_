import { createHyperspeed } from './HyperspeedVanilla.js';
import { createCardSwap } from './CardSwapVanilla.js';

const motionPreview = new URLSearchParams(window.location.search).has('motion-preview');
const reducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches && !motionPreview;
const hyperspeedContainer = document.querySelector('[data-hyperspeed]');
let hyperspeed = null;

if (hyperspeedContainer && !reducedMotion) {
  hyperspeed = createHyperspeed(hyperspeedContainer, {
    distortion: 'turbulentDistortion',
    length: 400,
    roadWidth: 10,
    islandWidth: 2,
    lanesPerRoad: 4,
    fov: 88,
    fovSpeedUp: 132,
    speedUp: 1.7,
    carLightsFade: 0.45,
    totalSideLightSticks: 16,
    lightPairsPerRoadWay: 28,
    movingAwaySpeed: [48, 64],
    movingCloserSpeed: [-92, -120],
    colors: {
      roadColor: 0xe8d8c8,
      islandColor: 0xd8bca3,
      background: 0xfff7ec,
      shoulderLines: 0xd85b16,
      brokenLines: 0x7c4a31,
      leftCars: [0xff7a2f, 0xd84f0d, 0xffae70],
      rightCars: [0x342018, 0x74412a, 0xff8b45],
      sticks: 0xff7a2f
    }
  });
}

const collabSlider = document.querySelector('[data-card-swap]');
const collabTrack = collabSlider?.querySelector('[data-collab-track]');
let cardSwap = null;

if (collabSlider && collabTrack && !reducedMotion) {
  const current = collabSlider.querySelector('[data-collab-current]');
  const total = collabSlider.querySelector('[data-collab-total]');
  const compact = window.matchMedia('(max-width: 700px)').matches;

  cardSwap = createCardSwap(collabTrack, {
    width: compact ? 300 : 760,
    height: compact ? 470 : 460,
    cardDistance: compact ? 14 : 30,
    verticalDistance: compact ? 16 : 32,
    delay: 5200,
    pauseOnHover: true,
    skewAmount: compact ? 1 : 2,
    easing: 'linear',
    onCardChange(index, count) {
      if (current) current.textContent = String(index + 1).padStart(2, '0');
      if (total) total.textContent = String(count).padStart(2, '0');
    }
  });

  collabSlider.querySelector('[data-collab-prev]')?.addEventListener('click', cardSwap.swap);
  collabSlider.querySelector('[data-collab-next]')?.addEventListener('click', cardSwap.swap);
}

document.documentElement.dataset.motionReady = reducedMotion ? 'reduced' : 'full';

window.addEventListener(
  'pagehide',
  () => {
    hyperspeed?.dispose();
    cardSwap?.dispose();
  },
  { once: true }
);
