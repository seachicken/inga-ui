import { cssomSheet, tw } from 'twind';
import install from '@twind/with-web-components';
import config from '../twind.config';
import graph from '../core/graph.js';
import { selectState } from '../core/state.js';
import sort, { fileType, groupKey } from '../core/sort.js';

const withTwind = install(config);
const sheet = cssomSheet({ target: new CSSStyleSheet() });
sheet.target.replaceSync(`
  .declaration {
    background-color: ${tw.theme('colors.white')};
  }
  .declaration-hover {
    background-color: ${tw.theme('colors.gray.100')};
  }
  .declaration-select-impacted {
    background-color: ${tw.theme('colors.green.100')};
  }
  .declaration-select-changed {
    background-color: ${tw.theme('colors.blue.100')};
  }

  .joint-searching {
    width: 10px;
    stroke: ${tw.theme('colors.blue.400')};
    transform: rotate(-90deg);
  }
  .joint-searching-path {
    stroke-width: 20px;
    stroke-dasharray: 1000;
    stroke-linecap: round;
    animation: joint-searching-animation 1s linear infinite;
  }
  @keyframes joint-searching-animation {
    0% {
      stroke-dashoffset: 1000;
    }
    100% {
      stroke-dashoffset: 0;
    }
  }
  .joint-normal {
    background-color: ${tw.theme('colors.gray.300')};
  }
  .joint-select-impacted {
    background-color: ${tw.theme('colors.green.500')};
  }
  .joint-select-changed {
    background-color: ${tw.theme('colors.blue.500')};
  }

  .edge-select-impacted {
    stroke-dasharray: 7;
    stroke-linecap: round;
    animation: edge-animation 70s linear infinite;
  }
  @keyframes edge-animation {
    0% {
      stroke-dashoffset: 1000;
    }
    100% {
      stroke-dashoffset: 0;
    }
  }
  .edge-select-changed {
    stroke-dasharray: 7;
    stroke-linecap: round;
    animation: edge-animation-changed 70s linear infinite;
  }
  @keyframes edge-animation-changed {
    0% {
      stroke-dashoffset: 0;
    }
    100% {
      stroke-dashoffset: 1000;
    }
  }

  .sync-button-hover {
    background-color: ${tw.theme('colors.gray.200')};
  }
  .sync-button-select {
    background-color: ${tw.theme('colors.blue.500')};
  }
  .sync-button-select div {
    fill: ${tw.theme('colors.white')};
  }
`);

