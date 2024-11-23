import { install } from '@twind/core';
import config from './twind.config';
import FileTree from './components/FileTree.js';
import PopupList from './components/PopupList.js';
import ServiceGraph from './components/ServiceGraph.js';
import SettingsPopup from './components/SettingsPopup.js';
import TreeItem from './components/TreeItem.js';
import graph from './core/graph.js';
import sort, { fileType } from './core/sort.js';
import { selectState } from './core/state.js';

install(config);

window.customElements.define('file-tree', FileTree);
window.customElements.define('popup-list', PopupList);
window.customElements.define('service-graph', ServiceGraph);
window.customElements.define('settings-popup', SettingsPopup);
window.customElements.define('tree-item', TreeItem);

const supportedReportVersion = '0.2';
const supportedReportErrorVersion = '0.1';
const repoUrl = window.inga_repo_url;
const headSha = window.inga_head_sha;
const prNumber = window.inga_pr_number;
const connectionNoCaller = '(no caller)';
let report = window.inga_report;
let reportHash = '';
let reportError = {};
let reportErrorHash = '';
let state = {};
let stateHash = '';
let entrypointTree = [];
let selectedFileIndex = 0;
let enableSync = false;

const urlParams = new URLSearchParams(window.location.search);
const wsPort = urlParams.get('wsPort');
let webSocket;
let callerHints = [];
let connectionTarget;

function connectWebSocket() {
  webSocket = new WebSocket(`ws://localhost:${wsPort}`);

  webSocket.addEventListener('message', (json) => {
    const msg = JSON.parse(json.data);
    switch (msg.method) {
      case 'getConnectionPaths': {
        const items = msg.modulePaths.map((p) => ({
          name: p,
          active: msg.callerHint?.map((c) => c.path).includes(p) || false,
        }));
        items.unshift({
          name: connectionNoCaller,
          active: msg.callerHint ? msg.callerHint.length === 0 : false,
        });
        document.querySelector('#connection-selector')?.setAttribute('items', JSON.stringify(items));
        break;
      }
      case 'getCallerHints':
        callerHints = msg.callerHints;
        document.querySelector('#service-graph')
          .setAttribute('callerhints', JSON.stringify(msg.callerHints));
        break;
      default:
    }
  });

  webSocket.addEventListener('open', () => {
    webSocket?.send(JSON.stringify({
      method: 'getCallerHints',
    }));
  });

  webSocket.addEventListener('close', () => {
    setTimeout(connectWebSocket, 10000);
  });

  webSocket.addEventListener('error', () => {
    webSocket.close();
  });
}

async function loadReport() {
  const response = await fetch('report/report.json', { cache: 'no-cache' });
  if (!response.ok) {
    return {};
  }
  const obj = await response.json();
  if (obj.version !== supportedReportVersion) {
    return {};
  }
  return obj;
}

async function loadError() {
  const response = await fetch('report/error.json', { cache: 'no-cache' });
  if (!response.ok) {
    return [];
  }
  const obj = await response.json();
  if (obj.version !== supportedReportErrorVersion) {
    return [];
  }
  return obj;
}

async function loadState() {
  const response = await fetch('report/state.json', { cache: 'no-cache' });
  if (!response.ok) {
    return {};
  }
  return response.json();
}

function filterSearchingKeys(results) {
  return results
    .filter((r) => r.type === 'searching')
    .map((r) => graph.getPosKey(r.entrypoint ? r.entrypoint : r.origin));
}

