var Service = require('node-windows').Service;
var path = require('path');

// Get the directory where this script is running
var serviceDir = __dirname;

// Create a new service object
var svc = new Service({
  name: 'SELRS API Server',
  description: 'API server for SELRS Accounting mobile app - Connects to MS Access database',
  script: path.join(serviceDir, 'server.js'),
  execPath: process.execPath,
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: [
    {
      name: "NODE_ENV",
      value: "production"
    }
  ],
  wait: 2,
  grow: .25
});

// Listen for the "install" event
svc.on('install', function(){
  console.log('Service installed successfully!');
  console.log('Starting service...');
  svc.start();
});

// Listen for the "start" event
svc.on('start', function(){
  console.log('Service started successfully!');
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║        SELRS API Server Service Installed                ║');
  console.log('║                                                           ║');
  console.log('║  The server will now start automatically on boot         ║');
  console.log('║                                                           ║');
  console.log('║  Manage the service:                                     ║');
  console.log('║  - Open Services (Win + R → services.msc)                ║');
  console.log('║  - Find "SELRS API Server"                               ║');
  console.log('║  - Right-click to Start/Stop/Restart                     ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
});

// Listen for errors
svc.on('error', function(err){
  console.error('Error installing service:', err);
  process.exit(1);
});

// Install the service
console.log('Installing SELRS API Server as Windows Service...');
console.log('');
svc.install();
