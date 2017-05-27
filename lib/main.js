'use babel';

import path from 'path';
import fs from 'fs-plus';
import Routes from './routes';
import Provider from './provider';

export default {
  activate() {
    if (!fs.existsSync(this.getRoutesFilePath())) return;

    this.routes = new Routes();
    this.routes.load();
    this.provider = new Provider(this.routes);
  },

  deactivate() {
    if (this.routes) {
      this.routes.destroy();
      this.routes = null;
    }

    this.provider = null;
  },

  getRoutesFilePath() {
    return path.join(atom.project.getPaths()[0], 'config', 'routes.rb');
  },

  getProvider() {
    return this.provider;
  },
};
