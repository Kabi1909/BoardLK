import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendDeliveredMessage, clearSubmittedDraft } from './messages.js';

test('confirmed messages remain unique when delivery and refresh overlap', () => {
  const message = { id: 'b', text: 'Confirmed', createdAt: '2026-09-27T12:01:00Z' };
  const conversation = {
    id: 'chat',
    messages: [{ id: 'a', text: 'Hello', createdAt: '2026-09-27T12:00:00Z' }],
    unreadCount: 1,
  };
  const result = appendDeliveredMessage(appendDeliveredMessage(conversation, message), message);
  assert.deepEqual(
    result.messages.map((item) => item.id),
    ['a', 'b'],
  );
  assert.equal(result.lastMessage, 'Confirmed');
  assert.equal(result.unreadCount, 1);
  assert.equal(conversation.messages.length, 1);
});

test('send completion clears only the submitted conversation draft', () => {
  const drafts = { first: 'Hello', second: 'Different conversation' };
  assert.deepEqual(clearSubmittedDraft(drafts, 'first', 'Hello'), {
    second: 'Different conversation',
  });
  assert.equal(drafts.first, 'Hello');
});

test('typing while a send is pending preserves the newer draft', () => {
  const drafts = { first: 'New message' };
  assert.equal(clearSubmittedDraft(drafts, 'first', 'Old message'), drafts);
});
