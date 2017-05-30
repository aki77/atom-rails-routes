'use babel';

import { CompositeDisposable } from 'atom';
import path from 'path';
import fs from 'fs-plus';
import Routes from './routes';
import AutocompleteProvider from './autocomplete_provider';
import HyperclickProvider from './hyperclick_provider';

export default {
  activate() {
    if (!fs.existsSync(this.getRoutesFilePath())) return;

    this.subscriptions = new CompositeDisposable();
    this.routes = new Routes();

    this.autocompleteProvider = new AutocompleteProvider(this.routes);
    this.hyperclickProvider = new HyperclickProvider(this.routes);

    requestIdleCallback(() => this.routes.load());
  },

  deactivate() {
    if (this.routes) {
      this.routes.destroy();
      this.routes = null;
    }

    this.autocompleteProvider = null;
    this.hyperclickProvider = null;
  },

  getRoutesFilePath() {
    return path.join(atom.project.getPaths()[0], 'config', 'routes.rb');
  },

  provideAutocomplete() {
    return this.autocompleteProvider;
  },

  provideHyperclick() {
    return this.hyperclickProvider;
  },
};
