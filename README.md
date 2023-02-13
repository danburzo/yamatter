Yamatter is a command-line tool to inspect and transform YAML front-matter data  using [`js-yaml`](https://github.com/nodeca/js-yaml).

## Installation

Install `yamatter` globally with `npm`:

```bash
npm install -g yamatter
```

Run `yamatter` without installing it with `npx`:

```bash
npx yamatter
```

## Usage

```bash
yamatter [OPTIONS] [PATTERN ...]
```

### Operands

The `yamatter` command accepts one or more glob patterns to match the files from which to read front-matter data. 

The patterns are expanded by [`fast-glob`](https://github.com/mrmlnc/fast-glob). In order for the glob patterns to be expanded with `fast-glob` and not the shell that runs the command (e.g. `sh`, `bash`, `zsh`), make sure pass them enclosed in quotes:

```bash
yamatter 'content/**/*.md' 'notes/*.md'
```

`yamatter` looks for lines beginning with three or more hyphens (`---`) as the delimiter for front-matter data. Any matching files without front-matter data delimiters are ignored. 

### Options

#### `-t <file>, --transform=<file>`

Point to a JavaScript module, relative to the current working directory, that performs a transformation on the front-matter data. 

The module must export a function that receives these arguments:

* `data`: a JSON object corresponding to the original front-matter data
* `filepath`: the source file path, relative to the current working directory

You can alter `data` directly, or return a new object in its place.

```bash
yamatter '*.md' -t to-uppercase.js
```

__to-uppercase.js__:

```js
module.exports = function(data, filepath) {
	data.title = data.title.toUpperCase();
};
```

#### `-w, --write`

Write the result of the transformation back to the file.

__Pro tip:__ Since this has the potential to be destructive, it is recommended that you run any `yamatter --write` commands in a folder that's managed by a source control system such as Git, with any pending changes committed. This makes it easy to revert the files back to their original content.

#### `--yaml.<option>=<value>`

Pass serialization options to [`js-yaml`](https://github.com/nodeca/js-yaml)'s `dump()` method. These options are passed by default:

```json
{
	"lineWidth": -1
}
```

## See also

* [mikefarah/yq](https://github.com/mikefarah/yq)
* [dbohdan/structured-text-tools](https://github.com/dbohdan/structured-text-tools)