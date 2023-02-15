import { create, cssomSheet } from 'twind';

const sheet = cssomSheet({ target: new CSSStyleSheet() })
const { tw } = create({ sheet });

export default class LayerView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [sheet.target];
    this.shadowRoot.innerHTML = `
      <ul id="code-list" class="${tw`ml-2 mt-3`}">
      </ul>

      <template id="code-item">
        <li>
          <a class="link"></a>
        </li>
      </template>
    `;

    this._codeList = this.shadowRoot.querySelector('#code-list');
    this._codeItemTemplate = this.shadowRoot.querySelector('#code-item');
  }

  set origins(value) {
    this.setAttribute('origins', value);
  }

  static get observedAttributes() {
    return ['origins', 'repourl', 'headsha'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'origins') {
      this._origins = JSON.parse(newValue);
    }
    if (name === 'repourl') {
      this._repoUrl = newValue;
    }
    if (name === 'headsha') {
      this._headSha = newValue;
    }
    this.render();
  }

  render() {
    this._codeList.innerHTML = '';
    for (const pos of this._origins) {
      const codeItem = document.importNode(this._codeItemTemplate.content, true);
      const link = codeItem.querySelector('.link');
      link.href = `${this._repoUrl}/blob/${this._headSha}/${pos.path}#L${pos.line}`;
      link.innerHTML = pos.path;
      this._codeList.appendChild(codeItem);
    }
  }
}
