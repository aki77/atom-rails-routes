'use babel';

import { BufferedProcess } from 'atom';

const LINE_REGEXP = /(\w+)?\s+(GET|POST|PUT|PATCH|DELETE)\s+\S+\s+([^#]+#\w+)/;

const parse = (lines) => {
  const routesArray = lines
    .map(line => line.match(LINE_REGEXP))
    .filter(matches => matches !== null)
    .map(([, prefix, method, action]) => ({ prefix, method, action }))
    .reduce((arr, { prefix, method, action }) => {
      const prevRoute = arr[arr.length - 1];
      // NOTE: PATCH, PUT
      if (prevRoute && prevRoute.actions.has(action)) {
        return arr;
      }

      if (!prefix) {
        prevRoute.actions.add(action);
        prevRoute.methods.add(method);
        return arr.slice(0, -1).concat(prevRoute);
      }

      return arr.concat({
        methods: new Set([method]),
        actions: new Set([action]),
        prefix,
      });
    }, [])
    .map(({ prefix, methods, actions }) => [prefix, { methods, actions }]);

  return new Map(routesArray);
};

export default class Routes {
  constructor() {
    this.routes = new Map();
  }

  destroy() {
    this.routes.clear();
  }

  async load() {
    const output = await this.exec();
    this.routes.clear();
    this.routes = parse(output.split('\n'));
  }

  exec() {
    return new Promise((resolve, reject) => {
      const outputs = [];
      const errors = [];

      if (this.process) {
        this.process.kill();
      }

      this.process = new BufferedProcess({
        command: 'bundle',
        args: ['exec', 'rake', 'routes'],
        options: {
          // TODO: multiple folder project
          cwd: atom.project.getPaths()[0],
        },
        stdout: (output) => {
          outputs.push(output);
        },
        stderr: (output) => {
          errors.push(output);
        },
        exit: (code) => {
          this.process = null;
          if (code > 0) {
            reject(errors.join(''));
          } else {
            resolve(outputs.join(''));
          }
        },
      });
    });
  }

  getAll() {
    return this.routes;
  }
}
