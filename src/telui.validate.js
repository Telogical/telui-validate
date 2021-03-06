var TelogicalUi = angular.module('TelUI');
var _ = require('lodash');

console.log('defining teluiValidate');
TelogicalUi
  .service('TelUIValidate', [function teluiValidateService() {
      'use strict';

      // Stylistically, for the alpha/numeric/alpha-numeric regexes I'm using the '*'
      // quantifier instead of '+'. Adding '+' would make the regex overlap with
      // checking for empty, which will be handled by "required"
      var __validationClasses = {
          'zip': /(^-1$|^\$(?!(-|\$))\d*\.?\d+)$/, // supports long and short
          'alpha-only': /^[a-zA-Z]$/,
          'numeric-only': /^[0-9]$/,
          'alpha-numeric': /^[a-zA-Z0-9_]*$/,
          'required': /^\S+$/ // require only non-whitespace.
      };

      var __baseValidators = {
        'minLength': {
          scopeAttr: 'minlength',
          value: null,
          check: function minLengthCheck(value) {
            return value.length >= value;
          },
          message: 'This field is not long enough.' // TODO: Come upwith function taht calculates whether it's 'characters' or 'character'
        },
        'maxLength': {
          scopeAttr: 'maxlength',
          value: null,
          check: function maxLengthCheck(value) {
            return value.length <= this.value;
          },
          message: 'This field is too long.' // TODO: Come upwith function taht calculates whether it's 'characters' or 'character'
        },
        'pattern': {
          scopeAttr: 'pattern',
          value: null,
          check: function patternCheck(value) {
            return value.match(this.value) !== null;
          },
          formatName: null, // 'a zip code', 'a phone number'
          message: 'This field does not meet the required format.'
        },
        'required': {
          scopeAttr: 'required',
          value: null,
          check: function requiredCheck(value) {
            if(typeof value !== undefined) {
              return value.match(__validationClasses.required) !== null;
            } else {
              return false;
            }
          },
          message: 'This field is required.'
        }
      };

      this.attach = function attach(scopeObj) {
        _.extend(scopeObj, { 
          'valid': '=?',
          'minLength': '@',
          'maxlength': '@',
          'required': '@',
          'pattern': '@'
        });

        return scopeObj;
      };

      this.buildValidators = function buildValidators($scope) {
        $scope.validators = {};
        $scope.validatorStates = {};
        $scope.valid = true;

         _.each(__baseValidators, function buildValidator(validatorDef, validatorName) {
           if(typeof $scope[validatorDef.scopeAttr] !== 'undefined') {
            $scope.validators[validatorName] = _.clone(validatorDef);

            // Set value to the given attribute. Treat blanks as true. This
            // may seem strange but attributes like 'required' will just be
            // tossed on and assumed true
            $scope.validators[validatorName].value =
              $scope[validatorDef.scopeAttr] === '' ?
                true : $scope[validatorDef.scopeAttr];
           }
         });
      };

      this.validate = function validate($scope) {
        var allValid = true;

        _.each($scope.validators, function performValidate(validator, validatorName) {
          $scope.validatorStates[validatorName] = validator.check($scope.value);
          allValid = allValid && $scope.validatorStates[validatorName];
        });

        $scope.valid = allValid;
        $scope.state = $scope.valid ? 'default' : 'error';
      };

    }
  ]);

