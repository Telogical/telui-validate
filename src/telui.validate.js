var TelogicalUi = angular.module('TelUI');
var _ = require('lodash');

TelogicalUi
  .service('TelUIValidate', ['$parse',
     function teluiValidateService($parse) {
      'use strict';

      // Stylistically, for the alpha/numeric/alpha-numeric regexes I'm using the '*'
      // quantifier instead of '+'. Adding '+' would make the regex overlap with
      // checking for empty, which will be handled by "required"
      var __validationClasses = {
          'zip': /(^-1$|^\$(?!(-|\$))\d*\.?\d+)$/, // supports long and short
          'alpha-only': /^[a-zA-Z]$/,
          'numeric-only': /^[0-9]$/,
          'alpha-numeric': /^[a-zA-Z0-9_]*$/,
          'money': /^(?:-)?\$\d+(?:\.\d{2})?$/,
          'moneyrate': /^(?:(?:-)?\$\d+(?:\.\d{2})?$)|(?:^\d+%$)/,
          'rangePlus': /^\d+(?:(?:\+)?|(?:-\d+)?)$/,
          'dateymd': /^\d{4}-\d{2}-\d{2}$/
      };

      var __baseValidators = {
        'minLength': {
          scopeAttr: 'minlength',
          value: null,
          check: function minLengthCheck(value) {
            return value.length >= value;
          },
          message: 'This field is not long enough.' 
        },
        'maxLength': {
          scopeAttr: 'maxlength',
          value: null,
          check: function maxLengthCheck(value) {
            return value.length <= this.value;
          },
          message: 'This field is too long.' 
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
        'money': {
          scopeAttr: 'money',
          value: __validationClasses.money,
          check: function moneyCheck(value) {
            return (
              value === '-1' ||
              value.match(this.value) !== null
            );
          },
          formatName: 'money',
          message: 'This field is not money.'
        },
        'moneyrate': {
          scopeAttr: 'moneyrate',
          value: __validationClasses.moneyrate,
          check: function moneyRateCheck(value) {
            return (
              value === '-1' ||
              value.match(this.value) !== null
            );
          },
          formatName: 'moneyrate',
          message: 'This field is not money.'
        },
        'dateymd': {
          scopeAttr: 'dateymd',
          value: __validationClasses.dateymd,
          check: function dateymdCheck(value) {
            if(value === '2222-2-2') {
              return true;
            }

            if(value.match(this.value) !== null) {
              return !isNaN(Date.parse(value));
            }
          },
          formatName: 'dateymd',
          message: 'This field is not a yyyy-mm-dd date.'
        },
        'rangePlus': {
          scopeAttr: 'rangePlus',
          value: __validationClasses.rangePlus,
          check: function rangeCheck(value) {
            var validForm = value.match(this.value) !== null;
            if(validForm) {
              if(value.indexOf('-') > -1) {
                var leftRight = value.split('-');
                var left = parseInt(leftRight[0]);
                var right = parseInt(leftRight[1]);
                return left < right;
              } else {
                return true;
              }
            } else {
              return false;
            }
          },
          formatName: 'rangePlus', 
          message: 'This field is not a range.'
        },
        'required': {
          scopeAttr: 'required',
          value: null,
          check: function requiredCheck(value) {
            if(typeof value !== undefined) {
              //return value.match(__validationClasses.required) !== null;
              return value.trim().length > 0;
            } else {
              return false;
            }
          },
          message: 'This field is required.'
        }
      };

      this.attach = function attach(scopeObj) {
        // TODO: Loop over the base validators
        _.extend(scopeObj, { 
          'valid': '=?',
          'childids': '=?',
          'minLength': '@',
          'maxlength': '@',
          'required': '@',
          'pattern': '@',
          'rangePlus': '@',
          'money': '@',
          'moneyrate': '@',
          'dateymd': '@'
        });

        return scopeObj;
      };

      this.resetValidationStates = function resetValidationStates($scope) {
        $scope.validatorStates = {};

        if($scope.valid) {
          $scope.valid.validatorControlStates = $scope.valid.validatorControlStates || {};
        }
      };

      this.addSelfAsChild = function addSelfAsChild($scope) {
        if(typeof $scope.childids !== 'undefined') {
          $scope.childids.push($scope.id);
        }
      };

      this.deleteChildStates = function deleteChildStates(childStates, $scope) {
        if(typeof $scope.valid.validatorControlStates !== 'undefined') {
          _.each(childStates, function deleteChildState(childState) {
            delete $scope.valid.validatorControlStates[childState];
          });
        }

        this.validate($scope);
      };

      this.checkValidationStates = function checkValidationStates(controlStates) {
        if(typeof controlStates === 'undefined') {
          return true;
        }

        var allValid = true;
        _.each(controlStates, function checkControlStates(controlState) {
          allValid = allValid && controlState;
          if(!allValid) {
            return false;
          }
        });

        return allValid;
      };

      this.buildValidators = function buildValidators($scope) {
        $scope.validators = {};
        this.resetValidationStates($scope);

        this.addSelfAsChild($scope);

         _.each(__baseValidators, function buildValidator(validatorDef, validatorName) {
           if(typeof $scope[validatorDef.scopeAttr] !== 'undefined') {
            $scope.validators[validatorName] = _.clone(validatorDef);

            // Set value to the given attribute. Treat blanks as true. This
            // may seem strange but attributes like 'required' will just be
            // tossed on and assumed true
            if($scope.validators[validatorName].value === null) {
              $scope.validators[validatorName].value =
                $scope[validatorDef.scopeAttr] === '' ?
                  true : $scope[validatorDef.scopeAttr];
             }
           }
         });
      };


      this.validate = function validate($scope) {
        if($scope.disabled) {
          return;
        }

        if(typeof $scope.valid === 'undefined' ||
           typeof $scope.valid.validatorControlStates === 'undefined') {
          return;
        }

        var controlValid = true;
        _.each($scope.validators, function performValidate(validator, validatorName) {

          if(typeof($scope.value) === 'object') {
             if(typeof $scope.labelProp === 'undefined') {
               throw new Error('Value of type "object" given without a property to validate.');
             } else {
               var getActualValue = $parse($scope.labelProp);
               var actualValue = getActualValue($scope.value);
               $scope.validatorStates[validatorName] = validator.check(actualValue);
             }
          } else {
            $scope.validatorStates[validatorName] = validator.check($scope.value);
          } 

          controlValid = controlValid && $scope.validatorStates[validatorName];
        });
        
        if(typeof $scope.id !== 'undefined' && $scope.id) {
          $scope.valid.validatorControlStates[$scope.id] = controlValid;
        }
        $scope.state = controlValid ? 'default' : 'error';
        
        if(typeof $scope.valid !== 'undefined') {
          $scope.valid.isValid = this.checkValidationStates($scope.valid.validatorControlStates);
        }
      };

    }
  ]);

