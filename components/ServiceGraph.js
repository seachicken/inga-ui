import { cssomSheet, tw } from 'twind';
import install from '@twind/with-web-components';
import config from '../twind.config';
import { itemSelectState } from './TreeItem.js';
import { findLeafPoss, getPosKey } from '../core/graph.js';
import { fileType, getFilePoss, groupKey } from '../core/sort.js';

const withTwind = install(config);
const sheet = cssomSheet({ target: new CSSStyleSheet() });
sheet.target.replaceSync(`
  .file {
    background-color: ${tw.theme('colors.white')};
  }
  .file-hover {
    background-color: ${tw.theme('colors.gray.100')};
  }
  .file-select {
    background-color: ${tw.theme('colors.blue.100')};
  }
  .file-changed {
    background-color: ${tw.theme('colors.green.50')};
  }

  .edge-select {
    stroke-dasharray: 8;
    animation: edge-animation 50s linear infinite;
  }
  @keyframes edge-animation {
    0% {
      stroke-dashoffset: 0;
    }
    100% {
      stroke-dashoffset: 1000;
    }
  }
`);

export default class ServiceGraph extends withTwind(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet.target];
    this.shadowRoot.innerHTML = `
      <div id="panel" class="w-full h-full">
        <svg xmlns="http://www.w3.org/2000/svg" id="edges" class="w-full h-full"></svg>
        <div id="nodes" class="w-full h-full"></div>
      </div>

      <template id="service-template">
        <div class="service absolute rounded border-1 border-green m-3 p-2">
          <p class="name text-gray-700"></p>
          <div class="flex">
            <div class="in">
            </div>
            <div class="out">
            </div>
          </div>
        </div>
      </template>

      <template id="file-template">
        <div class="file rounded drop-shadow m-3 py-1">
          <div class="flex mb-1 px-2 items-center">
            <div class="changed-icon fill-green mr-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M1 1.75C1 .784 1.784 0 2.75 0h7.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V4.664a.25.25 0 0 0-.073-.177l-2.914-2.914a.25.25 0 0 0-.177-.073ZM8 3.25a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0V7h-1.5a.75.75 0 0 1 0-1.5h1.5V4A.75.75 0 0 1 8 3.25Zm-3 8a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z"></path></svg>
            </div>
            <p class="name"></p>
          </div>
          <ul class="declarations divide-y"></ul>
        </div>
      </template>

      <template id="declaration-template">
        <li class="declaration flex items-center">
          <p class="name text-gray-700 text-sm px-2"></p>
          <a target="_blank" class="link">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z"></path></svg>
          </a>
        </li>
      </template>
    `;

    this.panel = this.shadowRoot.querySelector('#panel');
    this.nodes = this.shadowRoot.querySelector('#nodes');
    this.edges = this.shadowRoot.querySelector('#edges');
    this.serviceTemplate = this.shadowRoot.querySelector('#service-template');
    this.fileTemplate = this.shadowRoot.querySelector('#file-template');
    this.declarationTemplate = this.shadowRoot.querySelector('#declaration-template');
    this.declarations = new Map();
    this.selectEntrypointState = itemSelectState.NORMAL;
  }

  static get observedAttributes() {
    return ['src', 'repourl', 'prnumber', 'entrypointselect'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'src') {
      this.graphs = JSON.parse(newValue);
      this.filesChangedPoss = findLeafPoss(this.graphs);
      this.render();
    }
    if (name === 'repourl') {
      this.repoUrl = newValue;
      this.render();
    }
    if (name === 'prnumber') {
      this.prNumber = newValue;
      this.render();
    }
    if (name === 'entrypointselect') {
      const obj = JSON.parse(newValue);
      this.selectEntrypointState = obj.state;
      this.selectEntrypoint = obj.posKey;

      for (const file of this.declarations.values()) {
        file.classList.remove('file-hover', 'file-select');
      }
      switch (this.selectEntrypointState) {
        case itemSelectState.OVER:
          this.declarations.get(this.selectEntrypoint).classList.add('file-hover');
          break;
        case itemSelectState.SELECT:
          this.declarations.get(this.selectEntrypoint).classList.add('file-select');
          break;
        default:
      }
      requestAnimationFrame(() => {
        this.edges.innerHTML = '';
        this.renderEdges(this.graphs, this.declarations);
      });
    }
  }

  render() {
    this.nodes.innerHTML = '';
    for (let i = 0; i < this.graphs.length; i += 1) {
      this.renderGraph(this.graphs[i], i);
    }
    requestAnimationFrame(() => {
      this.edges.innerHTML = '';
      this.renderEdges(this.graphs, this.declarations);
    });
  }

  renderGraph(graph, i, depth = 0) {
    const serviceRoot = document.importNode(this.serviceTemplate.content, true);
    const service = serviceRoot.querySelector('.service');
    service.style.left = `${depth * 430}px`;
    service.style.top = `${i * 150}px`;
    service.querySelector('.name').innerHTML = graph.service;
    this.nodes.appendChild(service);

    const filePossIn = getFilePoss(graph.innerConnections
      .map((c) => ({ entrypoint: c.entrypoint })))
      .filter((p) => p.type === fileType.FILE);
    for (const filePosIn of filePossIn) {
      this.renderFile(filePosIn, 0, 0, service.querySelector('.in'));
    }

    const filePossOut = getFilePoss(graph.innerConnections
      .flatMap((c) => c.origins.filter((o) => getPosKey(o) !== getPosKey(c.entrypoint)))
      .map((p) => ({ origin: p })), groupKey.ORIGIN)
      .filter((p) => p.type === fileType.FILE);
    for (const filePosOut of filePossOut) {
      this.renderFile(filePosOut, 0, 0, service.querySelector('.out'));
    }

    (graph.neighbours || [])
      .forEach((c, ci) => c.neighbours.forEach((s) => this.renderGraph(s, ci, depth + 1)));
  }

  renderFile(pos, i, depth, parent) {
    const fileRoot = document.importNode(this.fileTemplate.content, true);
    const file = fileRoot.querySelector('.file');
    file.style.left = `${depth * 200}px`;
    file.style.top = `${i * 30}px`;
    file.querySelector('.name').innerHTML = pos.path.split('/').pop();

    const fileChanged = pos.declarations
      .find((d) => this.filesChangedPoss.find((p) => getPosKey(p) === getPosKey(d)));
    if (fileChanged) {
      file.classList.add('file-changed');
    } else {
      file.querySelector('.changed-icon').classList.add('hidden');
    }

    parent.appendChild(file);

    for (const dec of pos.declarations) {
      const declarationRoot = document.importNode(this.declarationTemplate.content, true);
      const declaration = declarationRoot.querySelector('.declaration');
      declaration.querySelector('.name').innerHTML = dec.name;
      if (fileChanged && this.repoUrl) {
        toSha256(dec.path).then((sha) => {
          declaration.querySelector('.link').href = `${this.repoUrl}/pull/${this.prNumber}/files#diff-${sha}R${dec.line}`;
        });
      } else {
        declaration.querySelector('.link').remove();
      }
      file.querySelector('.declarations').appendChild(declaration);

      this.declarations.set(getPosKey(dec), declaration);
    }
  }

  renderEdges(graphs, declarations, parentKey = null) {
    for (const graph of graphs) {
      let selected = false;
      const parentKeys = [];
      for (const innerConn of graph.innerConnections) {
        if (parentKey) {
          selected = this.selectEntrypointState !== itemSelectState.NORMAL
            && parentKey === getPosKey(innerConn.entrypoint);
        } else {
          selected = this.selectEntrypointState !== itemSelectState.NORMAL
            && this.selectEntrypoint === getPosKey(innerConn.entrypoint);
        }

        for (const origin of innerConn.origins) {
          this.renderEdge(
            declarations.get(getPosKey(innerConn.entrypoint)),
            declarations.get(getPosKey(origin)),
            selected,
          );
          if (getPosKey(innerConn.entrypoint) === this.selectEntrypoint) {
            parentKeys.push(getPosKey(origin));
          }
          if (selected && this.filesChangedPoss
            .find((p) => getPosKey(p) === getPosKey(origin))) {
            if (this.selectEntrypointState === itemSelectState.OVER) {
              this.declarations.get(getPosKey(origin)).classList.add('file-hover');
            } else if (this.selectEntrypointState === itemSelectState.SELECT) {
              this.declarations.get(getPosKey(origin)).classList.add('file-select');
            }
          }
        }
      }

      for (const connection of graph.neighbours || []) {
        let newParentKey = null;
        for (const conn of connection.innerConnections) {
          this.renderEdge(
            declarations.get(getPosKey(conn.entrypoint)),
            declarations.get(getPosKey(conn.origin)),
            selected,
          );

          if (parentKeys.find((k) => k === getPosKey(conn.entrypoint))) {
            newParentKey = getPosKey(conn.origin);
          }
        }

        this.renderEdges(
          connection.neighbours,
          declarations,
          newParentKey,
        );
      }
    }
  }

  renderEdge(dom1, dom2, selected) {
    const edge = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    if (selected) {
      edge.classList.add('edge-select');
    }
    const panelRect = this.panel.getBoundingClientRect();
    const dom1Rect = dom1.getBoundingClientRect();
    const dom2Rect = dom2.getBoundingClientRect();
    edge.setAttribute('x1', dom1Rect.right - panelRect.left);
    edge.setAttribute('y1', dom1Rect.top + (dom2Rect.height / 2) - panelRect.top);
    edge.setAttribute('x2', dom2Rect.left - panelRect.left);
    edge.setAttribute('y2', dom2Rect.top + (dom1Rect.height / 2) - panelRect.top);
    edge.setAttribute('stroke', selected ? tw.theme('colors.blue.500') : tw.theme('colors.gray.300'));
    edge.setAttribute('fill', selected ? tw.theme('colors.blue.500') : tw.theme('colors.gray.300'));
    edge.setAttribute('stroke-width', selected ? '3' : '2');
    this.edges.appendChild(edge);
  }
}

async function toSha256(str) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
