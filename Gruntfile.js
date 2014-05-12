var pkg = require('./package.json');

module.exports = function(grunt){
	grunt.initConfig({
		pkg: pkg,

		clean: { dist: ['dist'] },

		browserify: {
			dist: { 
				files: { 'dist/<%= pkg.name %>.js': ['src/js/module.js']	}
			},
			dev: {
				files: { 'dist/<%= pkg.name %>.js': ['src/js/module.js'] },
				options: {	
					alias: ['bower_components/parallel-coordinates-chart/dist/parallel-coordinates-chart:parallel-coordinates-chart'],
					bundleOptions: { 
						debug: true,
						standalone: '<%= pkg.name %>'
					} 
				}
			},
			options: {
				alias: ['bower_components/parallel-coordinates-chart/dist/parallel-coordinates-chart:parallel-coordinates-chart'],
				bundleOptions: { standalone: '<%= pkg.name %>' }
			}
		},
		
		uglify: {
			dist: {	files: { 'dist/<%= pkg.name %>.min.js': ['dist/<%= pkg.name %>.js']	} }
		},

		watch: {
			devJS: {
				files: ['src/js/**'],
				tasks: ['browserify:dev', 'copy', 'jshint:dev']
			}
		},

		jshint: {
			dev: {
				options: { force: true },
				files: { src: ["src/js/**.js"]	}
			},

			dist: {
				files: { src: ["src/js/**.js"]	}
			},

			options: {
				jshintrc: '.jshintrc'
			}
		},

		jasmine: {
			test: {
				src: 'dist/<%= pkg.name %>.js',
				options: {
					specs: 'test/**Spec.js',
					helpers: 'test/**Helper.js',
					vendor: [
						'bower_components/angular/angular.js',
						'bower_components/d3/d3.js'
					]
				}
			}
		},

		copy: {
			examples: {
				files: [
					{expand: true, src: ['dist/*'], dest: 'example/', filter: 'isFile'},
				]
			},
			css: {
				files: [
					{	
						expand: true, 
						cwd: 'bower_components/parallel-coordinates-chart/dist/',
						src: ['*.css'], 
						dest: 'dist/',
						rename: function(dest, src){ 
							return 'dist/' + src.replace('parallel-coordinates-chart','angular-parallel-coordinates');	
						}
					},
				]
			}
		},

		connect: {
			server: {
				options: { port: 8000, base: 'example' }
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-browserify');
	
	grunt.registerTask('dev', [
		'clean',
		'jasmine',
		'browserify:dev',
		'jshint:dev',
		'copy:css',
		'copy:examples',
		'connect',
		'watch'
	]);

	grunt.registerTask('dist', [
		'jshint:dist',
		'clean',
		'browserify:dist',
		'uglify',
		'copy:css',
		'jasmine'
	]);

	grunt.registerTask('default', 'dist');
};