import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path';
// path, 
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.ico?asset'
import { execFile } from 'child_process'
import fs from 'fs'
import axios from 'axios'
// import { spawn, exec } from 'child_process'
// import os from 'os'
// import { AlgoKit } from '@algorandfoundation/algokit-utils'
// import { FRY_TOKEN_ID } from './config/getAlgoClientConfigs'
// import { exec, execSync } from 'child_process'
// import axios from 'axios'

// Import database service with robust path resolution
let databaseService;
try {
  // Try to require from the same directory (development)
  databaseService = require('./database');
} catch (error) {
  try {
    // Try to require from the parent directory (production build)
    databaseService = require('../database');
  } catch (secondError) {
    try {
      // Try to require using absolute path
      const databasePath = is.dev 
        ? join(__dirname, 'database.js')
        : join(__dirname, '../database.js');
      databaseService = require(databasePath);
    } catch (thirdError) {
      console.error('Failed to load database service:', thirdError);
      // Create a mock database service for fallback
      databaseService = {
        connect: async () => { console.log('Mock database service - connect'); return false; },
        disconnect: async () => { console.log('Mock database service - disconnect'); },
        saveWallet: async () => ({ success: false, message: 'Database not available' }),
        getWallet: async () => ({ success: false, message: 'Database not available' }),
        updateWalletBalance: async () => ({ success: false, message: 'Database not available' }),
        getAllWallets: async () => ({ success: false, message: 'Database not available' }),
        testConnection: async () => ({ success: false, message: 'Database not available' })
      };
    }
  }
}

// Global BigInt declaration for linter
/* global BigInt */

// Helper function to safely serialize objects with BigInt values
function safeStringify(obj, space = 2) {
  try {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    }, space);
  } catch (error) {
    console.error('Error in safeStringify:', error);
    return JSON.stringify({ error: 'Failed to serialize object', message: error.message });
  }
}

// WireGuard configuration
// const CONF_NAME = "bbb.conf";

function createWindow() {
  const preloadPath = is.dev
    ? join(app.getAppPath(), 'src/preload/index.js')    // ✅ Dev mode
    : join(__dirname, '../preload/index.js');   // ✅ Production

  console.log('🔧 Preload path:', preloadPath);
  console.log('📄 Preload file exists:', fs.existsSync(preloadPath));

  const mainWindow = new BrowserWindow({
    width: 1224,
    height: 700,
    minWidth: 1224,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      devTools: is.dev,
      webSecurity: false
    }
  });

  // Only open DevTools in development mode
  if (is.dev) {
    mainWindow.webContents.openDevTools();
  }
  
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window close event
  mainWindow.on('close', async (event) => {
    console.log('Window close event triggered');
    event.preventDefault();
    
    try {
      await forceDisconnectWireGuard();
      mainWindow.destroy();
    } catch (error) {
      console.error('Error during window close cleanup:', error);
      mainWindow.destroy();
    }
  });

  // Handle window closed event
  mainWindow.on('closed', () => {
    console.log('Window closed event triggered');
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// WireGuard IPC handlers using API and command line
let wgPath = is.dev
  ? join(app.getAppPath(), 'src/wg-bin/wireguard.exe')
  : join(process.resourcesPath, 'wg-bin/wireguard.exe');

// Try multiple possible paths for production
if (!is.dev) {
  const possiblePaths = [
    join(process.resourcesPath, 'wg-bin/wireguard.exe'),
    join(process.resourcesPath, 'src/wg-bin/wireguard.exe'),
    join(app.getAppPath(), 'wg-bin/wireguard.exe'),
    join(app.getAppPath(), 'src/wg-bin/wireguard.exe'),
    join(__dirname, '../wg-bin/wireguard.exe'),
    join(__dirname, '../../wg-bin/wireguard.exe')
  ];
  
  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      wgPath = path;
      console.log('✅ Found WireGuard executable at:', wgPath);
      break;
    }
  }
}

console.log('🔧 WireGuard path:', wgPath);
console.log('📄 WireGuard executable exists:', fs.existsSync(wgPath));
console.log('📁 process.resourcesPath:', process.resourcesPath);
console.log('📁 app.getAppPath():', app.getAppPath());

// Check if WireGuard is running
async function checkWireGuardStatus() {
  console.log('Checking WireGuard status...');
  
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    // Use multiple methods to check if WireGuard is running
    const checkCommands = [
      'tasklist /fi "imagename eq wireguard.exe"',
      'tasklist /fi "imagename eq wg.exe"',
      'sc query "WireGuardTunnel$*"',
      'netstat -ano | findstr :51820'
    ];
    
    // Use Promise.all to wait for all checks to complete
    const checkPromises = checkCommands.map(async (command, index) => {
      try {
        const { stdout } = await execAsync(command);
        console.log(`Check ${index + 1} (${command}) output:`, stdout);
        
        if (stdout) {
          const hasProcess = stdout.toLowerCase().includes('wireguard.exe') || 
                           stdout.toLowerCase().includes('wg.exe') ||
                           stdout.toLowerCase().includes('running') ||
                           stdout.toLowerCase().includes('51820');
          
          if (hasProcess) {
            console.log(`WireGuard detected running via command ${index + 1}:`, command);
            return true;
          }
        }
        return false;
      } catch (error) {
        console.log(`Check ${index + 1} (${command}) failed:`, error.message);
        return false;
      }
    });
    
    // Wait for all checks to complete
    const results = await Promise.all(checkPromises);
    const isRunning = results.some(result => result === true);
    
    console.log('WireGuard status check results:', results);
    console.log('WireGuard running (final result):', isRunning);
    
    return isRunning;
  } catch (error) {
    console.error('Error in checkWireGuardStatus:', error);
    return false; // Assume not running if check fails
  }
}

// Check if running with administrator privileges
function isRunningAsAdmin() {
  try {
    // Method 1: Try to access a protected system directory
    const testPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
    fs.accessSync(testPath, fs.constants.W_OK);
    console.log('✅ Admin privileges confirmed via file access test');
    return true;
  } catch (error) {
    console.log('❌ Admin privileges not detected via file access test');
    
    // Method 2: Try to use Windows command to check admin status
    try {
      const { execSync } = require('child_process');
      execSync('net session', { stdio: 'ignore' });
      console.log('✅ Admin privileges confirmed via net session test');
      return true;
    } catch (netError) {
      console.log('❌ Admin privileges not detected via net session test');
      return false;
    }
  }
}

// Check admin privileges on app startup
// function checkAdminPrivileges() {
//   if (!isRunningAsAdmin()) {
//     console.log('⚠️ Application is not running with administrator privileges');
//     
//     // Show a dialog to inform the user
//     dialog.showMessageBox({
//       type: 'warning',
//       title: 'Administrator Privileges Required',
//       message: 'DVPN requires administrator privileges to function properly.',
//       detail: 'Please close this application and run it as administrator:\n\n1. Right-click on the DVPN icon\n2. Select "Run as administrator"\n3. Click "Yes" when prompted\n\nThis is required for WireGuard VPN functionality.',
//       buttons: ['OK'],
//       defaultId: 0
//     }).then(() => {
//       // Exit the application
//       app.quit();
//     });
//     
//     return false;
//   }
//   
//   console.log('✅ Application is running with administrator privileges');
//   return true;
// }

