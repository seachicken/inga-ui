function create(reportedPoss) {
  const entrypointConnections = new Map();
  for (const pos of reportedPoss) {
    if (pos.type !== 'connection') {
      continue;
    }
    if (entrypointConnections.has(getPosKey(pos.entrypoint))) {
      entrypointConnections.get(getPosKey(pos.entrypoint)).push(pos);
    } else {
      entrypointConnections.set(getPosKey(pos.entrypoint), [pos]);
    }
  }

  const originConnections = new Map();
  for (const pos of reportedPoss) {
    if (pos.type !== 'connection') {
      continue;
    }
    if (originConnections.has(getPosKey(pos.origin))) {
      originConnections.get(getPosKey(pos.origin)).push(pos);
    } else {
      originConnections.set(getPosKey(pos.origin), [pos]);
    }
  }

  const services = new Map();
  for (const pos of reportedPoss) {
    if (!pos.service) {
      continue;
    }
    if (services.has(pos.service)) {
      services.get(pos.service).poss.push(pos);
    } else {
      services.set(pos.service, { type: pos.type, name: pos.service, poss: [pos] });
    }
  }

  for (const service of Array.from(services.values())) {
    const entrypointConns = service.poss
      .flatMap((pos) => entrypointConnections.get(getPosKey(pos.origin)) || []);
    for (const originConn of entrypointConns) {
      if (service.neighbours) {
        service.neighbours.push(originConn);
      } else {
        service.neighbours = [originConn];
      }

      const neighbourServices = Array.from(services.values())
        .filter((s) => s.poss
          .find((pos) => getPosKey(pos.entrypoint) === getPosKey(originConn.origin)));
      if (originConn.neighbours) {
        originConn.neighbours.push(...neighbourServices);
      } else {
        originConn.neighbours = neighbourServices;
      }
    }
  }

  return findRootServiecs(services, originConnections).map((s) => toNode(s));
}

function merge(graphsByDefinition) {
  let results = [];

  function findSameNode(target, graphs) {
    for (const graph of graphs || []) {
      const aEntrypoints = new Set(target.innerConnections
        .flatMap((c) => c.entrypoint).map((p) => getPosKey(p)));
      const bEntrypoints = new Set(graph.innerConnections
        .flatMap((c) => c.entrypoint).map((p) => getPosKey(p)));
      const aOrigins = new Set(target.innerConnections
        .flatMap((c) => (graph.type === 'connection' ? c.origin : c.origins))
        .map((p) => getPosKey(p)));
      const bOrigins = new Set(graph.innerConnections
        .flatMap((c) => (graph.type === 'connection' ? c.origin : c.origins))
        .map((p) => getPosKey(p)));
      if ([...aEntrypoints].some((p) => bEntrypoints.has(p))
          || [...aOrigins].some((p) => bOrigins.has(p))) {
        return graph;
      }
      const node = findSameNode(target, graph.neighbours);
      if (node) {
        return node;
      }
    }
    return null;
  }

  function mergeNode(a, b) {
    const source = a;
    const target = b;
    if (source.type === 'connection') {
      for (const sourceConn of source.innerConnections) {
        const targetConn = target.innerConnections
          .find((c) => getPosKey(c.origin) === getPosKey(sourceConn.origin));
        if (!targetConn) {
          target.innerConnections.push(sourceConn);
        }
      }
    } else {
      for (const sourceConn of source.innerConnections) {
        const targetConn = target.innerConnections
          .find((c) => getPosKey(c.entrypoint) === getPosKey(sourceConn.entrypoint));
        const targetOrigins = new Set(targetConn.origins.map((p) => getPosKey(p)));
        for (const sourceOrigin of sourceConn.origins) {
          if (!targetOrigins.has(getPosKey(sourceOrigin))) {
            targetConn.origins.push(sourceOrigin);
          }
        }
      }
    }

    for (const aNeighbour of a.neighbours || []) {
      const sameNode = findSameNode(aNeighbour, target.neighbours);
      if (sameNode) {
        mergeNode(aNeighbour, sameNode);
      } else if (target.neighbours) {
        target.neighbours.push(aNeighbour);
      } else {
        target.neighbours = [aNeighbour];
      }
    }
  }

  for (const graphs of graphsByDefinition) {
    for (const graph of graphs) {
      const sameNode = findSameNode(graph, results);
      if (sameNode) {
        mergeNode(graph, sameNode);
      } else {
        results = results.concat(graphs);
      }
    }
  }

  return results;
}

function findLeafPoss(graphs) {
  const results = [];
  const q = [];
  q.push(...graphs);

  while (q.length > 0) {
    const graph = q.shift();
    if (graph.type === 'entrypoint' && !graph.neighbours) {
      results.push(...graph.innerConnections.flatMap((c) => c.origins));
    }
    q.push(...graph.neighbours || []);
  }

  return results;
}

function findParentDeclarationKeys(targetPos, graphs) {
  const results = new Set();
  results.add(getPosKey(targetPos));
  findParentDeclarationKeysRecursive(targetPos, graphs).forEach((d) => results.add(d));
  return results;
}

function findParentDeclarationKeysRecursive(targetPos, graphs) {
  const results = [];
  const q = [];
  q.push(...graphs);

  while (q.length > 0) {
    const graph = q.shift();
    for (const conn of graph.innerConnections) {
      if ((graph.type === 'entrypoint' && conn.origins.some((o) => getPosKey(o) === getPosKey(targetPos)))
        || (graph.type === 'connection' && getPosKey(conn.origin) === getPosKey(targetPos))) {
        results.push(getPosKey(conn.entrypoint));
        results.push(...findParentDeclarationKeysRecursive(conn.entrypoint, graphs));
      }
    }
    q.push(...graph.neighbours || []);
  }

  return results;
}

function findRootServiecs(services, originConnections) {
  const results = [];
  for (const service of Array.from(services.values())) {
    if (service.poss.every((pos) => !originConnections.has(getPosKey(pos.entrypoint)))) {
      results.push(service);
    }
  }
  return results;
}

function toNode(service) {
  const result = {
    type: service.type,
    innerConnections: groupByEntrypoint(service),
  };
  if (service.name) {
    result.service = service.name;
  }
  if (service.neighbours) {
    result.neighbours = service.neighbours.map((s) => toNode(s));
  }
  return result;
}

function groupByEntrypoint(service) {
  if (service.type === 'connection') {
    return [{
      entrypoint: service.entrypoint,
      origin: service.origin,
    }];
  }

  const entrypoints = new Map();
  for (const pos of service.poss) {
    if (entrypoints.has(getPosKey(pos.entrypoint))) {
      entrypoints.get(getPosKey(pos.entrypoint)).push(pos);
    } else {
      entrypoints.set(getPosKey(pos.entrypoint), [pos]);
    }
  }
  return Array.from(entrypoints.values()).map((eposs) => ({
    entrypoint: eposs[0].entrypoint,
    origins: eposs.map((pos) => pos.origin),
  }));
}

function getPosKey(pos) {
  if (!pos) {
    return null;
  }
  return `${pos.path}-${pos.name}-${pos.line}-${pos.offset}`;
}

export default {
  create,
  merge,
  findLeafPoss,
  findParentDeclarationKeys,
  getPosKey,
};
