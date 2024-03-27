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

const report = window.inga_report;
const repoUrl = window.inga_repo_url;
const headSha = window.inga_head_sha;
const entrypointTree = getFilePoss(report.filter((p) => p.type === 'entrypoint'));
const graphs = create(report);
const selectedFileIndex = entrypointTree.findIndex((p) => p.type === fileType.FILE);

document.querySelector('#app').innerHTML = `
  <header class="flex items-center w-full p-2 bg-green">
    <img class="w-10" src="logo.png">
    <span class="ml-2 text-white text-xl">Inga</span>
  </header>
  <div class="flex h-screen">
    <div id="entrypoint-nav" class="overflow-y-auto w-72">
      <div class="flex items-center w-full">
        <span class="m-2 text-ms text-gray-500">Impacted entrypoints</span>
      </div>
      <div class="ml-2">
        <file-tree id="entrypoint-tree" src=${JSON.stringify(entrypointTree)} repourl=${repoUrl} headsha=${headSha} defaultindex=${selectedFileIndex}></file-tree>
      </div>
    </div>
    <div id="separator" class="cursor-col-resize border-1 hover:border-green"></div>
    <service-graph id="service-graph" class="w-full" src=${JSON.stringify(graphs)}></service-graph>
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
      posKey: getPosKey(entrypointTree[e.detail.fileIndex].declarations[e.detail.declarationIndex]),
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
