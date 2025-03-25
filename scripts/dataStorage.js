// scripts/dataStorage.js

var StockDB = (function() {
    // 私有配置
    var DB_CONFIG = {
        name: 'StockDataDB',
        version: 1,
        storeName: 'stocks'
    };

    // 私有方法：初始化数据库
    function _initDB(callback) {
        var request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

        request.onerror = function(event) {
            console.error('DB init error:', event.target.error);
            callback(event.target.error, null);
        };

        request.onsuccess = function(event) {
            callback(null, event.target.result);
        };

        request.onupgradeneeded = function(event) {
            var db = event.target.result;
            if (!db.objectStoreNames.contains(DB_CONFIG.storeName)) {
                var store = db.createObjectStore(DB_CONFIG.storeName, {
                    keyPath: 'symbol',
                    autoIncrement: false
                });
                console.log('Object store created');
            }
        };
    }

    // 核心操作方法
    function _executeDBOperation(mode, operation, data, callback) {
        _initDB(function(err, db) {
            if (err) {
                callback(err, null);
                return;
            }

            var tx = db.transaction(DB_CONFIG.storeName, mode);
            var store = tx.objectStore(DB_CONFIG.storeName);
            
            var request;
            switch (operation) {
                case 'put':
                    request = store.put(data);
                    break;
                case 'get':
                    request = store.get(data.symbol);
                    break;
                case 'delete':
                    request = store.delete(data.symbol);
                    break;
                case 'getAll':
                    request = store.getAll();
                    break;
                case 'clear':
                    request = store.clear();
                    break;
            }

            request.onsuccess = function() {
                callback(null, operation === 'get' ? request.result : true);
            };
            request.onerror = function(event) {
                callback(event.target.error, null);
            };
        });
    }

    // ================ 公有API ================
    return {
        // 保存/更新数据
        saveStockData: function(symbol, data, dataType, callback) {
            _executeDBOperation('readwrite', 'put', {
                symbol: symbol,
                data: data,
                type: dataType || 'daily',
                lastUpdated: new Date().toISOString()
            }, callback || function(err) {
                if (err) console.error('Save failed:', err);
            });
        },

        // 加载数据
        loadStockData: function(symbol, callback) {
            _executeDBOperation('readonly', 'get', { symbol: symbol }, 
                function(err, result) {
                    callback(err, result ? result.data : null);
                }
            );
        },

        // 删除数据
        deleteStockData: function(symbol, callback) {
            _executeDBOperation('readwrite', 'delete', { symbol: symbol }, callback);
        },

        // 获取所有股票代码
        getAllSymbols: function(callback) {
            _executeDBOperation('readonly', 'getAll', {}, 
                function(err, results) {
                    if (err) {
                        callback(err, null);
                        return;
                    }
                    var symbols = results.map(function(item) {
                        return { 
                            symbol: item.symbol, 
                            type: item.type 
                        };
                    });
                    callback(null, symbols);
                }
            );
        },

        // 清理过期数据
        cleanupOldData: function(maxAgeDays, callback) {
            var cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - (maxAgeDays || 30));
            
            _executeDBOperation('readonly', 'getAll', {}, 
                function(err, results) {
                    if (err) {
                        callback(err, 0);
                        return;
                    }

                    var oldItems = results.filter(function(item) {
                        return new Date(item.lastUpdated) < cutoff;
                    });

                    if (oldItems.length === 0) {
                        callback(null, 0);
                        return;
                    }

                    var deleteCount = 0;
                    oldItems.forEach(function(item) {
                        this.deleteStockData(item.symbol, function(err) {
                            if (!err) deleteCount++;
                        });
                    }.bind(this));

                    callback(null, deleteCount);
                }.bind(this)
            );
        },

        // 导出所有数据
        exportAllData: function(callback) {
            _executeDBOperation('readonly', 'getAll', {}, 
                function(err, results) {
                    callback(err, JSON.stringify(results || [], null, 2));
                }
            );
        },

        // 导入数据
        importData: function(jsonStr, callback) {
            try {
                var data = JSON.parse(jsonStr);
                if (!Array.isArray(data)) {
                    throw new Error('Invalid data format');
                }

                var successCount = 0;
                data.forEach(function(item) {
                    this.saveStockData(item.symbol, item.data, item.type, 
                        function(err) {
                            if (!err) successCount++;
                        }
                    );
                }.bind(this));

                callback(null, successCount);
            } catch (err) {
                callback(err, 0);
            }
        }
    };
})();


//下面是维护感兴趣的股票清单的函数
function saveStockList(stockList) {
    localStorage.setItem('stockList', JSON.stringify(stockList));
}

function loadStockList() {
    return JSON.parse(localStorage.getItem('stockList')) || [];
}