export default class ServiceGraph extends withTwind(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet.target];
    this.shadowRoot.innerHTML = `
      <div id="panel" class="relative w-[5000px] h-[5000px]">
        <svg xmlns="http://www.w3.org/2000/svg" id="edges" class="absolute w-full h-full z-10 pointer-events-none"></svg>
        <div id="nodes" class="absolute w-full h-full"></div>
        <button id="sync-button" class="flex items-end fixed mt-2 z-50 max-w-max mx-auto right-2 bottom-2 rounded-md border-1">
          <div class="fill-gray-500 m-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path></svg>
          </div>
        </button>
      </div>

      <template id="service-template">
        <div class="service absolute rounded-md hover:ring-2 cursor-move select-none">
          <div class="absolute rounded-md w-full h-full bg-white/50 backdrop-blur-md"></div>
          <span class="name relative mx-2 text-gray-500"></span>
          <div class="errors relative"></div>
          <div class="flex">
            <div class="in">
            </div>
            <div class="out">
            </div>
          </div>
        </div>
      </template>

      <template id="error-template">
        <div class="error flex items-center rounded bg-red-100 text-red-700 mt-2 mx-3 px-4 py-2">
          <div class="fill-red-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M2.343 13.657A8 8 0 1 1 13.658 2.343 8 8 0 0 1 2.343 13.657ZM6.03 4.97a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042L6.94 8 4.97 9.97a.749.749 0 0 0 .326 1.275.749.749 0 0 0 .734-.215L8 9.06l1.97 1.97a.749.749 0 0 0 1.275-.326.749.749 0 0 0-.215-.734L9.06 8l1.97-1.97a.749.749 0 0 0-.326-1.275.749.749 0 0 0-.734.215L8 6.94Z"></path></svg>
          </div>
          <span class="message ml-2"></span>
        </div>
      </template>

      <template id="file-template">
        <div class="file relative rounded bg-white border-1 drop-shadow m-5 py-1 z-30">
          <div class="flex mb-1 px-2 items-center">
            <p class="name"></p>
          </div>
          <ul class="declarations divide-y"></ul>
        </div>
      </template>

      <template id="declaration-template">
        <li class="declaration flex items-center h-6">
          <div class="joint-slot absolute left-1"></div>
          <p class="name w-full px-4"></p>
          <a target="_blank" class="link">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z"></path></svg>
          </a>
          <div class="joint-slot absolute right-1"></div>
        </li>
      </template>

      <template id="joint-template">
        <div class="joint flex items-center justify-center w-100 h-100 -top-1 mx-1">
          <div class="joint-inner absolute w-1.5 h-1.5 rounded-full"></div>
          <svg class="joint-searching absolute fill-none overflow-visible" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle class="joint-searching-path" cx="50" cy="50" r="50" /></svg>
        </div>
      </template>
    `;

    this.panel = this.shadowRoot.querySelector('#panel');
    this.nodes = this.shadowRoot.querySelector('#nodes');
    this.edges = this.shadowRoot.querySelector('#edges');
    this.serviceTemplate = this.shadowRoot.querySelector('#service-template');
    this.errorTemplate = this.shadowRoot.querySelector('#error-template');
    this.fileTemplate = this.shadowRoot.querySelector('#file-template');
    this.declarationTemplate = this.shadowRoot.querySelector('#declaration-template');
    this.jointTemplate = this.shadowRoot.querySelector('#joint-template');
    this.errors = [];
    this.filesChangedKeys = [];
    this.searchingKeys = [];
    this.declarations = new Map();
    this.selectEntrypoint = '';
    this.selectEntrypointState = selectState.NORMAL;
    this.selectDeclaration = '';
    this.selectDeclarations = new Set();
    this.callbackStateChanged = () => {};

    const syncButton = this.shadowRoot.querySelector('#sync-button');
    const handleSelectSyncButton = () => {
      if (this.enableSync) {
        syncButton.classList.add('sync-button-select');
        this.callbackStateChanged(selectState.SELECT);
      } else {
        this.unselectChanged();
        syncButton.classList.remove('sync-button-select');
        requestAnimationFrame(() => {
          this.edges.innerHTML = '';
          this.renderEdges(this.graphs, this.declarations);
        });
        this.callbackStateChanged(selectState.NORMAL);
      }
    };
    handleSelectSyncButton();
    syncButton.addEventListener('click', () => {
      this.enableSync = !this.enableSync;
      handleSelectSyncButton();
    });
    syncButton.addEventListener('mouseover', () => {
      syncButton.classList.add('sync-button-hover');
    });
    syncButton.addEventListener('mouseleave', () => {
      syncButton.classList.remove('sync-button-hover');
    });
  }

  get enableSync() {
    return this.getAttribute('enablesync') === 'true';
  }

  set enableSync(value) {
    this.setAttribute('enablesync', value);
  }

  set onStateChanged(callback) {
    this.callbackStateChanged = callback;
  }

  static get observedAttributes() {
    return ['src', 'errors', 'fileschangedkeys', 'searchingkeys', 'state', 'enablesync', 'repourl', 'prnumber', 'entrypointselect'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'src') {
      this.graphs = JSON.parse(newValue);
      this.render();
    }
    if (name === 'errors') {
      this.errors = JSON.parse(newValue);
      this.render();
    }
    if (name === 'fileschangedkeys') {
      this.filesChangedKeys = JSON.parse(newValue);
      this.render();
    }
    if (name === 'searchingkeys') {
      this.searchingKeys = JSON.parse(newValue);
      this.render();
    }
    if (name === 'state') {
      if (!this.enableSync) {
        return;
      }

      this.state = JSON.parse(newValue);
      this.unselectChanged();
      this.selectChanged();
      this.scrollToDeclaration(this.selectDeclaration);
    }
    if (name === 'repourl') {
      this.repoUrl = newValue;
      if (this.repoUrl) {
        this.shadowRoot.querySelector('#sync-button').classList.add('hidden');
      }
      this.render();
    }
    if (name === 'prnumber') {
      this.prNumber = newValue;
      this.render();
    }
    if (name === 'entrypointselect') {
      const obj = JSON.parse(newValue);

      for (const dec of this.declarations.values()) {
        dec.classList.remove('declaration-hover', 'declaration-select-impacted');
        dec.querySelectorAll('.joint-inner')
          .forEach((j) => j.classList.remove(
            'joint-normal',
            'joint-select-impacted',
            'joint-select-changed',
          ));
      }

      switch (obj.state) {
        case selectState.NORMAL:
          if (this.selectEntrypointState === selectState.SELECT) {
            for (const dec of this.declarations.values()) {
              const file = dec.closest('.file');
              file.classList.remove('ring-2');
            }
            if (this.enableSync || this.selectDeclaration) {
              this.selectChanged();
            }
          }
          break;
        case selectState.OVER:
          if (this.selectEntrypointState === selectState.SELECT) {
            for (const dec of this.declarations.values()) {
              const file = dec.closest('.file');
              file.classList.remove('ring-2');
            }
            if (this.enableSync || this.selectDeclaration) {
              this.selectChanged();
            }
          }

          this.declarations.get(obj.posKey).classList.add('declaration-hover');
          break;
        case selectState.SELECT:
          this.unselectChanged();
          this.selectDeclarations = new Set();
          this.declarations.get(obj.posKey).classList.add('declaration-select-impacted');

          this.scrollToDeclaration(obj.posKey);
          for (const [key, dec] of this.declarations) {
            if (key === obj.posKey) {
              const file = dec.closest('.file');
              file.classList.add('ring-2');
              break;
            }
          }
          break;
        default:
      }

      requestAnimationFrame(() => {
        this.edges.innerHTML = '';
        this.renderEdges(this.graphs, this.declarations);
      });

      this.selectEntrypointState = obj.state;
      this.selectEntrypoint = obj.posKey;
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

    for (const dec of this.declarations.values()) {
      dec.querySelectorAll('.joint-searching')
        .forEach((j) => j.classList.add('hidden'));
    }
    for (const key of this.searchingKeys) {
      if (this.declarations.has(key)) {
        this.declarations.get(key).querySelector('.joint-searching').classList.remove('hidden');
      }
    }
  }

  renderGraph(g, i, depth = 0) {
    const serviceRoot = document.importNode(this.serviceTemplate.content, true);
    const service = serviceRoot.querySelector('.service');
    service.style.left = `${depth * 430 + 30}px`;
    service.style.top = `${i * 150 + 30}px`;
    service.querySelector('.name').innerHTML = g.service;

    const error = this.errors.find((e) => e.service === g.service);
    if (error) {
      const errorRoot = document.importNode(this.errorTemplate.content, true);
      const errorDom = errorRoot.querySelector('.error');
      errorDom.querySelector('.message').innerHTML = 'Signature loading failed. Please recompile this project.';
      service.querySelector('.errors').appendChild(errorDom);
    }

    service.addEventListener('mousedown', (e) => {
      const panelRect = this.panel.getBoundingClientRect();
      const offsetX = panelRect.left + e.clientX - service.getBoundingClientRect().left;
      const offsetY = panelRect.top + e.clientY - service.getBoundingClientRect().top;

      const drag = (de) => {
        service.style.left = `${de.clientX - offsetX}px`;
        service.style.top = `${de.clientY - offsetY}px`;

        this.edges.innerHTML = '';
        this.renderEdges(this.graphs, this.declarations);
      };

      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', () => {
        document.removeEventListener('mousemove', drag);
      });
    });

    this.nodes.appendChild(service);

    function isOut(target, conns) {
      if (!target) {
        return true;
      }
      return conns
        .some((c) => (!c.entrypoint || c.entrypoint.path !== target.path)
          && c.origins.some((o) => o.path === target.path));
    }

    const filePossIn = sort.getFilePoss(
      g.innerConnections
        .filter((c) => !isOut(c.entrypoint, g.innerConnections))
        .map((c) => ({ entrypoint: c.entrypoint })),
    ).filter((p) => p.type === fileType.FILE);
    for (const filePosIn of filePossIn) {
      this.renderFile(filePosIn, 0, 0, service.querySelector('.in'));
    }

    const filePossOut = sort.getFilePoss(
      g.innerConnections
        .flatMap((c) => c.origins)
        .filter((p) => isOut(p, g.innerConnections))
        .map((p) => ({ origin: p })),
      groupKey.ORIGIN,
    ).filter((p) => p.type === fileType.FILE);
    for (const filePosOut of filePossOut) {
      this.renderFile(filePosOut, 0, 0, service.querySelector('.out'));
    }

    (g.neighbours || [])
      .forEach((c, ci) => c.neighbours.forEach((s) => this.renderGraph(s, ci, depth + 1)));
  }

  renderFile(pos, i, depth, parent) {
    const fileRoot = document.importNode(this.fileTemplate.content, true);
    const file = fileRoot.querySelector('.file');
    file.style.left = `${depth * 200}px`;
    file.style.top = `${i * 30}px`;
    file.querySelector('.name').innerHTML = pos.path.split('/').pop();

    const fileChanged = pos.declarations
      .find((d) => this.filesChangedKeys.find((k) => k === graph.getPosKey(d)));

    parent.appendChild(file);

    for (const dec of pos.declarations) {
      const declarationRoot = document.importNode(this.declarationTemplate.content, true);
      const declaration = declarationRoot.querySelector('.declaration');
      declaration.querySelector('.name').innerHTML = dec.name;
      if (this.filesChangedKeys.some((k) => k === graph.getPosKey(dec))) {
        declaration.querySelector('.name').classList.add('text-blue-600');
      } else {
        declaration.querySelector('.name').classList.add('text-gray-700');
      }
      if (fileChanged && this.repoUrl) {
        toSha256(dec.path).then((sha) => {
          declaration.querySelector('.link').href = `${this.repoUrl}/pull/${this.prNumber}/files#diff-${sha}R${dec.line}`;
        });
      } else {
        declaration.querySelector('.link').remove();
      }
      file.querySelector('.declarations').appendChild(declaration);

      for (const jointSlot of declaration.querySelectorAll('.joint-slot')) {
        const jointRoot = document.importNode(this.jointTemplate.content, true);
        const joint = jointRoot.querySelector('.joint');
        joint.classList.add('hidden');
        jointSlot.appendChild(joint);
      }

      this.declarations.set(graph.getPosKey(dec), declaration);
    }
  }

  renderEdges(graphs, declarations, parentKey = null) {
    for (const g of graphs) {
      let selected = false;
      const parentKeys = [];
      for (const innerConn of g.innerConnections) {
        if (this.selectEntrypoint) {
          if (parentKey) {
            selected = this.selectEntrypointState === selectState.SELECT
              && parentKey === graph.getPosKey(innerConn.entrypoint);
          } else {
            selected = this.selectEntrypointState === selectState.SELECT
              && this.selectEntrypoint === graph.getPosKey(innerConn.entrypoint);
          }
        }

        for (const origin of innerConn.origins) {
          this.renderEdge(
            declarations.get(graph.getPosKey(innerConn.entrypoint)),
            declarations.get(graph.getPosKey(origin)),
            this.selectDeclaration
              ? this.selectDeclarations.has(graph.getPosKey(innerConn.entrypoint))
                && this.selectDeclarations.has(graph.getPosKey(origin))
              : selected,
          );
          if (graph.getPosKey(innerConn.entrypoint) === this.selectEntrypoint) {
            parentKeys.push(graph.getPosKey(origin));
          }
        }
      }

      for (const connection of g.neighbours || []) {
        let newParentKey = null;
        for (const conn of connection.innerConnections) {
          this.renderEdge(
            declarations.get(graph.getPosKey(conn.entrypoint)),
            declarations.get(graph.getPosKey(conn.origin)),
            this.selectDeclaration
              ? this.selectDeclarations.has(graph.getPosKey(conn.entrypoint))
              : selected,
          );

          if (parentKeys.find((k) => k === graph.getPosKey(conn.entrypoint))) {
            newParentKey = graph.getPosKey(conn.origin);
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
    const edge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    if (dom1 && dom2) {
      const panelRect = this.panel.getBoundingClientRect();
      const dom1Rect = dom1.getBoundingClientRect();
      const dom2Rect = dom2.getBoundingClientRect();
      const x1 = dom1Rect.right - panelRect.left;
      const y1 = dom1Rect.top + (dom2Rect.height / 2) - panelRect.top;
      const x2 = dom2Rect.left - panelRect.left;
      const y2 = dom2Rect.top + (dom1Rect.height / 2) - panelRect.top;
      edge.setAttribute('d', `M ${x1} ${y1} C ${x1 + 20} ${y1} ${x2 - 20} ${y2} ${x2} ${y2}`);
    }
    dom1?.querySelectorAll('.joint')[1].classList.remove('hidden');
    dom2?.querySelectorAll('.joint')[0].classList.remove('hidden');
    if (selected) {
      if (this.selectDeclaration) {
        dom1?.querySelectorAll('.joint-inner').forEach((j) => j.classList.add('joint-select-changed'));
        dom2?.querySelectorAll('.joint-inner').forEach((j) => j.classList.add('joint-select-changed'));
        edge.classList.add('edge-select-changed');
        edge.setAttribute('stroke', tw.theme('colors.blue.600'));
      } else {
        dom1?.querySelectorAll('.joint-inner').forEach((j) => j.classList.add('joint-select-impacted'));
        dom2?.querySelectorAll('.joint-inner').forEach((j) => j.classList.add('joint-select-impacted'));
        edge.classList.add('edge-select-impacted');
        edge.setAttribute('stroke', tw.theme('colors.green.500'));
      }
    } else {
      dom1?.querySelectorAll('.joint-inner').forEach((j) => j.classList.add('joint-normal'));
      dom2?.querySelectorAll('.joint-inner').forEach((j) => j.classList.add('joint-normal'));
      edge.setAttribute('stroke', tw.theme('colors.gray.300'));
    }
    edge.setAttribute('fill', 'transparent');
    edge.setAttribute('stroke-width', selected ? '3' : '2');
    this.edges.appendChild(edge);
  }

  selectChanged() {
    if (!this.state) {
      return;
    }

    this.selectDeclaration = graph.getPosKey(this.state.didChange);
    this.selectDeclarations = graph.findParentDeclarationKeys(this.state.didChange, this.graphs);
    for (const [key, dec] of this.declarations) {
      if (key === graph.getPosKey(this.state.didChange)) {
        dec.classList.add('declaration-select-changed');
        const file = dec.closest('.file');
        file.classList.add('ring-2');
        break;
      }
    }

    requestAnimationFrame(() => {
      this.edges.innerHTML = '';
      this.renderEdges(this.graphs, this.declarations);
    });
  }

  unselectChanged() {
    this.selectDeclaration = '';

    for (const dec of this.declarations.values()) {
      dec.classList.remove('declaration-select-changed');
      dec.querySelectorAll('.joint-inner')
        .forEach((j) => j.classList.remove(
          'joint-normal',
          'joint-select-impacted',
          'joint-select-changed',
        ));
      const file = dec.closest('.file');
      file.classList.remove('ring-2');
    }
  }

  scrollToDeclaration(targetKey) {
    for (const [key, dec] of this.declarations) {
      if (key === targetKey) {
        const panelRect = this.panel.getBoundingClientRect();
        this.scrollTo(
          dec.getBoundingClientRect().left - panelRect.left - (this.clientWidth / 2),
          dec.getBoundingClientRect().top - panelRect.top - (this.clientHeight / 2),
        );
        break;
      }
    }
  }
}

async function toSha256(str) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
