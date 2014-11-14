require('TelUI-Core');
var TelogicalUi = angular.module('TelUI');
var _ = require('lodash');

var validationClasses = require('./validation-classes.js');

TelogicalUi
  .directive('teluiValidate', [
    function teluiValidateDirective() {
      'use strict';
      return {
        restrict: 'A',
        scope: {
          validate: '=?', // comma-separated set of validation classes
          statePass: '=?',
          stateFail: '=?'
          pattern: '=?', // this should be a last resort
        },
        controller: './telui-validate-controller.js',
        link: function link($scope, $el, attrs) {

          $scope.statePass = $scope.statePass || 'default';
          $scope.stateFail = $scope.stateFail || 'error';

          console.log('telui-validate is working on element', $el);
          console.log('i should have statepass and fail set', $scope);
        }
      };
    }]);
