export const fileType = {
  DIR: 1,
  FILE: 2,
};

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

function groupByEntorypoint(poss) {
  const results = [];

  function equalsPos(a, b) {
    return a.path === b.path && a.name === b.name
      && a.line === b.line && a.offset === b.offset;
  }

  for (const pos of poss) {
    const found = results.find((r) => equalsPos(pos.entorypoint, r.entorypoint));
    if (found) {
      found.origins.push(pos.origin);
    } else {
      const paths = pos.entorypoint.path.split('/');
      results.push({
        entorypoint: { ...pos.entorypoint, paths },
        origins: [pos.origin],
      });
    }
  }

  return results;
}

function sortByAlphabeticaly(poss) {
  function toString(pos) {
    return `${pos.path}${pos.line}${pos.offset}`;
  }

  return poss.sort((a, b) => toString(a.entorypoint)
    .localeCompare(toString(b.entorypoint), undefined, { numeric: true }));
}

export function getFilePoss(reportedPoss) {
  let sortedPoss = groupByEntorypoint(reportedPoss);
  sortedPoss = sortByAlphabeticaly(sortedPoss);

  function splitShortestPoss(poss) {
    let pathLength = 0;
    let idx = 0;
    for (const pos of poss) {
      if (pathLength !== 0 && pos.entorypoint.paths.length !== pathLength) {
        break;
      }
      pathLength = pos.entorypoint.paths.length;
      idx += 1;
    }
    const tail = poss.splice(idx);
    return [poss, tail];
  }

  let splitPoss = [];

  while (sortedPoss.length > 0) {
    const [head, tail] = splitShortestPoss(sortedPoss);
    splitPoss = head.concat(splitPoss);
    sortedPoss = tail;
  }

  function extractDirs(poss) {
    return poss.map((p) => p.entorypoint.paths.splice(0, p.entorypoint.paths.length - 1));
  }

  function extractFile(pos) {
    return pos.entorypoint.paths.splice(-1)[0];
  }

  const dirsList = groupBySubdirctories(extractDirs(splitPoss));
  const results = [];
  let prevDirs;

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
      entorypoint: {
        path: extractFile(filePos),
        name: filePos.entorypoint.name,
        line: filePos.entorypoint.line,
        offset: filePos.entorypoint.offset,
      },
      origins: filePos.origins,
    });
  }

  return results;
}
