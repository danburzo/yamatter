#!/usr/bin/env node
import opsh from 'opsh';
import fg from 'fast-glob';
import { writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse, transform, toYAML, serialize } from './index.js';

const args = opsh(process.argv.slice(2), ['h', 'help', 'w', 'write']);

if (args.options.h || args.options.help) {
	printHelp();
	process.exit();
}

const transformer = args.options.transform || args.options.t;
const transformFn = transformer ? 
	(await import(resolve(transformer))).default : 
	v => v; 

if (typeof transformFn !== 'function') {
	throw new Error(
		`The default export in ${transformer} is not a function.`
	);
}

const YAML_DEFAULTS = {
	'lineWidth': -1
};

const yamlOptions = Object.keys(args.options).reduce((obj, k) => {
	const m = k.match(/^yaml\.(.+)/);
	if (m) obj[m[1]] = args.options[k];
	return obj;
}, YAML_DEFAULTS);

fg(args.operands).then(entries => {
	entries.forEach(async filepath => {
		const content = await readFile(filepath, 'utf8');
		const parsed = parse(content, filepath);
		if (parsed) {
			parsed.yaml = toYAML(
				await transform(parsed, transformFn), 
				yamlOptions
			);
			if (args.options.write || args.options.w) {
				writeFile(filepath, serialize(parsed));
			} else {
				console.log('\x1b[36m%s:\x1b[0m', filepath);
				console.log(parsed.yaml);
			}
		} else {
			console.log('\x1b[36mSKIP %s\x1b[0m', filepath);
		}
	});
});

function printHelp() {
	console.log(`yamatter: transform YAML frontmatter

Usage:
	
	yamatter <options> [pattern_1] [pattern_2] [pattern_3]...

Options:

	-h, --help
		Print out this help information.

	-w, --write
		Write the result back to the source file.

	-t <file>, --transform=<file>
		Path to a JS module whose default export is a transform function.

	--yaml.<option>=<value>
		Pass options to the YAML engine (js-yaml).
`);
}