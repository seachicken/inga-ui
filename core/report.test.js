import assert from 'node:assert';
import { test } from 'node:test';
import report from './report.js';

test('print PR comment', () => {
  assert.deepStrictEqual(
    report.print('./data/report.json', 'https://github.com/owner/repo', 'sha'),
    `# Inga Report

**2 entory points affected by the change** (powered by [Inga](https://github.com/seachicken/inga))

<details><summary>Affected files</summary>

- 📂 src
  - 📄 [index.js - hoge](https://github.com/owner/repo/blob/sha/src/index.js#L1)
  - 📄 [index.js - fuga](https://github.com/owner/repo/blob/sha/src/index.js#L2)

</details>`,
  );
});
