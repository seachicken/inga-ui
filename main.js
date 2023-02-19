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
let selectedFileIndex = filePoss.findIndex((p) => p.type === fileType.FILE);
const selectedEntorypoints = selectedFileIndex < 0 ? [] : filePoss[selectedFileIndex].declarations;
const selectedOrigins = selectedEntorypoints[0]?.origins[0]?.declarations || [];

document.querySelector('#app').innerHTML = `
  <div class="${tw`flex h-screen`}">
    <nav class="${tw`w-64 pt-2 pl-2`}">
      <file-tree src=${JSON.stringify(filePoss)} defaultindex=${selectedFileIndex} onclick=></file-tree>
    </nav>
    <div id="separator" class="${tw`cursor-col-resize border-1`}"></div>
    <main class="${tw`flex`}">
      <layer-view id="entorypoint-layer-view" origins=${JSON.stringify(selectedEntorypoints)} repourl=${repoUrl} headsha=${headSha}></layer-view>
      <layer-view id="origin-layer-view" origins=${JSON.stringify(selectedOrigins)} repourl=${repoUrl} headsha=${headSha}></layer-view>
    </main>
  </div>
`;

const nav = document.querySelector('nav');
const fileTree = document.querySelector('file-tree');
const separator = document.querySelector('#separator');
const entorypointLayerView = document.querySelector('#entorypoint-layer-view');
const originLayerView = document.querySelector('#origin-layer-view');

fileTree.addEventListener('itemselect', (e) => {
  selectedFileIndex = e.detail.index;
  const entorypoints = filePoss[selectedFileIndex].declarations;
  entorypointLayerView.origins = JSON.stringify(entorypoints);
  originLayerView.origins = JSON.stringify(entorypoints[0]?.origins[0]?.declarations || []);
});

entorypointLayerView.addEventListener('itemselect', (e) => {
  const entorypoints = filePoss[selectedFileIndex].declarations;
  originLayerView.origins = JSON.stringify(
    entorypoints[e.detail.index].origins[0]?.declarations || [],
  );
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
