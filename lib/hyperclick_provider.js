'use babel';

import path from 'path';

const SCOPE_NAMES = ['source.ruby', 'source.ruby.rails', 'text.haml', 'text.html.ruby'];
const SELECTOR_DISABLE = ['.comment', '.string'];

const METHOD_REGEXP = /^(\w+)_(?:path|url)$/;

const open = async (controller, action) => {
  // TODO: multiple folder project
  const controllerPath = path.join(
    atom.project.getPaths()[0],
    'app',
    'controllers',
    `${controller}_controller.rb`,
  );

  const editor = await atom.workspace.open(controllerPath);
  editor.scan(new RegExp(`^ *def\\s+${action}\\s*$`), ({ range: { start }, stop }) => {
    stop();
    editor.setCursorBufferPosition(start);
    editor.scrollToCursorPosition();
  });
};

export default class HyperclickProvider {
  constructor(routes) {
    this.routes = routes;
    this.priority = 1;
  }

  getSuggestionForWord(editor, text, range) {
    const matches = text.match(METHOD_REGEXP);
    if (!matches) {
      return null;
    }

    const { scopeName } = editor.getGrammar();
    if (!SCOPE_NAMES.includes(scopeName)) {
      return null;
    }

    const scopeChain = editor.scopeDescriptorForBufferPosition(range.start).getScopeChain();
    const found = SELECTOR_DISABLE.some(selector => scopeChain.includes(selector));
    if (found) return null;

    const [, prefix] = matches;
    const route = this.routes.get(prefix);
    if (!route) {
      return null;
    }

    if (route.actions.size === 1) {
      return {
        callback: () => {
          open(route.controller, Array.from(route.actions)[0]);
        },
        range,
      };
    }

    const callback = Array.from(route.actions).map(action => ({
      title: action,
      rightLabel: `${route.controller}#${action}`,
      callback: () => {
        open(route.controller, action);
      },
    }));
    return { callback, range };
  }
}
