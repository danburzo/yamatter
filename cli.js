#!/usr/bin/env node
import opsh from 'opsh';
import fg from 'fast-glob';
import { writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse, transform, toYAML, serialize } from './index.js';

const args = opsh(
	process.argv.slice(2), 
	// Boolean options
	['h', 'help', 'w', 'write', 'no-ignore']
);

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


let fgOptions = {};

/*
	Ignore patterns based on .gitignore rules,
	unless the `--no-ignore` option has been used.
 */
if (!args.options['no-ignore']) {
	try {
		fgOptions.ignore = (await readFile('.gitignore', 'utf8'))
			.split('\n')
			.filter(line => line.trim() && !line.match(/^#/))
			.map(pattern => {
				/*
					Make .gitignore pattern glob-compatible.
					Each pattern matches itself (in case of files)
					or descendant files.
				 */
				return [
					pattern.trim(), 
					`${pattern.trim().replace(/\/$/, '')}/**`
				];
			})
			.flat();
	} catch(err) {};
}

fg(args.operands, fgOptions).then(entries => {
	entries.forEach(async filepath => {
		const content = await readFile(filepath, 'utf8');
		const parsed = parse(content);
		if (parsed) {
			parsed.filepath = filepath;
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

	--no-ignore
		Don't ignore files from .gitignore.
`);
}