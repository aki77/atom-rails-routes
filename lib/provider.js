'use babel';

const SELECTOR = ['.source.ruby'];
const SELECTOR_DISABLE = ['.comment', '.string'];

const LINE_REGEXP = /(?:link_to|redirect_to|url:\s+)/;

export default class Provider {
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

    return this.generateSuggestions();
  }

  generateSuggestions() {
    const suggestions = [];

    this.routes.getAll().forEach(({ methods, actions }, prefix) => {
      const suggestion = {
        text: `${prefix}_path`,
        type: 'function',
        rightLabel: Array.from(methods).join(', '),
        description: Array.from(actions).join(', '),
      };
      suggestions.push(suggestion);
    });

    return suggestions;
  }
}
