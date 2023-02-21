import { create, cssomSheet } from 'twind';

const sheet = cssomSheet({ target: new CSSStyleSheet() });
const { tw } = create({ sheet });

export default class LayerView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet.target];
    this.shadowRoot.innerHTML = `
      <ul id="code-list" class="${tw`h-full border-r`}">
      </ul>

      <template id="code-item">
        <li class="item ${tw`my-2 p-2 border`}">
          <div class="name"></div>
        </li>
      </template>

      <template id="declaration-list">
        <ul class="list ${tw`px-2`}">
        </ul>
      </template>

      <template id="declaration-item">
        <li class="item ${tw`w-80 my-2 p-2 border truncate hover:bg-gray-100`}">
          <div class="name ${tw`text-sm`}"></div>
          <a class="link ${tw`text-xs text-blue-500 underline`}"></a>
        </li>
      </template>
    `;

    this.codeList = this.shadowRoot.querySelector('#code-list');
    this.codeItemTemplate = this.shadowRoot.querySelector('#code-item');
    this.declarationListTemplate = this.shadowRoot.querySelector('#declaration-list');
    this.declarationItemTemplate = this.shadowRoot.querySelector('#declaration-item');
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
    const declarationListRoot = document.importNode(this.declarationListTemplate.content, true);
    const declarationList = declarationListRoot.querySelector('.list');
    const codeItemRoot = document.importNode(this.codeItemTemplate.content, true);
    const codeItem = codeItemRoot.querySelector('.item');
    const codeName = codeItem.querySelector('.name');
    codeName.innerHTML = `${this.parsedOrigins[0].path.split('/').splice(-1)[0]}`;

    for (let i = 0; i < this.parsedOrigins.length; i += 1) {
      const pos = this.parsedOrigins[i];
      const declarationItemRoot = document.importNode(this.declarationItemTemplate.content, true);
      const declarationItem = declarationItemRoot.querySelector('.item');
      const selectStyle = tw('bg-gray-100');
      if (i === 0) {
        declarationItem.classList.add(selectStyle);
      }
      declarationItem.addEventListener('click', () => {
        this.selectedIndex = i;
        this.codeList.querySelectorAll('.item')
          .forEach((it) => it.classList.remove(selectStyle));
        declarationItem.classList.add(selectStyle);
        this.dispatchEvent(new CustomEvent('itemselect', {
          bubbles: true,
          composed: true,
          detail: { index: i },
        }));
      });
      const link = declarationItem.querySelector('.link');
      link.href = `${this.repoUrl}/blob/${this.headSha}/${pos.path}#L${pos.line}`;
      link.innerHTML = `${pos.path}#L${pos.line}`;
      const name = declarationItem.querySelector('.name');
      name.innerHTML = pos.name;

      codeItem.appendChild(declarationItem);
      declarationList.appendChild(codeItem);
    }

    this.codeList.appendChild(declarationList);
  }
}
