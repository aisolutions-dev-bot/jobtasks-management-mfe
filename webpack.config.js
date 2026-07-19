const {
  shareAll,
  withModuleFederationPlugin,
} = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  name: 'jobtasks-management-mfe',

  exposes: {
    './JobTasksApp': './src/app/app.component.ts',
    './TaskReleaseComponent': './src/app/task-release-component/task-release-component.ts',
    './TaskReleaseAddComponent': './src/app/task-release-component/task-release-add-component/task-release-add-component.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
});
