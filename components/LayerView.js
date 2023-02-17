import { create, cssomSheet } from 'twind';

const sheet = cssomSheet({ target: new CSSStyleSheet() });
const { tw } = create({ sheet });

export default class LayerView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
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

    this.codeList = this.shadowRoot.querySelector('#code-list');
    this.codeItemTemplate = this.shadowRoot.querySelector('#code-item');
  }

  get origins() {
    return this.getAttribute('origins');
  }

  set origins(value) {
    this.setAttribute('origins', value);
  }

  static get observedAttributes() {
    return ['origins', 'repourl', 'headsha'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'origins') {
      this.parsedOrigins = JSON.parse(newValue);
    }
    if (name === 'repourl') {
      this.repoUrl = newValue;
    }
    if (name === 'headsha') {
      this.headSha = newValue;
    }
    this.render();
  }

  render() {
    this.codeList.innerHTML = '';
    for (const pos of this.parsedOrigins) {
      const codeItem = document.importNode(this.codeItemTemplate.content, true);
      const link = codeItem.querySelector('.link');
      link.href = `${this.repoUrl}/blob/${this.headSha}/${pos.path}#L${pos.line}`;
      link.innerHTML = pos.path;
      this.codeList.appendChild(codeItem);
    }
  }
}
