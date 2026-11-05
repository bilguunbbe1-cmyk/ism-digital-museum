import { Link, useParams } from 'react-router-dom';
import { fetchExhibitsByCreator, fetchProfile } from '../lib/api.js';
import { useLoad } from '../hooks/useLoad.js';
import Avatar from '../components/Avatar.jsx';
import ExhibitCard from '../components/ExhibitCard.jsx';
import { LoadBoundary, Message } from '../components/States.jsx';

export default function CreatorDetailPage() {
  const { id } = useParams();
  const load = useLoad(async () => {
    const [profile, exhibits] = await Promise.all([fetchProfile(id), fetchExhibitsByCreator(id)]);
    return profile && { profile, exhibits: exhibits.filter((e) => e.status === 'published') };
  }, [id]);

  return (
    <div className="page">
      <Link to="/creators" className="text-link">← ISM Creators руу буцах</Link>
      <LoadBoundary load={load} emptyTitle="Бүтээгч олдсонгүй">
        {({ profile, exhibits }) => (
          <>
            <header className="creator-head">
              <Avatar name={profile.display_name} src={profile.avatar_url} size="xl" />
              <div>
                <h1>{profile.display_name}</h1>
                {profile.bio && <p className="lead">{profile.bio}</p>}
              </div>
            </header>
            <h2 className="section-title">Бүтээлүүд</h2>
            {exhibits.length ? (
              <div className="exhibit-grid">
                {exhibits.map((e) => <ExhibitCard key={e.id} exhibit={e} />)}
              </div>
            ) : (
              <Message title="Нийтлэгдсэн бүтээл алга" />
            )}
          </>
        )}
      </LoadBoundary>
    </div>
  );
}
