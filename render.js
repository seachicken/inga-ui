import Mustache from 'mustache';
import fs from 'fs';

const jsonPath = process.argv[2] ? process.argv[2] : './data/report.json'
const report = fs.readFileSync(jsonPath);

const template = fs.readFileSync('./templates/index.html');
const html = Mustache.render(template.toString(), report);
fs.writeFileSync('./index.html', html);
