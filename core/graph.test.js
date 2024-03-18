import assert from 'node:assert';
import { test } from 'node:test';
import { create } from './graph.js';

test('create graphs', () => {
  assert.deepEqual(
    create([
      {
        type: 'entrypoint',
        service: 'B',
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
        service: 'A',
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
        service: 'A',
        innerConnections: [
          {
            entrypoint: {
              path: 'a/A.java', name: 'a', line: 1, offset: 1,
            },
            origins: [
              {
                path: 'a/B.java', name: 'a', line: 1, offset: 1,
              },
            ],
          },
        ],
        neighbours: [
          {
            service: 'B',
            innerConnections: [
              {
                entrypoint: {
                  path: 'b/B.java', name: 'a', line: 1, offset: 1,
                },
                origins: [
                  {
                    path: 'b/A.java', name: 'a', line: 1, offset: 1,
                  },
                ],
              },
            ],
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
        service: 'B',
        entrypoint: {
          path: 'b/B.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'b/A.java', name: 'a', line: 1, offset: 1,
        },
      },
      {
        type: 'entrypoint',
        service: 'A',
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
        service: 'B',
        innerConnections: [
          {
            entrypoint: {
              path: 'b/B.java', name: 'a', line: 1, offset: 1,
            },
            origins: [
              {
                path: 'b/A.java', name: 'a', line: 1, offset: 1,
              },
            ],
          },
        ],
      },
      {
        service: 'A',
        innerConnections: [
          {
            entrypoint: {
              path: 'a/A.java', name: 'a', line: 1, offset: 1,
            },
            origins: [
              {
                path: 'a/B.java', name: 'a', line: 1, offset: 1,
              },
            ],
          },
        ],
      },
    ],
  );
});

test('create graphs with a common parent', () => {
  assert.deepEqual(
    create([
      {
        type: 'entrypoint',
        service: 'B',
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
        service: 'A',
        entrypoint: {
          path: 'a/A.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'a/B.java', name: 'a', line: 1, offset: 1,
        },
      },
      {
        type: 'entrypoint',
        service: 'C',
        entrypoint: {
          path: 'c/B.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'c/A.java', name: 'a', line: 1, offset: 1,
        },
      },
      {
        type: 'connection',
        entrypoint: {
          path: 'a/C.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'c/B.java', name: 'a', line: 1, offset: 1,
        },
      },
      {
        type: 'entrypoint',
        service: 'A',
        entrypoint: {
          path: 'a/A.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'a/C.java', name: 'a', line: 1, offset: 1,
        },
      },
    ]),
    [
      {
        service: 'A',
        innerConnections: [
          {
            entrypoint: {
              path: 'a/A.java', name: 'a', line: 1, offset: 1,
            },
            origins: [
              {
                path: 'a/B.java', name: 'a', line: 1, offset: 1,
              },
              {
                path: 'a/C.java', name: 'a', line: 1, offset: 1,
              },
            ],
          },
        ],
        neighbours: [
          {
            service: 'B',
            innerConnections: [
              {
                entrypoint: {
                  path: 'b/B.java', name: 'a', line: 1, offset: 1,
                },
                origins: [
                  {
                    path: 'b/A.java', name: 'a', line: 1, offset: 1,
                  },
                ],
              },
            ],
          },
          {
            service: 'C',
            innerConnections: [
              {
                entrypoint: {
                  path: 'c/B.java', name: 'a', line: 1, offset: 1,
                },
                origins: [
                  {
                    path: 'c/A.java', name: 'a', line: 1, offset: 1,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  );
});
