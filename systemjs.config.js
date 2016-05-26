/**
 * System configuration for WAVE.
 */
(function(global) {
  // map tells the System loader where to look for things
  var map = {
    'app':                        'app',
    '@angular':                   'node_modules/@angular',
    'angular2-in-memory-web-api': 'node_modules/angular2-in-memory-web-api',
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
    'moment':                     'node_modules/moment/moment.js'
  };
  // packages tells the System loader how to load when no filename and/or no extension
  var packages = {
    'app':                        { main: 'main.js',  defaultExtension: 'js' },
    'rxjs':                       { defaultExtension: 'js' },
    'angular2-in-memory-web-api': { defaultExtension: 'js' },
    'ng2-material':               { main: 'index.js', defaultExtension: 'js' },
    'ng2-dragula':                { defaultExtension: 'js' },
    'dragula':                    { defaultExtension: 'js' },
    'codemirror':                 { main: "lib/codemirror.js", defaultExtension: 'js' },
    'moment':                     { defaultExtension: 'js' }
  };
  // Angular: package entries for angular packages
  var ngPackageNames = [
    'common',
    'compiler',
    'core',
    'http',
    'platform-browser',
    'platform-browser-dynamic',
    'router',
    'router-deprecated',
    'upgrade'
  ];
  // Add package entries for angular packages
  ngPackageNames.forEach( function(pkgName) {
    packages['@angular/'+pkgName] = { main: pkgName + '.umd.js', defaultExtension: 'js' };
  });

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
    'input'
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
