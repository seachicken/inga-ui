import { tw } from 'twind';
import FileTree from './components/FileTree.js';
import LayerView from './components/LayerView.js';

const report = JSON.stringify(window['__inga__']);

window.customElements.define('file-tree', FileTree);
window.customElements.define('layer-view', LayerView);

document.querySelector('#app').innerHTML = `
  <div class="${tw`flex`}">
    <nav class="${tw`w-64 h-full`}">
      <file-tree report=${report}></file-tree>
    </nav>
    <main>
      <layer-view></layer-view>
    </main>
  </div>
`;
