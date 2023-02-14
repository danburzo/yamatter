import { load, dump } from 'js-yaml';

export function parse(content, delim = /(^-{3,}$)/m) {
	const [whitespace, delimiter, frontmatter, ...after] = content.split(delim);
	if (!whitespace.trim() && after.length > 1) {
		return {
			frontmatter,
			data: load(frontmatter),
			before: [whitespace, delimiter],
			after
		};
	}
	return null;
}

export async function transform(parsed, transformFn) {
	return await transformFn(parsed.data, parsed.filepath) ?? parsed.data;
}

export function toYAML(data, yamlOptions) {
	return '\n' + dump(data, yamlOptions);
}

export function serialize(parsed) {
	return [...parsed.before, parsed.yaml, ...parsed.after].join('');
}