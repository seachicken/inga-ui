export function create(reportedPoss) {
  const entrypointConnections = new Map();
  for (const pos of reportedPoss) {
    if (pos.type !== 'connection') {
      continue;
    }
    if (entrypointConnections.has(getKey(pos.entrypoint))) {
      entrypointConnections.get(getKey(pos.entrypoint)).push(pos);
    } else {
      entrypointConnections.set(getKey(pos.entrypoint), [pos]);
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

  const services = new Map();
  for (const pos of reportedPoss) {
    if (!pos.service) {
      continue;
    }
    if (services.has(pos.service)) {
      services.get(pos.service).poss.push(pos);
    } else {
      services.set(pos.service, { name: pos.service, poss: [pos] });
    }
  }

  for (const service of Array.from(services.values())) {
    const originConns = service.poss
      .flatMap((pos) => entrypointConnections.get(getKey(pos.origin)) || []);
    if (originConns) {
      for (const originConn of originConns) {
        const neighbours = Array.from(services.values())
          .filter((s) => s.poss
            .find((pos) => getKey(pos.entrypoint) === getKey(originConn.origin)));
        if (service.neighbours) {
          service.neighbours.push(...neighbours);
        } else {
          service.neighbours = neighbours;
        }
      }
    }
  }

  return findHeadServiecs(services, originConnections).map((s) => toNode(s));
}

function findHeadServiecs(services, originConnections) {
  const heads = [];
  for (const service of Array.from(services.values())) {
    if (service.poss.find((pos) => !originConnections.has(getKey(pos.entrypoint)))) {
      heads.push(service);
    }
  }
  return heads;
}

function toNode(service) {
  const result = {
    service: service.name,
    innerConnections: groupByEntrypoint(service.poss),
  };
  if (service.neighbours) {
    result.edges = service.neighbours.map((s) => toNode(s));
  }
  return result;
}

function groupByEntrypoint(poss) {
  const entrypoints = new Map();
  for (const pos of poss) {
    if (entrypoints.has(getKey(pos.entrypoint))) {
      entrypoints.get(getKey(pos.entrypoint)).push(pos);
    } else {
      entrypoints.set(getKey(pos.entrypoint), [pos]);
    }
  }
  return Array.from(entrypoints.values()).map((eposs) => ({
    entrypoint: eposs[0].entrypoint,
    origins: eposs.map((pos) => pos.origin),
  }));
}

function getKey(reportedPos) {
  return `${reportedPos.path}-${reportedPos.name}-${reportedPos.line}-${reportedPos.offset}`;
}
