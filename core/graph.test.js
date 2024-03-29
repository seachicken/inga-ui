import assert from 'node:assert';
import { test } from 'node:test';
import { create, findLeafPoss } from './graph.js';

test('create graphs', () => {
  assert.deepStrictEqual(
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
        type: 'entrypoint',
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
            type: 'connection',
            innerConnections: [
              {
                entrypoint: {
                  path: 'a/B.java', name: 'a', line: 1, offset: 1,
                },
                origin: {
                  path: 'b/B.java', name: 'a', line: 1, offset: 1,
                },
              },
            ],
            neighbours: [
              {
                type: 'entrypoint',
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
      },
    ],
  );
});

test('create multiple graphs', () => {
  assert.deepStrictEqual(
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
        type: 'entrypoint',
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
        type: 'entrypoint',
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
  assert.deepStrictEqual(
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
        type: 'entrypoint',
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
            type: 'connection',
            innerConnections: [
              {
                entrypoint: {
                  path: 'a/B.java', name: 'a', line: 1, offset: 1,
                },
                origin: {
                  path: 'b/B.java', name: 'a', line: 1, offset: 1,
                },
              },
            ],
            neighbours: [
              {
                type: 'entrypoint',
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
          {
            type: 'connection',
            innerConnections: [
              {
                entrypoint: {
                  path: 'a/C.java', name: 'a', line: 1, offset: 1,
                },
                origin: {
                  path: 'c/B.java', name: 'a', line: 1, offset: 1,
                },
              },
            ],
            neighbours: [
              {
                type: 'entrypoint',
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
      },
    ],
  );
});

test('create graphs with related and orphan declarations', { only: true }, () => {
  assert.deepStrictEqual(
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
        service: 'B',
        entrypoint: {
          path: 'b/D.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'b/C.java', name: 'a', line: 1, offset: 1,
        },
      },
    ]),
    [
      {
        type: 'entrypoint',
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
            type: 'connection',
            innerConnections: [
              {
                entrypoint: {
                  path: 'a/B.java', name: 'a', line: 1, offset: 1,
                },
                origin: {
                  path: 'b/B.java', name: 'a', line: 1, offset: 1,
                },
              },
            ],
            neighbours: [
              {
                type: 'entrypoint',
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
                  {
                    entrypoint: {
                      path: 'b/D.java', name: 'a', line: 1, offset: 1,
                    },
                    origins: [
                      {
                        path: 'b/C.java', name: 'a', line: 1, offset: 1,
                      },
                    ],
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

test('filter by files changed', () => {
  assert.deepStrictEqual(
    findLeafPoss(create([
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
    ])),
    [
      {
        path: 'b/A.java', name: 'a', line: 1, offset: 1,
      },
    ],
  );
});
