import test from 'node:test';
import assert from 'node:assert';
import { readFile } from 'node:fs/promises';

import { parse, toYAML, serialize } from '../index.js';

const no_content = readFile('test/fixtures/no-content.md', 'utf8');
const no_newline = readFile('test/fixtures/no-newline.md', 'utf8');
const with_content = readFile('test/fixtures/with-content.md', 'utf8');
const whitespace_before = readFile('test/fixtures/whitespace-before.md', 'utf8');
const empty_frontmatter = readFile('test/fixtures/empty-frontmatter.md', 'utf8');
const delim_more_dashes = readFile('test/fixtures/delim-more-dashes.md', 'utf8');
const content_before = readFile('test/fixtures/content-before.md', 'utf8');
const no_frontmatter = readFile('test/fixtures/no-frontmatter.md', 'utf8');

test('parsing', async t => {
	assert.deepEqual(
		parse(await no_content),
		{
			frontmatter: '\nhello: world\n',
			before: ['', '---'],
			data: {
				hello: 'world'
			},
			after: [ '---', '\n' ]
		},
		'no content'
	);

	assert.deepEqual(
		parse(await no_newline),
		{
			frontmatter: '\nhello: world\n',
			before: ['', '---'],
			data: {
				hello: 'world'
			},
			after: [ '---', '' ]
		},
		'no newline after frontmatter'
	);

	assert.deepEqual(
		parse(await whitespace_before),
		{
			frontmatter: '\nhello: world\n',
			before: ['\n', '---'],
			data: {
				hello: 'world'
			},
			after: [ '---', '' ]
		},
		'whitespace before frontmatter'
	);

	assert.deepEqual(
		parse(await with_content),
		{
			frontmatter: '\nhello: world\n',
			before: ['', '---'],
			data: {
				hello: 'world'
			},
			after: [ '---', '\nWelcome to my blog!' ]
		},
		'with content'
	);

	assert.deepEqual(
		parse(await empty_frontmatter),
		{
			frontmatter: '\n',
			before: ['', '---'],
			data: undefined,
			after: [ '---', '' ]
		},
		'with content'
	);

	assert.deepEqual(
		parse(await delim_more_dashes),
		{
			frontmatter: '\ntitle: Hello World\n',
			before: ['', '----'],
			data: { title: 'Hello World' },
			after: [ '----', '\n\nHello content.' ]
		},
		'with content'
	);

	assert.equal(parse(await no_frontmatter), null, 'no frontmatter');
	assert.equal(parse(await content_before), null, 'content before frontmatter');
});

test('parse + serialize does not change content', async t => {
	(await Promise.all([
		await no_content,
		await with_content,
		await no_newline,
		await whitespace_before,
		await empty_frontmatter,
		await delim_more_dashes
	])).map(content => {
		const parsed = parse(content);
		parsed.transformed = toYAML(parsed.data);
		assert.equal(serialize(parsed), content);
	});
});