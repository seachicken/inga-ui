import assert from 'node:assert';
import { test } from 'node:test';
import sort, { fileType } from './sort.js';

test('group by entrypoint', () => {
  assert.deepStrictEqual(
    sort.getFilePoss([
      {
        entrypoint: {
          path: 'a/A.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'b/A.java', name: 'a', line: 1, offset: 1,
        },
      },
      {
        entrypoint: {
          path: 'a/A.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'b/A.java', name: 'b', line: 2, offset: 1,
        },
      },
      {
        entrypoint: {
          path: 'a/A.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'b/B.java', name: 'a', line: 1, offset: 1,
        },
      },
      {
        entrypoint: {
          path: 'a/A.java', name: 'b', line: 2, offset: 1,
        },
        origin: {
          path: 'b/A.java', name: 'a', line: 1, offset: 1,
        },
      },
    ]),
    [
      {
        type: fileType.DIR,
        nest: 0,
        path: 'a',
      },
      {
        type: fileType.FILE,
        nest: 1,
        path: 'A.java',
        declarations: [
          {
            path: 'a/A.java',
            name: 'a',
            line: 1,
            offset: 1,
            origins: [
              {
                path: 'A.java',
                declarations: [
                  {
                    path: 'b/A.java',
                    name: 'a',
                    line: 1,
                    offset: 1,
                  },
                  {
                    path: 'b/A.java',
                    name: 'b',
                    line: 2,
                    offset: 1,
                  },
                ],
              },
              {
                path: 'B.java',
                declarations: [
                  {
                    path: 'b/B.java',
                    name: 'a',
                    line: 1,
                    offset: 1,
                  },
                ],
              },
            ],
          },
          {
            path: 'a/A.java',
            name: 'b',
            line: 2,
            offset: 1,
            origins: [
              {
                path: 'A.java',
                declarations: [
                  {
                    path: 'b/A.java',
                    name: 'a',
                    line: 1,
                    offset: 1,
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

test('sort with a root file and a file in directories', () => {
  assert.deepStrictEqual(
    sort.getFilePoss([
      {
        entrypoint: {
          path: 'A.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'b/A.java', name: 'a', line: 1, offset: 1,
        },
      },
      {
        entrypoint: {
          path: 'a/B.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'b/A.java', name: 'a', line: 1, offset: 1,
        },
      },
    ]),
    [
      {
        type: fileType.DIR,
        nest: 0,
        path: 'a',
      },
      {
        type: fileType.FILE,
        nest: 1,
        path: 'B.java',
        declarations: [
          {
            path: 'a/B.java',
            name: 'a',
            line: 1,
            offset: 1,
            origins: [
              {
                path: 'A.java',
                declarations: [
                  {
                    path: 'b/A.java',
                    name: 'a',
                    line: 1,
                    offset: 1,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: fileType.FILE,
        nest: 0,
        path: 'A.java',
        declarations: [
          {
            path: 'A.java',
            name: 'a',
            line: 1,
            offset: 1,
            origins: [
              {
                path: 'A.java',
                declarations: [
                  {
                    path: 'b/A.java',
                    name: 'a',
                    line: 1,
                    offset: 1,
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

test('sort with multiple files in a directory', () => {
  assert.deepStrictEqual(
    sort.getFilePoss([
      {
        entrypoint: {
          path: 'b/A.java', name: 'b', line: 2, offset: 1,
        },
        origin: {
          path: 'b/A.java', name: 'a', line: 1, offset: 1,
        },
      },
      {
        entrypoint: {
          path: 'b/A.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'b/A.java', name: 'a', line: 1, offset: 1,
        },
      },
    ]),
    [
      {
        type: fileType.DIR,
        nest: 0,
        path: 'b',
      },
      {
        type: fileType.FILE,
        nest: 1,
        path: 'A.java',
        declarations: [
          {
            path: 'b/A.java',
            name: 'a',
            line: 1,
            offset: 1,
            origins: [
              {
                path: 'A.java',
                declarations: [
                  {
                    path: 'b/A.java',
                    name: 'a',
                    line: 1,
                    offset: 1,
                  },
                ],
              },
            ],
          },
          {
            path: 'b/A.java',
            name: 'b',
            line: 2,
            offset: 1,
            origins: [
              {
                path: 'A.java',
                declarations: [
                  {
                    path: 'b/A.java',
                    name: 'a',
                    line: 1,
                    offset: 1,
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

test('sort with multiple files in nested directories', () => {
  assert.deepStrictEqual(
    sort.getFilePoss([
      {
        entrypoint: {
          path: 'a/b/c/A.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'b/A.java', name: 'a', line: 1, offset: 1,
        },
      },
      {
        entrypoint: {
          path: 'a/b/c/A.java', name: 'b', line: 2, offset: 1,
        },
        origin: {
          path: 'b/A.java', name: 'a', line: 1, offset: 1,
        },
      },
      {
        entrypoint: {
          path: 'a/b/A.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'b/A.java', name: 'a', line: 1, offset: 1,
        },
      },
    ]),
    [
      {
        type: fileType.DIR,
        nest: 0,
        path: 'a/b',
      },
      {
        type: fileType.DIR,
        nest: 1,
        path: 'c',
      },
      {
        type: fileType.FILE,
        nest: 2,
        path: 'A.java',
        declarations: [
          {
            path: 'a/b/c/A.java',
            name: 'a',
            line: 1,
            offset: 1,
            origins: [
              {
                path: 'A.java',
                declarations: [
                  {
                    path: 'b/A.java',
                    name: 'a',
                    line: 1,
                    offset: 1,
                  },
                ],
              },
            ],
          },
          {
            path: 'a/b/c/A.java',
            name: 'b',
            line: 2,
            offset: 1,
            origins: [
              {
                path: 'A.java',
                declarations: [
                  {
                    path: 'b/A.java',
                    name: 'a',
                    line: 1,
                    offset: 1,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: fileType.FILE,
        nest: 1,
        path: 'A.java',
        declarations: [
          {
            path: 'a/b/A.java',
            name: 'a',
            line: 1,
            offset: 1,
            origins: [
              {
                path: 'A.java',
                declarations: [
                  {
                    path: 'b/A.java',
                    name: 'a',
                    line: 1,
                    offset: 1,
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

test('group by entrypoint with only entrypoint', () => {
  assert.deepStrictEqual(
    sort.getFilePoss([
      {
        entrypoint: {
          path: 'a/A.java', name: 'a', line: 1, offset: 1,
        },
      },
      {
        entrypoint: {
          path: 'a/A.java', name: 'b', line: 2, offset: 1,
        },
      },
    ]),
    [
      {
        type: fileType.DIR,
        nest: 0,
        path: 'a',
      },
      {
        type: fileType.FILE,
        nest: 1,
        path: 'A.java',
        declarations: [
          {
            path: 'a/A.java',
            name: 'a',
            line: 1,
            offset: 1,
            origins: [],
          },
          {
            path: 'a/A.java',
            name: 'b',
            line: 2,
            offset: 1,
            origins: [],
          },
        ],
      },
    ],
  );
});

test('group by subdirectories', () => {
  assert.deepStrictEqual(
    sort.groupBySubdirctories([
      ['a', 'b', 'c'],
      ['a', 'b', 'c'],
      ['a', 'b'],
    ]),
    [
      [['a', 'b'], ['c']],
      [['a', 'b'], ['c']],
      [['a', 'b']],
    ],
  );
});

test('get matching subdirectories length', async (t) => {
  await t.test('with target index', () => {
    assert.deepStrictEqual(
      sort.getMatchingLength([
        ['a', 'b', 'c'],
        ['a', 'b'],
        ['b'],
      ], 0),
      2,
    );
  });

  await t.test('with partial match', () => {
    assert.deepStrictEqual(
      sort.getDuplicateLength(
        ['a', 'b'],
        ['a'],
      ),
      1,
    );
  });

  await t.test('with exact match', () => {
    assert.deepStrictEqual(
      sort.getDuplicateLength(
        ['a', 'b'],
        ['a', 'b'],
      ),
      2,
    );
  });
});
