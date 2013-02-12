/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

var frontend;
var saveData = {};
var onLaunched = function () {
	if (frontend) {
		frontend.focus();
		return;
	}
	chrome.app.window.create('/html/frontend.html', {
		'id' : 'frontend',
		'defaultWidth' : 500,
		'defaultHeight' : 300,
		'defaultLeft' : 0,
		'defaultTop' : 0,
		'hidden' : true
	}, function(win) {
		frontend = win;
		/* This code does not work.
		 frontend.onClosed.addListener(function () {
		 frontend.contentWindow.windowClose();
		 frontend = undefined;
		 });
		 frontend.contentWindow.document.addEventListenr('DOMContentLoaded', function () {
		 frontend.focus();
		 frontend.show();
		 });
		 */
		var sockets = {};
		var win_interval = setInterval(function () {
			if (!frontend.contentWindow.closed) {
				return;
			}
			Object.keys(sockets).forEach(function (sid) {
				chrome.socket.disconnect(sid-0);
				chrome.socket.destroy(sid-0);
			});
			var isReload = frontend.toReload;
			frontend = undefined;
			clearInterval(win_interval);
			if (isReload) {
				onLaunched();
			}
		}, 500);
		var dom_interval = setInterval(function () {
			var win = frontend.contentWindow;
			if (!win.windowClose) {
				return;
			}
			win.appEvents.addListener('windowReload', function () {
				frontend.toReload = true;
				frontend.close();
			});
			win.appEvents.addListener('backgroundSave', function (key, val) {
				saveData[key] = val;
			});
			win.appEvents.addListener('init', function () {
				Object.keys(saveData).forEach(function (key) {
					win.appEvents.emitEvent('backgroundLoad', [key, saveData[key]]);
				});
			});
			sockets = win.SocketTable.sockets;
			frontend.show();
			clearInterval(dom_interval);
		});
	});
};
chrome.app.runtime.onLaunched.addListener(onLaunched);