ipcMain.handle('connect-wg', async (event, data) => {
  console.log('connect-wg handler called');
  console.log('Connection data:', data);
  
  try {
    // Get wallet address from the request data
    const walletAddress = data?.walletAddress || 'unknown-wallet';
    console.log('Using wallet address for peer:', walletAddress);
    
    // 1. Create peer and get config in response using wallet address
    const { data: peer } = await axios.post('http://54.211.138.164:8000/create-peer', { 
      wallet_address: walletAddress 
    });
    
    console.log('Peer created successfully:', peer);
    
    // 2. Save conf to temp file
    const tempConfigPath = require('path').join(app.getPath('temp'), 'wireguard.conf');
    fs.writeFileSync(tempConfigPath, peer.conf);
    console.log('Config saved to:', tempConfigPath);
    
    // 3. Start WireGuard
    return new Promise((resolve, reject) => {
      execFile(wgPath, ['/installtunnelservice', tempConfigPath], (err, stdout, stderr) => {
        if (err) {
          console.error('WireGuard service start failed:', stderr || err.message);
          
          // Check for specific permission errors
          const errorMessage = stderr || err.message;
          if (errorMessage.includes('Access is denied') || errorMessage.includes('access denied')) {
            const permissionError = new Error(
              'WireGuard requires administrator privileges to install network services.\n\n' +
              'Please:\n' +
              '1. Close this application\n' +
              '2. Right-click on the Fry dVPN icon\n' +
              '3. Select "Run as administrator"\n' +
              '4. Try connecting again'
            );
            return reject(permissionError);
          }
          
          // Check for "tunnel already installed" error
          if (errorMessage.includes('Tunnel already installed') || errorMessage.includes('already running')) {
            const tunnelError = new Error(
              'A WireGuard tunnel is already running. Please disconnect first and try again.\n\n' +
              'The application will attempt to disconnect the existing tunnel automatically.'
            );
            return reject(tunnelError);
          }
          
          return reject(new Error(stderr || err.message));
        }
        console.log('WireGuard connected:', stdout);
        resolve('Tunnel connected successfully.');
      });
    });
  } catch (err) {
    console.error('Connection error:', err);
    return Promise.reject("Failed to connect: " + err.message);
  }
});

// WireGuard disconnect handler
ipcMain.handle('disconnect-wg', async () => {
  console.log('disconnect-wg handler called');
  
  try {
    // Always attempt to disconnect, regardless of status check
    console.log('Forcing WireGuard disconnect...');
    
    // Use the same WireGuard path as connect function
    console.log('Using WireGuard path for disconnect:', wgPath);
    
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    // Method 1: First, try to list and stop all WireGuard tunnels
    try {
      console.log('Attempting to list and stop all WireGuard tunnels...');
      
      // Try to get list of installed tunnels
      try {
        const { stdout: listOutput } = await execAsync('sc query type= service state= all | findstr /i wireguard');
        console.log('Installed WireGuard services:', listOutput);
      } catch (listError) {
        console.log('Could not list WireGuard services:', listError.message);
      }
      
      // Try multiple service name patterns
      const serviceNames = [
        'Fry dVPN',
        'wireguard', 
        'WireGuardTunnel$Fry dVPN',
        'WireGuardTunnel$wireguard',
        'WireGuardTunnel$FRY-VPN',
        'WireGuardTunnel$FRY_VPN',
        'WireGuardTunnel$FRYVPN'
      ];
      
      let serviceStopped = false;
      for (const serviceName of serviceNames) {
        try {
          console.log(`Trying to stop service: ${serviceName}`);
          const { stdout, stderr } = await execAsync(`"${wgPath}" /uninstalltunnelservice "${serviceName}"`);
          console.log(`WireGuard service stop for ${serviceName} stdout:`, stdout);
          if (stderr) console.log(`WireGuard service stop for ${serviceName} stderr:`, stderr);
          serviceStopped = true;
          // Don't break - try all service names to ensure complete cleanup
        } catch (serviceError) {
          console.log(`Service stop failed for ${serviceName}:`, serviceError.message);
          continue; // Try next service name
        }
      }
      
      if (!serviceStopped) {
        console.log('All service stop attempts failed, trying alternative methods...');
      }
      
      // Wait a moment for the service to stop
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if WireGuard is still running
      const stillRunning = await checkWireGuardStatus();
      if (!stillRunning) {
        console.log('✅ WireGuard service stopped successfully');
        return { success: true, message: 'WireGuard disconnected successfully' };
      } else {
        console.log('⚠️ WireGuard service still running, trying process kill...');
      }
    } catch (serviceError) {
      console.log('Service stop failed, trying process kill:', serviceError.message);
    }
    
    // Method 2: Kill WireGuard processes aggressively
    try {
      console.log('Attempting to kill WireGuard processes aggressively...');
      
      // Kill all WireGuard related processes with multiple attempts
      const killCommands = [
        'taskkill /f /im wireguard.exe /t',
        'taskkill /f /im wg.exe /t',
        'taskkill /f /im "WireGuard*" /t',
        'wmic process where "name like \'%wireguard%\'" delete',
        'wmic process where "name like \'%wg%\'" delete',
        'taskkill /f /im wireguard.exe',
        'taskkill /f /im wg.exe',
        'taskkill /f /im "WireGuard*"'
      ];
      
      for (const command of killCommands) {
        try {
          const { stdout, stderr } = await execAsync(command);
          console.log(`Kill command "${command}" stdout:`, stdout);
          if (stderr) console.log(`Kill command "${command}" stderr:`, stderr);
        } catch (killError) {
          console.log(`Kill command "${command}" failed:`, killError.message);
        }
      }
      
      // Wait for processes to terminate
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if WireGuard is still running
      const stillRunning = await checkWireGuardStatus();
      if (!stillRunning) {
        console.log('✅ WireGuard processes killed successfully');
        return { success: true, message: 'WireGuard processes terminated' };
      } else {
        console.log('⚠️ WireGuard processes still running, trying service stop...');
      }
    } catch (killError) {
      console.log('Process kill failed:', killError.message);
    }
    
    // Method 3: Stop services via sc command
    try {
      console.log('Attempting to stop services via sc command...');
      const scCommands = [
        'sc stop "WireGuardTunnel$Fry dVPN"',
        'sc stop "WireGuardTunnel$wireguard"',
        'sc stop "WireGuardTunnel$FRY-VPN"',
        'sc stop "WireGuardTunnel$FRY_VPN"',
        'sc stop "WireGuardTunnel$FRYVPN"',
        'sc stop "WireGuardManager"',
        'sc delete "WireGuardTunnel$Fry dVPN"',
        'sc delete "WireGuardTunnel$wireguard"',
        'sc delete "WireGuardTunnel$FRY-VPN"',
        'sc delete "WireGuardTunnel$FRY_VPN"',
        'sc delete "WireGuardTunnel$FRYVPN"'
      ];
      
      for (const command of scCommands) {
        try {
          const { stdout, stderr } = await execAsync(command);
          console.log(`SC command "${command}" stdout:`, stdout);
          if (stderr) console.log(`SC command "${command}" stderr:`, stderr);
        } catch (scError) {
          console.log(`SC command "${command}" failed:`, scError.message);
        }
      }
    } catch (scError) {
      console.log('SC stop failed:', scError.message);
    }
    
    // Method 4: Final aggressive cleanup
    try {
      console.log('Attempting final aggressive cleanup...');
      
      // Try to kill any remaining processes with different methods
      const finalCommands = [
        'powershell -Command "Get-Process | Where-Object {$_.ProcessName -like \'*wireguard*\'} | Stop-Process -Force"',
        'powershell -Command "Get-Process | Where-Object {$_.ProcessName -like \'*wg*\'} | Stop-Process -Force"',
        'wmic process where "name like \'%wireguard%\'" call terminate',
        'wmic process where "name like \'%wg%\'" call terminate'
      ];
      
      for (const command of finalCommands) {
        try {
          const { stdout, stderr } = await execAsync(command);
          console.log(`Final command "${command}" stdout:`, stdout);
          if (stderr) console.log(`Final command "${command}" stderr:`, stderr);
        } catch (finalError) {
          console.log(`Final command "${command}" failed:`, finalError.message);
        }
      }
    } catch (finalError) {
      console.log('Final cleanup failed:', finalError.message);
    }
    
    // Final check with longer wait
    await new Promise(resolve => setTimeout(resolve, 3000));
    const finalCheck = await checkWireGuardStatus();
    
    if (!finalCheck) {
      console.log('✅ WireGuard successfully disconnected');
      return { success: true, message: 'WireGuard disconnected successfully' };
    } else {
      console.log('❌ WireGuard still running after all attempts');
      return { 
        success: false, 
        message: 'WireGuard is still running. Please manually close WireGuard from Task Manager or restart your computer.' 
      };
    }
    
  } catch (err) {
    console.error('Disconnection error:', err);
    return { 
      success: false, 
      message: `Disconnect failed: ${err.message}` 
    };
  }
});

