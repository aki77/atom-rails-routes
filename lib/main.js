'use babel';

import { CompositeDisposable, Disposable } from 'atom';
import path from 'path';
import fs from 'fs-plus';
import PathWatcher from 'pathwatcher';
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

    const pathWatcher = PathWatcher.watch(this.getRoutesFilePath(), () => {
      requestIdleCallback(() => this.routes.load());
    });
    this.subscriptions.add(new Disposable(() => {
      pathWatcher.close();
    }));
    this.subscriptions.add(atom.commands.add('atom-workspace', 'rails-routes:reload', () => {
      this.routes.load();
    }));
  },

  deactivate() {
    if (this.routes) {
      this.routes.destroy();
      this.routes = null;
    }

    if (this.subscriptions) {
      this.subscriptions.dispose();
      this.subscriptions = null;
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

  consumeSignal(registry) {
    const provider = registry.create();
    this.subscriptions.add(provider);

    this.subscriptions.add(this.routes.onWillLoad(() => {
      provider.add('rails-routes loading');
    }));
    this.subscriptions.add(this.routes.onDidLoad(() => {
      provider.clear();
    }));
  },
};
