// Juggle a number of callbacks asynchronously
// Written by Luke Morton, MIT licensed.
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

	function allValuesTruthy(responses) {
		var i = 0,
			length = responses.length,
			response,
			success = true;

		for (i; i < length; i++) {
			if ( ! responses[i]) {
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
				c.call(this, allValuesTruthy(this.responses), this.responses);
			}
		}
	}

	Juggle.prototype.add = function (callback) {
		var _this = this,
			i = this.callbackLength++,
			cancelMethod;

		cancelMethod = callback.call(this, function (response) {
			_this.responses[i] = response;
			checkComplete.call(_this);
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