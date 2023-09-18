export function create(reportedPoss) {
  const entrypoints = new Map();
  for (const pos of reportedPoss) {
    if (entrypoints.has(getKey(pos.entrypoint))) {
      entrypoints.get(getKey(pos.entrypoint)).push(pos);
    } else {
      entrypoints.set(getKey(pos.entrypoint), [pos]);
    }
  }
  const originConnections = new Map();
  for (const pos of reportedPoss) {
    if (pos.type !== 'connection') {
      continue;
    }
    if (originConnections.has(getKey(pos.origin))) {
      originConnections.get(getKey(pos.origin)).push(pos);
    } else {
      originConnections.set(getKey(pos.origin), [pos]);
    }
  }

  const results = [];
  for (const pos of reportedPoss.filter((p) => p.type === 'entrypoint')) {
    const connection = (entrypoints.get(getKey(pos.origin)) || [])
      .find((p) => p.type === 'connection');
    if (connection) {
      for (const entrypoint of entrypoints.get(getKey(connection.origin))) {
        if (pos.edeges) {
          pos.edges.push(entrypoint);
        } else {
          pos.edges = [entrypoint];
        }
      }
    } else {
      if (originConnections.has(getKey(pos.entrypoint))) {
        continue;
      }
      pos.edges = [];
    }
    results.push(pos);
  }
  return results;
}

function getKey(reportedPos) {
  return `${reportedPos.path}-${reportedPos.name}-${reportedPos.line}-${reportedPos.offset}`;
}
