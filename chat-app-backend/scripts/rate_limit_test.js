const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/request-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const makeRequest = (i) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`Request ${i}: Status Code: ${res.statusCode}, Response: ${data}`);
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error(`Request ${i} error:`, error);
      reject(error);
    });

    req.write(JSON.stringify({
      email: `test${i}@example.com`
    }));
    req.end();
  });
};

async function testRateLimit() {
  console.log('Starting rate limit test for /api/auth/request-otp...');
  // The rate limit for /request-otp is 3 requests per 5 minutes.
  // We'll make 5 requests to ensure we hit the limit and verify the 429 response.
  
  for (let i = 1; i <= 5; i++) {
     await makeRequest(i);
  }
  
  console.log('Finished rate limit test.');
}

testRateLimit();
