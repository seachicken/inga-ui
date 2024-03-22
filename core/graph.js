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
    const originConns = service.poss
      .flatMap((pos) => entrypointConnections.get(getPosKey(pos.origin)) || []);
    for (const originConn of originConns) {
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

  return findHeadServiecs(services, originConnections).map((s) => toNode(s));
}

function findHeadServiecs(services, originConnections) {
  const heads = [];
  for (const service of Array.from(services.values())) {
    if (service.poss.find((pos) => !originConnections.has(getPosKey(pos.entrypoint)))) {
      heads.push(service);
    }
  }
  return heads;
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
  return `${pos.path}-${pos.name}-${pos.line}-${pos.offset}`;
}
