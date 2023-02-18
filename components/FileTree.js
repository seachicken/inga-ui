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
          <button class="button ${tw`w-full text-left`}"><span class="name"></span></button>
        </li>
      </template>

      <template id="file-item">
        <li>
          <button class="button ${tw`w-full text-left`}"><span class="name"></span></button>
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
        const buttonName = dirButton.querySelector('.name');
        buttonName.innerHTML = pos.path;
        buttonName.classList.add(tw(`pl-${pos.nest * 2}`));
        dirButton.addEventListener('click', () => {
          this.dispatchEvent(new CustomEvent('click', {
            bubbles: true,
            composed: true,
            detail: { index: i },
          }));
        });

        this.fileList.appendChild(dirItem);
      } else {
        const fileItem = document.importNode(this.fileItemTemplate.content, true);
        const fileButton = fileItem.querySelector('.button');
        const buttonName = fileButton.querySelector('.name');
        buttonName.innerHTML = pos.entorypoint.path;
        buttonName.classList.add(tw(`pl-${pos.nest * 2}`));
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
