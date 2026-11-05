export default function SetupNotice() {
  return (
    <div className="page narrow">
      <h1>Supabase тохируулаагүй байна</h1>
      <p>
        <code>.env.example</code> файлыг <code>.env</code> нэрээр хуулж, <code>VITE_SUPABASE_URL</code> болон{' '}
        <code>VITE_SUPABASE_ANON_KEY</code> утгыг бөглөөд дахин ажиллуулна уу. Дэлгэрэнгүйг README-с харна уу.
      </p>
    </div>
  );
}
