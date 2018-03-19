"use strict";

const Homey = require('homey');

module.exports = [

    {
        method:         'GET',
        path:            '/sites',
        fn: function( args, callback ){
            //let driver = Homey.ManagerDrivers.getDriver('wifi-client');

            let _default_list = [{'name': 'default', 'desc': 'default'}];
            //if (!driver.unifi) {
            //    Homey.app.initSettings();
                return callback(null, _default_list);
            //}
        }
    },

    {
        method:         'PUT',
        path:            '/settings',
        fn: function( args, callback ){
            var result = Homey.app.updateSettings( args.body );
            if( result instanceof Error ) return callback( result );
            return callback( null, result );
        }
    },

]
