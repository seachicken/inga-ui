export function create(reportedPoss) {
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
    console.log(`===service: ${JSON.stringify(service, null, 2)}`);
    console.log(`entrypointConnections: ${JSON.stringify(Array.from(entrypointConnections), null, 2)}`);
    const originConns = service.poss
      .flatMap((pos) => entrypointConnections.get(getPosKey(pos.origin)) || []);
    console.log(`service: ${service.name}, originConns: ${JSON.stringify(originConns, null, 2)}`);
    for (const originConn of originConns) {
      // originConn は１つ
      if (service.neighbours) {
        service.neighbours.push(originConn);
      } else {
        service.neighbours = [originConn];
      }

      const neighbourServices = Array.from(services.values())
        .filter((s) => s.poss
          .find((pos) => getPosKey(pos.entrypoint) === getPosKey(originConn.origin)));
      console.log(`neighbourServices: ${JSON.stringify(neighbourServices, null, 2)}`);
      if (originConn.neighbours) {
        originConn.neighbours.push(...neighbourServices);
      } else {
        originConn.neighbours = neighbourServices;
      }
      console.log(`originConn.neighbours: ${JSON.stringify(originConn.neighbours, null, 2)}`);
    }
  }

  const results = findRootServiecs(services, originConnections).map((s) => toNode(s));
  console.log(`results: ${JSON.stringify(results, null, 2)}`);
  return results;
}

export function findLeafPoss(graphs) {
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

function findRootServiecs(services, originConnections) {
  const results = [];
  for (const service of Array.from(services.values())) {
    if (service.poss.every((pos) => !originConnections.has(getPosKey(pos.entrypoint)))) {
      results.push(service);
    }
  }
  console.log(`rootServices: ${JSON.stringify(results, null, 2)}`);
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

export function getPosKey(pos) {
  if (!pos) {
    return null;
  }
  return `${pos.path}-${pos.name}-${pos.line}-${pos.offset}`;
}
