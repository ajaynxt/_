import { createHyperspeed } from './HyperspeedVanilla.js';
import { createCardSwap } from './CardSwapVanilla.js';

const motionPreview = new URLSearchParams(window.location.search).has('motion-preview');
const prefersReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches && !motionPreview;
const reducedMotion = false;
const hyperspeedContainer = document.querySelector('[data-hyperspeed]');
let hyperspeed = null;

function cssColorNumber(variable, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return /^#[0-9a-f]{6}$/i.test(value)
    ? Number.parseInt(value.slice(1), 16)
    : fallback;
}

function getHyperspeedColors() {
  const dailyAccent = cssColorNumber('--daily-accent', 0xc45112);
  const dailyAccentDark = cssColorNumber('--daily-accent-dark', 0x8f340a);
  const dailyAccentSoft = cssColorNumber('--daily-accent-soft', 0xffb36b);

  return {
    roadColor: 0xe8d8c8,
    islandColor: 0xd8bca3,
    background: 0xfff7ec,
    shoulderLines: dailyAccent,
    brokenLines: dailyAccentDark,
    leftCars: [dailyAccent, dailyAccentDark, dailyAccentSoft],
    rightCars: [0x342018, dailyAccentDark, dailyAccentSoft],
    sticks: dailyAccent
  };
}

// AJAY NXT's hero motion is an intentional part of the brand experience.
// Keep it available even when the OS requests reduced motion, but use a
// calmer configuration in that case instead of removing the canvas entirely.
function startHyperspeed() {
  if (!hyperspeedContainer) return null;

  hyperspeedContainer.dataset.motionActive = 'true';
  return createHyperspeed(hyperspeedContainer, {
    distortion: 'turbulentDistortion',
    length: 400,
    roadWidth: 10,
    islandWidth: 2,
    lanesPerRoad: 4,
    fov: 88,
    fovSpeedUp: 132,
    speedUp: prefersReducedMotion ? 1.15 : 1.7,
    carLightsFade: 0.45,
    totalSideLightSticks: prefersReducedMotion ? 10 : 16,
    lightPairsPerRoadWay: prefersReducedMotion ? 18 : 28,
    movingAwaySpeed: prefersReducedMotion ? [32, 42] : [48, 64],
    movingCloserSpeed: prefersReducedMotion ? [-58, -76] : [-92, -120],
    colors: getHyperspeedColors()
  });
}

if (hyperspeedContainer) {
  hyperspeed = startHyperspeed();
  window.addEventListener('ajaynxt:palette-change', () => {
    // Recolour the existing WebGL scene in place. Recreating the renderer
    // every five seconds would be expensive and can briefly interrupt motion.
    hyperspeed?.setColors(getHyperspeedColors());
  });
}

let cardSwap = null;
let collabPrevControl = null;
let collabNextControl = null;
let collabPrevHandler = null;
let collabNextHandler = null;

function setupCardSwap() {
  if (collabPrevControl && collabPrevHandler) collabPrevControl.removeEventListener('click', collabPrevHandler);
  if (collabNextControl && collabNextHandler) collabNextControl.removeEventListener('click', collabNextHandler);
  cardSwap?.dispose();
  cardSwap = null;
  const collabSlider = document.querySelector('[data-card-swap]');
  const collabTrack = collabSlider?.querySelector('[data-collab-track]');
  if (!collabSlider || !collabTrack || reducedMotion) return;

  const current = collabSlider.querySelector('[data-collab-current]');
  const total = collabSlider.querySelector('[data-collab-total]');
  const compact = window.matchMedia('(max-width: 700px)').matches;

  cardSwap = createCardSwap(collabTrack, {
    width: compact ? 300 : 700,
    height: compact ? 470 : 420,
    cardDistance: compact ? 14 : 30,
    verticalDistance: compact ? 16 : 32,
    delay: 2600,
    pauseOnHover: true,
    skewAmount: compact ? 1 : 2,
    easing: 'linear',
    onCardChange(index, count) {
      if (current) current.textContent = String(index + 1).padStart(2, '0');
      if (total) total.textContent = String(count).padStart(2, '0');
    }
  });

  collabPrevControl = collabSlider.querySelector('[data-collab-prev]');
  collabNextControl = collabSlider.querySelector('[data-collab-next]');
  collabPrevHandler = () => cardSwap?.swap();
  collabNextHandler = () => cardSwap?.swap();
  collabPrevControl?.addEventListener('click', collabPrevHandler);
  collabNextControl?.addEventListener('click', collabNextHandler);
}

setupCardSwap();
window.addEventListener('ajaynxt:collaborations-rendered', setupCardSwap);

document.documentElement.dataset.motionReady = hyperspeed ? 'full' : 'reduced';

window.addEventListener(
  'pagehide',
  () => {
    hyperspeed?.dispose();
    cardSwap?.dispose();
    window.removeEventListener('ajaynxt:collaborations-rendered', setupCardSwap);
  },
  { once: true }
);
