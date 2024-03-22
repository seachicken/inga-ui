import install from '@twind/with-web-components';
import config from '../twind.config';
import { getPosKey } from '../core/graph.js';

const withTwind = install(config);

export default class ServiceGraph extends withTwind(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
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
        <div class="file rounded border border-black m-3 p-2">
          <p class="name text-xs"></p>
        </div>
      </template>

      <template id="edge-template">
        <line class="edge" stroke="black" />
      </template>
    `;

    this.panel = this.shadowRoot.querySelector('#panel');
    this.edges = this.shadowRoot.querySelector('#edges');
    this.serviceTemplate = this.shadowRoot.querySelector('#service-template');
    this.fileTemplate = this.shadowRoot.querySelector('#file-template');
    this.edgeTemplate = this.shadowRoot.querySelector('#edge-template');
    this.files = new Map();
  }

  static get observedAttributes() {
    return ['src'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'src') {
      this.graphs = JSON.parse(newValue);
    }
    this.render();
  }

  render() {
    for (let i = 0; i < this.graphs.length; i += 1) {
      this.renderGraph(this.graphs[i], i);
    }
    requestAnimationFrame(() => {
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
    }
  }

  renderEdges(graphs, files) {
    for (const graph of graphs) {
      for (const innerConn of graph.innerConnections) {
        for (const origin of innerConn.origins) {
          this.renderEdge(
            files.get(getPosKey(innerConn.entrypoint)),
            files.get(getPosKey(origin)),
          );
        }
      }

      for (const connection of graph.neighbours || []) {
        for (const conn of connection.innerConnections) {
          this.renderEdge(
            files.get(getPosKey(conn.entrypoint)),
            files.get(getPosKey(conn.origin)),
          );
        }
        this.renderEdges(connection.neighbours, files);
      }
    }
  }

  renderEdge(dom1, dom2) {
    const edge = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const panelRect = this.panel.getBoundingClientRect();
    const dom1Rect = dom1.getBoundingClientRect();
    const dom2Rect = dom2.getBoundingClientRect();
    edge.setAttribute('x1', dom1Rect.right - panelRect.left);
    edge.setAttribute('y1', dom1Rect.top + (dom2Rect.height / 2) - panelRect.top);
    edge.setAttribute('x2', dom2Rect.left - panelRect.left);
    edge.setAttribute('y2', dom2Rect.top + (dom1Rect.height / 2) - panelRect.top);
    edge.setAttribute('stroke', 'lightblue');
    this.edges.appendChild(edge);
  }
}
