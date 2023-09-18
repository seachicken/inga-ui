import { install } from '@twind/core';
import config from './twind.config';
import FileTree from './components/FileTree.js';
import ServiceGraph from './components/ServiceGraph.js';
import TreeItem from './components/TreeItem.js';
import {
  fileType,
  getFilePoss,
} from './core/sort.js';
import { create } from './core/graph.js';

install(config);

window.customElements.define('file-tree', FileTree);
window.customElements.define('service-graph', ServiceGraph);
window.customElements.define('tree-item', TreeItem);

const report = window.inga_report;
const repoUrl = window.inga_repo_url;
const headSha = window.inga_head_sha;
const entrypointTree = getFilePoss(report.filter((p) => p.type === 'entrypoint'));
const graphs = create(report);
console.log(JSON.stringify(graphs, null, 2));
const selectedFileIndex = entrypointTree.findIndex((p) => p.type === fileType.FILE);

document.querySelector('#app').innerHTML = `
  <header class="flex items-center w-full p-2 text-2xl bg-green">
    <img class="w-10" src="logo.png">
    <span class="ml-2 text-white">Inga</span>
  </header>
  <div class="flex h-screen">
    <div id="entrypoint-nav" class="overflow-y-auto w-72 ml-2 pt-2">
      <div class="flex items-center w-full">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="20" height="20"><path d="M2 1.75C2 .784 2.784 0 3.75 0h5.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v8.586A1.75 1.75 0 0 1 12.25 15h-7a.75.75 0 0 1 0-1.5h7a.25.25 0 0 0 .25-.25V6H9.75A1.75 1.75 0 0 1 8 4.25V1.5H3.75a.25.25 0 0 0-.25.25V4.5a.75.75 0 0 1-1.5 0Zm-.5 10.487v1.013a.75.75 0 0 1-1.5 0v-1.012a3.748 3.748 0 0 1 3.77-3.749L4 8.49V6.573a.25.25 0 0 1 .42-.183l2.883 2.678a.25.25 0 0 1 0 .366L4.42 12.111a.25.25 0 0 1-.42-.183V9.99l-.238-.003a2.25 2.25 0 0 0-2.262 2.25Zm8-10.675V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"></path></svg>
        <span class="ml-2 text-xl">Affected endpoints</span>
      </div>
      <file-tree id="entrypoint-tree" src=${JSON.stringify(entrypointTree)} repourl=${repoUrl} headsha=${headSha} defaultindex=${selectedFileIndex}></file-tree>
    </div>
    <div id="separator" class="cursor-col-resize border-1 hover:border-green"></div>
    <service-graph id="service-graph" class="w-full" src=${JSON.stringify(graphs)}></service-graph>
  </div>
`;

const entrypointNav = document.querySelector('#entrypoint-nav');
const entrypointTreeView = document.querySelector('#entrypoint-tree');
const separator = document.querySelector('#separator');

entrypointTreeView.addEventListener('itemselect', (e) => {
  const selectedEntoryDec = entrypointTree[e.detail.fileIndex]
    .declarations[e.detail.declarationIndex];
  const relatedPoss = [];
  for (const entoryOrigin of selectedEntoryDec.origins) {
    for (const originDec of entoryOrigin.declarations) {
      const found = report
        .find((pos) => pos.origin.path === originDec.path && pos.origin.name === originDec.name);
      if (found) {
        relatedPoss.push(found);
      }
    }
  }
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
