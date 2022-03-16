# Contributing to FormulaParser

Your contributions to the project are very welcome. If you would like to fix a bug or propose a new feature, you can submit a Pull Request.

To help us merge your Pull Request, please make sure you follow these points:

1. Please make sure that you're using the NodeJS in the proper version. The project requires version 10.
2. Make your fix on a separate branch based on `develop` branch. This makes merging much easier.
3. Do not edit files in `dist/` directory (e.g: `formula-parser.js`, `formula-parser.min.js`). Instead, edit files inside the `src/` directory and then use `gulp` or `npm scripts` to make a build.
4. **Very important:** For any change that you make, **please try to also add a test case(s)** in `tests/unit/` or `test/integration/`. This helps us understand the issue and make sure that it will stay fixed forever.
5. Describe the problem in the Pull Request description (of course you would do it, why do I mention that?).
6. **Very important:** Make Pull Request ready to merge into `develop` branch.

Thank you for your commitment!

## Team rules

The Handsontable team utilizes Git-Flow. See [How we use Git-Flow](https://github.com/handsontable/handsontable/wiki/How-we-use-Git-Flow)
