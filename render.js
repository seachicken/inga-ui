import fs from 'fs';

const jsonPath = process.env.npm_config_ingapath || './data/report.json';
const repoUrl = process.env.npm_config_ingaurl || 'https://github.com/owner/repo';
const headSha = process.env.npm_config_ingasha || '';

const template = fs.readFileSync('./templates/index.html');
const report = fs.readFileSync(jsonPath);
let html = template.toString();
html = html.replace('{{report}}', report);
html = html.replace('{{repoUrl}}', repoUrl);
html = html.replace('{{headSha}}', headSha);
fs.writeFileSync('./index.html', html);
