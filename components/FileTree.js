import install from '@twind/with-web-components';
import config from '../twind.config';
import { fileType } from '../core/sort.js';
import { itemSelectState } from './TreeItem.js';

const withTwind = install(config);

export default class FileTree extends withTwind(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <ul id="file-list" class="truncate"></ul>

      <template id="dir-item">
        <tree-item class="item">
          <div slot="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M.513 1.513A1.75 1.75 0 0 1 1.75 1h3.5c.55 0 1.07.26 1.4.7l.9 1.2a.25.25 0 0 0 .2.1H13a1 1 0 0 1 1 1v.5H2.75a.75.75 0 0 0 0 1.5h11.978a1 1 0 0 1 .994 1.117L15 13.25A1.75 1.75 0 0 1 13.25 15H1.75A1.75 1.75 0 0 1 0 13.25V2.75c0-.464.184-.91.513-1.237Z"></path></svg>
          </div>
          <span slot="body" class="name ml-2"></span>
        </tree-item>
      </template>

      <template id="file-item">
        <tree-item class="item">
          <div slot="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"></path></svg>
          </div>
          <span slot="body" class="name ml-2"></span>
        </tree-item>
      </template>

      <template id="declaration-item-template">
        <tree-item class="declaration-item">
          <div slot="body" class="flex items-center">
            <span class="name text-xs"></span>
            <a target="_blank" class="link">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z"></path></svg>
            </a>
          </div>
        </tree-item>
      </template>
    `;

    this.fileList = this.shadowRoot.querySelector('#file-list');
    this.dirItemTemplate = this.shadowRoot.querySelector('#dir-item');
    this.fileItemTemplate = this.shadowRoot.querySelector('#file-item');
    this.declarationItemTemplate = this.shadowRoot.querySelector('#declaration-item-template');
  }

  get src() {
    return this.getAttribute('src');
  }

  set src(value) {
    this.setAttribute('src', value);
  }

  static get observedAttributes() {
    return ['src', 'repourl', 'headsha', 'defaultindex'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'src') {
      this.files = JSON.parse(newValue);
    }
    if (name === 'repourl') {
      this.repoUrl = newValue;
    }
    if (name === 'headsha') {
      this.headSha = newValue;
    }
    if (name === 'defaultindex') {
      this.selectedIndex = Number(newValue);
    }
    this.render();
  }

  render() {
    this.fileList.innerHTML = '';
    const elements = new Map();

    for (let fi = 0; fi < this.files.length; fi += 1) {
      const pos = this.files[fi];

      if (pos.type === fileType.DIR) {
        const dirItemRoot = document.importNode(this.dirItemTemplate.content, true);
        const dirItem = dirItemRoot.querySelector('.item');
        dirItem.nest = pos.nest;
        const name = dirItemRoot.querySelector('.name');
        name.innerHTML = pos.path;
        const foundElement = elements.get(pos.nest - 1);
        if (foundElement) {
          foundElement.appendChild(dirItem);
        } else {
          this.fileList.appendChild(dirItem);
        }
        elements.set(pos.nest, dirItem);
      } else {
        const fileItemRoot = document.importNode(this.fileItemTemplate.content, true);
        const fileItem = fileItemRoot.querySelector('.item');
        fileItem.nest = pos.nest;
        const name = fileItemRoot.querySelector('.name');
        name.innerHTML = pos.path;
        const foundElement = elements.get(pos.nest - 1);
        if (foundElement) {
          foundElement.appendChild(fileItem);
        } else {
          this.fileList.appendChild(fileItem);
        }
        elements.set(pos.nest, fileItem);

        for (let di = 0; di < pos.declarations.length; di += 1) {
          const declaration = pos.declarations[di];
          const declarationItemRoot = document
            .importNode(this.declarationItemTemplate.content, true);
          const decItem = declarationItemRoot.querySelector('.declaration-item');
          decItem.nest = pos.nest + 1;
          decItem.activable = true;
          decItem.querySelector('.name').innerHTML = declaration.name;
          decItem.querySelector('.link').href = `${this.repoUrl}/blob/${this.headSha}/${declaration.path}#L${declaration.line}`;
          decItem.onStateChanged = (state) => {
            if (this.prevSelectItem?.active && state !== itemSelectState.SELECT) {
              return;
            }
            if (state === itemSelectState.SELECT) {
              if (this.prevSelectItem && decItem !== this.prevSelectItem) {
                this.prevSelectItem.active = false;
              }
              this.prevSelectItem = decItem;
            }
            this.dispatchEvent(new CustomEvent('itemselect', {
              bubbles: true,
              composed: true,
              detail: { state, fileIndex: fi, declarationIndex: di },
            }));
          };
          fileItem.appendChild(decItem);
        }
      }
    }
  }
}
