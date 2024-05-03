import fs from 'fs';

const jsonPath = process.env.npm_config_ingapath;
const repoUrl = process.env.npm_config_ingaurl || 'https://github.com/owner/repo';
const headSha = process.env.npm_config_ingasha || '';
const prNumber = process.env.npm_config_inganumber || '';

const template = fs.readFileSync('./templates/index.html');
const report = jsonPath ? fs.readFileSync(jsonPath) : '[]';
let html = template.toString();
html = html.replace('{{report}}', report);
html = html.replace('{{repoUrl}}', repoUrl);
html = html.replace('{{headSha}}', headSha);
html = html.replace('{{prNumber}}', prNumber);
fs.writeFileSync('./index.html', html);
