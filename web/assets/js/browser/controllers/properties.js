(function(angular, app) {
  'use strict';

  app.controller('mbPropertiesCtrl', ['$scope', '$log', '$filter', '$timeout', '$location',
    function($scope, $log, $filter, $timeout, $location) {
      var rawProperties;
      $scope.displayCreateForm = false;

      $scope.$on('search.change', function(e, value) {
        $scope.search = value;
      });

      $scope.toggleCreateForm = function() {
        $scope.displayCreateForm = !$scope.displayCreateForm;
      };

      $scope.backup = null;

      $scope.$on('drop.delete', function(e, element) {
        if (element.hasClass('property-item')) {
          $scope.deleteProperty(element.data('name'));
        }
      });

      $scope.types = [
        { name: 'undefined', value: 0},
        { name: 'String', value: 1},
        { name: 'Binary', value: 2},
        { name: 'Long', value: 3},
        { name: 'Double', value: 4},
        { name: 'Date', value: 5},
        { name: 'Boolean', value: 6},
        { name: 'Name', value: 7},
        { name: 'Path', value: 8},
        { name: 'Reference', value: 9},
        { name: 'WeakReference', value: 10},
        { name: 'URI', value: 11},
        { name: 'Decimal', value: 12},
      ];

      $scope.typeLabel = function(value) {
        if ($scope.types[value]) { return $scope.types[value].name; }
        return 'undefined';
      };

      var reloadProperties = function() {
        rawProperties = $scope.currentNode.getProperties();
        $scope.properties = normalize(rawProperties);
      };

      $scope.deleteProperty = function(name, path) {
        rawProperties[name].getValue(path).then(function(value) {
          var temp = { name: name, value: angular.copy(value), path: path, type: rawProperties[name].getType() };

          rawProperties[name].delete(path).then(function() {
            reloadProperties();
            if (!(path && path !== '/')) {
              $scope.backup = temp;
              $timeout(function() {
                $scope.backup = null;
              }, 10000);
              $location.hash('restore');
            }
            $log.log('Property deleted.');
          }, function(err) {
            if (err.status === 423) { return $log.warn(err, 'You can not delete this property. It is locked.'); }
            else if (err.data && err.data.message) { return $log.error(err, err.data.message); }
            $log.error(err);
          });
        }, $log.error);
      };

      $scope.createProperty = function(name, value, type, path) {
        if (!name || name.length === 0) {
          return $log.error('Name is empty');
        } else if (!value || value.length === 0) {
          return $log.error('Value is empty');
        }

        if (path) {
          path = path.split('/');
          path.pop();
          path = path.join('/');
          var datum = {};
          try {
            datum[name] = JSON.parse(value);
          } catch (e) {
            datum[name] = value;
          }

          return rawProperties[type].insert(path, datum).then(function() {
            reloadProperties();
            $log.log('Property created.');
          }, function(err) {
            if (err.data && err.data.message) { return $log.error(err, err.data.message); }
            $log.error(err);
          });
        }

        $scope.currentNode.createProperty(name, value).then(function() {
          $log.log('Property created');
          reloadProperties();
          $scope.name = $scope.value = undefined;
          $scope.displayCreateForm = false;
        }, function(err) {
          if (err.data && err.data.message) { return $log.error(err, err.data.message); }
          $log.error(err);
        });
      };

      $scope.restoreProperty = function() {
        // if ($scope.backup.path && $scope.backup.path !== '/') {
        //   $scope.backup.path = $scope.backup.path.split('/');
        //   $scope.backup.path.pop();
        //   $scope.backup.path = $scope.backup.path.join('/');
        //   return rawProperties[$scope.backup.name].insert($scope.backup.path, $scope.backup.value).then(function() {
        //     reloadProperties();
        //     $scope.backup = null;
        //     $log.log('Property restored.');
        //   }, function(err) {
        //     if (err.data && err.data.message) { return $log.error(err, err.data.message); }
        //     $log.error(err);
        //   });
        // }

        $scope.createProperty($scope.backup.name, $scope.backup.value, $scope.backup.type);
        $scope.backup = null;
      };

      var normalize = function(data, path, parentName, parentType) {
        var array = [];

        if (typeof(data) !== 'object') {
          return data;
        }

        for (var i in data) {
          var datum;
          if (!data) { continue; }
          if (!path) {
            datum = {
              name: i,
              value: normalize(data[i]._property.value, '/', i, data[i].getType()),
              type: data[i].getType(),
              path: '/'
            };
          } else {
            // Subproperty
            datum = {
              name: i,
              value: normalize(data[i], path + '/' + i, parentName, parentType),
              path: (path === '/') ? path + i : path + '/' + i,
              type: parentType,
              parentName: parentName
            };
          }
          array.push(datum);
        }
        return  array;
      };

      $scope.updateProperty = function(name, value, path) {
        rawProperties[name].update(path, value).then(function() {
          reloadProperties();
          $log.log('Property updated.');
        }, function(err) {
          if (err.data && err.data.message) { return $log.error(err, err.data.message); }
          $log.error(err);
        });
      };

      $scope.updatePropertyType = function(name, type) {
        rawProperties[name].setType(type).then(function() {
          reloadProperties();
          $log.log('Property updated.');
        }, function(err) {
          if (err.data && err.data.message) { return $log.error(err, err.data.message); }
          $log.error(err);
        });
      };

      $scope.$watch('currentNode', function(node) {
        if (node) {
          reloadProperties();
        }
      });

      $scope.typeof = function(o) { return typeof(o); };
    }]);
})(angular, angular.module('browserApp'));
