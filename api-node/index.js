const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.json({ 
    service: 'Node.js Chat Service', 
    status: 'Active',
    time: new Date().toISOString() 
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Node.js Service listening on port ${port}`);
});
