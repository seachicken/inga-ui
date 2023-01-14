import { create, cssomSheet } from 'twind';

const sheet = cssomSheet({ target: new CSSStyleSheet() })
const { tw } = create({ sheet });

export default class FileTree extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [sheet.target];
    this.shadowRoot.innerHTML = `
      <ul id="file-list" class="${tw`ml-2`}">
      </ul>

      <template id="dir-list-item">
        <li>
          <button class="dir-button"></button>
        </li>
      </template>
    `;

    this._fileList = this.shadowRoot.querySelector('#file-list');
    this._dirListItemTemplate = this.shadowRoot.querySelector('#dir-list-item');
  }

  static get observedAttributes() {
    return ['report'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'report') {
      this._report = JSON.parse(newValue);
    }
    this.render();
  }

  render() {
    for (const file of this._report) {
      const dirListItem = document.importNode(this._dirListItemTemplate.content, true);
      const dirButton = dirListItem.querySelector('.dir-button');
      dirButton.innerHTML = file.entorypoint.path;
      this._fileList.appendChild(dirListItem);
    }
  }
}
