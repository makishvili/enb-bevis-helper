module.exports = function (config) {
    config.registerModule('enb-bevis-helper', new EnbBevisHelperModule(config));
};

var inherit = require('inherit');
var ModuleConfig = require('enb/lib/config/module-config');

var EnbBevisHelperBase = inherit(ModuleConfig, {
    __constructor: function (config) {
        this._sourcesConfig = {};
        this._depsConfig = {};
        this._useAutopolyfiller = true;
        this._autopolyfillerExcludes = [];
        this._browserSupport = [];
        this._buildHtml = false;
        this._buildTests = false;
        this._ie8Suffix = null;
        this._ie9Suffix = null;
        this._testDirs = null;
        this._config = config;
    },

    forStaticHtmlPage: function () {
        return this.copyAnd(function () {
            this._depsConfig = {};
            this._buildHtml = true;
        });
    },

    forServerPage: function () {
        return this.copyAnd(function () {
            this._buildHtml = false;
        });
    },

    configureUnitTests: function (path) {
        return this.copyAnd(function () {
            this._buildHtml = false;
            this._buildTests = true;
            this._depsConfig = {jsSuffixes: ['js', 'test.js']};
            var testDirs = this._testDirs;
            this._config.task('test', function (task) {
                var blocksToTest = [].slice.call(arguments, 1);
                if (blocksToTest.length) {
                    testDirs = blocksToTest;
                }
                return task.buildTargets([
                    path + '/sources.js',
                    path + '/tests.js'
                ]);
            });
            var fileMask = function (file) {
                var fullname = file.fullname;
                if (fullname.indexOf('node_modules') !== -1) {
                    return false;
                }
                if (testDirs) {
                    for (var i = 0; i < testDirs.length; i++) {
                        if (fullname.indexOf(testDirs[i]) !== -1) {
                            return true;
                        }
                    }
                } else {
                    return true;
                }
                return false;
            };
            var _this = this;
            this._config.node(path, function (nodeConfig) {
                _this.configureNode(nodeConfig, {fileMask: fileMask});
            });

        });
    },

    testDirs: function (testDirs) {
        return this.copyAnd(function () {
            this._testDirs = testDirs;
        });
    },

    supportIE8: function (ie8Suffix) {
        return this.copyAnd(function () {
            this._ie8Suffix = ie8Suffix;
        });
    },

    supportIE9: function (ie9Suffix) {
        return this.copyAnd(function () {
            this._ie9Suffix = ie9Suffix;
        });
    },

    browserSupport: function (browserSupport) {
        return this.copyAnd(function () {
            this._browserSupport = browserSupport;
        });
    },

    useAutopolyfiller: function (useAutopolyfiller) {
        if (arguments.length === 0) {
            useAutopolyfiller = true;
        }
        return this.copyAnd(function () {
            this._useAutopolyfiller = useAutopolyfiller;
        });
    },

    autopolyfillerExcludes: function (autopolyfillerExcludes) {
        return this.copyAnd(function () {
            this._autopolyfillerExcludes = autopolyfillerExcludes;
        });
    },

    sources: function (sourcesConfig) {
        return this.copyAnd(function () {
            this._sourcesConfig = sourcesConfig;
        });
    },

    sourceDeps: function (sourceDeps) {
        return this.copyAnd(function () {
            if (sourceDeps) {
                this._depsConfig = {
                    sourceDeps: sourceDeps
                };
            } else {
                this._depsConfig = {};
            }
        });
    },

    configureNode: function (nodeConfig, options) {
        var browserSupport = this._browserSupport;

        function configureCssBuild(suffix, browserSupport, variables) {
            var file = '?' + (suffix ? '.' + suffix : '') + '.css';
            nodeConfig.addTech([require('enb-stylus/techs/css-stylus-with-autoprefixer'), {
                browsers: browserSupport,
                target: file,
                variables: variables
            }]);
            nodeConfig.mode('development', function () {
                nodeConfig.addTech([require('enb/techs/file-copy'), {source: file, target: '_' + file}]);
            });
            nodeConfig.mode('production', function () {
                nodeConfig.addTech([
                    require('enb-borschik/techs/borschik'), {source: file, target: '_' + file, freeze: true}
                ]);
            });
            nodeConfig.addTarget('_' + file);
        }

        nodeConfig.addTechs([
            [require('enb-bevis/techs/sources'), this._sourcesConfig],
            [require('enb-bevis/techs/deps'), this._depsConfig],
            require('enb-bevis/techs/files'),

            [require('enb-y-i18n/techs/y-i18n-lang-js'), {lang: '{lang}'}],
            require('enb-bt/techs/bt-client-module')
        ]);

        if (this._useAutopolyfiller) {
            nodeConfig.addTechs([
                [require('enb-bevis/techs/js'), {lang: '{lang}', target: '?.source.{lang}.js'}],
                [require('enb-autopolyfiller/techs/autopolyfiller'), {
                    source: '?.source.{lang}.js',
                    target: '?.{lang}.js',
                    browsers: browserSupport,
                    excludes: this._autopolyfillerExcludes
                }]
            ]);
        } else {
            nodeConfig.addTech([require('enb-bevis/techs/js'), {lang: '{lang}'}]);
        }

        if (this._buildHtml) {
            nodeConfig.addTechs([
                [require('enb/techs/file-provider'), {target: '?.btjson.js'}],
                require('enb-bevis/techs/source-deps-from-btjson'),
                [require('enb-bt/techs/html-from-btjson'), {lang: '{lang}'}]
            ]);
            nodeConfig.addTarget('?.{lang}.html');
        }

        if (this._buildTests) {
            var fileMask = options.fileMask;

            nodeConfig.setLanguages(['ru']);
            nodeConfig.addTechs([
                [require('enb-bevis/techs/source-deps-test'), {fileMask: fileMask}],
                [require('enb-bevis/techs/js-test'), {target: 'tests.js', fileMask: fileMask}],
                [require('enb/techs/file-copy'), {source: '?.ru.js', target: 'sources.js'}]
            ]);
        } else {
            nodeConfig.addTech(require('enb-bt/techs/bt-server'));

            nodeConfig.mode('development', function (nodeConfig) {
                nodeConfig.addTechs([
                    [require('enb/techs/file-copy'), {source: '?.{lang}.js', target: '_?.{lang}.js'}],
                    [require('enb/techs/file-copy'), {source: '?.lang.{lang}.js', target: '_?.lang.{lang}.js'}]
                ]);
            });

            nodeConfig.mode('production', function (nodeConfig) {
                nodeConfig.addTechs([
                    [require('enb-borschik/techs/borschik'), {source: '?.{lang}.js', target: '_?.{lang}.js'}],
                    [require('enb-borschik/techs/borschik'), {source: '?.lang.{lang}.js', target: '_?.lang.{lang}.js'}]
                ]);
            });

            configureCssBuild(null, browserSupport, {ie: false});

            if (this._ie8Suffix) {
                configureCssBuild(this._ie8Suffix, ['ie 8'], {ie: 8});
            }

            if (this._ie9Suffix) {
                configureCssBuild(this._ie9Suffix, ['ie 9'], {ie: 9});
            }

            nodeConfig.addTargets(['_?.{lang}.js', '_?.lang.{lang}.js']);
        }
    },

    copyAnd: function (fn) {
        var newInstance = this.copy();
        fn.call(newInstance);
        return newInstance;
    },

    copy: function () {
        var Class = this.__self;
        var result = new Class(this._config);
        for (var i in this) {
            if (this.hasOwnProperty(i)) {
                result[i] = this[i];
            }
        }
        return result;
    }
});

var EnbBevisHelperModule = inherit(EnbBevisHelperBase, {
    getName: function() {
        return 'enb-bevis-helper';
    }
});
