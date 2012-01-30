# Juggle asynchnous results

Check out lib/juggle.js and test/index.html for more of an
idea what I'm on about.

I'll get round to a real README.md later.

## Install

  npm install

## Example

``` javascript
(new Juggle)

  // You add a task using .add()
  .add(function (complete) {
    $.post('/api', function (response) {
      // Call complete when you want to hand a result back
      complete(response.success);
    });
  })

  // Here's another
  .add(function (complete) {
    var timeout = setTimeout(function () {
      complete(true);
    }, 5000);

    // You can return a cancel method that will be called
    // if this juggle times out or .cancel() is called
    return function () {
      clearTimeout(timeout);
    };
  })

  .add(function (complete) {
    if (false) {
      // this represents the Juggle instance, so you can
      // call it's methods here, cancel for example runs
      // all the 
      this.cancel();
    }

    // Doesn't have to be asynchronous but you must call
    // complete() always
    complete(true);
  })

  // The success callback is only called if all responses
  // are not "falsy", if a response is an array each value
  // is checked recursively for a "falsy" value
  .success(function (response) {
    console.log('It was a success');
  })

  // Fail is called if any response is "falsy"
  .fail(function (response) {
    console.log('This will not be logged');

    if (this.cancelled) {
      console.log('Was cancelled');
    }
  })

  // Called after 30 seconds
  .timeout(30*1000, function () {
    console.log('Took more than 30 seconds');
  })

  // Once all tasks have reported back their responses
  // and success boolean are passed to a callback
  .complete(function (success, responses) {
    console.log('The juggle was completed');
    console.log('Successful:', success);
    console.log('Responses:', responses);
  })

  // You can bind as many callbacks as you like, the same
  // goes for .success() and .fail()
  .complete(function (success, responses) {
    console.log('Complete');
  });
```
## License

MIT

## Author

Luke Morton a.k.a. DrPheltRight