// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
if (!Object.keys) {
  Object.keys = (function() {
    'use strict';
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function(obj) {
      if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {
        throw new TypeError('Object.keys called on non-object');
      }

      var result = [], prop, i;

      for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }

      if (hasDontEnumBug) {
        for (i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) {
            result.push(dontEnums[i]);
          }
        }
      }
      return result;
    };
  }());
}

if (!String.isNullOrEmpty) {
    String.isNullOrEmpty = function(value) {
        return !(typeof value === 'string' && value.length > 0);
    }
}

if(!String.prototype.isNullOrEmpty) {
    String.prototype.isNullOrEmpty = function() {
        return !(typeof this === 'string' && this.length > 0);
    }
}

// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.io/#x15.4.4.19
if (!Array.prototype.map) {
  Array.prototype.map = function(callback/*, thisArg*/) {

    var T, A, k;

    if (this == null) {
      throw new TypeError('this is null or not defined');
    }

    // 1. Let O be the result of calling ToObject passing the |this|
    //    value as the argument.
    var O = Object(this);

    // 2. Let lenValue be the result of calling the Get internal
    //    method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0;

    // 4. If IsCallable(callback) is false, throw a TypeError exception.
    // See: http://es5.github.com/#x9.11
    if (typeof callback !== 'function') {
      throw new TypeError(callback + ' is not a function');
    }

    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    if (arguments.length > 1) {
      T = arguments[1];
    }

    // 6. Let A be a new array created as if by the expression new Array(len)
    //    where Array is the standard built-in constructor with that name and
    //    len is the value of len.
    A = new Array(len);

    // 7. Let k be 0
    k = 0;

    // 8. Repeat, while k < len
    while (k < len) {

      var kValue, mappedValue;

      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal
      //    method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      if (k in O) {

        // i. Let kValue be the result of calling the Get internal
        //    method of O with argument Pk.
        kValue = O[k];

        // ii. Let mappedValue be the result of calling the Call internal
        //     method of callback with T as the this value and argument
        //     list containing kValue, k, and O.
        mappedValue = callback.call(T, kValue, k, O);

        // iii. Call the DefineOwnProperty internal method of A with arguments
        // Pk, Property Descriptor
        // { Value: mappedValue,
        //   Writable: true,
        //   Enumerable: true,
        //   Configurable: true },
        // and false.

        // In browsers that support Object.defineProperty, use the following:
        // Object.defineProperty(A, k, {
        //   value: mappedValue,
        //   writable: true,
        //   enumerable: true,
        //   configurable: true
        // });

        // For best browser support, use the following:
        A[k] = mappedValue;
      }
      // d. Increase k by 1.
      k++;
    }

    // 9. return A
    return A;
  };
}

// Inject Object.values / Object.entries functions (Part of ES6 Spec not in current Node version)
const reduce = Function.bind.call(Function.call, Array.prototype.reduce);
const isEnumerable = Function.bind.call(Function.call, Object.prototype.propertyIsEnumerable);
const concat = Function.bind.call(Function.call, Array.prototype.concat);
const keys = Reflect.ownKeys;

if (!Object.values) {
	Object.values = function values(O) {
		return reduce(keys(O), (v, k) => concat(v, typeof k === 'string' && isEnumerable(O, k) ? [O[k]] : []), []);
	};
}
if (!Object.entries) {
	Object.entries = function entries(O) {
		return reduce(keys(O), (e, k) => concat(e, typeof k === 'string' && isEnumerable(O, k) ? [[k, O[k]]] : []), []);
	};
}
if (!Object.isEmpty) {
    Object.isEmpty = function isEmpty(o) {
        return Object.keys(o).every((x) => o[x]===''||o[x]===null);
    };
}

/***********************************************************************************
* Add Array.indexOf                                                                *
***********************************************************************************/
(function () {
	if (typeof Array.prototype.indexOf !== 'function') {
		Array.prototype.indexOf = function(searchElement, fromIndex) {
			for (var i = (fromIndex || 0), j = this.length; i < j; i += 1) {
				if ((searchElement === undefined) || (searchElement === null)) {
					if (this[i] === searchElement) {
						return i;
					}
				} else if (this[i] === searchElement) {
					return i;
				}
			}
			return -1;
		};
	}
})();
/**********************************************************************************/

