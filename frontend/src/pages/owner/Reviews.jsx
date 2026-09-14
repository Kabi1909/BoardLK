import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../hooks/useStore';
import { collection } from '../../services/store';
import { ReviewCard } from '../../components/property/Reviews';
import { FormTextarea, FormSelect } from '../../components/forms/Fields';
import { EmptyState } from '../../components/common/UI';
function Reply({ review }) {
  const [text, setText] = useState(review.reply || '');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  return editing ? (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim().length < 3) {
          setError('Write at least 3 characters.');
          return;
        }
        try {
          collection('reviews').update(review.id, { reply: text.trim() });
          setEditing(false);
        } catch (e) {
          setError(e.message);
        }
      }}
    >
      <FormTextarea
        label="Your response"
        value={text}
        onChange={(e) => setText(e.target.value)}
        error={error}
      />
      <div className="actions">
        <button className="btn small secondary" type="button" onClick={() => setEditing(false)}>
          Cancel
        </button>
        <button className="btn small">Publish reply</button>
      </div>
    </form>
  ) : (
    <button className="text-link" onClick={() => setEditing(true)}>
      {review.reply ? 'Edit your reply' : 'Reply to review'} →
    </button>
  );
}
export default function OwnerReviews() {
  const { user } = useAuth();
  const s = useStore();
  const [filter, setFilter] = useState('');
  const own = s.properties.filter((p) => p.ownerId === user.id);
  const reviews = s.reviews.filter(
    (r) => own.some((p) => p.id === r.propertyId) && (!filter || r.propertyId === filter),
  );
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">LISTEN. CONNECT. GROW.</span>
        <h1>Property reviews</h1>
        <p>See what renters have to say and share a thoughtful response.</p>
      </div>
      <div className="review-filter">
        <FormSelect
          label="Filter by property"
          placeholder="All my properties"
          value={filter}
          options={own.map((p) => ({ value: p.id, label: p.title }))}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="grid-2">
        {reviews.map((r) => (
          <section className="panel" key={r.id}>
            <span className="eyebrow">{own.find((p) => p.id === r.propertyId)?.title}</span>
            <ReviewCard review={r} user={s.users.find((u) => u.id === r.renterId)} />
            <Reply review={r} />
          </section>
        ))}
      </div>
      {!reviews.length && (
        <EmptyState
          title="Your story is still being written"
          description="Reviews from your renters will appear here."
        />
      )}
    </>
  );
}
