import gsap from 'gsap';

const makeSlot = (i, distX, distY, total) => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i
});

const placeNow = (el, slot, skew) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true
  });

export function createCardSwap(
  container,
  {
    width = 760,
    height = 480,
    cardDistance = 32,
    verticalDistance = 34,
    delay = 5000,
    pauseOnHover = true,
    onCardClick,
    onCardChange,
    skewAmount = 2,
    easing = 'linear'
  } = {}
) {
  if (!container) return { swap() {}, dispose() {} };

  const config =
    easing === 'elastic'
      ? {
          ease: 'elastic.out(0.6,0.9)',
          durDrop: 2,
          durMove: 2,
          durReturn: 2,
          promoteOverlap: 0.9,
          returnDelay: 0.05
        }
      : {
          ease: 'power1.inOut',
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.45,
          returnDelay: 0.2
        };

  const cards = Array.from(container.children);
  let order = Array.from({ length: cards.length }, (_, i) => i);
  let timeline = null;
  let interval = null;

  container.classList.add('reactbits-card-swap-container');
  container.style.width = typeof width === 'number' ? `${width}px` : width;
  container.style.height = typeof height === 'number' ? `${height}px` : height;

  cards.forEach((card, index) => {
    card.classList.add('reactbits-card');
    card.style.width = typeof width === 'number' ? `${width}px` : width;
    card.style.height = typeof height === 'number' ? `${height}px` : height;
    card.addEventListener('click', event => {
      if (event.target.closest('a, button, input, select, textarea')) return;
      onCardClick?.(index);
    });
    placeNow(card, makeSlot(index, cardDistance, verticalDistance, cards.length), skewAmount);
  });

  const swap = () => {
    if (order.length < 2 || timeline?.isActive()) return;

    const [front, ...rest] = order;
    const frontCard = cards[front];
    const tl = gsap.timeline();
    timeline = tl;

    tl.to(frontCard, {
      y: '+=500',
      duration: config.durDrop,
      ease: config.ease
    });

    tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
    rest.forEach((idx, i) => {
      const card = cards[idx];
      const slot = makeSlot(i, cardDistance, verticalDistance, cards.length);
      tl.set(card, { zIndex: slot.zIndex }, 'promote');
      tl.to(
        card,
        {
          x: slot.x,
          y: slot.y,
          z: slot.z,
          duration: config.durMove,
          ease: config.ease
        },
        `promote+=${i * 0.15}`
      );
    });

    const backSlot = makeSlot(cards.length - 1, cardDistance, verticalDistance, cards.length);
    tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
    tl.call(() => gsap.set(frontCard, { zIndex: backSlot.zIndex }), undefined, 'return');
    tl.to(
      frontCard,
      {
        x: backSlot.x,
        y: backSlot.y,
        z: backSlot.z,
        duration: config.durReturn,
        ease: config.ease
      },
      'return'
    );
    tl.call(() => {
      order = [...rest, front];
      onCardChange?.(order[0], cards.length);
    });
  };

  const start = () => {
    window.clearInterval(interval);
    interval = window.setInterval(swap, delay);
  };
  const pause = () => {
    timeline?.pause();
    window.clearInterval(interval);
  };
  const resume = () => {
    timeline?.play();
    start();
  };

  if (pauseOnHover) {
    container.addEventListener('mouseenter', pause);
    container.addEventListener('mouseleave', resume);
    container.addEventListener('focusin', pause);
    container.addEventListener('focusout', resume);
  }

  onCardChange?.(order[0], cards.length);
  swap();
  start();

  return {
    swap,
    dispose() {
      window.clearInterval(interval);
      timeline?.kill();
      if (pauseOnHover) {
        container.removeEventListener('mouseenter', pause);
        container.removeEventListener('mouseleave', resume);
        container.removeEventListener('focusin', pause);
        container.removeEventListener('focusout', resume);
      }
      cards.forEach(card => gsap.set(card, { clearProps: 'transform,zIndex,width,height' }));
    }
  };
}
