const {
  shareAll,
  withModuleFederationPlugin,
} = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  name: 'jobtasks-management-mfe',

  exposes: {
    './JobTasksApp': './src/app/components/jobtasks-root-component/jobtasks-root-component.ts',
    './JobTasksBoardComponent': './src/app/app.component.ts',
    './TaskReleaseComponent': './src/app/components/task-release-component/task-release-component.ts',
    './TaskReleaseAddComponent': './src/app/components/task-release-component/task-release-add-component/task-release-add-component.ts',
    './TaskReleaseViewComponent': './src/app/components/task-release-component/task-release-view-component/task-release-view-component.ts',
    './TaskReleaseAddTasksComponent': './src/app/components/task-release-component/task-release-view-component/task-release-add-tasks-component/task-release-add-tasks-component.ts',
    './TaskReleaseEditComponent': './src/app/components/task-release-component/task-release-edit-component/task-release-edit-component.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
});
