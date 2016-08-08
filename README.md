# Flow for Visual Studio Code

![https://i.imgur.com/4rNERMs.png](https://i.imgur.com/4rNERMs.png)

This extension adds [Flow](http://flowtype.org) support for VS Code. Flow is a static type checker, designed to find type errors in JavaScript programs.

## Setup
* add `"flow.path": "path/to/flow"` to your project's `.vscode/settings.json`
* You need a `.flowconfig` in your workspace to enable the flow features
* Make sure you are able to run the `flow` command from the command line
* Set workspace preference with `"javascript.validate.enable": false`.

## Installation

Follow the [instructions](https://code.visualstudio.com/docs/editor/extension-gallery) for VS Code extension installation.


## Workspace settings

flow comes bundled with this extention. if you would like to use 
a different version of flow, use `"flow.path": "/path/to/wher/you/put/flow"` in your `.vscode/settings.json` file.

## Features

* Syntax Coloring
* IntelliSense
* Go to Definition / Peek Definition
* Diagnostics (Errors, Warnings)


## Known Issues

* You should set workspace preference to disable default syntax validation from Visual Studio Code: `"javascript.validate.enable": false`.

## Contributing

* please refer to [CONTRIBUTING.md](CONTRIBUTING.md)

## License
[See here](LICENSE)
