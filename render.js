import Mustache from 'mustache';
import fs from 'fs';

const template = fs.readFileSync('./templates/index.html');
const report = fs.readFileSync('./data/report.json');
const html = Mustache.render(template.toString(), report);
fs.writeFileSync('./index.html', html);
