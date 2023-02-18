import { tw } from 'twind';
import FileTree from './components/FileTree.js';
import LayerView from './components/LayerView.js';
import { fileType, getFilePoss } from './core/sort.js';

window.customElements.define('file-tree', FileTree);
window.customElements.define('layer-view', LayerView);

const report = window.inga_report;
const repoUrl = window.inga_repo_url;
const headSha = window.inga_head_sha;
const filePoss = getFilePoss(report);
let selectedOrigins = filePoss.find((p) => p.type === fileType.FILE)?.origins || [];

document.querySelector('#app').innerHTML = `
  <div class="${tw`flex h-screen`}">
    <nav class="${tw`w-64 min-w-48`}">
      <file-tree src=${JSON.stringify(filePoss)} onclick=></file-tree>
    </nav>
    <div id="separator" class="${tw`cursor-col-resize border-1`}"></div>
    <main>
      <layer-view origins=${JSON.stringify(selectedOrigins)} repourl=${repoUrl} headsha=${headSha}></layer-view>
    </main>
  </div>
`;

const nav = document.querySelector('nav');
const fileTree = document.querySelector('file-tree');
const separator = document.querySelector('#separator');
const layerView = document.querySelector('layer-view');

fileTree.addEventListener('click', (e) => {
  if (e.detail.index) {
    selectedOrigins = JSON.stringify(filePoss[e.detail.index].origins);
    layerView.origins = selectedOrigins;
  }
});

function risizeSeperator(e) {
  nav.style.flexBasis = `${e.x}px`;
}

separator.addEventListener('mousedown', () => {
  document.addEventListener('mousemove', risizeSeperator);
  document.addEventListener('mouseup', () => {
    document.removeEventListener('mousemove', risizeSeperator);
  });
});
