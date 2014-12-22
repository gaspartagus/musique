function * fibonacci() {
  var i = 1,
  		j = 0;
  while (true) {
  	var temp = i;
  	i+=j;
  	j = temp;
    yield i;
  }
}


var adder = fibonacci();

for(var k = 0; k< 10; k ++){
	console.log(adder.next().value)
}

var promise = new Promise(function(resolve, reject) {
  resolve(1);
});

promise.then(function(val) {
  // console.log(val); // 1
  return val + 2;
}).then(function(val) {
  // console.log(val); // 3
});









function errorHandler(e) {
  var msg = '';

  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  };

  console.log('Error: ' + msg,e);
}



