import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Send, ArrowLeft, MessageCircle, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../hooks/useStore';
import { database } from '../../services/store';
import { sendMessage } from '../../services/actions';
import { Avatar, EmptyState } from '../common/UI';
import { MessageBubble, ConversationList } from './MessageComponents';
export default function MessagesPage() {
  const { user } = useAuth();
  const s = useStore();
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const end = useRef();
  const own = s.conversations.filter((c) => c.renterId === user.id || c.ownerId === user.id);
  const selected = params.get('conversation');
  const conversation = own.find((c) => c.id === selected);
  const other = s.users.find(
    (u) => u.id === (user.role === 'owner' ? conversation?.renterId : conversation?.ownerId),
  );
  const property = s.properties.find((p) => p.id === conversation?.propertyId);
  useEffect(() => {
    if (conversation && !conversation.readBy?.includes(user.id))
      database.update((s) => ({
        ...s,
        conversations: s.conversations.map((c) =>
          c.id === conversation.id ? { ...c, readBy: [...(c.readBy || []), user.id] } : c,
        ),
      }));
  }, [conversation, user.id]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [selected, conversation?.messages.length]);
  const visible = own
    .filter((c) => {
      const person = s.users.find((u) => u.id === (user.role === 'owner' ? c.renterId : c.ownerId));
      const property = s.properties.find((p) => p.id === c.propertyId);
      return ((person?.name || '') + ' ' + (property?.title || ''))
        .toLowerCase()
        .includes(search.toLowerCase());
    })
    .sort(
      (a, b) =>
        new Date(b.messages.at(-1)?.createdAt || 0) - new Date(a.messages.at(-1)?.createdAt || 0),
    );
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">A GOOD PLACE STARTS WITH A CONVERSATION</span>
        <h1>Messages</h1>
        <p>Ask a question, plan a visit, and get to know each other.</p>
      </div>
      <div className={'messaging-layout ' + (conversation ? 'chat-open' : '')}>
        <aside className="inbox">
          <div className="inbox-search">
            <Search size={16} />
            <input
              aria-label="Search conversations"
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ConversationList
            conversations={visible}
            selected={selected}
            onSelect={(id) => {
              setParams({ conversation: id });
              setText('');
              setError('');
            }}
            users={s.users}
            properties={s.properties}
            user={user}
          />
          {!visible.length && (
            <EmptyState
              title="No conversations"
              description="Contact an owner from a property or message a renter from a booking."
            />
          )}
        </aside>
        <section className="chat-panel">
          {conversation ? (
            <>
              <header className="chat-header">
                <button
                  className="icon-button chat-back"
                  onClick={() => setParams({})}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={18} />
                </button>
                <Avatar user={other} />
                <div>
                  <h3>{other?.name || 'Former user'}</h3>
                  {property ? (
                    <Link className="text-link" to={'/properties/' + property.id}>
                      {property.title} ↗
                    </Link>
                  ) : (
                    <small>Property no longer listed</small>
                  )}
                </div>
              </header>
              <div className="chat-messages" aria-live="polite">
                <div className="chat-start">
                  <MessageCircle size={22} />
                  <p>
                    This is the start of your conversation.
                    <br />A little hello goes a long way.
                  </p>
                </div>
                {conversation.messages.map((m) => (
                  <MessageBubble key={m.id} message={m} outgoing={m.senderId === user.id} />
                ))}
                <div ref={end} />
              </div>
              {error && (
                <p role="alert" className="error-box">
                  {error}
                </p>
              )}
              <form
                className="message-compose"
                onSubmit={(e) => {
                  e.preventDefault();
                  try {
                    sendMessage(user, conversation.id, text);
                    setText('');
                    setError('');
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >
                <input
                  aria-label="Message"
                  placeholder="Write a message…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={2000}
                />
                <button className="btn" aria-label="Send message" disabled={!text.trim()}>
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <EmptyState
              title="Let’s start a conversation"
              description="Choose a conversation on the left, or find a property you love."
              action={
                <Link className="btn" to="/properties">
                  Explore properties
                </Link>
              }
            />
          )}
        </section>
      </div>
    </>
  );
}
