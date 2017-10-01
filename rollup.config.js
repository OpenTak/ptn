import { readFileSync } from 'fs';
import babel from 'rollup-plugin-babel';

const pkg = JSON.parse(readFileSync('package.json'));

export default {
  entry:   pkg.entry,
  banner:  `/*! ${pkg.name} v${pkg.version} by ${pkg.author} (${pkg.license} license) */`,
  targets: [
    {
      dest:       pkg.main,
      format:     'umd',
      moduleName: 'Ptn'
    }
  ],
  plugins: [
    babel({
      runtimeHelpers: true,
      exclude: 'node_modules/**',
      plugins: ['external-helpers']
    }),
  ],
};
