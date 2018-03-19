'use strict';

const Homey = require('homey');
var NodeVRealize = require( 'node-vrealize')
var https = require( 'https');

var appSettings;
const Settings = Homey.ManagerSettings;

const _settingsKey = 'com.pqr.vra.settings'
const API = Homey.ManagerApi;
const _states = {
    'initializing': 'Initializing driver',
    'initialized': 'initialized',
    'connecting': 'Connecting',
    'connected': 'Connected',
    'disconnected': 'Disconnected',
}

const deploy_BluePrint = new Homey.FlowCardAction('deploy_BluePrint');
const post_url = new Homey.FlowCardAction('post_url');

class vRaApp extends Homey.App {
	onInit() {
			this.log('com.pqr.vRa started...');
			this.setStatus('Offline');
			this.initSettings();

			this.log('- Loaded settings', this.appSettings);
			this.initialized = true;
	}; // onInit

	initSettings() {
			let settingsInitialized = false;
			Settings.getKeys().forEach(key => {
					if (key == _settingsKey) {
							settingsInitialized = true;
					}
			});

			if (settingsInitialized) {
					this.log('Found settings key', _settingsKey)
					this.appSettings = Settings.get(_settingsKey);
					this.nodeVRealize = new NodeVRealize();
					return;
			}

			this.log('Freshly initializing com.pqr.vra settings with some defaults')
			this.updateSettings({
					'host': 'vra.domain.com',
					'port': '443',
					'user': 'user',
					'pass': 'password',
					'tenant': 'tenant'
			});
			this.nodeVRealize = new NodeVRealize();
	}; // initSettings

	updateSettings(settings) {
			this.log('Got new settings:', settings)
			this.appSettings = settings;
			this.saveSettings();
			//Homey.ManagerDrivers.getDriver('vm-client').getSettings(_settingsKey);
			this.getSettings(_settingsKey);
	}

	saveSettings() {
			if (typeof this.appSettings === 'undefined') {
					this.log('Not saving settings; settings empty!');
					return;
			}

			this.log('Save settings.');
			Settings.set(_settingsKey, this.appSettings)
	}

	setStatus(status) {
			Settings.set('com.pqr.vra.status', status);
	}

	getSettings(key) {
			if (key != _settingsKey) return;
			this.log('Getting settings for key', key);

			this.driverSettings = Settings.get(_settingsKey);
			this._debug('Received new settings:', this.driverSettings);

			if (!this.initialized) return;

			setTimeout(function() {
					// this.disconnect();
					this.initializeConnection();
			}.bind(this), 100);
	};

	initializeConnection() {
			this.log('initializeConnection called');
			console.log( 'My Token !! = ', this.nodeVRealize.config.token  )

			if (this.connected || !this.driverSettings) return;

			this._debug('Connecting to vRa server', this.driverSettings['host']);
			this.setStatus(_states['connecting'])

			if (this.nodeVRealize !== null) {
					// Update to possibly new settings
					this._debug('Updating vRa connection params.')
					this.nodeVRealize.config.hostname = this.driverSettings['host'];
					// this.nodeVRealize.config.port = this.driverSettings['port'];
					this.nodeVRealize.config.username = this.driverSettings['user'];
					this.nodeVRealize.config.password = this.driverSettings['pass'];
					this.nodeVRealize.config.tenant = this.driverSettings['tenant'];
					this.nodeVRealize.config.token = null;
					this.nodeVRealize.config.agent = new https.Agent({
						host: this.driverSettings['host'],
						port: this.driverSettings['port'],
						path: '/',
						rejectUnauthorized: false
					});
					// this.unifi.controller = url.parse('https://' + this.unifi.opts.host + ':' + this.unifi.opts.port);
					this.log( JSON.stringify(this.nodeVRealize.config) )

					// this.nodeVRealize.connect();
					this.nodeVRealize.config.token  = this.nodeVRealize.identity.getTokenId()
						.then( function (token) {
							// Handle the retrieved token
							return token;
						})
						.catch(function (error) {
							// Handle the Error
							console.log('Error getTokenId',error);
							return error;
						});
					return;
			};
	}

	/**
	 * Debug method that will enable logging when
	 * debug: true is provided in the main options
	 * object.
	 * @private
	 */
	_debug() {
			const args = Array.prototype.slice.call(arguments);
			args.unshift('[debug]');
			API.realtime('com.pqr.vra.debug', args.join(' '));
			this.log.apply(null, args);
	}
	// deploy_BluePrint
	deploy_BluePrint1(args) {
		console.log('deploy_BluePrint!!:', args.blueprintName );
		this.nodeVRealize.vra.catalog.submitRequest({ blueprintName: args.blueprintName, templateData: {a:'b'}} )
	};
	// post_url
	post_url1(args) {
		console.log('post_url!!:', args.url );
		data = {
  parameters: [
		{
			name: "approved",
			type: "boolean",
			value: { objectType: "string", value: "true"}
		}]}
		this.nodeVRealize.vra.catalog.sendRequestViaUrl({ url: args.url, data } )
	};
};

// post_url
post_url.register().on('run', ( args, state, callback ) => {
	console.log('post_url:', args.url );
	// Homey.app.post_url1(args);
  callback( null, true );
});

// deploy_BluePrint
deploy_BluePrint.register().on('run', ( args, state, callback ) => {
	console.log('deploy_BluePrint:', args.blueprintName );
	Homey.app.deploy_BluePrint1(args);
  callback( null, true );
});

module.exports = vRaApp;
