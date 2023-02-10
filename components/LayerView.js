import { create, cssomSheet } from 'twind';

const sheet = cssomSheet({ target: new CSSStyleSheet() })
const { tw } = create({ sheet });

export default class LayerView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [sheet.target];
    this.shadowRoot.innerHTML = `
      <span class="${tw`text-3xl font-bold underline`}">
        Hello!
      </span>
    `;
  }
}
