module.exports = function(grunt) {

    grunt.initConfig({
	pkg: grunt.file.readJSON('package.json'),
   
        jshint: {
            all: ['main.js']
        },

	jslint: {
	    all: { 
		src: [ 'main.js' ] 
	    }
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
		    "main.gen.html": ["main.jade"],
		    "login.gen.html": ["login.jade"]
		}
	    }
	},

	stylus: {
	    compile: {
		options: {
		    compress: false
		},
		files: {
		    'main.gen.css': 'main.styl', 
		}
	    }
	},

        clean: {
            all: ["main.gen.*", "login.gen.*" ]
        },

        copy: {
            compile: {
                files: [
                    {
			expand: true, flatten: true, 
			src: ['lib/font-awesome/css/font-awesome.css'], 
			dest: 'lib/css/', filter: 'isFile'},
		    {
			expand: true, flatten: true, 
			src: ['lib/bootstrap/dist/css/bootstrap.css'], 
			dest: 'lib/css/', filter: 'isFile'},
                    {
			expand: true, flatten: true, 
			src: ['lib/bootstrap/dist/fonts/glyphicons-halflings-regular.woff'], 
			dest: 'lib/fonts/', filter: 'isFile'},   
		    {
			expand: true, flatten: true, 
			src: ['lib/font-awesome/fonts/fontawesome-webfont.woff'], 
			dest: 'lib/fonts/', filter: 'isFile'},
                    {
			expand: true, flatten: true, 
			src: ['lib/jquery/dist/jquery.js'], 
			dest: 'lib/js/', filter: 'isFile'},
                    {
			expand: true, flatten: true, 
			src: ['lib/bootstrap/dist/js/bootstrap.js'], 
			dest: 'lib/js/', filter: 'isFile'},
                    {
			expand: true, flatten: true, 
			src: ['lib/underscore/underscore.js'], 
			dest: 'lib/js/', filter: 'isFile'},
                ]
            }
        }
	
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-stylus');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jslint'); 
    grunt.loadNpmTasks('grunt-contrib-clean');


    grunt.registerTask('default', ['jshint','jade','stylus','copy']);

};
