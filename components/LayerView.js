import { create, cssomSheet } from 'twind';

const sheet = cssomSheet({ target: new CSSStyleSheet() });
const { tw } = create({ sheet });

export default class LayerView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet.target];
    this.shadowRoot.innerHTML = `
      <ul id="code-list" class="${tw`h-full px-5 border-r`}">
      </ul>

      <template id="code-item">
        <li class="item ${tw`w-80 my-2 p-2 border truncate hover:bg-gray-100`}">
          <div class="name"></div>
          <a class="link ${tw`text-xs text-blue-500 underline`}"></a>
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

    for (let i = 0; i < this.parsedOrigins.length; i += 1) {
      const pos = this.parsedOrigins[i];
      const codeItem = document.importNode(this.codeItemTemplate.content, true);
      const item = codeItem.querySelector('.item');
      const selectStyle = tw('bg-gray-100');
      if (i === 0) {
        item.classList.add(selectStyle);
      }
      item.addEventListener('click', () => {
        this.selectedIndex = i;
        this.codeList.querySelectorAll('.item')
          .forEach((it) => it.classList.remove(selectStyle));
        item.classList.add(selectStyle);
        this.dispatchEvent(new CustomEvent('itemselect', {
          bubbles: true,
          composed: true,
          detail: { index: i },
        }));
      });
      const link = codeItem.querySelector('.link');
      link.href = `${this.repoUrl}/blob/${this.headSha}/${pos.path}#L${pos.line}`;
      link.innerHTML = `${pos.path}#L${pos.line}`;
      const name = codeItem.querySelector('.name');
      name.innerHTML = `${pos.path.split('/').splice(-1)[0].split('.')[0]}.${pos.name}`;
      this.codeList.appendChild(codeItem);
    }
  }
}
