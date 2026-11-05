import { Link } from 'react-router-dom';
import { Message } from '../components/States.jsx';

export default function NotFoundPage() {
  return (
    <div className="page">
      <Message title="Энэ танхим олдсонгүй">
        <p>Хайсан хуудас байхгүй байна.</p>
        <Link className="btn" to="/">Нүүр хуудас руу</Link>
      </Message>
    </div>
  );
}
