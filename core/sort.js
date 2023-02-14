export function sort(report) {
  const results = [];

  function equalsPos(a, b) {
    return a.path === b.path && a.name === b.name
      && a.line === b.line && a.offset === b.offset;
  }

  for (const input of report) {
    const found = results.find(r => equalsPos(input, r));
    if (found) {
      found.origins.push(input.origin);
    } else {
      results.push({
        entorypoint: input.entorypoint,
        origins: [input.origin]
      });
    }
  }

  return results;
}
