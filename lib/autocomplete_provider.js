'use babel';

const SELECTOR = ['.source.ruby'];
const SELECTOR_DISABLE = ['.comment', '.string'];

const LINE_REGEXP = /(?:link_to|redirect_to|url:\s+)/;

const buildSnippet = (prefix, params) => {
  if (params.length < 1) return null;
  const args = params.map((param, index) => `\${${index + 1}:${param}}`);
  return `${prefix}_path(${args.join(', ')})`;
};

export default class AutocompleteProvider {
  constructor(routes) {
    this.routes = routes;

    this.selector = SELECTOR.join(', ');
    this.disableForSelector = SELECTOR_DISABLE.join(', ');
    this.filterSuggestions = true;
    this.suggestionPriority = 1;
  }

  getSuggestions({ bufferPosition, editor }) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    const matches = line.match(LINE_REGEXP);
    if (!matches) {
      return [];
    }

    return this.buildSuggestions();
  }

  buildSuggestions() {
    const suggestions = [];

    this.routes.getAll().forEach(({ url, actions, params, controller }, prefix) => {
      const suggestion = {
        text: `${prefix}_path`,
        snippet: buildSnippet(prefix, params),
        type: 'function',
        rightLabel: url,
        description: Array.from(actions).map(action => [controller, action].join('#')).join(', '),
      };
      suggestions.push(suggestion);
    });

    return suggestions;
  }
}
