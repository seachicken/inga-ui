import { install } from '@twind/core';
import config from './twind.config';
import FileTree from './components/FileTree.js';
import ServiceGraph from './components/ServiceGraph.js';
import TreeItem from './components/TreeItem.js';
import { create, getPosKey } from './core/graph.js';
import {
  fileType,
  getFilePoss,
} from './core/sort.js';

install(config);

window.customElements.define('file-tree', FileTree);
window.customElements.define('service-graph', ServiceGraph);
window.customElements.define('tree-item', TreeItem);

const repoUrl = window.inga_repo_url;
const headSha = window.inga_head_sha;
const prNumber = window.inga_pr_number;
let report = window.inga_report;
let entrypointTree = [];
let graphs = [];
let selectedFileIndex = 0;

async function loadReport() {
  const response = await fetch('report.json');
  if (!response.ok) {
    return [];
  }
  return response.json();
}

function reload(poss) {
  entrypointTree = getFilePoss(poss.filter((p) => p.type === 'entrypoint'));
  graphs = create(poss);
  selectedFileIndex = entrypointTree.findIndex((p) => p.type === fileType.FILE);

  document.querySelector('#app').innerHTML = `
    <div class="flex h-screen bg-white">
      <div id="entrypoint-nav" class="overflow-y-auto w-72">
        <div class="flex items-center w-full">
          <span class="m-2 text-ms text-gray-500">Impacted entrypoints</span>
        </div>
        <div class="ml-2">
          <file-tree id="entrypoint-tree" src=${JSON.stringify(entrypointTree)} repourl=${repoUrl} headsha=${headSha} defaultindex=${selectedFileIndex}></file-tree>
        </div>
      </div>
      <div id="separator" class="cursor-col-resize border-1 hover:border-green"></div>
      <service-graph id="service-graph" class="w-full bg-gray-100" src=${JSON.stringify(graphs)} repourl=${repoUrl} prnumber=${prNumber}></service-graph>
    </div>
  `;

  const entrypointNav = document.querySelector('#entrypoint-nav');
  const entrypointTreeView = document.querySelector('#entrypoint-tree');
  const separator = document.querySelector('#separator');
  const serviceGraph = document.querySelector('#service-graph');

  entrypointTreeView.addEventListener('itemselect', (e) => {
    serviceGraph.setAttribute(
      'entrypointselect',
      JSON.stringify({
        state: e.detail.state,
        posKey: getPosKey(entrypointTree[e.detail.fileIndex]
          .declarations[e.detail.declarationIndex]),
      }),
    );
  });

  function risizeSeperator(e) {
    entrypointNav.style.flexBasis = `${e.x}px`;
  }

  separator.addEventListener('mousedown', () => {
    document.addEventListener('mousemove', risizeSeperator);
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', risizeSeperator);
    });
  });

  document.querySelector('#refresh-button').addEventListener('click', () => {
    reload(report);
    document.querySelector('#refresh-button').classList.add('hidden');
  });
}

(async () => {
  if (report.length === 0) {
    report = await loadReport();
  }
  reload(report);
})();

setInterval(async () => {
  const json = await loadReport();
  if (JSON.stringify(report) !== JSON.stringify(json)) {
    report = json;
    document.querySelector('#refresh-button').classList.remove('hidden');
  }
}, 5000);
