#!/usr/bin/env node

import opsh from 'opsh';
import fg from 'fast-glob';
import { load, dump } from 'js-yaml';

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = opsh(process.argv.slice(2), ['h', 'help']);

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

/*
	Delimiter: three or more lines, optional whitespace afterwards
 */
const DELIMITER = /^-{3,}\s*$/m;

fg(args.operands).then(entries => {
	entries.forEach(async filepath => {
		const content = (await readFile(filepath, 'utf8')).split(DELIMITER);
		if (content.length >= 2) {
			// Has front-matter
			const [_, frontmatter, ...markdown] = content;
			const data = load(frontmatter);
			const res = dump(await transformFn(data));
			console.log(res);
		}
	});
});

function printHelp() {
	console.log(`frontmatter.js: Transform YAML frontmatter

Options:

-h, --help         Print out this help information.

-t, --transform    Path to a JS module whose default export 
                   is a transform function.
-w, --write        Write the result back to the source file.`);
}