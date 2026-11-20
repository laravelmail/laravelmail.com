import { test } from 'node:test';
import assert from 'node:assert/strict';
import { legacyRoute } from '../src/lib/legacy-routes.mjs';

test('removed sections answer 410', () => {
  for (const p of ['/databases/', '/databases/database_92/', '/databases', '/buy', '/es/buy', '/zh/databases/database_1']) {
    assert.equal(legacyRoute(p)?.status, 410, p);
  }
});

test('double locale prefix redirects to the last locale', () => {
  assert.deepEqual(legacyRoute('/es/ru/blog/chat-history-memory-neuron/'), { status: 301, location: '/ru/blog/chat-history-memory-neuron/' });
  assert.deepEqual(legacyRoute('/es/ru/'), { status: 301, location: '/ru/' });
});

test('localized template detail redirects to the English page', () => {
  assert.deepEqual(legacyRoute('/zh/templates/delicious-cookies/'), { status: 301, location: '/templates/delicious-cookies/' });
  assert.deepEqual(legacyRoute('/ru/templates/e-book-launch'), { status: 301, location: '/templates/e-book-launch/' });
});

test('real routes are untouched', () => {
  for (const p of ['/', '/templates/', '/es/templates/', '/zh/laravel-mail/', '/blog/laravel-mail-queue-performance/', '/ru/blog/', '/validation/', '/pricing']) {
    assert.equal(legacyRoute(p), null, p);
  }
});
