import install from '@twind/with-web-components';
import config from '../twind.config';

const withTwind = install(config);

export default class ServiceGraph extends withTwind(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <div id="panel" class="absolute mt-5">
        <svg xmlns="http://www.w3.org/2000/svg" id="edges" class="absolute"></svg>
      </div>

      <template id="node-template">
        <div class="node absolute rounded border m-3 p-2">
          <p class="name"></p>
          <p class="method"></p>
        </div>
      </template>

      <template id="edge-template">
        <line class="edge" stroke="black" />
      </template>
    `;

    this.panel = this.shadowRoot.querySelector('#panel');
    this.edges = this.shadowRoot.querySelector('#edges');
    this.nodeTemplate = this.shadowRoot.querySelector('#node-template');
    this.edgeTemplate = this.shadowRoot.querySelector('#edge-template');
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
    for (let i = 0; i < this.graphs.length; i++) {
      const graph = this.graphs[i];
      this.renderGraph(graph, i);
    }
  }

  renderGraph(graph, i, depth = 0, parent = null) {
    const nodeRoot = document.importNode(this.nodeTemplate.content, true);
    const node = nodeRoot.querySelector('.node');
    node.style.left = `${depth * 130}px`;
    node.style.top = `${i * 70}px`;
    node.querySelector('.name').innerHTML = graph.service;
    node.querySelector('.method').innerHTML = graph.entrypoint.name;
    this.panel.appendChild(node);
    if (parent) {
      requestAnimationFrame(() => {
        //const edgeRoot = document.importNode(this.edgeTemplate.content, true);
        //const edge2 = edgeRoot.querySelector('.edge');
        const edge = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const panelRect = this.panel.getBoundingClientRect();
        const nodeRect = node.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        edge.setAttribute('x1', parentRect.right - panelRect.left);
        edge.setAttribute('y1', parentRect.top + (parentRect.height / 2) - panelRect.top);
        edge.setAttribute('x2', nodeRect.left - panelRect.left);
        edge.setAttribute('y2', nodeRect.top + (nodeRect.height / 2) - panelRect.top);
        edge.setAttribute('stroke', 'black');
        this.edges.appendChild(edge);
      });
    }

    (graph.edges || []).forEach((n) => this.renderGraph(n, i, depth + 1, node));
  }
}
