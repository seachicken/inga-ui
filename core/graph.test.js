import assert from 'node:assert';
import { test } from 'node:test';
import { create } from './graph.js';

test('create graphs', () => {
  assert.deepEqual(
    create([
      {
        type: 'entrypoint',
        entrypoint: {
          path: 'b/B.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'b/A.java', name: 'a', line: 1, offset: 1,
        },
      },
      {
        type: 'connection',
        entrypoint: {
          path: 'a/B.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'b/B.java', name: 'a', line: 1, offset: 1,
        },
      },
      {
        type: 'entrypoint',
        entrypoint: {
          path: 'a/A.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'a/B.java', name: 'a', line: 1, offset: 1,
        },
      },
    ]),
    [
      {
        type: 'entrypoint',
        entrypoint: {
          path: 'a/A.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'a/B.java', name: 'a', line: 1, offset: 1,
        },
        edges: [
          {
            type: 'entrypoint',
            entrypoint: {
              path: 'b/B.java', name: 'a', line: 1, offset: 1,
            },
            origin: {
              path: 'b/A.java', name: 'a', line: 1, offset: 1,
            },
          },
        ],
      },
    ],
  );
});

test('create multiple graphs', () => {
  assert.deepEqual(
    create([
      {
        type: 'entrypoint',
        entrypoint: {
          path: 'b/B.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'b/A.java', name: 'a', line: 1, offset: 1,
        },
      },
      {
        type: 'entrypoint',
        entrypoint: {
          path: 'a/A.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'a/B.java', name: 'a', line: 1, offset: 1,
        },
      },
    ]),
    [
      {
        type: 'entrypoint',
        entrypoint: {
          path: 'b/B.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'b/A.java', name: 'a', line: 1, offset: 1,
        },
        edges: [],
      },
      {
        type: 'entrypoint',
        entrypoint: {
          path: 'a/A.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'a/B.java', name: 'a', line: 1, offset: 1,
        },
        edges: [],
      },
    ],
  );
});
