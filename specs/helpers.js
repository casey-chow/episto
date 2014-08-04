/** 
 * Helpers
 *
 * This file stores important testy stuff, like globals, plugin config,
 * and factories.
 *
 */


/**
 * Globals
 */

GLOBAL.chai     = require('chai');
GLOBAL.expect   = chai.expect;

GLOBAL.sinon    = require('sinon');

GLOBAL.Sails    = require('sails');

GLOBAL._        = require('lodash');

/**
 * Chai Configuration
 */

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

/**
 * Sinon Configuration
 */

require('sinon-as-promised')(require('when'));

/**
 * Global Hooks
 */
