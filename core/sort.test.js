import assert from 'node:assert';
import { test } from 'node:test';
import { sort } from './sort.js';

test('group by entorypoint', t => {
  assert.deepEqual(sort([
    {
      "entorypoint": {
        "path": "src/api/A.java", "name": "a",
        "line": 1, "offset": 1
      },
      "origin": {
        "path": "src/core/A.java", "name": "aa",
        "line": 2, "offset": 1
      }
    },
    {
      "entorypoint": {
        "path": "src/api/A.java", "name": "a",
        "line": 1, "offset": 1
      },
      "origin": {
        "path": "src/core/B.java", "name": "aa",
        "line": 3, "offset": 1
      }
    }
  ]),
  [
    {
      entorypoint: {
        path: 'src/api/A.java', name: 'a',
        line: 1, offset: 1
      },
      origins: [
        {
          path: 'src/core/A.java', name: 'aa',
          line: 2, offset: 1
        },
        {
          path: 'src/core/B.java', name: 'aa',
          line: 3, offset: 1
        }
      ]
    }
  ]);
});

test('sort by alphabetically', t => {
  assert.deepEqual(sort([
    {
      "entorypoint": {
        "path": "src/api/B.java", "name": "a",
        "line": 1, "offset": 1
      },
      "origin": {
        "path": "src/core/A.java", "name": "aa",
        "line": 1, "offset": 1
      }
    },
    {
      "entorypoint": {
        "path": "src/api/A.java", "name": "a",
        "line": 2, "offset": 1
      },
      "origin": {
        "path": "src/core/A.java", "name": "aa",
        "line": 1, "offset": 1
      }
    },
    {
      "entorypoint": {
        "path": "src/api/A.java", "name": "a",
        "line": 1, "offset": 1
      },
      "origin": {
        "path": "src/core/A.java", "name": "aa",
        "line": 1, "offset": 1
      }
    }
  ]),
  [
    {
      entorypoint: {
        path: 'src/api/A.java', name: 'a',
        line: 1, offset: 1
      },
      origins: [
        {
          path: 'src/core/A.java', name: 'aa',
          line: 1, offset: 1
        }
      ]
    },
    {
      entorypoint: {
        path: 'src/api/A.java', name: 'a',
        line: 2, offset: 1
      },
      origins: [
        {
          path: 'src/core/A.java', name: 'aa',
          line: 1, offset: 1
        }
      ]
    },
    {
      entorypoint: {
        path: 'src/api/B.java', name: 'a',
        line: 1, offset: 1
      },
      origins: [
        {
          path: 'src/core/A.java', name: 'aa',
          line: 1, offset: 1
        }
      ]
    }
  ]);
});
