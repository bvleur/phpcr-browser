(function(app) {
  'use strict';

  app.provider('mbApiFoundation', function() {
    var server = '/api';
    var repositoriesPrefix = 'repositories';
    var workspacesPrefix = 'workspaces';
    var nodesPrefix = 'nodes';

    this.setServer = function(value) {
      server = value;
    };

    this.setRepositoriesPrefix = function(value) {
      repositoriesPrefix = value;
    };

    this.setWorkspacesPrefix = function(value) {
      workspacesPrefix = value;
    };

    this.setNodesPrefix = function(value) {
      nodesPrefix = value;
    };

    this.$get = ['$q', 'Restangular', function($q, Restangular) {
      Restangular.setBaseUrl(server);

      var repositories = Restangular.all(repositoriesPrefix);
      var repository = function(repository) {
        return Restangular.one(repositoriesPrefix, repository);
      };
      var workspaces = function(repositoryName) {
        return repository(repositoryName).all(workspacesPrefix);
      };
      var workspace = function(repositoryName, name) {
        return repository(repositoryName).one(workspacesPrefix, name);
      };
      var node = function(repositoryName, workspaceName, path) {
        if (path.slice(0,1) === '/') {
          path = path.slice(1);
        }
        return workspace(repositoryName, workspaceName).one(nodesPrefix, path);
      };
      var nodeProperties = function(repositoryName, workspaceName, path) {
        if (path.slice(0,1) === '/') {
          path = path.slice(1);
        }
        return workspace(repositoryName, workspaceName).all(nodesPrefix).all(path + '@properties');
      };
      var nodeProperty = function(repositoryName, workspaceName, path, propertyName) {
        if (path.slice(0,1) === '/') {
          path = path.slice(1);
        }
        return workspace(repositoryName, workspaceName).all(nodesPrefix).one(path + '@properties', propertyName);
      };

      return {
        getRepositories: function(config) {
          config = config || {};
          return repositories.withHttpConfig(config).getList();
        },
        getRepository: function(name, config) {
          config = config || {};
          return repository(name).withHttpConfig(config).get();
        },
        getWorkspaces: function(repositoryName, config) {
          config = config || {};
          return workspaces(repositoryName).withHttpConfig(config).getList();
        },
        getWorkspace: function(repositoryName, name, config) {
          config = config || {};
          return workspace(repositoryName, name).withHttpConfig(config).get();
        },
        createWorkspace: function(repositoryName, name, config) {
          config = config || {};
          return workspaces(repositoryName).withHttpConfig(config).post({ name: name });
        },
        deleteWorkspace: function(repositoryName, name, config) {
          config = config || {};
          return workspace(repositoryName, name).withHttpConfig(config).remove();
        },
        getNode: function(repositoryName, workspaceName, path, config) {
          config = config || {};
          return node(repositoryName, workspaceName, path).withHttpConfig(config).get({reducedTree: true});
        },
        createNode: function(repositoryName, workspaceName, parentPath, relPath, config) {
          config = config || {};
          node(repositoryName, workspaceName, parentPath).withHttpConfig(config).post({ relPath: relPath});
        },
        deleteNode: function(repositoryName, workspaceName, path, config) {
          config = config || {};
          return node(repositoryName, workspaceName, path).withHttpConfig(config).remove();
        },
        moveNode: function(repositoryName, workspaceName, path, newPath, config) {
          config = config || {};
          return node(repositoryName, workspaceName, path).withHttpConfig(config).put({
            method: 'move',
            destAbsPath: newPath
          });
        },
        renameNode: function(repositoryName, workspaceName, path, newName, config) {
          config = config || {};
          return node(repositoryName, workspaceName, path).withHttpConfig(config).put({
            method: 'rename',
            newName: newName
          });
        },
        createNodeProperty: function(repositoryName, workspaceName, path, propertyName, propertyValue, propertyType, config) {
          config = config || {};
          if (propertyType) {
            return nodeProperties(repositoryName, workspaceName, path).withHttpConfig(config).post({ name: propertyName, value: propertyValue, type: propertyType });
          }
          return nodeProperties(repositoryName, workspaceName, path).withHttpConfig(config).post({ name: propertyName, value: propertyValue });
        },
        deleteNodeProperty: function(repositoryName, workspaceName, path, propertyName, config) {
          config = config || {};
          return nodeProperty(repositoryName, workspaceName, path, propertyName).withHttpConfig(config).remove();
        },
        updateNodeProperty: function(repositoryName, workspaceName, path, propertyName, propertyValue, propertyType, config) {
          config = config || {};
          return nodeProperties(repositoryName, workspaceName, path).withHttpConfig(config).post({ name: propertyName, value: propertyValue, type: propertyType });
        },
      };
    }];
  });
})(angular.module('browserApp'));