import fs from 'fs';

const jsonPath = process.argv[2] || './data/report.json';
const repoUrl = process.argv[3] || 'https://github.com/owner/repo';
const headSha = process.argv[4] || '';

const template = fs.readFileSync('./templates/index.html');
const report = fs.readFileSync(jsonPath);
let html = template.toString();
html = html.replace('{{report}}', report);
html = html.replace('{{repoUrl}}', repoUrl);
html = html.replace('{{headSha}}', headSha);
fs.writeFileSync('./index.html', html);
