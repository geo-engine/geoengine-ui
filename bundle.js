var path = require("path");
var Builder = require('systemjs-builder');

// optional constructor options
// sets the baseURL and loads the configuration file
var builder = new Builder('', {
	paths: {
	    'dragula': 'node_modules/dragula/dist/dragula.min.js'
	},
    packages: {
        app: {
            format: 'register',
            defaultExtension: 'js'
        },
        'ng2-material': {
            defaultExtension: 'js'
        },
        'ng2-dragula': {
            defaultExtension: 'js'
        },
        'dragula': {
            defaultExtension: 'js'
        }
    },
    map: {
        'ng2-material': 'node_modules/ng2-material',
        'ng2-dragula': 'node_modules/ng2-dragula',
        'openlayers': 'node_modules/openlayers/dist/ol.js'
    },
    meta: {
		'angular2/*': {
		    build: false
		},
		'rxjs/*': {
			build: false
		}
    }
});

builder
.bundle('app/main.js', 'build/outfile.js', { minify: false, sourceMaps: true })
.then(function() {
  console.log('Build complete');
})
.catch(function(err) {
  console.log('Build error');
  console.log(err);
});