// Force disconnect WireGuard (for cleanup)
async function forceDisconnectWireGuard() {
  console.log('Force disconnecting WireGuard...');
  
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    // Try multiple methods to ensure WireGuard is stopped
    
    // Method 1: Stop service using correct path
    try {
      console.log('Force disconnect: Stopping WireGuard service...');
      // Try multiple service names
      const serviceNames = [
        'Fry dVPN',
        'wireguard', 
        'WireGuardTunnel$Fry dVPN',
        'WireGuardTunnel$wireguard',
        'WireGuardTunnel$FRY-VPN',
        'WireGuardTunnel$FRY_VPN',
        'WireGuardTunnel$FRYVPN'
      ];
      
      for (const serviceName of serviceNames) {
        try {
          await execAsync(`"${wgPath}" /uninstalltunnelservice "${serviceName}"`);
          console.log(`WireGuard service stopped successfully for ${serviceName}`);
        } catch (error) {
          console.log(`Service stop failed for ${serviceName}:`, error.message);
        }
      }
    } catch (error) {
      console.log('Service stop failed:', error.message);
    }
    
    // Method 2: Kill processes aggressively
    try {
      console.log('Force disconnect: Killing WireGuard processes...');
      const killCommands = [
        'taskkill /f /im wireguard.exe /t',
        'taskkill /f /im wg.exe /t',
        'taskkill /f /im "WireGuard*" /t',
        'wmic process where "name like \'%wireguard%\'" delete',
        'wmic process where "name like \'%wg%\'" delete',
        'taskkill /f /im wireguard.exe',
        'taskkill /f /im wg.exe',
        'taskkill /f /im "WireGuard*"'
      ];
      
      for (const command of killCommands) {
        try {
          await execAsync(command);
          console.log(`Force disconnect: ${command} successful`);
        } catch (error) {
          console.log(`Force disconnect: ${command} failed:`, error.message);
        }
      }
    } catch (error) {
      console.log('Process kill failed:', error.message);
    }
    
    // Method 3: Stop services via sc command
    try {
      console.log('Force disconnect: Stopping services via sc...');
      const scCommands = [
        'sc stop "WireGuardTunnel$Fry dVPN"',
        'sc stop "WireGuardTunnel$wireguard"',
        'sc stop "WireGuardTunnel$FRY-VPN"',
        'sc stop "WireGuardTunnel$FRY_VPN"',
        'sc stop "WireGuardTunnel$FRYVPN"',
        'sc stop "WireGuardManager"',
        'sc delete "WireGuardTunnel$Fry dVPN"',
        'sc delete "WireGuardTunnel$wireguard"',
        'sc delete "WireGuardTunnel$FRY-VPN"',
        'sc delete "WireGuardTunnel$FRY_VPN"',
        'sc delete "WireGuardTunnel$FRYVPN"'
      ];
      
      for (const command of scCommands) {
        try {
          await execAsync(command);
          console.log(`Force disconnect: ${command} successful`);
        } catch (error) {
          console.log(`Force disconnect: ${command} failed:`, error.message);
        }
      }
    } catch (error) {
      console.log('Service stop via sc failed:', error.message);
    }
    
    // Method 4: Final aggressive cleanup
    try {
      console.log('Force disconnect: Final aggressive cleanup...');
      const finalCommands = [
        'powershell -Command "Get-Process | Where-Object {$_.ProcessName -like \'*wireguard*\'} | Stop-Process -Force"',
        'powershell -Command "Get-Process | Where-Object {$_.ProcessName -like \'*wg*\'} | Stop-Process -Force"',
        'wmic process where "name like \'%wireguard%\'" call terminate',
        'wmic process where "name like \'%wg%\'" call terminate'
      ];
      
      for (const command of finalCommands) {
        try {
          await execAsync(command);
          console.log(`Force disconnect: ${command} successful`);
        } catch (error) {
          console.log(`Force disconnect: ${command} failed:`, error.message);
        }
      }
    } catch (error) {
      console.log('Final cleanup failed:', error.message);
    }
    
    // Wait a moment and verify WireGuard is stopped
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if WireGuard is still running
    const isStillRunning = await checkWireGuardStatus();
    if (isStillRunning) {
      console.log('WireGuard still running, trying additional cleanup...');
      
      // Additional aggressive cleanup
      try {
        console.log('Force disconnect: Using wmic to delete processes...');
        await execAsync('wmic process where "name like \'%wireguard%\'" delete');
        console.log('WireGuard processes deleted via wmic');
      } catch (error) {
        console.log('wmic cleanup failed:', error.message);
      }
      
      // Final attempt with different service name
      try {
        console.log('Force disconnect: Trying alternative service name...');
        await execAsync('sc stop "WireGuardTunnel$FRY-VPN"');
        console.log('Alternative service stop successful');
      } catch (error) {
        console.log('Alternative service stop failed:', error.message);
      }
    } else {
      console.log('WireGuard successfully stopped');
    }
    
    console.log('WireGuard cleanup completed');
  } catch (error) {
    console.error('Error during WireGuard cleanup:', error);
  }
}

// App cleanup handlers
app.on('before-quit', async (event) => {
  console.log('App before-quit event triggered');
  event.preventDefault();
  
  try {
    await forceDisconnectWireGuard();
    await databaseService.disconnect();
    app.exit(0);
  } catch (error) {
    console.error('Error during app cleanup:', error);
    app.exit(1);
  }
});

app.on('window-all-closed', async () => {
  console.log('All windows closed, cleaning up...');
  
  try {
    await forceDisconnectWireGuard();
    await databaseService.disconnect();
    app.quit();
  } catch (error) {
    console.error('Error during window cleanup:', error);
    app.quit();
  }
});

// Handle process termination signals
process.on('SIGINT', async () => {
  console.log('SIGINT received, cleaning up...');
  try {
    await forceDisconnectWireGuard();
    await databaseService.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during SIGINT cleanup:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, cleaning up...');
  try {
    await forceDisconnectWireGuard();
    await databaseService.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during SIGTERM cleanup:', error);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  try {
    await forceDisconnectWireGuard();
    await databaseService.disconnect();
  } catch (cleanupError) {
    console.error('Error during exception cleanup:', cleanupError);
  }
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason) => {
  console.error('Unhandled promise rejection:', reason);
  try {
    await forceDisconnectWireGuard();
    await databaseService.disconnect();
  } catch (cleanupError) {
    console.error('Error during rejection cleanup:', cleanupError);
  }
  process.exit(1);
});

// WireGuard status handler
ipcMain.handle('get-wg-status', async () => {
  console.log('get-wg-status handler called');
  
  try {
    const isRunning = await checkWireGuardStatus();
    console.log('WireGuard status check result:', isRunning);
    
    return { 
      success: true, 
      isConnected: isRunning,
      message: isRunning ? 'WireGuard is running' : 'WireGuard is not running'
    };
  } catch (err) {
    console.error('Status check error:', err);
    return { 
      success: false, 
      isConnected: false,
      message: 'Failed to check WireGuard status: ' + err.message 
    };
  }
});

// Check admin privileges handler
ipcMain.handle('check-admin-privileges', async () => {
  console.log('check-admin-privileges handler called');
  
  try {
    const isAdmin = isRunningAsAdmin();
    console.log('Running as admin:', isAdmin);
    
    return { 
      success: true, 
      isAdmin: isAdmin,
      message: isAdmin ? 'Running with administrator privileges' : 'Not running with administrator privileges'
    };
  } catch (err) {
    console.error('Admin check error:', err);
    return { 
      success: false, 
      isAdmin: false,
      message: 'Failed to check administrator privileges: ' + err.message 
    };
  }
});

// Handle opening external URLs (for Pera wallet deep links)
ipcMain.handle('open-external', async (_, url) => {
  console.log('Opening external URL:', url);
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('Failed to open external URL:', error);
    return { success: false, error: error.message };
  }
});

