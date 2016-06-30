/**
 * System configuration for WAVE.
 */
(function(global) {
  // map tells the System loader where to look for things
  var map = {
    'app':                        'app',
    '@angular':                   'node_modules/@angular',
    'rxjs':                       'node_modules/rxjs',
    '@angular2-material':         'node_modules/@angular2-material',
    'ng2-material':               'node_modules/ng2-material',
    'ng2-dragula':                'node_modules/ng2-dragula',
    'openlayers':                 'node_modules/openlayers/dist/ol.js',
    'proj4':                      'node_modules/proj4/dist/proj4.js',
    'd3':                         'node_modules/d3/d3.js',
    'dagre':                      'node_modules/dagre/dist/dagre.js',
    'dagre-d3':                   'node_modules/dagre-d3/dist/dagre-d3.js',
    'dragula':                    'node_modules/dragula/dist/dragula.min.js',
    'codemirror':                 'node_modules/codemirror',
    'immutable':                  'node_modules/immutable/dist/immutable.min.js',
    'moment':                     'node_modules/moment/moment.js',
    'ct-angular2-color-picker':   'node_modules/ct-angular2-color-picker'
  };
  // packages tells the System loader how to load when no filename and/or no extension
  var packages = {
    'app':                        { main: 'main.js',  defaultExtension: 'js' },
    'rxjs':                       { defaultExtension: 'js' },
    'ng2-material':               { main: 'index.js', defaultExtension: 'js' },
    'ng2-dragula':                { defaultExtension: 'js' },
    'dragula':                    { defaultExtension: 'js' },
    'codemirror':                 { main: "lib/codemirror.js", defaultExtension: 'js' },
    'moment':                     { defaultExtension: 'js' },
    'ct-angular2-color-picker':   { defaultExtension: 'js' }
  };

  // Angular: package entries for angular packages
  var ngPackageNames = [
    'common',
    'compiler',
    'core',
    'forms',
    'http',
    'platform-browser',
    'platform-browser-dynamic',
    'router'
  ];
  // Individual files (~300 requests):
  function packIndex(pkgName) {
    packages['@angular/'+pkgName] = { main: 'index.js', defaultExtension: 'js' };
  }
  // Bundled (~40 requests):
  function packUmd(pkgName) {
    packages['@angular/'+pkgName] = { main: '/bundles/' + pkgName + '.umd.js', defaultExtension: 'js' };
  }
  // Most environments should use UMD; some (Karma) need the individual index files
  var setPackageConfig = System.packageWithIndex ? packIndex : packUmd;
  // Add package entries for angular packages
  ngPackageNames.forEach(setPackageConfig);

  // Material2 specific barrels.
  var mdPackageNames = [
    'core',
    'checkbox',
    'progress-circle',
    'progress-bar',
    'radio',
    'toolbar',
    'sidenav',
    'icon',
    'input',
    'tabs'
  ];
  mdPackageNames.forEach( function(pkgName) {
    packages['@angular2-material/' + pkgName] = {
      main: pkgName + '.js',
      defaultExtension: 'js',
      format: 'cjs'
    };
  });

  var meta = {
      'node_modules/proj4/dist/proj4.js': { format: 'global' }
  }

  var config = {
    map: map,
    packages: packages,
    meta: meta
  }
  System.config(config);
})(this);
