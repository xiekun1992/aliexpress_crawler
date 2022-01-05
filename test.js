const a = require('async')

a.series([
  function(callback) {
      setTimeout(function() {
          callback(null, 'one');
      }, 200);
  },
  function(callback) {
      setTimeout(function() {
          callback(null, 'two');
      }, 100);
  }
]).then(results => {
  console.log(results);
  // results is equal to ['one','two']
}).catch(err => {
  console.log(err);
});