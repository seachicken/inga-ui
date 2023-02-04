import { tw } from 'twind';
import FileTree from './components/FileTree.js';
import HierarchyView from './components/HierarchyView.js';

const report = JSON.stringify(window['__inga__']);

window.customElements.define('file-tree', FileTree);
window.customElements.define('hierarchy-view', HierarchyView);

document.querySelector('#app').innerHTML = `
  <div class="${tw`flex`}">
    <nav class="${tw`w-64 h-full`}">
      <file-tree report=${report}></file-tree>
    </nav>
    <main>
      <hierarchy-view></hierarchy-view>
    </main>
  </div>
`;