// Create new wallet handler
ipcMain.handle('create-wallet', async () => {
  console.log('create-wallet handler called');
  
  try {
    console.log('Attempting to import AlgoKit...');
    
    // Import AlgoKit for wallet creation
    const { AlgorandClient } = await import('@algorandfoundation/algokit-utils');
    console.log('AlgoKit imported successfully');
    
    // Configure AlgoKit
    const algokit = await import('@algorandfoundation/algokit-utils');
    console.log('Configuring AlgoKit...');
    algokit.Config.configure({ 
      populateAppCallResources: true,
      debug: true
    });
    console.log('AlgoKit configured');
    
    // Use explicit Algorand mainnet configuration
    const algorandClient = AlgorandClient.fromConfig({
      algodConfig: {
        server: 'https://mainnet-api.algonode.cloud',
        port: 443,
        token: '',
        network: 'mainnet'
      }
    });
    
    console.log('Algorand client created for wallet generation');
    
    // Generate a new wallet
    console.log('Generating new wallet...');
    const wallet = algorandClient.account.generate();
    console.log('New wallet generated successfully');
    console.log('Wallet object:', wallet);
    console.log('Wallet address:', wallet.addr);
    console.log('Wallet mnemonic:', wallet.mnemonic);
    console.log('Seed phrase length:', wallet.mnemonic ? wallet.mnemonic.split(' ').length : 'undefined', 'words');
    
    // Validate wallet data
    if (!wallet.addr || !wallet.mnemonic) {
      console.error('Generated wallet is missing address or mnemonic');
      throw new Error('Generated wallet is invalid - missing address or mnemonic');
    }
    
    const result = { 
      success: true, 
      address: wallet.addr,
      seedPhrase: wallet.mnemonic,
      message: 'New wallet created successfully!'
    };
    
    console.log('Returning wallet result:', result);
    return result;
    
  } catch (err) {
    console.error('Wallet creation error details:', err);
    console.error('Error stack:', err.stack);
    
    // Try fallback wallet generation using crypto
    console.log('Trying fallback wallet generation...');
    try {
      // Import algosdk for proper address generation
      const algosdk = require('algosdk');
      
      // Create a proper Algorand account
      const generatedAccount = algosdk.generateAccount();
      const seedPhrase = algosdk.secretKeyToMnemonic(generatedAccount.sk);
      const walletAddress = algosdk.encodeAddress(generatedAccount.addr.publicKey);
      
      console.log('Fallback wallet generated with algosdk');
      console.log('Address:', walletAddress);
      console.log('Address length:', walletAddress.length);
      console.log('Address format check:', /^[A-Z2-7]{58}$/.test(walletAddress));
      
      const fallbackResult = {
        success: true,
        address: walletAddress,
        seedPhrase: seedPhrase,
        message: 'New wallet created successfully! (Fallback method)'
      };
      
      console.log('Fallback wallet created:', fallbackResult);
      return fallbackResult;
      
    } catch (fallbackError) {
      console.error('Fallback wallet creation also failed:', fallbackError);
      
      let errorMessage = 'Wallet creation failed: ';
      if (err.message.includes('network')) {
        errorMessage += 'Network connection error. Please check your internet connection.';
      } else if (err.message.includes('import')) {
        errorMessage += 'Failed to import AlgoKit library.';
      } else {
        errorMessage += err.message;
      }
      
      return { success: false, message: errorMessage };
    }
  }
});

// FRY token transfer handler for Pera wallet
ipcMain.handle('transfer-fry-pera', async (event, data) => {
  console.log('transfer-fry-pera handler called');
  
  try {
    const FRY_TOKEN_ID = 2485314946; // FRY token ID as number
    const RECIPIENT_WALLET = 'F3RFSU3VN2HXTIVNXUJ2MQUIVMQNMR33QWDQ5D26TSXZD43FA3DGJJSZJM';
    const TRANSFER_AMOUNT = 1; // 1 FRY token as number
    
    console.log('Starting FRY transfer with Pera wallet...');
    console.log('Token ID:', FRY_TOKEN_ID);
    console.log('Recipient:', RECIPIENT_WALLET);
    console.log('Amount:', TRANSFER_AMOUNT);
    console.log('Network: Algorand Mainnet');
    console.log('Pera Wallet Address:', data.address);
    
    // Create the transaction for Pera wallet
    const transaction = {
      from: data.address,
      to: RECIPIENT_WALLET,
      assetIndex: FRY_TOKEN_ID,
      amount: TRANSFER_AMOUNT,
      type: 'axfer', // Asset transfer
      network: 'mainnet'
    };
    
    console.log('Transaction created for Pera wallet:', transaction);
    
    // Send transaction to renderer for Pera wallet signing
    // The renderer will handle the Pera wallet interaction
    return new Promise((resolve) => {
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        ipcMain.removeListener('pera-transfer-response', responseHandler);
        console.log('Pera transfer request timed out');
        resolve({ 
          success: false, 
          message: 'Transfer request timed out. Please try again.' 
        });
      }, 30000); // 30 second timeout
      
      // Listen for response from renderer using ipcMain.on
      const responseHandler = (event, result) => {
        clearTimeout(timeout);
        ipcMain.removeListener('pera-transfer-response', responseHandler);
        console.log('Received Pera transfer response:', result);
        resolve(result);
      };
      
      ipcMain.on('pera-transfer-response', responseHandler);
      
      // Send request to renderer
      event.sender.send('pera-transfer-request', {
        transaction,
        recipient: RECIPIENT_WALLET,
        amount: TRANSFER_AMOUNT.toString(),
        tokenId: FRY_TOKEN_ID.toString()
      });
    });
    
  } catch (err) {
    console.error('Pera FRY transfer error details:', err);
    console.error('Error stack:', err.stack);
    
    let errorMessage = 'Pera FRY transfer failed: ';
    if (err.message && err.message.includes('network')) {
      errorMessage += 'Network connection error. Please check your internet connection.';
    } else if (err.message && err.message.includes('insufficient')) {
      errorMessage += 'Insufficient FRY tokens in Pera wallet.';
    } else if (err.message && err.message.includes('invalid')) {
      errorMessage += 'Invalid Pera wallet or configuration.';
    } else if (err.message && err.message.includes('user rejected')) {
      errorMessage += 'Transaction was rejected by user in Pera wallet.';
    } else {
      errorMessage += err.message || 'Unknown error occurred';
    }
    
    return { success: false, message: errorMessage };
  }
});

