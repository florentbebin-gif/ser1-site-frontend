import { useState, type KeyboardEvent, type ReactElement, type TouchEvent } from 'react';

import { IconBuilding, IconChevronRight, IconFileText, IconLock, IconPieChart } from '@/icons/ui';

import type { AuditPreviewSlide, AuditPreviewSlideId } from '../auditLandingViewModel';

interface AuditPreviewCarouselProps {
  slides: AuditPreviewSlide[];
}

type SlidePosition = 'active' | 'prev' | 'next';

const SWIPE_THRESHOLD_PX = 36;

export function AuditPreviewCarousel({ slides }: AuditPreviewCarouselProps): ReactElement {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const activeSlideId = slides[activeIndex]?.id ?? null;
  const activeNumber = slides.length === 0 ? 0 : activeIndex + 1;

  const showPrevious = () => {
    if (slides.length === 0) return;
    setActiveIndex((current) => (current + slides.length - 1) % slides.length);
  };

  const showNext = () => {
    if (slides.length === 0) return;
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  const showSlide = (index: number) => {
    setActiveIndex(index);
  };

  const handleControlKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showPrevious();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      showNext();
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX == null) return;
    const endX = event.changedTouches[0]?.clientX;
    setTouchStartX(null);
    if (endX == null) return;

    const delta = endX - touchStartX;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta > 0) showPrevious();
    else showNext();
  };

  return (
    <section
      className="audit-carousel"
      aria-label="Calculs et projections"
      aria-roledescription="carrousel"
    >
      <header className="audit-carousel__head">
        <div>
          <p className="audit-carousel__eyebrow">Calculs et projections</p>
          <p className="audit-carousel__context">
            Aperçus disponibles selon les fondations du dossier.
          </p>
        </div>
        <span
          className="audit-carousel__counter"
          aria-label={`Aperçu ${activeNumber} sur ${slides.length}`}
        >
          {activeNumber}/{slides.length}
        </span>
      </header>

      <div
        className="audit-carousel__viewport"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          className="audit-carousel__arrow audit-carousel__arrow--prev"
          aria-label="Afficher l’aperçu précédent"
          onKeyDown={handleControlKeyDown}
          onClick={showPrevious}
        >
          <IconChevronRight className="audit-carousel__arrow-icon" />
        </button>

        {slides.map((slide, index) => {
          const position = getSlidePosition(index, activeIndex, slides.length);
          const isActive = position === 'active';
          return (
            <article
              className={`audit-carousel__slide audit-carousel__slide--${position}${
                isActive ? ' audit-card' : ''
              }`}
              aria-hidden={isActive ? undefined : true}
              data-slide-position={position}
              key={slide.id}
            >
              <SlideContent slide={slide} active={isActive} />
            </article>
          );
        })}

        <button
          type="button"
          className="audit-carousel__arrow audit-carousel__arrow--next"
          aria-label="Afficher l’aperçu suivant"
          onKeyDown={handleControlKeyDown}
          onClick={showNext}
        >
          <IconChevronRight className="audit-carousel__arrow-icon" />
        </button>
      </div>

      <div className="audit-carousel__dots" aria-label="Choisir un aperçu">
        {slides.map((slide, index) => (
          <button
            type="button"
            className="audit-carousel__dot"
            aria-current={slide.id === activeSlideId ? 'true' : undefined}
            aria-label={`Afficher l’aperçu ${index + 1} : ${slide.title}`}
            key={slide.id}
            onKeyDown={handleControlKeyDown}
            onClick={() => showSlide(index)}
          />
        ))}
      </div>
    </section>
  );
}

function getSlidePosition(index: number, activeIndex: number, length: number): SlidePosition {
  if (index === activeIndex) return 'active';
  if (index === (activeIndex + length - 1) % length) return 'prev';
  return 'next';
}

function SlideContent({
  slide,
  active,
}: {
  slide: AuditPreviewSlide;
  active: boolean;
}): ReactElement {
  return (
    <>
      <div className="audit-carousel__slide-head">
        <span className="audit-card__icon audit-carousel__slide-icon" aria-hidden="true">
          {renderSlideIcon(slide.id)}
        </span>
        <div className="audit-carousel__slide-title">
          <p className="audit-carousel__slide-eyebrow">{slide.eyebrow}</p>
          <h2 className="audit-card__title">{slide.title}</h2>
        </div>
        <span className="audit-preview-badge" data-status={slide.status}>
          {slide.badgeLabel}
        </span>
      </div>

      <div className="audit-card__divider sim-divider sim-divider--soft" aria-hidden="true" />
      <PreviewVisual slideId={slide.id} />
      <p className="audit-card__sub">{slide.description}</p>
      <p className="audit-card__caption">{active ? slide.caption : ''}</p>
    </>
  );
}

function renderSlideIcon(id: AuditPreviewSlideId): ReactElement {
  if (id === 'masses') return <IconPieChart className="audit-card__icon-svg" />;
  if (id === 'societe') return <IconBuilding className="audit-card__icon-svg" />;
  return <IconFileText className="audit-card__icon-svg" />;
}

function PreviewVisual({ slideId }: { slideId: AuditPreviewSlideId }): ReactElement {
  if (slideId === 'societe') {
    return (
      <div className="audit-preview-visual audit-preview-visual--org" aria-hidden="true">
        <span className="audit-preview-visual__node audit-preview-visual__node--root" />
        <span className="audit-preview-visual__line audit-preview-visual__line--vertical" />
        <span className="audit-preview-visual__node audit-preview-visual__node--main" />
        <span className="audit-preview-visual__line audit-preview-visual__line--split" />
        <span className="audit-preview-visual__node" />
        <span className="audit-preview-visual__node" />
      </div>
    );
  }

  if (slideId === 'ir') {
    return (
      <div className="audit-preview-visual audit-preview-visual--ir" aria-hidden="true">
        <span className="audit-preview-visual__paper">
          <IconLock className="audit-preview-visual__lock" />
        </span>
        <span className="audit-preview-visual__line audit-preview-visual__line--wide" />
        <span className="audit-preview-visual__line" />
        <span className="audit-preview-visual__line audit-preview-visual__line--short" />
      </div>
    );
  }

  return (
    <div className="audit-preview-visual audit-preview-visual--masses" aria-hidden="true">
      <span className="audit-preview-visual__ring">
        <IconLock className="audit-preview-visual__lock" />
      </span>
      <span className="audit-preview-visual__band" />
      <span className="audit-preview-visual__band audit-preview-visual__band--short" />
      <span className="audit-preview-visual__band audit-preview-visual__band--muted" />
    </div>
  );
}
