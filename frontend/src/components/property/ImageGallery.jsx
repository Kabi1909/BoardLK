import SafeImage from '../common/SafeImage.jsx';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { Modal } from '../common/UI';
export default function ImageGallery({ images: sourceImages, title }) {
  const images = sourceImages?.length ? sourceImages : ['/property-placeholder.svg'];
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState(false);
  const move = (n) => setIndex((i) => (i + n + images.length) % images.length);
  const controls = (
    <>
      <button
        className="gallery-prev icon-button"
        onClick={() => move(-1)}
        aria-label="Previous photo"
      >
        <ChevronLeft />
      </button>
      <button className="gallery-next icon-button" onClick={() => move(1)} aria-label="Next photo">
        <ChevronRight />
      </button>
      <span className="image-count">
        {index + 1} / {images.length}
      </span>
    </>
  );
  return (
    <div className="gallery">
      <div className="gallery-main">
        <SafeImage src={images[index]} alt={title + ' photo ' + (index + 1)} />
        {controls}
        <button
          className="gallery-expand icon-button"
          aria-label="Full-screen photo preview"
          onClick={() => setFull(true)}
        >
          <Expand size={18} />
        </button>
      </div>
      <div className="gallery-thumbnails">
        {images.map((src, i) => (
          <button
            key={i}
            aria-label={'View photo ' + (i + 1)}
            aria-pressed={i === index}
            className={i === index ? 'selected' : ''}
            onClick={() => setIndex(i)}
          >
            <SafeImage src={src} alt={title + ' thumbnail ' + (i + 1)} />
          </button>
        ))}
      </div>
      {full && (
        <Modal
          title={title + ' · ' + (index + 1) + ' of ' + images.length}
          wide
          onClose={() => setFull(false)}
        >
          <div className="gallery-full">
            <SafeImage src={images[index]} alt={title + ' full photo ' + (index + 1)} />
            {controls}
          </div>
        </Modal>
      )}
    </div>
  );
}