// FRY token transfer handler
ipcMain.handle('transfer-fry', async (event, data) => {
  console.log('=== TRANSFER-FRY HANDLER CALLED ===');
  console.log('🔥🔥🔥 NEW VERSION - FORCE TRANSFER 🔥🔥🔥');
  console.log('transfer-fry handler called');
  console.log('Data received:', data);
  console.log('Seed phrase length:', data.seedPhrase ? data.seedPhrase.split(' ').length : 'undefined');
  
  try {
    const FRY_TOKEN_ID = 2485314946; // FRY token ID as number
    const RECIPIENT_WALLET = 'E2F2LT2INE75DBOYHQXTCTOP2PAP5MHAXQRXTTCCXFKHQTVG36DJONBQZE';
    const TRANSFER_AMOUNT = 1; // 1 FRY token as number
    
    console.log('Starting FRY transfer...');
    console.log('Token ID:', FRY_TOKEN_ID);
    console.log('Recipient:', RECIPIENT_WALLET);
    console.log('Amount:', TRANSFER_AMOUNT);
    console.log('Network: Algorand Mainnet');
    
    // Import AlgoKit for FRY transfer
    const { AlgorandClient } = await import('@algorandfoundation/algokit-utils');
    
    // Configure AlgoKit with explicit settings
    const algokit = await import('@algorandfoundation/algokit-utils');
    algokit.Config.configure({ 
      populateAppCallResources: true,
      debug: true
    });
    
    // Use explicit Algorand mainnet configuration
    const algorandClient = AlgorandClient.fromConfig({
      algodConfig: {
        server: 'https://mainnet-api.algonode.cloud',
        port: 443,
        token: '',
        network: 'mainnet'
      }
    });
    
    console.log('Algorand client created');
    
    // Create wallet from seed phrase
    const wallet = algorandClient.account.fromMnemonic(data.seedPhrase);
    console.log('Wallet created from seed phrase');
    console.log('Wallet address:', wallet.addr);
    
    // Get account information
    const accountInfo = await algorandClient.account.getInformation(wallet.addr);
    console.log('Account info retrieved');
    
    // Check if wallet has enough ALGO for transaction fees (minimum 1000 microAlgos)
    const balance = BigInt(accountInfo.account?.amount || accountInfo.amount || 0);
    const minBalance = 1000; // 0.001 ALGO for transaction fee as number
    
    if (balance < minBalance) {
      console.log('Insufficient ALGO balance for transaction fees');
      return { 
        success: false, 
        message: `Insufficient ALGO balance. Need at least 0.001 ALGO for transaction fees. Current balance: ${Number(balance) / 1000000} ALGO` 
      };
    }
    
    // Force transfer FRY tokens directly
    console.log('FORCING FRY TOKEN TRANSFER...');
    
    try {
      console.log('Initiating FRY token transfer...');
      const transferResponse = await algorandClient.send.assetTransfer({
        assetId: Number(FRY_TOKEN_ID),
        receiver: RECIPIENT_WALLET,
        sender: wallet.addr,
        signer: wallet.signer,
        amount: Number(TRANSFER_AMOUNT)
      });
      
      console.log('Transfer response received:', safeStringify(transferResponse));
      
      if (transferResponse.confirmation) {
        console.log('✅ FRY transfer successful:', safeStringify(transferResponse.confirmation));
        
        // Try different ways to get the transaction ID
        let transactionId = null;
        
        // Method 1: Direct property
        if (transferResponse.confirmation.transactionId) {
          transactionId = transferResponse.confirmation.transactionId;
        }
        // Method 2: From txId property
        else if (transferResponse.confirmation.txId) {
          transactionId = transferResponse.confirmation.txId;
        }
        // Method 3: From response.txId
        else if (transferResponse.txId) {
          transactionId = transferResponse.txId;
        }
        // Method 4: From transaction object
        else if (transferResponse.transaction && transferResponse.transaction.txID) {
          transactionId = transferResponse.transaction.txID;
        }
        // Method 5: Generate fallback
        else {
          transactionId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          console.warn('⚠️ Could not extract transaction ID from response, using fallback');
        }
        
        console.log('📝 Using transaction ID:', transactionId);
        
        return { 
          success: true, 
          message: `${TRANSFER_AMOUNT} FRY token sent successfully to ${RECIPIENT_WALLET}!`, 
          txId: transactionId 
        };
      } else {
        console.log('❌ FRY transfer failed - no confirmation');
        return { success: false, message: 'FRY transfer failed - no confirmation received' };
      }
    } catch (transferError) {
      console.error('❌ FRY transfer error:', transferError);
      console.error('Transfer error message:', transferError.message);
      
      // If transfer fails, return the error
      return { success: false, message: `Failed to transfer FRY token: ${transferError.message}` };
    }
    
  } catch (err) {
    console.error('FRY transfer error details:', err);
    console.error('Error stack:', err.stack);
    
    // Provide more specific error messages
    let errorMessage = 'FRY transfer failed: ';
    if (err.message.includes('network')) {
      errorMessage += 'Network connection error. Please check your internet connection.';
    } else if (err.message.includes('insufficient')) {
      errorMessage += 'Insufficient FRY tokens in wallet.';
    } else if (err.message.includes('invalid')) {
      errorMessage += 'Invalid wallet or configuration.';
    } else {
      errorMessage += err.message;
    }
    
    return { success: false, message: errorMessage };
  }
});

// Get FRY token balance handler
ipcMain.handle('get-fry-balance', async (event, data) => {
  console.log('get-fry-balance handler called');
  
  try {
    const FRY_TOKEN_ID = 2485314946; // FRY token ID as number
    
    console.log('Getting FRY token balance...');
    console.log('Token ID:', FRY_TOKEN_ID);
    console.log('Network: Algorand Mainnet');
    
    // Import AlgoKit for balance checking
    const { AlgorandClient } = await import('@algorandfoundation/algokit-utils');
    
    // Configure AlgoKit with explicit settings
    const algokit = await import('@algorandfoundation/algokit-utils');
    algokit.Config.configure({ 
      populateAppCallResources: true,
      debug: true
    });
    
    // Use explicit Algorand mainnet configuration
    const algorandClient = AlgorandClient.fromConfig({
      algodConfig: {
        server: 'https://mainnet-api.algonode.cloud',
        port: 443,
        token: '',
        network: 'mainnet'
      }
    });
    
    console.log('Algorand client created');
    
    // Create wallet from seed phrase
    const wallet = algorandClient.account.fromMnemonic(data.seedPhrase);
    console.log('Wallet created from seed phrase');
    console.log('Wallet address:', wallet.addr);
    
    // Get account information
    const accountInfo = await algorandClient.account.getInformation(wallet.addr);
    console.log('Account info retrieved');
    console.log('Account info type:', typeof accountInfo);
    console.log('Account info keys:', Object.keys(accountInfo));
    console.log('Account info full:', safeStringify(accountInfo));
    
    // Debug: Log the entire account structure
    console.log('=== ACCOUNT DEBUG INFO ===');
    console.log('Account object exists:', !!accountInfo.account);
    console.log('Account assets exist:', !!accountInfo.account?.assets);
    console.log('Number of assets:', accountInfo.account?.assets?.length || 0);
    
    if (accountInfo.account?.assets) {
      console.log('All assets in wallet:');
      accountInfo.account.assets.forEach((asset, index) => {
        console.log(`Asset ${index}:`, {
          assetId: asset.assetId,
          amount: typeof asset.amount === 'bigint' ? asset.amount.toString() : asset.amount,
          isFrozen: asset.isFrozen
        });
      });
    }
    
    // Check if wallet has opted in to FRY token
    const hasFryToken = accountInfo.account && 
                       accountInfo.account.assets && 
                       accountInfo.account.assets.some(asset => 
                         asset.assetId === Number(FRY_TOKEN_ID) || 
                         asset['asset-id'] === Number(FRY_TOKEN_ID)
                       );
    
    console.log('Looking for FRY token with ID:', Number(FRY_TOKEN_ID));
    console.log('Has FRY token:', hasFryToken);
    
    if (hasFryToken) {
      // Find the FRY token asset - try both property names
      const fryAsset = accountInfo.account.assets.find(asset => 
        asset.assetId === Number(FRY_TOKEN_ID) || 
        asset['asset-id'] === Number(FRY_TOKEN_ID)
      );
      const fryBalance = fryAsset.amount;
      
      console.log('✅ FRY token balance found:', fryBalance);
      console.log('FRY balance type:', typeof fryBalance);
      console.log('FRY balance as string:', fryBalance.toString());
      console.log('FRY balance as number:', Number(fryBalance));
      console.log('FRY asset details:', safeStringify(fryAsset));
      
      // Convert BigInt to number for the frontend
      const balanceNumber = typeof fryBalance === 'bigint' ? Number(fryBalance) : Number(fryBalance);
      
      return { 
        success: true, 
        balance: balanceNumber,
        message: `FRY token balance: ${balanceNumber}` 
      };
    } else {
      console.log('❌ Wallet has not opted in to FRY token (AlgoKit method)');
      console.log('Available asset IDs:', accountInfo.account?.assets?.map(a => a.assetId) || []);
      
      // Try fallback method using direct API
      console.log('Trying fallback method with direct API...');
      try {
        const axios = await import('axios');
        const directResponse = await axios.default.get(`https://mainnet-api.algonode.cloud/v2/accounts/${wallet.addr}`);
        
        console.log('Direct API response:', safeStringify(directResponse.data));
        
        if (directResponse.data && directResponse.data.assets) {
          console.log('Direct API assets:', directResponse.data.assets);
          
          // Look for FRY token using different property names
          const fryAssetDirect = directResponse.data.assets.find(asset => 
            (asset.assetId === Number(FRY_TOKEN_ID)) || 
            (asset['asset-id'] === Number(FRY_TOKEN_ID)) || 
            (asset.id === Number(FRY_TOKEN_ID))
          );
          
          if (fryAssetDirect) {
            console.log('✅ FRY token found via direct API:', safeStringify(fryAssetDirect));
            const balanceNumber = Number(fryAssetDirect.amount);
            console.log('FRY balance via direct API:', balanceNumber);
            
            return { 
              success: true, 
              balance: balanceNumber,
              message: `FRY token balance (direct API): ${balanceNumber}` 
            };
          } else {
            console.log('❌ FRY token not found via direct API either');
            const availableIds = directResponse.data.assets.map(asset => 
              asset.assetId || asset['asset-id'] || asset.id
            );
            console.log('Available asset IDs (direct API):', availableIds);
          }
        }
      } catch (fallbackError) {
        console.error('Fallback API call failed:', fallbackError);
      }
      
      return { 
        success: true, 
        balance: 0,
        message: 'Wallet has not opted in to FRY token' 
      };
    }
    
  } catch (err) {
    console.error('Get FRY balance error details:', err);
    console.error('Error stack:', err.stack);
    
    return { 
      success: false, 
      balance: 0,
      message: `Failed to get FRY balance: ${err.message}` 
    };
  }
});

