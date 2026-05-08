const {
  shareAll,
  withModuleFederationPlugin,
} = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  name: 'jobtasks-management-mfe',

  exposes: {
    './JobTasksApp': './src/app/app.component.ts',
  },

  shared: {
    // Share all Angular singletons as normal
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
    // lucide-angular must NOT be a singleton — each MFE needs its own icon registry
    // If shared as singleton, the host's (empty) instance wins and icons are lost
    'lucide-angular': {
      singleton: false,
      strictVersion: false,
    },
  },
});
