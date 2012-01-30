// Juggle a number of callbacks asynchronously
// Written by Luke Morton, MIT licensed.
//
//  (new Juggle)
//
//    // You add a task using .add()
//    .add(function (complete) {
//      $.post('/api', function (response) {
//        // Call complete when you want to hand a result back
//        complete(response.success);
//      });
//    })
//
//    // Here's another
//    .add(function (complete) {
//      var timeout = setTimeout(function () {
//        complete(true);
//      }, 5000);
//
//      // You can return a cancel method that will be called
//      // if this juggle times out or .cancel() is called
//      return function () {
//        clearTimeout(timeout);
//      };
//    })
//
//    .add(function (complete) {
//      if (false) {
//        // this represents the Juggle instance, so you can
//        // call it's methods here, cancel for example runs
//        // all the 
//        this.cancel();
//      }
//
//      // Doesn't have to be asynchronous but you must call
//      // complete() always
//      complete(true);
//    })
//
//    // The success callback is only called if all responses
//    // are not "falsy", if a response is an array each value
//    // is checked recursively for a "falsy" value
//    .success(function (response) {
//      console.log('It was a success');
//    })
//
//    // Fail is called if any response is "falsy"
//    .fail(function (response) {
//      console.log('This will not be logged');
//      
//      if (this.cancelled) {
//        console.log('Was cancelled');
//      }
//    })
//
//    // Called after 30 seconds
//    .timeout(30*1000, function () {
//      console.log('Took more than 30 seconds');
//    })
//
//    // Once all tasks have reported back their responses
//    // and success boolean are passed to a callback
//    .complete(function (success, responses) {
//      console.log('The juggle was completed');
//      console.log('Successful:', success);
//      console.log('Responses:', responses);
//    })
//
//    // You can bind as many callbacks as you like, the same
//    // goes for .success() and .fail()
//    .complete(function (success, responses) {
//      console.log('Complete');
//    });
//
!function (definition) {
	if (typeof module != 'undefined' && module.exports) module.exports = definition();
	else if (typeof define == 'function') define(definition);
	else this.Juggle = definition();
}(function () {
	var context = this,
		old = context.Juggle;

	function Juggle(settings) {
		var i;

		this.responses = [];
		this.callbackLength = 0;
		this.completeCallbacks = [];
		this.cancelMethods = [];
		this.cancelled = false;
		this.settings = {};

		if (settings) {
			for (i in Juggle.defaultSettings) {
				if (settings.hasOwnProperty(i)) {
					this.settings[i] = settings[i];
				} else {
					this.settings[i] = Juggle.defaultSettings[i];
				}
			}
		}
	}

	Juggle.defaultSettings = {
		cancelTimeout: 30*1000
	};

	function handleResponse(index, response) {
		this.responses[index] = response;
		checkComplete.call(this);
	}

	function countDefined(values) {
		var i = 0,
			length = values.length
			count = 0;

		for (i; i < length; i++) {
			if (typeof values[i] !== 'undefined') {
				count++;
			}
		}

		return count;
	}

	function checkSuccess(responses) {
		var i = 0,
			length,
			response,
			success = true;

		for (i; i < length; i++) {
			response = responses[i];

			if ( ! response || (countDefined(response) && ! checkSuccess(response))) {
				success = false;
			}
		}

		return success;
	}

	function checkComplete() {
		var completeCallbacks = this.completeCallbacks.reverse(),
			returnedResponses = countDefined(this.responses);
		
		if (this.cancelled) {
			while (c = completeCallbacks.pop()) {
				c.call(this, false, this.responses);
			}
		} else if (returnedResponses && (returnedResponses === this.callbackLength)) {
			while (c = completeCallbacks.pop()) {
				c.call(this, checkSuccess(this.responses), this.responses);
			}
		}
	}

	Juggle.prototype.add = function (callback) {
		var _this = this,
			i = this.callbackLength++,
			cancelMethod;

		cancelMethod = callback.call(this, function (response) {
			handleResponse.call(_this, i, response);
		});

		if (cancelMethod) {
			this.cancelMethods.push(cancelMethod);
		}

		return this;
	};

	Juggle.prototype.complete = function (callback) {
		this.completeCallbacks.push(callback);
		checkComplete.call(this);

		return this;
	};

	Juggle.prototype.fail = function (callback) {
		this.complete(function (success, response) {
			if (success === false) {
				callback.call(this, response);
			}
		});

		return this;
	};

	Juggle.prototype.success = function (callback) {
		this.complete(function (success, response) {
			if (success === true) {
				callback.call(this, response);
			}
		});

		return this;
	};

	// Timeout defaults to 30 seconds
	Juggle.prototype.cancel = function (timeout, callback) {
		var _this = this,
			cancelMethods = this.cancelMethods,
			i = 0,
			cancelMethodsLength = cancelMethods.length,
			juggle;

		if (typeof timeout === 'function') {
			callback = timeout;
			timeout = null;
		}

		timeout = timeout || this.settings.cancelTimeout;

		this.cancelled = true;

		if (callback) {
			// Add as a fail callback
			_this.fail(callback);
		}

		if ( ! cancelMethodsLength) {
			checkComplete.call(this);
		} else {
			// Handle asynchronous cancel with a new Juggle instance
			juggle = new Juggle;

			for (i; i < cancelMethodsLength; i++) {
				juggle.add(function (complete) {
					cancelMethods[i].call(_this, complete);
				});
			}

			juggle.timeout(timeout);

			juggle.complete(function () {
				checkComplete.call(_this);
			});
		}

		return this;
	};

	// Timeout must be specified
	Juggle.prototype.timeout = function (timeout, callback) {
		var _this = this;
		setTimeout(function () {
			_this.cancel(null, callback);
		}, timeout);

		return this;
	};

	Juggle.noConflict = function () {
		context.Juggle = old;

		return this;
	};

	return Juggle;
})