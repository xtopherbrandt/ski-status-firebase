/**
Copyright (C) 2019 Christopher Brandt

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

Contact Info: xtopher.brandt at gmail
*/

'use strict';

const app = require( './app.js' );
const lift_wait_ingest = require( './lift-wait-ingest.js' );
const unit_tests = require( './tests.js' );
const functions = require('firebase-functions');

// When a version of the action is submitted for Beta or Production, 
// Actions on Google takes a snapshot of the current DiagloFlow state, including the fulfillment route.
// However the firebase function code is not part of the snapshot. Meaning that changes to the fulfillment function (in firebase)
// will affect a released version of the action, if the function named in the fulfillment route is same as the
// function being changed.
//
// To allow the firebase function to be independently maintained without affecting released versions of the action,
// each release of the action will target a function versioned by name
// the naming scheme is: '/fulfillment_{version.major}_{version.minor}'
// example: '/fulfillment_2019_10'
//
// When deploying a version for the first time be sure to NOT delete any previous versions
//
// The version of the function should match the git branch name

exports.fulfillment_2019_19 = functions.https.onRequest(app);

exports.lift_wait_ingest_2019_1 = functions.pubsub.schedule('every 5 minutes').onRun( lift_wait_ingest );

exports.unitTests = unit_tests;
