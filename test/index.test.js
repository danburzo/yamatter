import tape from 'tape';
import { parse, toYAML, serialize } from '../index.js';
import { readFile } from 'node:fs/promises';

const no_content = readFile('test/fixtures/no-content.md', 'utf8');
const no_newline = readFile('test/fixtures/no-newline.md', 'utf8');
const with_content = readFile('test/fixtures/with-content.md', 'utf8');
const whitespace_before = readFile('test/fixtures/whitespace-before.md', 'utf8');

tape('parsing', async t => {
	t.deepEqual(
		parse(await no_content),
		{
			frontmatter: '\nhello: world\n',
			before: '',
			data: {
				hello: 'world'
			},
			after: [ '\n' ]
		},
		'no content'
	);

	t.deepEqual(
		parse(await no_newline),
		{
			frontmatter: '\nhello: world\n',
			before: '',
			data: {
				hello: 'world'
			},
			after: [ '' ]
		},
		'no newline after frontmatter'
	);

	t.deepEqual(
		parse(await whitespace_before),
		{
			frontmatter: '\nhello: world\n',
			before: '\n',
			data: {
				hello: 'world'
			},
			after: [ '' ]
		},
		'whitespace before frontmatter'
	);

	t.deepEqual(
		parse(await with_content),
		{
			frontmatter: '\nhello: world\n',
			before: '',
			data: {
				hello: 'world'
			},
			after: [ '\nWelcome to my blog!' ]
		},
		'with content'
	);

	t.end();
});

tape('end to end', async t => {
	(await Promise.all([
		await no_content,
		await with_content,
		await no_newline,
		await whitespace_before
	])).map(content => {
		const parsed = parse(content);
		parsed.yaml = toYAML(parsed.data);
		t.equal(serialize(parsed), content);
	});

	t.end();
});