function reload(reportObj) {
  const results = reportObj?.results || [];
  const uniqueKeys = new Set();
  const flatResults = results
    .flatMap((r) => r)
    .filter((r) => {
      const key = `${graph.getPosKey(r.entrypoint)}_${graph.getPosKey(r.origin)}`;
      const isUnique = !uniqueKeys.has(key);
      uniqueKeys.add(key);
      return isUnique;
    });

  entrypointTree = sort.getFilePoss(flatResults
    .filter((p) => p.type === 'entrypoint'));
  const graphsByDefinition = results.map((r) => graph.create(r));
  const filesChangedKeys = new Set(graphsByDefinition
    .flatMap((g) => graph.findLeafPoss(g).map((p) => graph.getPosKey(p))));
  const graphs = graph.create(flatResults);
  selectedFileIndex = entrypointTree.findIndex((p) => p.type === fileType.FILE);

  document.querySelector('#app').innerHTML = `
    <div class="absolute flex w-full h-full">
      <button id="refresh-button" class="flex items-center fixed mt-2 z-50 inset-x-0 max-w-max mx-auto bg-blue-500 text-white rounded-full px-3 py-1 hidden">
        <div class="fill-white mr-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"></path></svg>
        </div>
        Refresh
      </button>
      <div id="entrypoint-nav" class="overflow-y-auto truncate w-72 bg-white">
        <div class="flex items-center">
          <span class="text-clip m-2 text-ms text-gray-500">Impacted entrypoints</span>
        </div>
        <file-tree id="entrypoint-tree" src=${JSON.stringify(entrypointTree)} repourl="${repoUrl}" headsha="${headSha}" defaultindex="${selectedFileIndex}"></file-tree>
      </div>
      <div id="separator" class="cursor-col-resize border-1 hover:border-green"></div>
      <button id="settings-button" class="fixed z-50 right-2 top-2 hover:bg-gray-100 rounded-md border-1" title="Settings">
        <div class="fill-gray-500 m-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path></svg>
        </div>
      </button>
      <settings-popup id="settings-popup" class="absolute z-40"></settings-popup>
      <service-graph id="service-graph" class="flex-1 overflow-auto bg-gray-100" src=${JSON.stringify(graphs)} errors=${JSON.stringify(reportError.errors || [])} callerhints=${JSON.stringify(callerHints)} fileschangedkeys=${JSON.stringify([...filesChangedKeys])} searchingkeys=${JSON.stringify(filterSearchingKeys(flatResults))} state=${JSON.stringify(state)} enablesync="${enableSync}" repourl="${repoUrl}" prnumber="${prNumber}"></service-graph>
      <popup-list id="connection-selector" class="absolute hidden z-40" title="Add caller hint"></popup-list>
    </div>
  `;

  const entrypointNav = document.querySelector('#entrypoint-nav');
  const entrypointTreeView = document.querySelector('#entrypoint-tree');
  const separator = document.querySelector('#separator');
  const serviceGraph = document.querySelector('#service-graph');
  const settingsPopup = document.querySelector('#settings-popup');
  const connectionSelector = document.querySelector('#connection-selector');

  entrypointTreeView.addEventListener('itemselect', (e) => {
    serviceGraph.setAttribute(
      'entrypointselect',
      JSON.stringify({
        state: e.detail.state,
        posKey: graph.getPosKey(entrypointTree[e.detail.fileIndex]
          .declarations[e.detail.declarationIndex]),
      }),
    );
  });

  serviceGraph.onStateChanged = (s) => {
    enableSync = s === selectState.SELECT;
    if (s === selectState.SELECT) {
      initLoad();
    } else {
      state = {};
      stateHash = '';
    }
  };
  serviceGraph.onConnectionPressed = (target, dom) => {
    connectionTarget = target;
    webSocket?.send(JSON.stringify({
      method: 'getConnectionPaths',
      serverPath: connectionTarget,
    }));
    connectionSelector.style.left = `${dom.getBoundingClientRect().left}px`;
    connectionSelector.style.top = `${dom.getBoundingClientRect().bottom}px`;
    connectionSelector.classList.remove('hidden');
  };
  serviceGraph.onDeclarationPressed = (dec) => {
    webSocket?.send(JSON.stringify({
      method: 'openFile',
      path: dec.path,
      line: dec.line,
      offset: dec.offset,
    }));
  };

  connectionSelector.onClose = (items) => {
    if (connectionTarget) {
      let clientPaths = [];
      if (!items.find((i) => i.name === connectionNoCaller)) {
        clientPaths = items.map((i) => i.name);
        if (clientPaths.length === 0) {
          clientPaths = null;
        }
      }
      webSocket?.send(JSON.stringify({
        method: 'addConnectionPaths',
        serverPath: connectionTarget,
        clientPaths,
      }));
      webSocket?.send(JSON.stringify({
        method: 'getCallerHints',
      }));
      connectionTarget = null;
    }
    connectionSelector.classList.add('hidden');
  };

  separator.addEventListener('mousedown', () => {
    const risizeSeperator = (e) => {
      entrypointNav.style.flexBasis = `${e.clientX}px`;
    };

    document.addEventListener('mousemove', risizeSeperator);
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', risizeSeperator);
    });
  });

  settingsPopup.onClose = () => settingsPopup.close();

  document.querySelector('#settings-button').addEventListener('click', (e) => {
    settingsPopup.style.right = '10px';
    settingsPopup.style.top = `${e.currentTarget.getBoundingClientRect().bottom + 5}px`;
    settingsPopup.open();
    e.stopPropagation();
  });

  document.querySelector('#refresh-button').addEventListener('click', () => {
    reload(report);
    document.querySelector('#refresh-button').classList.add('hidden');
  });

  if (wsPort) {
    connectWebSocket();
  }
}

async function digest(msg) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function initLoad() {
  if (repoUrl.length === 0) {
    [report, reportError] = await Promise.all([loadReport(), loadError()]);
  }
  reportHash = await digest(JSON.stringify(report));
  reportErrorHash = await digest(JSON.stringify(reportError));
  reload(report);

  if (enableSync) {
    state = await loadState();
    stateHash = await digest(JSON.stringify(state));
    document.querySelector('#service-graph')
      .setAttribute('state', JSON.stringify(state));
  }
}

initLoad();

if (repoUrl.length === 0) {
  setInterval(async () => {
    const [reportObj, errorObj] = await Promise.all([loadReport(), loadError()]);

    const newReportHash = await digest(JSON.stringify(reportObj));
    if (newReportHash !== reportHash) {
      report = reportObj;
      reportHash = newReportHash;
      if (enableSync) {
        reload(report);
        document.querySelector('#refresh-button').classList.add('hidden');
        state = {};
        stateHash = '';
      } else {
        document.querySelector('#refresh-button').classList.remove('hidden');
      }
    }

    const newReportErrorHash = await digest(JSON.stringify(errorObj));
    if (newReportErrorHash !== reportErrorHash) {
      reportError = errorObj;
      reportErrorHash = newReportErrorHash;
      document.querySelector('#service-graph')
        .setAttribute('errors', JSON.stringify(reportError.errors));
    }

    if (enableSync) {
      const stateObj = await loadState();
      const newStateHash = await digest(JSON.stringify(stateObj));
      if (newStateHash !== stateHash) {
        state = stateObj;
        stateHash = newStateHash;
        document.querySelector('#service-graph')
          .setAttribute('state', JSON.stringify(state));
      }
    }
  }, 1000);
}
