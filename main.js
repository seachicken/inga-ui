import { tw } from 'twind';
import FileTree from './components/FileTree.js';
import LayerView from './components/LayerView.js';
import { sort } from './core/sort.js';

window.customElements.define('file-tree', FileTree);
window.customElements.define('layer-view', LayerView);

const report = window['__inga_report__'];
const repoUrl = window['__inga_repo_url__'];
const headSha = window['__inga_head_sha__'];
const filePoss = sort(report);
const selectedOrigins = filePoss[0].origins;

document.querySelector('#app').innerHTML = `
  <div class="${tw`flex`}">
    <nav class="${tw`w-64 h-full`}">
      <file-tree src=${JSON.stringify(filePoss)} onclick=></file-tree>
    </nav>
    <main>
      <layer-view origins=${JSON.stringify(selectedOrigins)} repourl=${repoUrl} headsha=${headSha}></layer-view>
    </main>
  </div>
`;
