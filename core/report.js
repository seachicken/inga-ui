import fs from 'fs';
import {
  fileType,
  getFilePoss,
} from './sort.js';

export function print(jsonPath, repoUrl, sha) {
  const report = fs.readFileSync(jsonPath);
  const files = getFilePoss(JSON.parse(report));
  return `# Inga Report

**${printNumOfFiles(files)} affected by the change** (powered by [Inga](https://github.com/seachicken/inga))

<details><summary>Affected files</summary>

${printFileTree(files, repoUrl, sha)}
</details>`;
}

function printNumOfFiles(files) {
  const n = files
    .filter((f) => f.type === fileType.FILE)
    .reduce((prev, current) => prev + current.declarations.length, 0);
  return n === 1 ? 'A entory point' : `${n} entory points`;
}

function printFileTree(files, repoUrl, sha) {
  let result = '';

  const printIndent = (nest) => ' '.repeat(nest * 2);

  for (let fi = 0; fi < files.length; fi += 1) {
    const pos = files[fi];

    if (pos.type === fileType.DIR) {
      result += `${printIndent(pos.nest)}- 📂 ${pos.path}\n`;
    } else {
      const fileName = pos.path;
      for (let di = 0; di < pos.declarations.length; di += 1) {
        const declaration = pos.declarations[di];
        result += `${printIndent(pos.nest)}- 📄 [${fileName} - ${declaration.name}](${repoUrl}/blob/${sha}/${declaration.path}#L${declaration.line})\n`;
      }
    }
  }

  return result;
}
