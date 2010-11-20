/**
 * IndexedDBAdaptor
 * ===================
 * Indexed DB implementation for Lawnchair.
 *
 */
var IndexedDBAdaptor = function(options) {
	for (var i in LawnchairAdaptorHelpers) {
		this[i] = LawnchairAdaptorHelpers[i];
	}
	this.init(options);
};

IndexedDBAdaptor.prototype = {
	init:function(options) {
		var that = this;
		var merge = that.merge;
		var opts = (typeof arguments[0] == 'string') ? {table:options} : options;
		var klass = IndexedDBAdaptor;

		// default properties
		this.name		= merge('Lawnchair', opts.name	  	);
		this.index 		= merge('key',     	 opts.index	  	);
		this.display	= merge('shed',      opts.display 	);
		this.version	= merge('1',		 opts.version	);
		this.db			= merge(null,        opts.db		);
		this.timeout 	= merge(3000,		 opts.timeout	);

		// indexedDB constants
		this.READ_ONLY = 1;
		this.READ_WRITE = 0;
		this.SNAPSHOT_READ = 2;		// not yet implemented!
		
		if(typeof opts.callback !== 'function') opts.callback = function(){};
		
		// error out on shit browsers
		var indexedDB = window.indexedDB || window.moz_indexedDB || window.webkitIndexedDB;
		if (!indexedDB)
			throw('Lawnchair, "This browser does not support IndexedDB."');
		
		// instantiate the store
		if(!this.db) {
			indexedDB.open(this.name, this.display).onsuccess = function (e) {
				that.db = e.result;

				if (that.db.version != that.version) {
					that.db.setVersion(that.version).onsuccess = function () {
						console.log(that.db)

						that.db.createObjectStore(that.name, that.index).onsuccess = opts.callback;
					}
				}
			};
		}
	},
	save:function(obj, callback) {
		obj[this.index] = obj[this.index] || this.uuid();

		var that = this;

		var txn = this.db.transaction([this.name], this.READ_WRITE, this.timeout);
		var putRequest = txn.objectStore(this.name).put(obj, obj[this.index]);

		putRequest.onsuccess = function (evt) {
			if (callback) that.terseToVerboseCallback(callback)(obj);
		};
		putRequest.onerror = function (evt) {
			if (callback) that.terseToVerboseCallback(callback)(null);
		};
	},
	get:function(key, callback) {
		var that = this;

		var txn = this.db.transaction([this.name], this.READ_ONLY, this.timeout);
		var getRequest = txn.objectStore(this.name).get(key);

		getRequest.onsuccess = function (evt) {
			if (callback) that.terseToVerboseCallback(callback)(evt.result);
		};
		getRequest.onerror = function (evt) {
			if (callback) that.terseToVerboseCallback(callback)(null);
		};
	},
	all:function(callback) {
		// pending
	},
	remove:function(keyOrObj, callback) {
		var that = this;
		var txn = this.db.transaction([this.name], this.READ_WRITE, this.timeout);
		var removeRequest = txn.objectStore(this.name).remove(keyOrObj);

		removeRequest.onsuccess = function (evt) {
			if (callback) that.terseToVerboseCallback(callback)(evt.result);
		};
		removeRequest.onerror = function (evt) {
			if (callback) that.terseToVerboseCallback(callback)(null);
		};
	},
	nuke:function(callback) {
		var that = this;
		var txn = this.db.transaction([this.name], this.READ_WRITE, this.timeout);
		var clearRequest = txn.objectStore(this.name).clear();

		clearRequest.onsuccess = function (evt) {
			if (callback) that.terseToVerboseCallback(callback)(evt.result);
		};
		clearRequest.onerror = function (evt) {
			if (callback) that.terseToVerboseCallback(callback)(null);
		};
	}
};
