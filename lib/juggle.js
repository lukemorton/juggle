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

		this.settings          = {};
		this.callbackLength    = 0;
		this.responses         = [];
		this.completeCallbacks = [];
		this.cancelMethods     = [];

		// States of a Juggle instance
		this.cancelled = false;
		this.timedout  = false;
		this.immutable = false;

		for (i in Juggle.defaultSettings) {
			if (settings && settings.hasOwnProperty(i)) {
				this.settings[i] = settings[i];
			} else {
				this.settings[i] = Juggle.defaultSettings[i];
			}
		}
	}

	Juggle.defaultSettings = {
		cancelTimeout: 30*1000,
		safe: true
	};

	function immutableAssert(inst) {
		if (inst.settings.safe && inst.immutable) {
			throw 'Cannot change an immutable Juggle instance'
		}
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
		var completeCallbacks = this.completeCallbacks,
			returnedResponses = countDefined(this.responses),
			err;
		
		if (this.timedout) {
			err = 'Timed out';

		} else if (this.cancelled) {
			err = 'Cancelled';

		} else if (returnedResponses && (returnedResponses === this.callbackLength)) {
			if ( ! allValuesTruthy(this.responses)) {
				err = 'Not all responses truthy';
			}
		} else {
			// Otherwise do nothing
			return;
		}

		// Turn Juggle instance immutable
		this.immutable = true;

		// Run all callbacks on first come first serve basis
		while (c = completeCallbacks.shift()) {
			c.call(this, err, this.responses);
		}
	}

	Juggle.prototype.do = function (callback) {
		immutableAssert(this);

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
		this.complete(function (err, response) {
			if (err != null) {
				callback.call(this, err, response);
			}
		});

		return this;
	};

	Juggle.prototype.success = function (callback) {
		this.complete(function (success, response) {
			if (err == null) {
				callback.call(this, response);
			}
		});

		return this;
	};

	// Timeout defaults to 30 seconds
	Juggle.prototype.cancel = function (timeout, callback) {
		immutableAssert(this);

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

		if ( ! this.timedout) {
			this.cancelled = true;
		}

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
				juggle.do(function (complete) {
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
		immutableAssert(this);

		var _this = this;
		setTimeout(function () {
			_this.timedout = true;
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