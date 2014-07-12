module.exports = function(grunt) {

    grunt.initConfig({
	pkg: grunt.file.readJSON('package.json'),
   
        jshint: {
            all: ['main.js']
        },

	jade: {
	    compile: {
		options: {
		    pretty: true,
		    data: {
			debug: true,
                        cssLibDir: "./lib/css",
                        jsLibDir: "./lib/js",
                        cssDir: ".",
                        jsDir: "."
		    }
		},
		files: {
		    "main.gen.html": ["main.jade"]
		}
	    }
	},

	stylus: {
	    compile: {
		options: {
		    firebug: false, // todo remove 
		    compress: false
		},
		files: {
		    'main.gen.css': 'main.styl'
		}
	    }
	},

        copy: {
            compile: {
                files: [
                    {
			expand: true, flatten: true, 
			src: ['lib/jquery/dist/jquery.js'], 
			dest: 'lib/js/', filter: 'isFile'
                    }
                ]
            }
        }
	
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-stylus');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jslint'); 

    grunt.registerTask('default', ['jshint','jade','stylus','copy']);

};
