'use babel';

import { BufferedProcess, Emitter } from 'atom';
import inflection from 'inflection';

const LINE_REGEXP = /(\w+)?\s+(GET|POST|PUT|PATCH|DELETE)\s+(\S+?)(?:\(\.:format\))?\s+([^#]+)#(\w+)/;
const PARAM_REGEXP = /:\w+/;

const parse = (lines) => {
  const routesArray = lines
    .map(line => line.match(LINE_REGEXP))
    .filter(matches => matches !== null)
    .map(([, prefix, method, url, controller, action]) => ({
      prefix,
      method,
      url,
      controller,
      action,
    }))
    .reduce((arr, { prefix, method, url, controller, action }) => {
      const prevRoute = arr[arr.length - 1];
      // NOTE: PATCH, PUT, DELETE
      if (prevRoute && prevRoute.controller === controller && prevRoute.actions.has(action)) {
        return arr;
      }

      if (!prefix) {
        if (!prevRoute) {
          return arr;
        }
        prevRoute.actions.add(action);
        prevRoute.methods.add(method);
        return arr.slice(0, -1).concat(prevRoute);
      }

      // TODO: refactor
      return arr.concat({
        methods: new Set([method]),
        actions: new Set([action]),
        params: url
          // NOTE: scope params
          .replace(/[()]/g, '')
          .split('/')
          .filter(part => part.match(PARAM_REGEXP))
          .map(part =>
            part
              .replace(':', '')
              .replace(/_id$/g, '')
              .replace(/^id$/g, inflection.singularize(controller.split('/').pop())),
          ),
        prefix,
        url,
        controller,
      });
    }, [])
    .map(({ prefix, methods, actions, url, params, controller }) => [
      prefix,
      { methods, actions, url, params, controller },
    ]);

  return new Map(routesArray);
};

export default class Routes {
  constructor() {
    this.routes = new Map();
    this.emitter = new Emitter();
  }

  destroy() {
    this.routes.clear();
  }

  onWillLoad(callback) {
    return this.emitter.on('will-load', callback);
  }

  onDidLoad(callback) {
    return this.emitter.on('did-load', callback);
  }

  async load() {
    this.emitter.emit('will-load');
    const output = await this.exec();
    this.routes.clear();
    this.routes = parse(output.split('\n'));
    this.emitter.emit('did-load');
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

  get(prefix) {
    return this.routes.get(prefix);
  }
}
