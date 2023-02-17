import { create, cssomSheet } from 'twind';

const sheet = cssomSheet({ target: new CSSStyleSheet() });
const { tw } = create({ sheet });

export default class FileTree extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet.target];
    this.shadowRoot.innerHTML = `
      <ul id="file-list" class="${tw`truncate ml-2 mt-3`}">
      </ul>

      <template id="dir-item">
        <li>
          <button class="dir-button"></button>
        </li>
      </template>
    `;

    this.fileList = this.shadowRoot.querySelector('#file-list');
    this.dirItemTemplate = this.shadowRoot.querySelector('#dir-item');
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
      const dirItem = document.importNode(this.dirItemTemplate.content, true);

      const dirButton = dirItem.querySelector('.dir-button');
      dirButton.innerHTML = pos.entorypoint.path;
      dirButton.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('click', {
          bubbles: true,
          composed: true,
          detail: { index: i },
        }));
      });

      this.fileList.appendChild(dirItem);
    }
  }
}
