require('TelUI-Core');
var TelogicalUi = angular.module('TelUI');
var _ = require('lodash');

TelogicalUI
  .controller('teluiValidateCtrl', [
    '$scope',
    function teluiValidateCtrl($scope) {
      console.log('i am the controller for teluivalidate');
      console.log('i have the $scope of', $scope);

      $scope.$isValid = true;
      // TODO: Replace these with object definitions of validations

      $scope.state = $scope.$isValid ? $scope.statePass : $scopeStateFail;
    }
  ]);
