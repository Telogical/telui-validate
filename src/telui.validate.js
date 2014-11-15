require('TelUI-Core');
var TelogicalUi = angular.module('TelUI');
var _ = require('lodash');

TelogicalUi
  .directive('teluiValidate', [
    '$parse',
    function teluiValidateDirective($parse) {
      'use strict';

      // Stylistically, for the alpha/numeric/alpha-numeric regexes I'm using the '*'
      // quantifier instead of '+'. Adding '+' would make the regex overlap with
      // checking for empty, which will be handled by "required"
      var validationClasses = {
          'zip': /(^-1$|^\$(?!(-|\$))\d*\.?\d+)$/, // supports long and short
          'alpha-only': /^[a-zA-Z]$/,
          'numeric-only': /^[0-9]$/,
          'alpha-numeric': /^[a-zA-Z0-9_]*$/,
          'required': /^\S+$/ // require only non-whitespace.
      };

      return {
        restrict: 'A',
        scope: false,
        link: function link($scope, $el, attrs) {
          function validate(newValue) {
            var validationStates =  _.object(_.map($scope.validatorNames, function validateRule(ruleName) {
              var matched = newValue.match(validationClasses[ruleName]) !== null;
              return [ruleName, matched];
            }));

            return validationStates;
          }

          function checkValidate() {
            var getValToCheck = $parse(attrs.value); // get the value expression
            var newValue = getValToCheck($scope); // eval that expr on $scope

            $scope.validationResults = validate(newValue);

            $scope.state = $scope.statePass;
            _.each($scope.validationResults, function checkResult(result, ruleName) {
              if(result === false) {
                $scope.state = $scope.stateFail;
              }
            });

          }

          function checkForAttributes() {
            if(typeof attrs.validate === 'undefined') {
              throw Error('To use the telui-validate attribute you must supply an attribute name via the \'validate\' attribute. See documentation.');
            }
          }

          $scope.statePass = attrs.statePass || 'success';
          $scope.stateFail = attrs.stateFail || 'error';

          checkForAttributes();

          $scope.validatorNames = attrs.validate.split(' ');

          $scope.$watch('value', checkValidate, true);
        }
      };
    }]);
