import { initials } from '../lib/format.js';

export default function Avatar({ name, src, size = 'md' }) {
  return (
    <div className={`avatar avatar-${size}`}>
      {src ? <img src={src} alt="" loading="lazy" /> : <span aria-hidden="true">{initials(name)}</span>}
    </div>
  );
}