// Send test FRY tokens to a wallet address
ipcMain.handle('send-test-fry', async (event, data) => {
  console.log('send-test-fry handler called');
  
  try {
    const FRY_TOKEN_ID = 2485314946; // FRY token ID as number
    const TEST_AMOUNT = 10; // 10 FRY tokens for testing
    
    console.log('Sending test FRY tokens...');
    console.log('Token ID:', FRY_TOKEN_ID);
    console.log('Recipient:', data.recipientAddress);
    console.log('Amount:', TEST_AMOUNT);
    console.log('Network: Algorand Mainnet');
    
    // Import AlgoKit for token transfer
    const { AlgorandClient } = await import('@algorandfoundation/algokit-utils');
    
    // Configure AlgoKit with explicit settings
    const algokit = await import('@algorandfoundation/algokit-utils');
    algokit.Config.configure({ 
      populateAppCallResources: true,
      debug: true
    });
    
    // Use explicit Algorand mainnet configuration
    const algorandClient = AlgorandClient.fromConfig({
      algodConfig: {
        server: 'https://mainnet-api.algonode.cloud',
        port: 443,
        token: '',
        network: 'mainnet'
      }
    });
    
    console.log('Algorand client created');
    
    // Use a test wallet with known seed phrase (this should have FRY tokens)
    const testSeedPhrase = 'pull daughter daring crunch umbrella oxygen subject arm exist organ wool lucky glass draw loop taste tuition wait old scout also huge awesome able shine';
    const senderWallet = algorandClient.account.fromMnemonic(testSeedPhrase);
    
    console.log('Sender wallet created');
    console.log('Sender address:', senderWallet.addr);
    
    // Check sender balance
    const senderAccountInfo = await algorandClient.account.getInformation(senderWallet.addr);
    const senderBalance = BigInt(senderAccountInfo.account?.amount || 0);
    
    console.log('Sender ALGO balance:', Number(senderBalance) / 1000000);
    console.log('Sender account info:', safeStringify(senderAccountInfo));
    
    if (senderBalance < 1000000) { // Less than 1 ALGO
      return { 
        success: false, 
        message: 'Test wallet has insufficient ALGO for transaction fees. Please fund the test wallet first.' 
      };
    }
    
    // Check if sender has FRY tokens
    const hasFryToken = senderAccountInfo.account && 
                       senderAccountInfo.account.assets && 
                       senderAccountInfo.account.assets.some(asset => asset.assetId === Number(FRY_TOKEN_ID));
    
    if (!hasFryToken) {
      return { 
        success: false, 
        message: 'Test wallet has no FRY tokens to send. Please fund the test wallet with FRY tokens first.' 
      };
    }
    
    // Get FRY token balance
    const fryAsset = senderAccountInfo.account.assets.find(asset => asset.assetId === Number(FRY_TOKEN_ID));
    const fryBalance = fryAsset.amount;
    
    console.log('Sender FRY balance:', typeof fryBalance === 'bigint' ? fryBalance.toString() : fryBalance);
    console.log('FRY asset details:', safeStringify(fryAsset));
    
    if (fryBalance < TEST_AMOUNT) {
      return { 
        success: false, 
        message: `Test wallet has insufficient FRY tokens. Has ${typeof fryBalance === 'bigint' ? fryBalance.toString() : fryBalance}, needs ${TEST_AMOUNT}` 
      };
    }
    
    // Transfer FRY tokens
    console.log('Initiating asset transfer...');
    const response = await algorandClient.send.assetTransfer({
      assetId: Number(FRY_TOKEN_ID),
      receiver: data.recipientAddress,
      sender: senderWallet.addr,
      signer: senderWallet.signer,
      amount: Number(TEST_AMOUNT)
    });
    
    console.log('Transfer response received:', safeStringify(response));
    
    if (response.confirmation) {
      console.log('FRY transfer successful:', safeStringify(response.confirmation));
      return { 
        success: true, 
        message: `${TEST_AMOUNT} FRY tokens sent successfully!`, 
        txId: response.confirmation.transactionId 
      };
    } else {
      console.log('FRY transfer failed - no confirmation');
      return { success: false, message: 'FRY transfer failed - no confirmation received' };
    }
    
  } catch (err) {
    console.error('Send test FRY error details:', err);
    console.error('Error stack:', err.stack);
    
    let errorMessage = 'Send test FRY failed: ';
    if (err.message.includes('network')) {
      errorMessage += 'Network connection error. Please check your internet connection.';
    } else if (err.message.includes('insufficient')) {
      errorMessage += 'Insufficient FRY tokens in test wallet.';
    } else if (err.message.includes('invalid')) {
      errorMessage += 'Invalid wallet or configuration.';
    } else {
      errorMessage += err.message;
    }
    
    return { success: false, message: errorMessage };
  }
});

