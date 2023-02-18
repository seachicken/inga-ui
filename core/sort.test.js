import assert from 'node:assert';
import { test } from 'node:test';
import {
  fileType,
  getDuplicateLength,
  getFilePoss,
  getMatchingLength,
  groupBySubdirctories,
} from './sort.js';

test('group by entorypoint', () => {
  assert.deepEqual(
    getFilePoss([
      {
        entorypoint: {
          path: 'a/A.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'b/A.java', name: 'a', line: 1, offset: 1,
        },
      },
      {
        entorypoint: {
          path: 'a/A.java', name: 'a', line: 1, offset: 1,
        },
        origin: {
          path: 'b/B.java', name: 'a', line: 1, offset: 1,
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
        entorypoint: {
          path: 'A.java', name: 'a', line: 1, offset: 1,
        },
        origins: [
          {
            path: 'b/A.java', name: 'a', line: 1, offset: 1,
          },
          {
            path: 'b/B.java', name: 'a', line: 1, offset: 1,
          },
        ],
      },
    ],
  );
});

test('sort with a root file and a file in directories', () => {
  assert.deepEqual(
    getFilePoss([
      {
        entorypoint: {
          path: 'A.java', name: 'a', line: 1, offset: 1,
        },
      },
      {
        entorypoint: {
          path: 'a/B.java', name: 'a', line: 1, offset: 1,
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
        entorypoint: {
          path: 'B.java', name: 'a', line: 1, offset: 1,
        },
        origins: [undefined],
      },
      {
        type: fileType.FILE,
        nest: 0,
        entorypoint: {
          path: 'A.java', name: 'a', line: 1, offset: 1,
        },
        origins: [undefined],
      },
    ],
  );
});

test('sort with multiple files in a directory', () => {
  assert.deepEqual(
    getFilePoss([
      {
        entorypoint: {
          path: 'b/A.java', name: 'b', line: 2, offset: 1,
        },
      },
      {
        entorypoint: {
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
        entorypoint: {
          path: 'A.java', name: 'a', line: 1, offset: 1,
        },
        origins: [undefined],
      },
      {
        type: fileType.FILE,
        nest: 1,
        entorypoint: {
          path: 'A.java', name: 'b', line: 2, offset: 1,
        },
        origins: [undefined],
      },
    ],
  );
});

test('sort with multiple files in nested directories', () => {
  assert.deepEqual(
    getFilePoss([
      {
        entorypoint: {
          path: 'a/b/c/A.java', name: 'a', line: 1, offset: 1,
        },
      },
      {
        entorypoint: {
          path: 'a/b/c/A.java', name: 'b', line: 2, offset: 1,
        },
      },
      {
        entorypoint: {
          path: 'a/b/A.java', name: 'a', line: 1, offset: 1,
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
        entorypoint: {
          path: 'A.java', name: 'a', line: 1, offset: 1,
        },
        origins: [undefined],
      },
      {
        type: fileType.FILE,
        nest: 2,
        entorypoint: {
          path: 'A.java', name: 'b', line: 2, offset: 1,
        },
        origins: [undefined],
      },
      {
        type: fileType.FILE,
        nest: 1,
        entorypoint: {
          path: 'A.java', name: 'a', line: 1, offset: 1,
        },
        origins: [undefined],
      },
    ],
  );
});

test('group by subdirectories', () => {
  assert.deepEqual(
    groupBySubdirctories([
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
    assert.deepEqual(
      getMatchingLength([
        ['a', 'b', 'c'],
        ['a', 'b'],
        ['b'],
      ], 0),
      2,
    );
  });

  await t.test('with partial match', () => {
    assert.deepEqual(
      getDuplicateLength(
        ['a', 'b'],
        ['a'],
      ),
      1,
    );
  });

  await t.test('with exact match', () => {
    assert.deepEqual(
      getDuplicateLength(
        ['a', 'b'],
        ['a', 'b'],
      ),
      2,
    );
  });
});
