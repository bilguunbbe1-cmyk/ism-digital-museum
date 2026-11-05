import { useEffect, useRef } from 'react';

// Зурагт цомгийн томруулсан харагдац. <dialog> нь Esc болон фокусыг өөрөө зохицуулдаг.
export default function Lightbox({ photos, index, onChange, onClose }) {
  const ref = useRef(null);
  const photo = photos[index];
  const step = (delta) => onChange((index + delta + photos.length) % photos.length);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog.open) dialog.showModal();
    return () => dialog.close();
  }, []);

  function onKeyDown(e) {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  }

  return (
    <dialog ref={ref} className="lightbox" onClose={onClose} onKeyDown={onKeyDown} aria-label="Зураг томруулж харах">
      <button type="button" className="lightbox-close" onClick={onClose}>Хаах</button>
      <img src={photo.image_url} alt={photo.caption || ''} />
      <div className="lightbox-bar">
        <button type="button" onClick={() => step(-1)} aria-label="Өмнөх зураг">←</button>
        <p>
          {photo.caption} <span className="muted">{index + 1} / {photos.length}</span>
        </p>
        <button type="button" onClick={() => step(1)} aria-label="Дараагийн зураг">→</button>
      </div>
    </dialog>
  );
}
