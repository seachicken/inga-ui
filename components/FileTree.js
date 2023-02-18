import { create, cssomSheet } from 'twind';
import { fileType } from '../core/sort.js';

const sheet = cssomSheet({ target: new CSSStyleSheet() });
const { tw } = create({ sheet });

export default class FileTree extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet.target];
    this.shadowRoot.innerHTML = `
      <ul id="file-list" class="${tw`truncate`}">
      </ul>

      <template id="dir-item">
        <li>
          <button class="button ${tw`flex items-center w-full`}">
            <div class="head ${tw`flex`}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M.513 1.513A1.75 1.75 0 0 1 1.75 1h3.5c.55 0 1.07.26 1.4.7l.9 1.2a.25.25 0 0 0 .2.1H13a1 1 0 0 1 1 1v.5H2.75a.75.75 0 0 0 0 1.5h11.978a1 1 0 0 1 .994 1.117L15 13.25A1.75 1.75 0 0 1 13.25 15H1.75A1.75 1.75 0 0 1 0 13.25V2.75c0-.464.184-.91.513-1.237Z"></path></svg>
            </div>
            <span class="name ${tw`ml-2`}"></span>
          </button>
        </li>
      </template>

      <template id="file-item">
        <li>
          <button class="button ${tw`flex items-center w-full`}">
            <div class="head">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"></path></svg>
            </div>
            <span class="name ${tw`ml-2`}"></span>
          </button>
        </li>
      </template>
    `;

    this.fileList = this.shadowRoot.querySelector('#file-list');
    this.dirItemTemplate = this.shadowRoot.querySelector('#dir-item');
    this.fileItemTemplate = this.shadowRoot.querySelector('#file-item');
  }

  static get observedAttributes() {
    return ['src'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'src') {
      this.src = JSON.parse(newValue);
    }
    this.render();
  }

  render() {
    for (let i = 0; i < this.src.length; i += 1) {
      const pos = this.src[i];

      if (pos.type === fileType.DIR) {
        const dirItem = document.importNode(this.dirItemTemplate.content, true);
        const dirButton = dirItem.querySelector('.button');
        const head = dirButton.querySelector('.head');
        head.classList.add(tw(`ml-${pos.nest * 2}`));
        const name = dirButton.querySelector('.name');
        name.innerHTML = pos.path;

        this.fileList.appendChild(dirItem);
      } else {
        const fileItem = document.importNode(this.fileItemTemplate.content, true);
        const fileButton = fileItem.querySelector('.button');
        const head = fileButton.querySelector('.head');
        head.classList.add(tw(`ml-${pos.nest * 2}`));
        const name = fileButton.querySelector('.name');
        name.innerHTML = pos.entorypoint.path;
        fileButton.addEventListener('click', () => {
          this.dispatchEvent(new CustomEvent('click', {
            bubbles: true,
            composed: true,
            detail: { index: i },
          }));
        });

        this.fileList.appendChild(fileItem);
      }
    }
  }
}
