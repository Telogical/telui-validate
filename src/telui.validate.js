var TelogicalUi = angular.module('TelUI');
var _ = require('lodash');

TelogicalUi
  .service('TelUIValidate', [
    '$parse',
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

      var err = {
        noLabel: 'Value of type "object" given without a property to validate.',
        noId: 'The application must have an Id on each scope. for the validator to track.'
      };

      var __baseValidators = [
        {
          name: 'minLength',
          value: null,
          check: function minLengthCheck(value) {

            if (!value) {
              return true;
            }

            return value.length >= value;
          },
          message: 'This field is not long enough.'
        },
        {
          name: 'maxLength',
          value: null,
          check: function maxLengthCheck(value) {

            if (!value) {
              return true;
            }

            return value.length <= this.value;
          },
          message: 'This field is too long.'
        },
        {
          name: 'pattern',
          value: null,
          check: function patternCheck(value) {

            if (!value) {
              return true;
            }

            return value.match(this.value) !== null;
          },
          formatName: null, // 'a zip code', 'a phone number'
          message: 'This field does not meet the required format.'
        },
        {
          name: 'money',
          value: __validationClasses.money,
          check: function moneyCheck(value) {

            if (!value) {
              return true;
            }

            return (
              value === '-1' ||
              value.match(this.value) !== null
            );
          },
          formatName: 'money',
          message: 'This field is not money.'
        },
        {
          name: 'moneyrate',
          value: __validationClasses.moneyrate,
          check: function moneyRateCheck(value) {

            if (!value) {
              return true;
            }

            return (
              value === '-1' ||
              value.match(this.value) !== null
            );
          },
          formatName: 'moneyrate',
          message: 'This field is not money.'
        },
        {
          name: 'dateymd',
          value: __validationClasses.dateymd,
          check: function dateymdCheck(value) {

            if (!value) {
              return true;
            }

            if (value === '2222-02-02') {
              return true;
            }

            if (value.match(this.value) !== null) {
              return !isNaN(Date.parse(value));
            }
          },
          formatName: 'dateymd',
          message: 'This field is not a yyyy-mm-dd date.'
        },
        {
          name: 'rangePlus',
          value: __validationClasses.rangePlus,
          check: function rangeCheck(value) {

            if (!value) {
              return true;
            }

            var validLexicalForm = value.match(this.value) !== null;
            if (validLexicalForm) {
              if (value.indexOf('-') > -1) {
                var leftRight = value.split('-'),
                  left = parseInt(leftRight[0]),
                  right = parseInt(leftRight[1]);
                return left < right;
              } else {
                return true;
              }
            }

            return false;

          },
          message: 'This field is not a range.'
        },
        {
          name: 'required',
          value: null,
          check: function requiredCheck(value) {
            if (_.isArray(value)) {

              return value.length;

            }

            if (typeof value === 'object') {
              return !!value;
            }

            if (typeof value !== undefined) {
              return value ? value.trim().length > 0 : false;
            }

            return false;

          },
          message: 'This field is required.'
        }];

      function extend(scopeObj) {
        return _.extend(scopeObj, {
          'valid': '=?',
          'childids': '=?',
          'minLength': '@?',
          'maxLength': '@?',
          'required': '@?',
          'pattern': '@?',
          'rangePlus': '@?',
          'money': '@?',
          'moneyrate': '@?',
          'dateymd': '@?'
        });
      }

      function resetValidationStates($scope) {
        $scope.validatorStates = {};

        if ($scope.valid) {
          $scope.valid.validatorControlStates = $scope.valid.validatorControlStates || {};
        }
      }

      function addSelfAsChild($scope) {
        if (_.isArray($scope.childids)) {
          $scope.childids.push($scope.id);
        }
      }

      function checkValidationStates(controlStates) {
        var allValid = true;

        function checkControlStates(controlState) {
          allValid = allValid && controlState;
          if (!allValid) {
            return false;
          }
        }

        if (_.isUndefined(controlStates)) {
          return allValid;
        }

        _.each(controlStates, checkControlStates);

        return allValid;
      }

      function setValidationState($scope, controlIsValid) {
        $scope.state = controlIsValid ? 'default' : 'error';

        if (!$scope.valid) {
          $scope.valid = {};
          $scope.valid.isValid = true;
          return;
        }

        $scope.valid.validatorControlStates[$scope.id] = controlIsValid;
        $scope.valid.isValid = checkValidationStates($scope.valid.validatorControlStates);
      }

      function validate($scope, $attrs) {

        $scope.valid = $scope.valid || {};

        var noId = !$scope.id,
          controlIsDisabled = $scope.disabled,
          controlIsValid = true;
        
        resetValidationStates($scope);

        buildValidators($scope, $attrs);

        if (noId) {
          console.warn(err.noId);
          return;
        }

        if (controlIsDisabled) {
          setValidationState($scope, controlIsValid);
          return;
        }

        function performValidate(validator) {
          var _value = $scope.value;

          if (_.isObject($scope.value) && $scope.labelProp) {
            _value = $parse($scope.labelProp)($scope.value);
          }
            
          console.log('validator states is', $scope.validatorStates);
          console.log('validator name is', validator.name);
          console.log('value is', _value);
          $scope.validatorStates[validator.name] = validator.check(_value);
          controlIsValid = controlIsValid && $scope.validatorStates[validator.name];
        }

        _.each($scope.valid.validators, performValidate);

        setValidationState($scope, controlIsValid);
      }

      function buildValidators($scope, $attrs) {

        if (!$attrs) {
          return;
        }

        $scope.valid = $scope.valid || {};

        function byDeclaredValidators(validator) {
          var wasDeclared = !_.isUndefined($attrs[validator.name]);

          if (wasDeclared) {
            return validator;
          }
        }

        function toValuOverrides(validator) {
          if ($attrs[validator.name] !== '') {
            validator.value = $attrs[validator.name];
          }
          return validator;
        }

        resetValidationStates($scope);
        addSelfAsChild($scope);

        $scope.valid.validators = _
          .chain(__baseValidators)
          .filter(byDeclaredValidators)
          .map(toValuOverrides)
          .value();

      }

      function deleteChildStates(childStates, $scope) {
        console.log('childstates to delete', childStates, $scope);
        if (typeof $scope.valid.validatorControlStates !== 'undefined') {
          _.each(childStates, function deleteChildState(childState) {
            delete $scope.valid.validatorControlStates[childState];
          });
          $scope.valid.validators = [];
        }

        validate($scope);
      }
      this.deleteChildStates = deleteChildStates;

      this.validate = validate;
      this.extend = extend;
    }
  ]);