const http = require('http');
const url = require('url');
const { Worker } = require('worker_threads');

const server = http.createServer(function (request, response) {                                                                                              
  const { pathname, query } = url.parse(request.url, true);

  if (pathname === '/primes') {                                                                                                                                    
    const worker = new Worker('./work.js', { workerData: { n: query.n || 1 } });

    worker.on('error', function (err) {
      response.statusCode = 500;
      console.log(err)
      response.write('Oops there was an error...');
      response.end();
    });

    let result;
    worker.on('message', function (message) {
      result = message;
    });

    worker.on('exit', function () {
      response.setHeader('Content-Type', 'application/json');
    //   console.log(result, '--')
      response.write(JSON.stringify(result));
      response.end();
    });
  } else {
    response.statusCode = 404;
    response.write('Not Found');
    response.end();
  }
});

server.listen(8080);