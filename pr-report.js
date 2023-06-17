import { print } from './core/report.js';

const jsonPath = process.env.npm_config_ingapath || './data/report.json';
const repoUrl = process.env.npm_config_ingaurl || 'https://github.com/owner/repo';
const headSha = process.env.npm_config_ingasha || '';

process.stdout.write(print(jsonPath, repoUrl, headSha));
