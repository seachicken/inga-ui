import { install } from '@twind/core';
import config from './twind.config';
import FileTree from './components/FileTree.js';
import ServiceGraph from './components/ServiceGraph.js';
import TreeItem from './components/TreeItem.js';
import graph from './core/graph.js';
import sort, { fileType } from './core/sort.js';
import { selectState } from './core/state.js';

install(config);

window.customElements.define('file-tree', FileTree);
window.customElements.define('service-graph', ServiceGraph);
window.customElements.define('tree-item', TreeItem);

const supportedReportVersion = '0.2';
const supportedReportErrorVersion = '0.1';
const repoUrl = window.inga_repo_url;
const headSha = window.inga_head_sha;
const prNumber = window.inga_pr_number;
let report = window.inga_report;
let reportHash = '';
let reportError = {};
let reportErrorHash = '';
let state = {};
let stateHash = '';
let entrypointTree = [];
let selectedFileIndex = 0;
let enableSync = false;

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
      <service-graph id="service-graph" class="flex-1 overflow-auto bg-gray-100" src=${JSON.stringify(graphs)} errors=${JSON.stringify(reportError.errors || [])} fileschangedkeys=${JSON.stringify([...filesChangedKeys])} searchingkeys=${JSON.stringify(filterSearchingKeys(flatResults))} state=${JSON.stringify(state)} enablesync="${enableSync}" repourl="${repoUrl}" prnumber="${prNumber}"></service-graph>
    </div>
  `;

  const entrypointNav = document.querySelector('#entrypoint-nav');
  const entrypointTreeView = document.querySelector('#entrypoint-tree');
  const separator = document.querySelector('#separator');
  const serviceGraph = document.querySelector('#service-graph');

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

  separator.addEventListener('mousedown', () => {
    const risizeSeperator = (e) => {
      entrypointNav.style.flexBasis = `${e.clientX}px`;
    };

    document.addEventListener('mousemove', risizeSeperator);
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', risizeSeperator);
    });
  });

  document.querySelector('#refresh-button').addEventListener('click', () => {
    reload(report);
    document.querySelector('#refresh-button').classList.add('hidden');
  });
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