// FRY token opt-in handler (without transfer)
ipcMain.handle('opt-in-fry', async (event, data) => {
  console.log('opt-in-fry handler called');
  
  try {
    const FRY_TOKEN_ID = 2485314946; // FRY token ID as number
    
    console.log('Opting in to FRY token...');
    console.log('Token ID:', FRY_TOKEN_ID);
    console.log('Network: Algorand Mainnet');
    
    // Import AlgoKit for token opt-in
    const { AlgorandClient } = await import('@algorandfoundation/algokit-utils');
    
    // Configure AlgoKit with explicit settings
    const algokit = await import('@algorandfoundation/algokit-utils');
    algokit.Config.configure({ 
      populateAppCallResources: true,
      debug: true
    });
    
    // Use explicit Algorand mainnet configuration
    const algorandClient = AlgorandClient.fromConfig({
      algodConfig: {
        server: 'https://mainnet-api.algonode.cloud',
        port: 443,
        token: '',
        network: 'mainnet'
      }
    });
    
    console.log('Algorand client created');
    
    // Create wallet from seed phrase
    const wallet = algorandClient.account.fromMnemonic(data.seedPhrase);
    console.log('Wallet created from seed phrase');
    console.log('Sender address:', wallet.addr);
    console.log('Connected Wallet Address:', wallet.addr);
    console.log('Wallet Seed Phrase Length:', data.seedPhrase.split(' ').length, 'words');
    
    // Check wallet balance first
    const accountInfo = await algorandClient.account.getInformation(wallet.addr);
    console.log('Account info retrieved');
    console.log('Account info type:', typeof accountInfo);
    console.log('Account info keys:', Object.keys(accountInfo));
    console.log('Account info full:', safeStringify(accountInfo));
    
    // Extract balance from account info
    const balance = BigInt(accountInfo.account?.amount || accountInfo.amount || 0);
    console.log('=== BALANCE DEBUG INFO ===');
    console.log('Raw accountInfo.account?.amount:', accountInfo.account?.amount);
    console.log('Raw accountInfo.amount:', accountInfo.amount);
    console.log('Extracted balance (microAlgos):', balance.toString());
    console.log('Balance in ALGO:', Number(balance) / 1000000);
    console.log('Balance type:', typeof balance);
    console.log('Balance > 1000?', balance > 1000);
    
    // Debug: Log the entire account structure
    console.log('=== ACCOUNT DEBUG INFO ===');
    console.log('Account object exists:', !!accountInfo.account);
    console.log('Account assets exist:', !!accountInfo.account?.assets);
    console.log('Number of assets:', accountInfo.account?.assets?.length || 0);
    
    if (accountInfo.account?.assets) {
      console.log('All assets in wallet:');
      accountInfo.account.assets.forEach((asset, index) => {
        console.log(`Asset ${index}:`, {
          assetId: asset.assetId,
          amount: typeof asset.amount === 'bigint' ? asset.amount.toString() : asset.amount,
          isFrozen: asset.isFrozen
        });
      });
    }
    
    // Check if account exists and has balance - try multiple ways to detect account
    const accountExists = accountInfo.account && accountInfo.account.amount !== undefined;
    const accountExistsAlt = accountInfo && (accountInfo.amount !== undefined || accountInfo.address);
    
    console.log('Account exists (method 1):', accountExists);
    console.log('Account exists (method 2):', accountExistsAlt);
    console.log('Account balance:', Number(balance) / 1000000, 'ALGO');
    console.log('Account info full:', safeStringify(accountInfo));
    
    // Check if account exists - try multiple detection methods
    if (!accountInfo.account && !accountInfo.amount && !accountInfo.address) {
      console.log('Account not found via AlgoKit, trying direct API...');
      
      // Try fallback method using direct API
      try {
        const axios = await import('axios');
        const directResponse = await axios.default.get(`https://mainnet-api.algonode.cloud/v2/accounts/${wallet.addr}`);
        
        console.log('Direct API response:', safeStringify(directResponse.data));
        
        if (directResponse.data && directResponse.data.address) {
          console.log('✅ Account found via direct API');
          // Account exists, continue with the process
          const directBalance = BigInt(directResponse.data.amount || 0);
          
          if (directBalance < minBalance) {
            console.log('Insufficient ALGO balance for transaction fees (direct API)');
            return { 
              success: false, 
              message: `Insufficient ALGO balance. Need at least 0.001 ALGO for transaction fees. Current balance: ${Number(directBalance) / 1000000} ALGO` 
            };
          }
          
          // Continue with opt-in process using direct API data
          console.log('Using direct API data for opt-in process');
        } else {
          console.log('❌ Account not found via direct API either');
          return { 
            success: false, 
            message: `Account not found on mainnet. Wallet address: ${wallet.addr}\n\nTo use this wallet, you need to fund it with ALGO first.\n\nYou can get ALGO from:\n• Algorand Mainnet Exchanges\n• Transfer from another mainnet wallet\n• Purchase from cryptocurrency exchanges` 
          };
        }
      } catch (fallbackError) {
        console.error('Fallback API call failed:', fallbackError);
        return { 
          success: false, 
          message: `Account not found on mainnet. Wallet address: ${wallet.addr}\n\nTo use this wallet, you need to fund it with ALGO first.\n\nYou can get ALGO from:\n• Algorand Mainnet Exchanges\n• Transfer from another mainnet wallet\n• Purchase from cryptocurrency exchanges` 
        };
      }
    }
    
    const status = accountInfo?.account?.status || accountInfo?.status || 'Unknown';
    console.log('Account status:', status);
    
    // Check if wallet has enough ALGO for transaction fees (minimum 1000 microAlgos)
    const minBalance = 1000; // 0.001 ALGO for transaction fee as number
    
    // If balance is 0, try direct API call as fallback
    if (balance === 0n) {
      console.log('Balance is 0, trying direct API call as fallback...');
      try {
        const axios = await import('axios');
        const directResponse = await axios.default.get(`https://mainnet-api.algonode.cloud/v2/accounts/${wallet.addr}`);
        
        if (directResponse.data && directResponse.data.amount !== undefined) {
          const directBalance = BigInt(directResponse.data.amount);
          console.log('Direct API balance (microAlgos):', directBalance.toString());
          console.log('Direct API balance (ALGO):', Number(directBalance) / 1000000);
          
          if (directBalance < minBalance) {
            console.log('Insufficient ALGO balance for transaction fees (direct API)');
            return { 
              success: false, 
              message: `Insufficient ALGO balance. Need at least 0.001 ALGO for transaction fees. Current balance: ${Number(directBalance) / 1000000} ALGO` 
            };
          }
        } else {
          console.log('Direct API also returned no balance');
          return { 
            success: false, 
            message: `Insufficient ALGO balance. Need at least 0.001 ALGO for transaction fees. Current balance: 0 ALGO` 
          };
        }
      } catch (directError) {
        console.error('Direct API call failed:', directError);
        return { 
          success: false, 
          message: `Insufficient ALGO balance. Need at least 0.001 ALGO for transaction fees. Current balance: 0 ALGO` 
        };
      }
    } else if (balance < minBalance) {
      console.log('Insufficient ALGO balance for transaction fees');
      return { 
        success: false, 
        message: `Insufficient ALGO balance. Need at least 0.001 ALGO for transaction fees. Current balance: ${Number(balance) / 1000000} ALGO` 
      };
    }
    
    // Check if wallet has already opted in to FRY token
    console.log('Checking FRY token opt-in status...');
    
    let needsOptIn = false;
    try {
      // Use the correct method to check asset information
      const accountAssets = await algorandClient.account.getInformation(wallet.addr);
      console.log('Account assets:', safeStringify(accountAssets));
      
      // Check if the account has the FRY token in its assets
      const hasFryToken = accountAssets.account && 
                         accountAssets.account.assets && 
                         accountAssets.account.assets.some(asset => 
                           asset.assetId === Number(FRY_TOKEN_ID) || 
                           asset['asset-id'] === Number(FRY_TOKEN_ID)
                         );
      
      console.log('Looking for FRY token with ID:', Number(FRY_TOKEN_ID));
      console.log('Has FRY token:', hasFryToken);
      
      if (accountAssets.account?.assets) {
        console.log('All assets in wallet:');
        accountAssets.account.assets.forEach((asset, index) => {
          console.log(`Asset ${index}:`, {
            assetId: asset.assetId,
            amount: typeof asset.amount === 'bigint' ? asset.amount.toString() : asset.amount,
            isFrozen: asset.isFrozen
          });
        });
      }
      
      if (hasFryToken) {
        console.log('✅ Wallet has already opted in to FRY token');
        needsOptIn = false;
      } else {
        console.log('❌ Wallet needs to opt-in to FRY token');
        needsOptIn = true;
      }
    } catch (optInError) {
      console.log('❌ Error checking FRY token status:', optInError);
      console.log('Assuming wallet needs to opt-in to FRY token');
      needsOptIn = true;
    }
    
    // Opt-in to FRY token if needed
    if (needsOptIn) {
      console.log('Opting in to FRY token...');
      try {
        const optInResponse = await algorandClient.send.assetOptIn({
          assetId: FRY_TOKEN_ID,
          sender: wallet.addr,
          signer: wallet.signer
        });
        
        console.log('Opt-in response:', safeStringify(optInResponse));
        
        if (optInResponse.confirmation) {
          console.log('✅ Successfully opted in to FRY token');
          
          // Try different ways to get the transaction ID
          let transactionId = null;
          
          // Method 1: Direct property
          if (optInResponse.confirmation.transactionId) {
            transactionId = optInResponse.confirmation.transactionId;
          }
          // Method 2: From txId property
          else if (optInResponse.confirmation.txId) {
            transactionId = optInResponse.confirmation.txId;
          }
          // Method 3: From response.txId
          else if (optInResponse.txId) {
            transactionId = optInResponse.txId;
          }
          // Method 4: From transaction object
          else if (optInResponse.transaction && optInResponse.transaction.txID) {
            transactionId = optInResponse.transaction.txID;
          }
          // Method 5: Generate fallback
          else {
            transactionId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.warn('⚠️ Could not extract transaction ID from response, using fallback');
          }
          
          console.log('📝 Using transaction ID:', transactionId);
          
          return { 
            success: true, 
            message: 'Successfully opted in to FRY token! You can now receive FRY tokens.', 
            txId: transactionId 
          };
        } else {
          console.log('❌ Opt-in failed - no confirmation');
          return { success: false, message: 'Failed to opt-in to FRY token - no confirmation received' };
        }
      } catch (optInError) {
        console.error('❌ Opt-in error:', optInError);
        return { success: false, message: `Failed to opt-in to FRY token: ${optInError.message}` };
      }
    } else {
      console.log('✅ Wallet is already opted in to FRY token');
      return { 
        success: true, 
        message: 'Wallet is already opted in to FRY token! You can receive FRY tokens.' 
      };
    }
    
  } catch (err) {
    console.error('FRY opt-in error details:', err);
    console.error('Error stack:', err.stack);
    
    // Safely serialize error information
    const errorInfo = {
      message: err.message || 'Unknown error',
      name: err.name || 'Error',
      stack: err.stack || 'No stack trace'
    };
    
    console.log('Serialized error info:', safeStringify(errorInfo));
    
    // Provide more specific error messages
    let errorMessage = 'FRY opt-in failed: ';
    if (err.message && err.message.includes('network')) {
      errorMessage += 'Network connection error. Please check your internet connection.';
    } else if (err.message && err.message.includes('insufficient')) {
      errorMessage += 'Insufficient ALGO balance for transaction fees.';
    } else if (err.message && err.message.includes('invalid')) {
      errorMessage += 'Invalid wallet or configuration.';
    } else if (err.message && err.message.includes('serialize')) {
      errorMessage += 'Data serialization error. Please try again.';
    } else {
      errorMessage += err.message || 'Unknown error occurred';
    }
    
    return { success: false, message: errorMessage };
  }
});

