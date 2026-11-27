import { load, dump } from 'js-yaml';

export function parse(content, delim = /(^-{3,}$)/m) {
	const [whitespace, delimiter, frontmatter, ...after] = content.split(delim);
	if (!whitespace.trim() && after.length > 1) {
		let data = undefined;
		try { data = load(frontmatter); } catch(err) {}
		return {
			frontmatter,
			data,
			before: [whitespace, delimiter],
			after
		};
	}
	// if unsuccessful, try to parse the entire content as YAML
	try {
		return {
			frontmatter: content,
			data: load(content),
			before: [],
			after: []
		}
	} catch(err) {}
	return null;
}

export async function transform(parsed, transformFn) {
	return await transformFn(parsed.data, parsed.filepath) ?? parsed.data;
}

export function toYAML(data, yamlOptions) {
	return '\n' + dump(data, yamlOptions);
}

// Based on: https://github.com/getkirby/kirby/blob/main/src/Data/Txt.php
export function parseKirby(content = '') {
	const data = {};
	content.split(/\n----\s*\n*/).forEach(field => {
		let [_, key, value] = field.match(/\s*([^:]+?)\s*:(.*)/su) ?? [];
		if (!key) {
			return;
		}
		data[key
			.toLowerCase()
			.replace(/[ -]/g, '_')
		] = value.trim().replace(/(\n|^)\\\\----/, '----');
	});
	return {
		frontmatter: content,
		data,
		before: [],
		after: []
	}
}

export function serializeKirby(data = {}) {
	return Object.entries(data)
		.filter(entry => entry[0] && entry[1])
		.map(entry => {
			const value = (Array.isArray(entry[1]) ? dump(entry[1]) : entry[1] + '')
				.replace(/(?:\n|^)----/g, '\\----')
				.trim();
			const key = cap(slugify(entry[0]));
			return key + (value.indexOf('\n') > -1 ? ':\n\n' : ': ') + value;
		})
		.join("\n\n----\n\n");
}

export function serialize(parsed) {
	return [...parsed.before, parsed.transformed, ...parsed.after].join('');
}


// https://danburzo.ro/snippets/slugify/
function slugify(str = '') {
	return str
		.trim()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^\-)|(\-$)/g, '');
}

function cap(str = '') {
	return str[0].toUpperCase() + str.slice(1);
}