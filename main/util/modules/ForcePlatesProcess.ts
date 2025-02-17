const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');

/** 
 * Start the force plate setup to connect to the force plate 
 * before the application boot
 */
const createForcePlateProcess = async (cb: Function) => {
  try {
    
    await spawn(
      path.resolve(__dirname, '../../connection/ForcePlatesConnector.exe')
      , ["10"]
    );
    cb();
    console.log(chalk.bold.white('[LOG] Force Plate Connector ') + chalk.bold.green('✓'));

  } catch (e) {
    console.log(chalk.bold.red('[ERROR] Force Plate Connector ') + chalk.bold.red('❌'));
  }
};

export = createForcePlateProcess;