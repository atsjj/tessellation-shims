(function() {
  /* globals define */

  var STRING_DASHERIZE_REGEXP = (/[ _]/g);
  var STRING_DECAMELIZE_REGEXP = (/([a-z\d])([A-Z])/g);

  function decamelize(str) {
    return str.replace(STRING_DECAMELIZE_REGEXP, '$1_$2').toLowerCase();
  }

  function dasherize(str) {
    return decamelize(str).replace(STRING_DASHERIZE_REGEXP, '-');
  }

  /**
    Finds a nested object within the global window.

    Found on http://stackoverflow.com/a/6491621

    @author alnitak (http://stackoverflow.com/users/6782/alnitak)
   */
  function resolveGlobalNamespace(s) {
    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, '');           // strip a leading dot
    var a = s.split('.');
    var o = window;
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in o) {
            o = o[k];
        } else {
            return;
        }
    }
    return o;
  }

  function generateModule(name, values) {
    define(name, [], function() {
      'use strict';

      return values;
    });
  }

  /**
    Generates a very flexible list of modules. As an example, it will generate
    from an object, it's keys as named exports from the namespace, as well as
    dasherized modules of those keys.

    // An example object with enumerable keys
    var MyGlobalModule = {
      SomeClass() {},
      AnotherClass() {},
      usefulValue: 1
    };

    // Generated shims
    var shims = {
      'my-global-module': {
        'default': MyGlobalModule,
        'SomeClass': MyGlobalModule.SomeClass,
        'AnotherClass': MyGlobalModule.AnotherClass,
        'usefulValue': MyGlobalModule.usefulValue
      },
      'my-global-module/some-class': {
        'default': MyGlobalModule.SomeClass
      },
      'my-global-module/another-class': {
        'default': MyGlobalModule.AnotherClass
      },
      'my-global-module/useful-value': {
        'default': MyGlobalModule.usefulValue
      }
    };
   */
  function generateLazyModuleFromGlobal(namespace, asModuleName) {
    if (asModuleName === undefined) {
      asModuleName = namespace;
    }

    var shims = {};
    var globalObject = (namespace.indexOf('.') === -1) ? window[namespace] : resolveGlobalNamespace(namespace);
    var keys = Object.keys(globalObject);

    shims[dasherize(asModuleName)] = '';

    for (var index in keys) {
      var key = keys[index];
      var shimKey = [
        dasherize(asModuleName),
        dasherize(key)
      ].join('/');
      var shimValue = '' + key;

      shims['' + shimKey] = shimValue;
    }

    for (var moduleName in shims) {
      generateLazyModule(namespace, asModuleName, moduleName, shims[moduleName], globalObject);
    }
  }

  function generateLazyModule(namespace, asModuleName, name, globalName, globalObject) {
    define(name, [], function() {
      'use strict';

      var exportObject = {};

      if (typeof globalName === 'object') {
        for (var i = 0, l = globalName.length; i < l; i++) {
          exportObject[globalName[i]] = globalObject[globalName[i]];
        }
      } else {
        exportObject['default'] = (globalName !== '') ? globalObject[globalName] : globalObject;
      }

      return exportObject;
    });
  }

  generateLazyModuleFromGlobal('d3');
  generateLazyModuleFromGlobal('moment');
  generateLazyModuleFromGlobal('moment.tz', 'moment-timezone');
  generateLazyModuleFromGlobal('Reflux');
  generateLazyModuleFromGlobal('classNames');
})();
