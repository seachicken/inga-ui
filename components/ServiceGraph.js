import { cssomSheet, tw } from 'twind';
import install from '@twind/with-web-components';
import config from '../twind.config';
import { itemSelectState } from './TreeItem.js';
import { findLeafPoss, getPosKey } from '../core/graph.js';

const withTwind = install(config);
const sheet = cssomSheet({ target: new CSSStyleSheet() });
sheet.target.replaceSync(`
  .file {
    outline: solid 1px ${tw.theme('colors.gray.500')};
  }
  .file-hover {
    outline: solid 2px ${tw.theme('colors.blue.500')};
  }
  .file-select {
    outline: solid 2px ${tw.theme('colors.blue.500')};
    background-color: ${tw.theme('colors.blue.100')};
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
      <div id="panel" class="absolute">
        <svg xmlns="http://www.w3.org/2000/svg" id="edges" class="absolute w-screen h-screen"></svg>
      </div>

      <template id="service-template">
        <div class="service absolute rounded border border-black m-3 p-2">
          <p class="name"></p>
          <div class="flex">
            <div class="in">
            </div>
            <div class="out">
            </div>
          </div>
        </div>
      </template>

      <template id="file-template">
        <div class="file flex rounded m-3 p-2">
          <div class="changed-icon hidden mr-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M1 1.75C1 .784 1.784 0 2.75 0h7.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V4.664a.25.25 0 0 0-.073-.177l-2.914-2.914a.25.25 0 0 0-.177-.073ZM8 3.25a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0V7h-1.5a.75.75 0 0 1 0-1.5h1.5V4A.75.75 0 0 1 8 3.25Zm-3 8a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z"></path></svg>
          </div>
          <p class="name text-xs"></p>
        </div>
      </template>
    `;

    this.panel = this.shadowRoot.querySelector('#panel');
    this.edges = this.shadowRoot.querySelector('#edges');
    this.serviceTemplate = this.shadowRoot.querySelector('#service-template');
    this.fileTemplate = this.shadowRoot.querySelector('#file-template');
    this.files = new Map();
  }

  static get observedAttributes() {
    return ['src', 'entrypointselect'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'src') {
      this.graphs = JSON.parse(newValue);
      this.filesChangedPoss = findLeafPoss(this.graphs);

      this.render();
    }
    if (name === 'entrypointselect') {
      const obj = JSON.parse(newValue);
      this.selectEntrypointState = obj.state;
      this.selectEntrypoint = obj.posKey;

      this.files.values().forEach((f) => f.classList.remove('file-hover', 'file-select'));
      switch (this.selectEntrypointState) {
        case itemSelectState.OVER:
          this.files.get(this.selectEntrypoint).classList.add('file-hover');
          break;
        case itemSelectState.SELECT:
          this.files.get(this.selectEntrypoint).classList.add('file-select');
          break;
        default:
      }
      requestAnimationFrame(() => {
        this.edges.innerHTML = '';
        this.renderEdges(this.graphs, this.files);
      });
    }
  }

  render() {
    for (let i = 0; i < this.graphs.length; i += 1) {
      this.renderGraph(this.graphs[i], i);
    }
    requestAnimationFrame(() => {
      this.edges.innerHTML = '';
      this.renderEdges(this.graphs, this.files);
    });
  }

  renderGraph(graph, i, depth = 0) {
    const serviceRoot = document.importNode(this.serviceTemplate.content, true);
    const service = serviceRoot.querySelector('.service');
    service.style.left = `${depth * 400}px`;
    service.style.top = `${i * 150}px`;
    service.querySelector('.name').innerHTML = graph.service;
    this.panel.appendChild(service);

    for (let ci = 0; ci < graph.innerConnections.length; ci += 1) {
      this.renderFile(graph.innerConnections[ci], 0, 0, service);
    }

    (graph.neighbours || [])
      .forEach((c, ci) => c.neighbours.forEach((s) => this.renderGraph(s, ci, depth + 1)));
  }

  renderFile(conn, i, depth, service) {
    const fileRoot = document.importNode(this.fileTemplate.content, true);
    const file = fileRoot.querySelector('.file');
    file.style.left = `${depth * 200}px`;
    file.style.top = `${i * 30}px`;
    if (conn.entrypoint) {
      file.querySelector('.name').innerHTML = conn.entrypoint.path.split('/').pop();
      service.querySelector('.in').appendChild(file);
      this.files.set(getPosKey(conn.entrypoint), file);

      conn.origins.forEach((o, oi) => this.renderFile(o, oi, depth + 1, service));
    } else {
      file.querySelector('.name').innerHTML = conn.path.split('/').pop();
      service.querySelector('.out').appendChild(file);
      this.files.set(getPosKey(conn), file);
      if (this.filesChangedPoss.find((p) => getPosKey(p) === getPosKey(conn))) {
        file.querySelector('.changed-icon').classList.remove('hidden');
      }
    }
  }

  renderEdges(graphs, files, selectedParent = false) {
    for (const graph of graphs) {
      let selected = selectedParent;
      for (const innerConn of graph.innerConnections) {
        if (!selectedParent) {
          selected = this.selectEntrypointState !== itemSelectState.NORMAL
            && this.selectEntrypoint === getPosKey(innerConn.entrypoint);
        }
        for (const origin of innerConn.origins) {
          this.renderEdge(
            files.get(getPosKey(innerConn.entrypoint)),
            files.get(getPosKey(origin)),
            selected,
          );
          if (selected && this.filesChangedPoss
            .find((p) => getPosKey(p) === getPosKey(origin))) {
            if (this.selectEntrypointState === itemSelectState.OVER) {
              this.files.get(getPosKey(origin)).classList.add('file-hover');
            } else if (this.selectEntrypointState === itemSelectState.SELECT) {
              this.files.get(getPosKey(origin)).classList.add('file-select');
            }
          }
        }
      }

      for (const connection of graph.neighbours || []) {
        for (const conn of connection.innerConnections) {
          this.renderEdge(
            files.get(getPosKey(conn.entrypoint)),
            files.get(getPosKey(conn.origin)),
            selected,
          );
        }
        this.renderEdges(connection.neighbours, files, selected);
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
