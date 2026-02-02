var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name: 'SELRS API Server',
  script: 'C:\\SELRS\\api-server\\server.js'
});

// Listen for the "uninstall" event
svc.on('uninstall', function(){
  console.log('Service uninstalled successfully!');
  console.log('The SELRS API Server service has been removed from Windows.');
});

// Listen for errors
svc.on('error', function(err){
  console.error('Error uninstalling service:', err);
});

// Uninstall the service
console.log('Uninstalling SELRS API Server Windows Service...');
console.log('');
svc.uninstall();
