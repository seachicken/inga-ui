import { create, cssomSheet } from 'twind';
import { fileType } from '../core/sort.js';

const sheet = cssomSheet({ target: new CSSStyleSheet() });
const { tw } = create({ sheet });

const MARGIN_WEIGHT = 2;

export default class FileTree extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet.target];
    this.shadowRoot.innerHTML = `
      <ul id="file-list" class="${tw`truncate`}">
      </ul>

      <template id="dir-item">
        <li class="item ${tw`flex items-center w-full py-1`}">
          <div class="head">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M.513 1.513A1.75 1.75 0 0 1 1.75 1h3.5c.55 0 1.07.26 1.4.7l.9 1.2a.25.25 0 0 0 .2.1H13a1 1 0 0 1 1 1v.5H2.75a.75.75 0 0 0 0 1.5h11.978a1 1 0 0 1 .994 1.117L15 13.25A1.75 1.75 0 0 1 13.25 15H1.75A1.75 1.75 0 0 1 0 13.25V2.75c0-.464.184-.91.513-1.237Z"></path></svg>
          </div>
          <span class="name ${tw`ml-2`}"></span>
        </li>
      </template>

      <template id="file-item">
        <li class="item ${tw`flex items-center w-full py-1`}">
          <div class="head">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"></path></svg>
          </div>
          <span class="name ${tw`ml-2`}"></span>
        </li>
      </template>

      <template id="declaration-item-template">
        <li class="declaration-item ${tw`flex items-center w-full py-1 hover:bg-gray-100`}">
          <div class="head">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M9.504.43a1.516 1.516 0 0 1 2.437 1.713L10.415 5.5h2.123c1.57 0 2.346 1.909 1.22 3.004l-7.34 7.142a1.249 1.249 0 0 1-.871.354h-.302a1.25 1.25 0 0 1-1.157-1.723L5.633 10.5H3.462c-1.57 0-2.346-1.909-1.22-3.004L9.503.429Zm1.047 1.074L3.286 8.571A.25.25 0 0 0 3.462 9H6.75a.75.75 0 0 1 .694 1.034l-1.713 4.188 6.982-6.793A.25.25 0 0 0 12.538 7H9.25a.75.75 0 0 1-.683-1.06l2.008-4.418.003-.006a.036.036 0 0 0-.004-.009l-.006-.006-.008-.001c-.003 0-.006.002-.009.004Z"></path></svg>
          </div>
          <a class="name ${tw`ml-2 text-xs text-blue-500 underline`}"></a>
        </li>
      </template>
    `;

    this.fileList = this.shadowRoot.querySelector('#file-list');
    this.dirItemTemplate = this.shadowRoot.querySelector('#dir-item');
    this.fileItemTemplate = this.shadowRoot.querySelector('#file-item');
    this.declarationItemTemplate = this.shadowRoot.querySelector('#declaration-item-template');
  }

  get relatedindexes() {
    return this.getAttribute('relatedindexes');
  }

  set relatedindexes(value) {
    this.setAttribute('relatedindexes', value);
  }

  static get observedAttributes() {
    return ['src', 'repourl', 'headsha', 'defaultindex', 'relatedindexes'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'src') {
      this.src = JSON.parse(newValue);
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
    if (name === 'relatedindexes') {
      this.relatedIndexes = JSON.parse(newValue);
    }
    this.render();
  }

  render() {
    this.fileList.innerHTML = '';

    for (let fi = 0; fi < this.src.length; fi += 1) {
      const pos = this.src[fi];

      if (pos.type === fileType.DIR) {
        const dirItem = document.importNode(this.dirItemTemplate.content, true);
        const item = dirItem.querySelector('.item');
        const head = item.querySelector('.head');
        head.classList.add(tw(`ml-${pos.nest * 2}`));
        const name = item.querySelector('.name');
        name.innerHTML = pos.path;
        this.fileList.appendChild(dirItem);
      } else {
        const fileItem = document.importNode(this.fileItemTemplate.content, true);
        const item = fileItem.querySelector('.item');
        const head = item.querySelector('.head');
        head.classList.add(tw(`ml-${pos.nest * MARGIN_WEIGHT}`));
        const name = item.querySelector('.name');
        name.innerHTML = pos.path;
        this.fileList.appendChild(fileItem);

        for (let di = 0; di < pos.declarations.length; di += 1) {
          const i = fi + di;
          const declaration = pos.declarations[di];
          const declarationItem = document.importNode(this.declarationItemTemplate.content, true);
          const decItem = declarationItem.querySelector('.declaration-item');
          const decHead = declarationItem.querySelector('.head');
          decHead.classList.add(tw(`ml-${(pos.nest + 1) * MARGIN_WEIGHT}`));
          const decName = decItem.querySelector('.name');
          decName.innerHTML = declaration.name;
          decName.href = `${this.repoUrl}/blob/${this.headSha}/${declaration.path}#L${declaration.line}`;
          const selectStyle = tw('bg-gray-100');
          if (this.relatedIndexes?.some((ri) => i === ri.fileIndex + ri.declarationIndex)) {
            decItem.classList.add(selectStyle);
          }
          decItem.addEventListener('mouseover', () => {
            this.selectedIndex = i;
            this.fileList.querySelectorAll('.declaration-item')
              .forEach((it) => it.classList.remove(selectStyle));
            decItem.classList.add(selectStyle);
            this.dispatchEvent(new CustomEvent('itemselect', {
              bubbles: true,
              composed: true,
              detail: { fileIndex: fi, declarationIndex: di },
            }));
          });
          this.fileList.appendChild(declarationItem);
        }
      }
    }
  }
}
