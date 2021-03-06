module.exports = function(grunt) {
    "use strict";

    var secret = {};
    try {
        secret = grunt.file.readJSON('secret.json');
    } catch (err) {
        console.log( "Error: need to create secret.json file" );
    }


    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            all: ['serv.js', '../client/main.js']
        },

	jslint: {
	    all: { 
		src: ['serv.js', '../client/main.js']
	    }
	},
        
	jade: {
	    dev: {
		options: {
		    pretty: true,
		    data: {
			debug: true,
                        cssLibDir: "/static-dev/bundle<%= pkg.version %>/css",
                        jsLibDir: "/static-dev/bundle<%= pkg.version %>/js",
                        cssDir: "/static-dev/bundle<%= pkg.version %>/css",
                        jsDir: "/static-dev/bundle<%= pkg.version %>/js"
                    }
		},
		files: {
		    "static-dev/bundle<%= pkg.version %>/html/main.gen.html": ["../client/main.jade"],
		    "static-dev/bundle<%= pkg.version %>/html/login.gen.html": ["../client/login.jade"]
		}
	    },
	    prod: {
		options: {
		    pretty: false,
		    data: {
			debug: false,
                        cssLibDir: "/static/bundle<%= pkg.version %>/css",
                        jsLibDir: "/static/bundle<%= pkg.version %>/js",
                        cssDir: "/static/bundle<%= pkg.version %>/css",
                        jsDir: "/static/bundle<%= pkg.version %>/js"
                    }
		},
		files: {
		    "static/bundle<%= pkg.version %>/html/main.gen.html": ["../client/main.jade"],
		    "static/bundle<%= pkg.version %>/html/login.gen.html": ["../client/login.jade"]
		}
	    }
	},

	stylus: {
	    dev: {
		options: {
		    firebug: false, // todo remove 
		    compress: false
		},
		files: {
		    'static-dev/bundle<%= pkg.version %>/css/main.gen.css': '../client/main.styl', 
		}
	    },
	    prod: {
		options: {
		    firebug: false, // todo remove 
		    compress: true
		},
		files: {
		    'static/bundle<%= pkg.version %>/css/main.gen.css': '../client/main.styl', 
		}
	    }
	},

        copy: {
            dev: {
                files: [
                    {
			expand: true, flatten: true, cwd: '../client/',
			src: ['lib/font-awesome/css/font-awesome.css'], 
			dest: 'static-dev/bundle<%= pkg.version %>/css/', filter: 'isFile'},
		    {
			expand: true, flatten: true, cwd: '../client/',
			src: ['lib/bootstrap/dist/css/bootstrap.css'], 
			dest: 'static-dev/bundle<%= pkg.version %>/css/', filter: 'isFile'},
                    {
			expand: true, flatten: true, cwd: '../client/', 
			src: ['lib/bootstrap/dist/fonts/glyphicons-halflings-regular.woff'], 
			dest: 'static-dev/bundle<%= pkg.version %>/fonts/', filter: 'isFile'},   
		    {
			expand: true, flatten: true, cwd: '../client/', 
			src: ['lib/font-awesome/fonts/fontawesome-webfont.woff'], 
			dest: 'static-dev/bundle<%= pkg.version %>/fonts/', filter: 'isFile'},
                    {
			expand: true, flatten: true, cwd: '../client/', 
			src: ['lib/jquery/dist/jquery.js'], 
			dest: 'static-dev/bundle<%= pkg.version %>/js/', filter: 'isFile'},
                    {
			expand: true, flatten: true, cwd: '../client/', 
			src: ['lib/bootstrap/dist/js/bootstrap.js'], 
			dest: 'static-dev/bundle<%= pkg.version %>/js/', filter: 'isFile'},
                    {
			expand: true, flatten: true, cwd: '../client/', 
			src: ['lib/underscore/underscore.js'], 
			dest: 'static-dev/bundle<%= pkg.version %>/js/', filter: 'isFile'},
                ]
            },
	    prod: {
                files: [
                    {
			expand: true, flatten: true, cwd: '../client/', 
			src: ['lib/font-awesome/css/font-awesome.css'],
			dest: 'static/bundle<%= pkg.version %>/css/', filter: 'isFile'},
                    {
			expand: true, flatten: true, cwd: '../client/', 
			src: ['lib/bootstrap/dist/css/bootstrap.css'],
			dest: 'static/bundle<%= pkg.version %>/css/', filter: 'isFile'},
                    {
			expand: true, flatten: true, cwd: '../client/', 
			src: ['lib/font-awesome/fonts/fontawesome-webfont.woff'], 
			dest: 'static/bundle<%= pkg.version %>/fonts/', filter: 'isFile'},
		    {
			expand: true, flatten: true, cwd: '../client/', 
			src: ['lib/bootstrap/dist/fonts/glyphicons-halflings-regular.woff'], 
			dest: 'static/bundle<%= pkg.version %>/fonts/', filter: 'isFile'},

                ]
            }
        },

 
        concat: {
            dev: {
                src: ['../client/main.js'],
                dest: 'static-dev/bundle<%= pkg.version %>/js/main.js',
            }
        },

        uglify: { // TODO - make one prod not prod?
	    options: {
		compress: {
		    drop_console: true
		},
		global_defs: {
		    "DEBUG": false
		},
		mangle: true, 
		dead_code: true
		//beautify: true
	    },
	    prod: {
		files: [
		    { 'static/bundle<%= pkg.version %>/js/main.min.js': ['../client/main.js'] },
		    { 'static/bundle<%= pkg.version %>/js/bootstrap.min.js': ['../client/lib/bootstrap/dist/js/bootstrap.js'] },
		    { 'static/bundle<%= pkg.version %>/js/jquery.min.js': ['../client/lib/jquery/dist/jquery.js'] },
		    { 'static/bundle<%= pkg.version %>/js/underscore.min.js': ['../client/lib/underscore/underscore.js'] }
		] 
	    }
        },
        
        bumpup: {
            options: {
                updateProps: {
                    pkg: 'package.json'
                }
            },
            file: 'package.json'
        },

        clean: {
            dev: ["static-dev"],
            prod: ["static"]
        },

        scp: {
            prod: {
                options: {
                    host:  secret.prod.host,
                    username:  secret.prod.username,
                    privateKey:  grunt.file.read( secret.prod.privateKeyLoc ),
                },
                files: [{
                    cwd: '.',
                    src: [ 'package.json', 
                           'secret.json', 
                           'nginx.gen-prod.conf',
                           'static/bundle<%= pkg.version %>/**',
                           'static-dev/bundle<%= pkg.version %>/**',
                           'serv.js' ],
                    filter: 'isFile',
                    dest: '/usr/local/ircexp',
                    createDirectories: true
                }]
            },
            test: {
                options: {
                    host:  secret.test.host,
                    username:  secret.test.username,
                    privateKey:  grunt.file.read( secret.test.privateKeyLoc ),
                },
                files: [{
                    cwd: '.',
                    src: [ 'package.json', 
                           'secret.json', 
                           'nginx.gen-test.conf',
                           'static/bundle<%= pkg.version %>/**',
                           'static-dev/bundle<%= pkg.version %>/**',
                           'serv.js' ],
                    filter: 'isFile',
                    dest: '/usr/local/ircexp-test',
                    createDirectories: true
                }]
            },
        },

        'string-replace': {
            prod: {
                files: {
                    'nginx.gen-prod.conf': 'nginx.tls.conf'
                },
                options: {
                    replacements: [
                        {
                            pattern: /DOMAIN/g,
                            replacement: secret.prod.domain
                        },
                        {
                            pattern: /PORT/g,
                            replacement: secret.prod.port
                        }
                    ]
                }
            },
            test: {
                files: {
                    'nginx.gen-test.conf': 'nginx.conf'
                },
                options: {
                    replacements: [
                        {
                            pattern: /DOMAIN/g,
                            replacement: secret.test.domain
                        },
                        {
                            pattern: /PORT/g,
                            replacement: secret.test.port
                        }
                    ]
                }
            }
        },

        sshexec: {
            prod: {
                command: ['sudo cp /usr/local/ircexp/nginx.gen-prod.conf /etc/nginx/sites-available/ircexp-prod.conf',
                          '(cd /usr/local/ircexp; npm install) ',
                          'sudo forever restartall',
                          'sudo service nginx restart'
                         ],
                options: {
                    host: secret.prod.host,
                    username: secret.prod.username,
                    privateKey:  grunt.file.read( secret.prod.privateKeyLoc ),
                }
            },
            test: {
                command: ['sudo cp /usr/local/ircexp-test/nginx.gen-test.conf /etc/nginx/sites-available/ircexp-test.conf',
                          '(cd /usr/local/ircexp-test; npm install) ',
                          'sudo forever restartall',
                          'sudo service nginx restart'
                         ],
                options: {
                    host: secret.test.host,
                    username: secret.test.username,
                    privateKey:  grunt.file.read( secret.test.privateKeyLoc ),
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-stylus');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-bumpup');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-scp');
    grunt.loadNpmTasks('grunt-ssh');
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-jslint'); 

    // Alias task for release
    grunt.registerTask('release', function () {
        grunt.task.run('jshint');    
        //grunt.task.run('jslint');    
        grunt.task.run('bumpup:patch');

        grunt.task.run('jade');
        grunt.task.run('stylus');

        grunt.task.run('copy');      
        grunt.task.run('concat');      
        grunt.task.run('uglify');      
        grunt.task.run('string-replace');      
    });

    // Alias task for release
    grunt.registerTask('deploy', function () {
        grunt.task.run('release');   
        grunt.task.run('scp:prod');    
        grunt.task.run('sshexec:prod');    
    });

   grunt.registerTask('deploy-test', function () {
        grunt.task.run('release:test');   
        grunt.task.run('scp:test');    
        grunt.task.run('sshexec:test');    
    });

    // Default task(s).
    grunt.registerTask('default', ['release']);

};

