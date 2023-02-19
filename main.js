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
const selectedEntorypoints = filePoss.find((p) => p.type === fileType.FILE)?.declarations || [];
const selectedOrigins = selectedEntorypoints[0]?.origins[0]?.declarations || [];

document.querySelector('#app').innerHTML = `
  <div class="${tw`flex h-screen`}">
    <nav class="${tw`w-64 min-w-48`}">
      <file-tree src=${JSON.stringify(filePoss)} onclick=></file-tree>
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

fileTree.addEventListener('click', (e) => {
  if (e.detail.index) {
    const entorypoints = filePoss[e.detail.index].declarations;
    entorypointLayerView.origins = JSON.stringify(entorypoints);
    originLayerView.origins = JSON.stringify(entorypoints[0]?.origins[0]?.declarations || []);
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
