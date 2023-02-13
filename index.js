import { load, dump } from 'js-yaml';

/*
	Delimiter: three or more lines, optional whitespace afterwards
 */
const DELIMITER = /^-{3,}$/m;

export function parse(content, filepath) {
	const parts = content.split(DELIMITER);
	if (parts.length >= 2) {
		const [before, frontmatter, ...after] = parts;
		const res = {
			frontmatter,
			data: load(frontmatter),
			before,
			after
		};
		if (filepath) {
			res.filepath = filepath;
		}
		return res;
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
	return [parsed.before, parsed.yaml, ...parsed.after].join('---');
}