export default {
  entry: './npm/index.js',
  dest: './npm/bundles/cat-grid.umd.js',
  sourceMap: false,
  format: 'umd',
  moduleName: 'ng.cat-grid',
  external: [
    '@angular/core',
    '@angular/common',
    'rxjs/Rx',
    'rxjs/Observable',
    'rxjs/Subject',
    'rxjs/util/isArray',
    'ng2-dragula',
  ],
  globals: {
    '@angular/core': 'ng.core',
    '@angular/common': 'ng.common',
    'rxjs/Rx': 'Rx',
    'rxjs/Observable': 'Rx',
    'rxjs/Subject': 'Rx',

    'rxjs/util/isArray': 'Rx.util.isArray',
    'ng2-dragula': 'ng2-dragula'
  }
}
