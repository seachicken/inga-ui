export const fileType = {
  DIR: 1,
  FILE: 2,
};

export const groupKey = {
  ENTORYPOINT: 1,
  ORIGIN: 2,
};

export function getFilePoss(reportedPoss, key = groupKey.ENTORYPOINT) {
  let sortedPoss = groupByKey(reportedPoss, key);
  sortedPoss = sortByAlphabet(sortedPoss);
  sortedPoss = groupByFile(sortedPoss);

  function splitShortestPoss(poss) {
    let pathLength = 0;
    let idx = 0;
    for (const pos of poss) {
      if (pathLength !== 0 && pos.paths.length !== pathLength) {
        break;
      }
      pathLength = pos.paths.length;
      idx += 1;
    }
    const tail = poss.splice(idx);
    return [poss, tail];
  }

  let splitPoss = [];
  let tempPoss = [...sortedPoss];

  while (tempPoss.length > 0) {
    const [head, tail] = splitShortestPoss(tempPoss);
    splitPoss = head.concat(splitPoss);
    tempPoss = tail;
  }

  function extractDirs(poss) {
    return poss.map((p) => p.paths.splice(0, p.paths.length - 1));
  }

  function extractFile(pos) {
    return pos.paths.splice(-1)[0];
  }

  const dirsList = groupBySubdirctories(extractDirs(splitPoss));
  let prevDirs;
  const results = [];

  for (let i = 0; i < dirsList.length; i += 1) {
    const dirs = dirsList[i];
    let nest = 0;
    let duplicateCnt = 0;
    if (prevDirs) {
      for (let prevIdx = 0; prevIdx < prevDirs.length; prevIdx += 1) {
        const dir = prevIdx < dirs.length ? dirs[prevIdx] : [];
        const len = getDuplicateLength(dir, prevDirs[prevIdx]);
        if (len > 0 && len === dir.length) {
          duplicateCnt += 1;
        }
      }
      nest = duplicateCnt === 0 ? 0 : duplicateCnt - 1;
    }
    for (let dirIdx = duplicateCnt; dirIdx < dirs.length; dirIdx += 1) {
      results.push({ type: fileType.DIR, nest: dirIdx, path: dirs[dirIdx].join('/') });
      nest = dirIdx;
    }
    prevDirs = dirs;
    const filePos = splitPoss[i];

    results.push({
      type: fileType.FILE,
      nest: dirs.length === 0 ? 0 : nest + 1,
      path: extractFile(filePos),
      declarations: filePos.declarations.map((ed) => ({
        path: ed.path,
        name: ed.name,
        line: ed.line,
        offset: ed.offset,
        origins: groupByFile(ed.origins).map((o) => ({
          path: extractFile(o),
          declarations: o.declarations,
        })),
      })),
    });
  }

  return results;
}

export function groupBySubdirctories(dirsList) {
  const results = [];

  for (let targetIdx = 0; targetIdx < dirsList.length; targetIdx += 1) {
    const targetDirs = dirsList[targetIdx];
    const len = getMatchingLength(dirsList, targetIdx);
    const tail = targetDirs.splice(len);
    const splitDirs = [];
    if (targetDirs.length > 0) {
      splitDirs.push(targetDirs);
    }
    if (tail.length > 0) {
      splitDirs.push(tail);
    }
    results.push(splitDirs);
  }

  return results;
}

export function getMatchingLength(dirsList, idx) {
  let result = 0;
  const targetDirs = dirsList[idx];
  for (let i = 0; i < dirsList.length; i += 1) {
    if (i === idx) {
      continue;
    }
    const dirs = dirsList[i];
    const len = getDuplicateLength(dirs, targetDirs);
    if (result === 0 || (len > 0 && len < result)) {
      result = len;
    }
  }
  return result;
}

export function getDuplicateLength(a, b) {
  let len = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if (a[i] === b[i]) {
      len += 1;
    } else {
      break;
    }
  }
  return len;
}

export function equalsDeclaration(a, b) {
  return a.path === b.path
    && a.name === b.name
    && a.line === b.line
    && a.offset === b.offset;
}

function groupByKey(poss, key) {
  const results = [];

  for (const pos of poss) {
    const target = key === groupKey.ENTORYPOINT ? pos.entorypoint : pos.origin;
    const paths = target.path.split('/');
    const foundDeclarations = results
      .find((r) => target.path === r.path)?.declarations || [];

    if (foundDeclarations.length > 0) {
      const foundDeclaration = foundDeclarations.find((d) => equalsDeclaration(d, target));
      if (foundDeclaration) {
        foundDeclaration.origins.push(pos.origin);
      } else {
        foundDeclarations.push(
          {
            ...target,
            paths,
            origins: [pos.origin],
          },
        );
      }
    } else {
      results.push({
        path: target.path,
        paths,
        declarations: [
          {
            ...target,
            paths,
            origins: [pos.origin],
          },
        ],
      });
    }
  }

  return results;
}

function sortByAlphabet(poss) {
  const results = poss.sort((a, b) => a.path
    .localeCompare(b.path, undefined, { numeric: true }));

  function declarationToString(pos) {
    return `${pos.line} ${pos.offset}`;
  }

  for (const result of results) {
    results.declarations = result.declarations.sort((a, b) => declarationToString(a)
      .localeCompare(declarationToString(b), undefined, { numeric: true }));
  }

  return results;
}

function groupByFile(poss) {
  const results = [];

  for (const pos of poss) {
    const found = results.find((r) => pos.path === r.path);
    if (found) {
      found.declarations = found.declarations.concat(pos.declarations || [pos]);
    } else {
      results.push(
        {
          ...pos,
          paths: pos.path.split('/'),
          declarations: pos.declarations || [pos],
        },
      );
    }
  }

  return results;
}