// Database IPC handlers
ipcMain.handle('save-wallet-to-db', async (event, walletData) => {
  console.log('save-wallet-to-db handler called');
  console.log('Wallet data to save:', {
    walletAddress: walletData.walletAddress,
    hasSeedPhrase: !!walletData.seedPhrase,
    balance: walletData.balance
  });
  
  try {
    const result = await databaseService.saveWallet(walletData);
    console.log('Database save result:', result);
    return result;
  } catch (error) {
    console.error('Error in save-wallet-to-db handler:', error);
    return {
      success: false,
      message: 'Failed to save wallet to database: ' + error.message
    };
  }
});

ipcMain.handle('get-wallet-from-db', async (event, walletAddress) => {
  console.log('get-wallet-from-db handler called');
  console.log('Wallet address to retrieve:', walletAddress);
  
  try {
    const result = await databaseService.getWallet(walletAddress);
    console.log('Database get result:', result);
    return result;
  } catch (error) {
    console.error('Error in get-wallet-from-db handler:', error);
    return {
      success: false,
      message: 'Failed to get wallet from database: ' + error.message
    };
  }
});

ipcMain.handle('update-wallet-balance-db', async (event, { walletAddress, newBalance }) => {
  console.log('update-wallet-balance-db handler called');
  console.log('Updating balance for wallet:', walletAddress, 'New balance:', newBalance);
  
  try {
    const result = await databaseService.updateWalletBalance(walletAddress, newBalance);
    console.log('Database update result:', result);
    return result;
  } catch (error) {
    console.error('Error in update-wallet-balance-db handler:', error);
    return {
      success: false,
      message: 'Failed to update wallet balance in database: ' + error.message
    };
  }
});

ipcMain.handle('update-wallet-plan-db', async (event, { walletAddress, planId }) => {
  console.log('🔄 update-wallet-plan-db handler called');
  console.log('📝 Updating plan for wallet:', walletAddress, 'New plan:', planId);
  console.log('📝 Event details:', event);
  
  try {
    console.log('🗄️ Calling databaseService.updateWalletPlan...');
    const result = await databaseService.updateWalletPlan(walletAddress, planId);
    console.log('🗄️ Database plan update result:', result);
    console.log('📤 Returning result to renderer:', result);
    return result;
  } catch (error) {
    console.error('❌ Error in update-wallet-plan-db handler:', error);
    console.error('❌ Error stack:', error.stack);
    return {
      success: false,
      message: 'Failed to update wallet plan in database: ' + error.message
    };
  }
});

ipcMain.handle('get-all-wallets-from-db', async () => {
  console.log('get-all-wallets-from-db handler called');
  
  try {
    const result = await databaseService.getAllWallets();
    console.log('Database get all wallets result:', result);
    return result;
  } catch (error) {
    console.error('Error in get-all-wallets-from-db handler:', error);
    return {
      success: false,
      message: 'Failed to get all wallets from database: ' + error.message
    };
  }
});

// Plan management IPC handlers
ipcMain.handle('get-all-plans-from-db', async () => {
  console.log('get-all-plans-from-db handler called');
  
  try {
    const result = await databaseService.getAllPlans();
    console.log('Database get all plans result:', result);
    return result;
  } catch (error) {
    console.error('Error in get-all-plans-from-db handler:', error);
    return {
      success: false,
      message: 'Failed to get all plans from database: ' + error.message
    };
  }
});

ipcMain.handle('get-plan-from-db', async (event, planId) => {
  console.log('get-plan-from-db handler called');
  console.log('Plan ID to retrieve:', planId);
  
  try {
    const result = await databaseService.getPlan(planId);
    console.log('Database get plan result:', result);
    return result;
  } catch (error) {
    console.error('Error in get-plan-from-db handler:', error);
    return {
      success: false,
      message: 'Failed to get plan from database: ' + error.message
    };
  }
});

ipcMain.handle('create-plan-in-db', async (event, planData) => {
  console.log('create-plan-in-db handler called');
  console.log('Plan data to create:', planData);
  
  try {
    const result = await databaseService.createPlan(planData);
    console.log('Database create plan result:', result);
    return result;
  } catch (error) {
    console.error('Error in create-plan-in-db handler:', error);
    return {
      success: false,
      message: 'Failed to create plan in database: ' + error.message
    };
  }
});

ipcMain.handle('update-plan-in-db', async (event, { planId, planData }) => {
  console.log('update-plan-in-db handler called');
  console.log('Updating plan:', planId, 'New data:', planData);
  
  try {
    const result = await databaseService.updatePlan(planId, planData);
    console.log('Database update plan result:', result);
    return result;
  } catch (error) {
    console.error('Error in update-plan-in-db handler:', error);
    return {
      success: false,
      message: 'Failed to update plan in database: ' + error.message
    };
  }
});

ipcMain.handle('delete-plan-from-db', async (event, planId) => {
  console.log('delete-plan-from-db handler called');
  console.log('Plan ID to delete:', planId);
  
  try {
    const result = await databaseService.deletePlan(planId);
    console.log('Database delete plan result:', result);
    return result;
  } catch (error) {
    console.error('Error in delete-plan-from-db handler:', error);
    return {
      success: false,
      message: 'Failed to delete plan from database: ' + error.message
    };
  }
});

// FRY Transaction management IPC handlers
ipcMain.handle('store-fry-transaction-db', async (event, transactionData) => {
  console.log('store-fry-transaction-db handler called');
  console.log('Transaction data to store:', transactionData);
  
  try {
    const result = await databaseService.storeFryTransaction(transactionData);
    console.log('Database store FRY transaction result:', result);
    return result;
  } catch (error) {
    console.error('Error in store-fry-transaction-db handler:', error);
    return {
      success: false,
      message: 'Failed to store FRY transaction in database: ' + error.message
    };
  }
});

ipcMain.handle('get-fry-transactions-db', async (event, walletAddress) => {
  console.log('get-fry-transactions-db handler called');
  console.log('Wallet address to get transactions for:', walletAddress);
  
  try {
    const result = await databaseService.getFryTransactions(walletAddress);
    console.log('Database get FRY transactions result:', result);
    return result;
  } catch (error) {
    console.error('Error in get-fry-transactions-db handler:', error);
    return {
      success: false,
      message: 'Failed to get FRY transactions from database: ' + error.message
    };
  }
});

ipcMain.handle('get-total-fry-fees-db', async (event, walletAddress) => {
  console.log('get-total-fry-fees-db handler called');
  console.log('Wallet address to get total fees for:', walletAddress);
  
  try {
    const result = await databaseService.getTotalFryFees(walletAddress);
    console.log('Database get total FRY fees result:', result);
    return result;
  } catch (error) {
    console.error('Error in get-total-fry-fees-db handler:', error);
    return {
      success: false,
      message: 'Failed to get total FRY fees from database: ' + error.message
    };
  }
});

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')
  
  // Initialize database connection
  console.log('🔌 Initializing database connection...');
  const dbConnected = await databaseService.connect();
  if (dbConnected) {
    console.log('✅ Database initialized successfully');
  } else {
    console.log('⚠️ Database initialization failed, continuing without database');
  }
  
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})