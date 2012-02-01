# Juggle

A promise-like library for running parallel tasks and
returning a result in order.

## Install

Installing with NPM is a breeze:

```
npm install juggle
```

## Usage

### Running two or more tasks in parallel

``` javascript
(new Juggle)
  .do(function (complete) {
    $.post('/api', function (response) {
      // Call complete when you want to hand a result back
      complete(response);
    });
  })
  .do(function (complete) {
    $.post('/api/v2', function (response) {
      complete(response);
    });
  })
  .complete(function (err, responses) {
    if (err) throw err;
    console.log(responses);
  });
```

### Using .success() and .fail()

``` javascript
(new Juggle)
  .do(function (complete) { complete(true); })
  .success(function (responses) { console.log(responses); });

(new Juggle)
  .do(function (complete) { complete(true); })
  .do(function (complete) { complete(false); })
  .fail(function (err, responses) { throw err; });
```

### Using .cancel()

``` javascript
(new Juggle)
  .do(function (complete) {
    var jqXHR = $.ajax({
      url: '/api',
      success: complete,
      error: function () { complete(false); }
    });

    // We return a cancel function that aborts the XHR
    return function () {
      jqXHR.abort();
    };
  })
  .do(function () {
    // Since this represents the Juggle instance we can call
    // methods like .cancel() from in here.
    // .cancel() will call all returned functions from .do()
    // callbacks
    this.cancel();
  })
  .fail(function (err) {
    throw err;
  });
```

### Using .timeout()

``` javascript
(new Juggle)
  .do(function (complete) {
    setTimeout(function () {
      complete('This will never get recorded');
    }, 30*1000);
  })
  .timeout(10*1000, function () {
    throw 'Timed out mofo';
  });
```

Also just like .cancel(), when a Juggle times out all returned
functions will be called. Here is the same example as above
but utilising a cancel function.

``` javascript
(new Juggle)
  .do(function (complete) {
    var t = setTimeout(function () {
      complete('This will never get recorded');
    }, 30*1000);

    return function () {
      clearTimeout(t);
    };
  })
  .timeout(10*1000, function () {
    throw 'Timed out mofo';
  });
```

### Using Juggle to load JS in parallel

``` javascript
function asyncJS(src, callback) {
  return function (complete) {
    var firstScript = s = document.getElementsByTagName('script')[0],
      newScript = document.createElement('script');
    
    newScript.type = 'text/javascript';
    newScript.async = true;
    newScript.src = src;
    newScript.onload = function () {
      complete(true);
    };

    firstScript.parentNode.insertBefore(newScript, firstScript);
  };
}

(new Juggle)
  .do(asyncJS('https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js'))
  .do(asyncJS('https://ajax.googleapis.com/ajax/libs/jqueryui/1/jquery-ui.min.js'))
  .success(function () {
    // Do something with jQuery and UI
    $('body').append('<h1>Loaded</h1>');
  })
  .fail(function () {
    alert('Could not load libraries from Google.');
  });
```


## Similar projects

 - https://github.com/kriszyp/node-promise
 - https://github.com/caolan/async

## License

MIT

## Author

Luke Morton a.k.a. DrPheltRight