(function ($,undefined) {
	var toasting = {
		gettoaster : function () {
			var toaster = $('#' + settings.toaster.id);

			if(toaster.length < 1) {
				toaster = $(settings.toaster.template).attr('id', settings.toaster.id).css(settings.toaster.css).addClass(settings.toaster['class']);

				if ((settings.stylesheet) && (!$("link[href=" + settings.stylesheet + "]").length)) {
					$('head').appendTo('<link rel="stylesheet" href="' + settings.stylesheet + '">');
				}

				$(settings.toaster.container).append(toaster);
			}

			return toaster;
		},

		notify : function (title, message, priority, icon) {
			var $toaster  = this.gettoaster();
			var delimiter = (title && message) ? settings.toast.defaults.delimiter : '';
			var $toast    = $(settings.toast.template.replace('%icon%', icon).replace('%priority%', priority).replace('%delimiter%', delimiter)).hide().css(settings.toast.css).addClass(settings.toast['class']);

			$('.title', $toast).css(settings.toast.csst).html(title);
			$('.message', $toast).css(settings.toast.cssm).html(message);

			if ((settings.debug) && (window.console)) {
				console.log(toast);
			}

			$toaster.append(settings.toast.display($toast));

			if (settings.donotdismiss.indexOf(priority) === -1) {
				var timeout = (typeof settings.timeout === 'number') ? settings.timeout : ((typeof settings.timeout === 'object') && (priority in settings.timeout)) ? settings.timeout[priority] : 1500;
				setTimeout(function() {
					settings.toast.remove($toast, function() {
						$toast.remove();
					});
				}, timeout);
			}
		}
	};

	var defaults = {
		'toaster': {
			'id': 'toaster',
			'container': 'body',
			'template': '<div></div>',
			'class': 'toaster',
			'css': {
				'position': 'fixed',
				'top': '10px',
				'right': '10px',
				'zIndex': 50000,
			},
		},
		'toast': {
			'template' :
			'<div class="alert alert-%priority% alert-dismissible" role="alert">' +
            	'<div class="container-fluid">' +
            		'<div class="alert-icon">' +
            			'<i class="%icon%"></i>' +
            		'</div>' +
            		'<strong><span class="title"></span></strong>%delimiter% <span class="message"></span>' +
            		'<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
            				'<span aria-hidden="true">' +
            				'<i class="now-ui-icons ui-1_simple-remove"></i>' +
            			'</span>' +
            		'</button>' +
            	'</div>' +
            '</div>',
			'defaults': {
				'title': 'Notice',
				'priority': 'success',
				'delimiter': ':',
                'icon': 'now-ui-icons ui-2_like',
			},
			'css': {},
			'cssm': {},
			'csst': {
                'fontWeight': 'bold',
            },
			'fade': 'slow',
			'display': function ($toast) {
				return $toast.fadeIn(settings.toast.fade);
			},
			'remove': function ($toast, callback) {
				return $toast.animate({
					opacity: '0',
					padding: '0px',
					margin: '0px',
					height: '0px'
				},
				{
					duration: settings.toast.fade,
					complete: callback,
				});
			}
		},
		'debug': false,
		'timeout': 3500,
		'stylesheet': null,
		'donotdismiss': [],
	};

	var settings = {};
	$.extend(settings, defaults);

	$.toaster = function (options) {
		if (typeof options === 'object') {
			if ('settings' in options) {
				settings = $.extend(true, settings, options.settings);
			}
		} else {
			var values = Array.prototype.slice.call(arguments, 0);
			var labels = ['message', 'title', 'priority', 'icon'];
			options = {};

			for (var i = 0, l = values.length; i < l; i += 1) {
				options[labels[i]] = values[i];
			}
		}

		var title    = (('title' in options) && (typeof options.title === 'string')) ? options.title : settings.toast.defaults.title;
		var message  = ('message' in options) ? options.message : null;
		var priority = (('priority' in options) && (typeof options.priority === 'string')) ? options.priority : settings.toast.defaults.priority;
		var icon = (('icon' in options) && (typeof options.icon === 'string')) ? options.icon : settings.toast.defaults.icon;

		if (message !== null) {
			toasting.notify(title, message, priority, icon);
		}
	};

	$.toaster.reset = function () {
		settings = {};
		$.extend(settings, defaults);
	};
})(jQuery);

Handlebars.registerHelper('compare', function (lvalue, operator, rvalue, options) {
    var operators, result;

    if (arguments.length < 3) {
        throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
    }

    if (options === undefined) {
        options = rvalue;
        rvalue = operator;
        operator = "===";
    }

    operators = {
        '==': function (l, r) { return l == r; },
        '===': function (l, r) { return l === r; },
        '!=': function (l, r) { return l != r; },
        '!==': function (l, r) { return l !== r; },
        '<': function (l, r) { return l < r; },
        '>': function (l, r) { return l > r; },
        '<=': function (l, r) { return l <= r; },
        '>=': function (l, r) { return l >= r; },
        'typeof': function (l, r) { return typeof l == r; },
        'in': function (l, r) { return (l in r); },
    };

    if (!operators[operator]) {
        throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
    }

    result = operators[operator](lvalue, rvalue);

    if (result) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }

});
