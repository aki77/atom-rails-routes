'use babel';

import path from 'path';
import fuzzaldrinPlus from 'fuzzaldrin-plus';
import sortBy from 'lodash.sortby';

const SELECTOR = ['.source.ruby'];
const SELECTOR_DISABLE = ['.comment', '.string', '.variable', '.constant', '.punctuation'];

const LINE_REGEXP = /(?:link_to|redirect_to|url:\s+)/;

const buildSnippet = (method, params) => {
  if (params.length < 1) return null;
  const args = params.map((param, index) => `\${${index + 1}:${param}}`);
  return `${method}(${args.join(', ')})\${${params.length + 1}}`;
};

const matchScore = (controller1, controller2) => {
  const parts1 = controller1.split('/');
  const parts2 = controller2.split('/');

  let score = 0;
  parts1.some((part, index) => {
    if (part === parts2[index]) {
      score += 1;
      return false;
    }
    return true;
  });

  return score;
};

const getCurrentController = (editor) => {
  const [, projectRelativePath] = atom.project.relativizePath(path.dirname(editor.getPath()));
  return projectRelativePath.replace(/app\/(?:controllers|views)\//, '');
};

export default class AutocompleteProvider {
  constructor(routes) {
    this.routes = routes;

    this.selector = SELECTOR.join(', ');
    this.disableForSelector = SELECTOR_DISABLE.join(', ');
    this.suggestionPriority = 1;
  }

  getSuggestions({ bufferPosition, editor, prefix }) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    if (prefix.length === 0 || !line.match(LINE_REGEXP)) {
      return [];
    }

    return this.buildSuggestions({ prefix, editor });
  }

  buildSuggestions({ editor, prefix }) {
    const suggestions = [];

    this.routes.getAll().forEach(({ url, actions, params, controller }, routePrefix) => {
      ['path', 'url'].forEach((suffix) => {
        const method = `${routePrefix}_${suffix}`;
        const score = fuzzaldrinPlus.score(method, prefix);
        if (score === 0) return;
        const controllerScore = matchScore(getCurrentController(editor), controller);

        const suggestion = {
          text: method,
          snippet: buildSnippet(method, params),
          type: 'function',
          rightLabel: url,
          description: Array.from(actions).map(action => [controller, action].join('#')).join(', '),
          score,
          controllerScore,
        };
        suggestions.push(suggestion);
      });
    });

    return sortBy(suggestions, ['controllerScore', 'score']).reverse();
  }
}
