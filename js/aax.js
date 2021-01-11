'use strict';

// ----------------------------------------------------------------------------

const Exchange = require ('./base/Exchange');
const { ArgumentsRequired, AuthenticationError, ExchangeError, ExchangeNotAvailable, OrderNotFound, InvalidOrder, CancelPending, RateLimitExceeded, InsufficientFunds, BadRequest, BadSymbol, PermissionDenied } = require ('./base/errors');
const { TICK_SIZE } = require ('./base/functions/number');

// ----------------------------------------------------------------------------

module.exports = class aax extends Exchange {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'aax',
            'name': 'AAX',
            'countries': [ 'MT' ], // Malta
            'enableRateLimit': true,
            'rateLimit': 500,
            'timeout': 120000,
            'version': 'v2',
            'hostname': 'aax.com',
            'has': {
                'cancelAllOrders': true,
                'cancelOrder': true,
                'createOrder': true,
                'editOrder': true,
                'fetchBalance': true,
                'fetchCanceledOrders': true,
                'fetchClosedOrders': true,
                'fetchDepositAddress': true,
                'fetchMarkets': true,
                'fetchMyTrades': true,
                'fetchOHLCV': true,
                'fetchOpenOrders': true,
                'fetchOrder': true,
                'fetchOrderBook': true,
                'fetchOrders': true,
                'fetchTicker': 'emulated',
                'fetchTickers': true,
                'fetchTrades': true,
            },
            'timeframes': {
                '1m': '1',
                '5m': '5',
                '15m': '15',
                '30m': '30',
                '1h': '60',
                '2h': '120',
                '4h': '240',
                '12h': '720',
                '1d': '1440',
                '3d': '4320',
                '1w': '10080',
            },
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/104140087-a27f2580-53c0-11eb-87c1-5d9e81208fe9.jpg',
                'test': {
                    'v1': 'https://api.testnet.{hostname}/marketdata/v1',
                    'public': 'https://api.testnet.{hostname}',
                    'private': 'https://api.testnet.{hostname}',
                },
                'api': {
                    'v1': 'https://api.{hostname}/marketdata/v1',
                    'public': 'https://api.{hostname}',
                    'private': 'https://api.{hostname}',
                },
                'www': 'https://www.aax.com', // string website URL
                'doc': 'https://www.aax.com/apidoc/index.html',
                'fees': 'https://www.aax.com/en-US/fees/',
            },
            'api': {
                'v1': {
                    'get': [
                        'getHistMarketData', // Get OHLC k line of specific market
                    ],
                },
                'public': {
                    // these endpoints are not documented
                    // 'get': [
                    //     'order_book', // Get the order book of specified market
                    //     'order_book/{market}',
                    //     'trades', // Get recent trades on market, each trade is included only once Trades are sorted in reverse creation order.
                    //     'trades/{market}',
                    //     'tickers', // Get ticker of all markets
                    //     'tickers/{market}', // Get ticker of specific market
                    // ],
                    'get': [
                        'announcement/maintenance', // System Maintenance Notice
                        'instruments', // Retrieve all trading pairs information
                        'market/orderbook', // Order Book
                        'futures/position/openInterest', // Open Interest
                        'market/tickers', // Get the Last 24h Market Summary
                        'market/candles', // Get Current Candlestick
                        'market/trades', // Get the Most Recent Trades
                        'market/markPrice', // Get Current Mark Price
                        'futures/funding/predictedFunding/{symbol}', // Get Predicted Funding Rate
                        'futures/funding/prevFundingRate/{symbol}', // Get Last Funding Rate
                        'market/candles/index', // Get Current Index Candlestick
                    ],
                },
                'private': {
                    'get': [
                        'user/info', // Retrieve user information
                        'account/balances', // Get Account Balances
                        'account/deposit/address', // undocumented
                        'spot/trades', // Retrieve trades details for a spot order
                        'spot/openOrders', // Retrieve spot open orders
                        'spot/orders', // Retrieve historical spot orders
                        'futures/position', // Get positions for all contracts
                        'futures/position/closed', // Get closed positions
                        'futures/trades', // Retrieve trade details for a futures order
                        'futures/openOrders', // Retrieve futures open orders
                        'futures/orders', // Retrieve historical futures orders
                        'futures/funding/predictedFundingFee/{symbol}', // Get predicted funding fee
                    ],
                    'post': [
                        'account/transfer', // Asset Transfer
                        'spot/orders', // Create a new spot order
                        'spot/orders/cancelAllOnTimeout', // Automatically cancel all your spot orders after a specified timeout.
                        'futures/orders', // Create a new futures order
                        'futures/orders/cancelAllOnTimeout', // Automatically cancel all your futures orders after a specified timeout.
                        'futures/position/sltp', // Set take profit and stop loss orders for an opening position
                        'futures/position/close', // Close position
                        'futures/position/leverage', // Update leverage for position
                        'futures/position/margin', // Modify Isolated Position Margin
                    ],
                    'put': [
                        'spot/orders', // Amend spot order
                        'futures/orders', // Amend the quantity of an open futures order
                    ],
                    'delete': [
                        'spot/orders/cancel/{orderID}', // Cancel a spot order
                        'spot/orders/cancel/all', // Batch cancel spot orders
                        'futures/orders/cancel/{orderID}', // Cancel a futures order
                        'futures/orders/cancel/all', // Batch cancel futures orders
                    ],
                },
            },
            'fees': {
                'trading': {
                    'tierBased': false,
                    'percentage': true,
                    'maker': 0.06 / 100,
                    'taker': 0.10 / 100,
                },
                'funding': {
                    'tierBased': false,
                    'percentage': true,
                    'withdraw': {}, // There is only 1% fee on withdrawals to your bank account.
                },
            },
            'exceptions': {
                'exact': {
                    '2002': InsufficientFunds,
                    '2003': OrderNotFound,
                    '10003': BadRequest, // Parameter validation error
                    '10006': AuthenticationError, // Session expired, please relogin
                    '10007': AuthenticationError, // Invalid authentication key or token
                    '11007': AuthenticationError, // Invalid key format
                    '20001': InsufficientFunds, // Insufficient balance. Please deposit to trade.
                    '20009': InvalidOrder, // Order amount must be positive
                    '30000': OrderNotFound, // {"code":30000,"data":null,"message":"The order does not exist","ts":1610259732263}
                    '30001': InvalidOrder, // The order is being submitted, please try again later
                    '30004': InvalidOrder, // Minimum quantity is {0}
                    '30005': InvalidOrder, // Quantity maximum precision is {0} decimal places
                    '30006': InvalidOrder, // Price maximum precision is {0} decimal places
                    '30007': InvalidOrder, // Minimum price is {0}
                    '30008': InvalidOrder, // Stop price maximum precision is {0} decimal places
                    '30009': InvalidOrder, // Stop Price cannot be less than {0}
                    '30010': InvalidOrder, // Market price cannot be empty
                    '30011': CancelPending, // The order is being cancelled, please wait.
                    '30012': BadRequest, // Unknown currency
                    '30013': BadSymbol, // Unknown symbol
                    '30014': OrderNotFound, // Futures order cannot be found
                    '30015': InvalidOrder, // This is not an open order and cannot modified
                    '30016': ExchangeError, // No position found
                    '30017': InvalidOrder, // The current close position is 0. It is recommended that you cancel the current order closing order.
                    '30018': InvalidOrder, // Order price cannot be greater than {0}
                    '30019': InvalidOrder, // Order quantity cannot be greater than {0}
                    '30020': InvalidOrder, // Order price must be a multiple of {0}
                    '30021': InvalidOrder, // Margin adjustement must be greater than 0
                    '30022': InvalidOrder, // New quantity must be greater than filled quantity
                    '30023': InvalidOrder, // Order failed, please try again
                    '30024': InvalidOrder, // TimeInForce error, only GTC or IOC are allowed
                    '30025': InvalidOrder, // TimeInForce error, only GTC is allowed
                    '30026': InvalidOrder, // Quantity is not a multiple of {0}
                    '30027': InvalidOrder, // Close position failed, it is recommended that you cancel the current order and then close the position.
                    '30028': BadSymbol, // Symbol cannot be traded at this time
                    '30029': InvalidOrder, // Modified quantity or price cannot be empty
                    '30030': InvalidOrder, // Price cannot be specified for market orders
                    '30031': InvalidOrder, // Liquidation orders cannot be modified
                    '30032': InvalidOrder, // Leverage cannot be greater than {0}
                    '30033': InvalidOrder, // Leverage cannot be smaller than {0}
                    '30034': RateLimitExceeded, // The max number of open orders is {0}. To place a new order, please cancel a previous one
                    '30035': RateLimitExceeded, // The max number of {0} open orders is {1}. To place a new order, please cancel a previous one
                    '30036': ExchangeNotAvailable, // Liquidation is in progress, please try again later
                    '30037': InvalidOrder, // Once stop limit order triggered, stop price cannot be amended
                    '30038': ExchangeError, // The total value of your orders has exceeded the current risk limit. Please adjust the risk limit
                    '30039': InsufficientFunds, // Your risk limit has now been changed to {0}, your maximum leverage less than 1, please readjust accordingly
                    '30040': InvalidOrder, // Order status has changed, please try again later
                    '30041': InvalidOrder, // Liquidation orders cannot be cancelled
                    '30042': InvalidOrder, // Order cannot be placed as you will be breaching you max limit value of {1} BTC for {0}
                    '30043': InvalidOrder, // The risk limit cannot be less than 0
                    '30044': BadRequest, // Timeout cannot be greater than 60 minutes
                    '30045': InvalidOrder, // Side is not valid, it should be BUY or SELL
                    '30046': InvalidOrder, // Order type is not valid, it should be MARKET or LIMIT or STOP-LIMIT or STOP
                    '30047': InvalidOrder, // The order is closed. Can't cancel
                    '30048': InvalidOrder, // Market orders cannot be modified
                    '30049': InvalidOrder, // The order is being modified, please wait
                    '30050': InvalidOrder, // Maximum 10 orders
                    '40004': BadRequest, // Requested resource doesn't exist
                    '40009': RateLimitExceeded, // Too many requests
                    '40102': AuthenticationError, // {"code":40102,"message":"Unauthorized(invalid key)"}
                    '40103': AuthenticationError, // {"code":40103,"message":"Unauthorized(invalid sign)"}
                    '40303': PermissionDenied, // {"code":40303,"message":"Forbidden(invalid scopes)"}
                    '41001': BadRequest, // Incorrect HTTP request
                    '41002': BadRequest, // Unsupported HTTP request method
                    '42001': ExchangeNotAvailable, // Duplicated data entry, please check and try again
                    '50001': ExchangeError, // Server side exception, please try again later
                    '50002': ExchangeError, // Server is busy, please try again later
                },
                'broad': {},
            },
            'precisionMode': TICK_SIZE,
            'options': {
                'defaultType': 'spot', // 'spot', 'future'
            },
        });
    }

    async fetchMarkets (params = {}) {
        const response = await this.publicGetInstruments (params);
        //
        //     {
        //         "code":1,
        //         "message":"success",
        //         "ts":1610159448962,
        //         "data":[
        //             {
        //                 "tickSize":"0.01",
        //                 "lotSize":"1",
        //                 "base":"BTC",
        //                 "quote":"USDT",
        //                 "minQuantity":"1.0000000000",
        //                 "maxQuantity":"30000",
        //                 "minPrice":"0.0100000000",
        //                 "maxPrice":"999999.0000000000",
        //                 "status":"readOnly",
        //                 "symbol":"BTCUSDTFP",
        //                 "code":"FP",
        //                 "takerFee":"0.00040",
        //                 "makerFee":"0.00020",
        //                 "multiplier":"0.001000000000",
        //                 "mmRate":"0.00500",
        //                 "imRate":"0.01000",
        //                 "type":"futures",
        //                 "settleType":"Vanilla",
        //                 "settleCurrency":"USDT"
        //             },
        //             {
        //                 "tickSize":"0.5",
        //                 "lotSize":"10",
        //                 "base":"BTC",
        //                 "quote":"USD",
        //                 "minQuantity":"10.0000000000",
        //                 "maxQuantity":"300000",
        //                 "minPrice":"0.5000000000",
        //                 "maxPrice":"999999.0000000000",
        //                 "status":"readOnly",
        //                 "symbol":"BTCUSDFP",
        //                 "code":"FP",
        //                 "takerFee":"0.00040",
        //                 "makerFee":"0.00020",
        //                 "multiplier":"1.000000000000",
        //                 "mmRate":"0.00500",
        //                 "imRate":"0.01000",
        //                 "type":"futures",
        //                 "settleType":"Inverse",
        //                 "settleCurrency":"BTC"
        //             },
        //             {
        //                 "tickSize":"0.0001",
        //                 "lotSize":"0.01",
        //                 "base":"AAB",
        //                 "quote":"USDT",
        //                 "minQuantity":"5.0000000000",
        //                 "maxQuantity":"50000.0000000000",
        //                 "minPrice":"0.0001000000",
        //                 "maxPrice":"999999.0000000000",
        //                 "status":"readOnly",
        //                 "symbol":"AABUSDT",
        //                 "code":null,
        //                 "takerFee":"0.00100",
        //                 "makerFee":"0.00100",
        //                 "multiplier":"1.000000000000",
        //                 "mmRate":"0.02500",
        //                 "imRate":"0.05000",
        //                 "type":"spot",
        //                 "settleType":null,
        //                 "settleCurrency":null
        //             },
        //         ]
        //     }
        //
        const data = this.safeValue (response, 'data');
        const result = [];
        for (let i = 0; i < data.length; i++) {
            const market = data[i];
            const id = this.safeString (market, 'symbol');
            const baseId = this.safeString (market, 'base');
            const quoteId = this.safeString (market, 'quote');
            const base = this.safeCurrencyCode (baseId);
            const quote = this.safeCurrencyCode (quoteId);
            const status = this.safeString (market, 'status');
            const active = (status === 'enable');
            const taker = this.safeFloat (market, 'takerFee');
            const maker = this.safeFloat (market, 'makerFee');
            const type = this.safeString (market, 'type');
            let inverse = undefined;
            let linear = undefined;
            let quanto = undefined;
            const spot = (type === 'spot');
            const futures = (type === 'futures');
            const settleType = this.safeStringLower (market, 'settleType');
            if (settleType !== undefined) {
                inverse = (settleType === 'inverse');
                linear = (settleType === 'vanilla');
                quanto = (settleType === 'quanto');
            }
            let symbol = id;
            if (type === 'spot') {
                symbol = base + '/' + quote;
            }
            const precision = {
                'amount': this.safeFloat (market, 'lotSize'),
                'price': this.safeFloat (market, 'tickSize'),
            };
            result.push ({
                'id': id,
                'symbol': symbol,
                'base': base,
                'quote': quote,
                'baseId': baseId,
                'quoteId': quoteId,
                'type': type,
                'spot': spot,
                'futures': futures,
                'inverse': inverse,
                'linear': linear,
                'quanto': quanto,
                'precision': precision,
                'info': market,
                'active': active,
                'taker': taker,
                'maker': maker,
                'percentage': false,
                'tierBased': true,
                'limits': {
                    'amount': {
                        'min': this.safeString (market, 'minQuantity'),
                        'max': this.safeString (market, 'maxQuantity'),
                    },
                    'price': {
                        'min': this.safeString (market, 'minPrice'),
                        'max': this.safeString (market, 'maxPrice'),
                    },
                    'cost': {
                        'min': undefined,
                        'max': undefined,
                    },
                },
            });
        }
        return result;
    }

    parseTicker (ticker, market = undefined) {
        //
        //     {
        //         "t":1610162685342, // timestamp
        //         "a":"0.00000000", // trading volume in USD in the last 24 hours, futures only
        //         "c":"435.20000000", // close
        //         "d":"4.22953489", // change
        //         "h":"455.04000000", // high
        //         "l":"412.78000000", // low
        //         "o":"417.54000000", // open
        //         "s":"BCHUSDTFP", // market id
        //         "v":"2031068.00000000", // trading volume in quote currency of last 24 hours
        //     }
        //
        const timestamp = this.safeInteger (ticker, 't');
        const marketId = this.safeString (ticker, 's');
        const symbol = this.safeSymbol (marketId, market);
        const last = this.safeFloat (ticker, 'c');
        const open = this.safeFloat (ticker, 'o');
        let change = undefined;
        let percentage = undefined;
        let average = undefined;
        if (last !== undefined && open !== undefined) {
            change = last - open;
            if (open > 0) {
                percentage = change / open * 100;
            }
            average = this.sum (last, open) / 2;
        }
        const quoteVolume = this.safeFloat (ticker, 'v');
        return {
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'high': this.safeFloat (ticker, 'h'),
            'low': this.safeFloat (ticker, 'l'),
            'bid': undefined,
            'bidVolume': undefined,
            'ask': undefined,
            'askVolume': undefined,
            'vwap': undefined,
            'open': open,
            'close': last,
            'last': last,
            'previousClose': undefined,
            'change': change,
            'percentage': percentage,
            'average': average,
            'baseVolume': undefined,
            'quoteVolume': quoteVolume,
            'info': ticker,
        };
    }

    async fetchTicker (symbol, params = {}) {
        const tickers = await this.fetchTickers (undefined, params);
        if (symbol in tickers) {
            return tickers[symbol];
        }
        throw new BadSymbol (this.id + ' fetchTicker() symbol ' + symbol + ' ticker not found');
    }

    async fetchTickers (symbols = undefined, params = {}) {
        await this.loadMarkets ();
        const response = await this.publicGetMarketTickers (params);
        //
        //     {
        //         "e":"tickers",
        //         "t":1610162685342,
        //         "tickers":[
        //             {
        //                 "a":"0.00000000",
        //                 "c":"435.20000000",
        //                 "d":"4.22953489",
        //                 "h":"455.04000000",
        //                 "l":"412.78000000",
        //                 "o":"417.54000000",
        //                 "s":"BCHUSDTFP",
        //                 "v":"2031068.00000000",
        //             },
        //         ],
        //     }
        //
        const tickers = this.safeValue (response, 'tickers', []);
        const result = [];
        const timestamp = this.safeInteger (response, 't');
        for (let i = 0; i < tickers.length; i++) {
            const ticker = this.parseTicker (this.extend (tickers[i], { 't': timestamp }));
            result.push (ticker);
        }
        return this.filterByArray (result, 'symbol', symbols);
    }

    async fetchOrderBook (symbol, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        if (limit === undefined) {
            limit = 20;
        } else {
            if ((limit !== 20) && (limit !== 50)) {
                throw new BadRequest (this.id + ' fetchOrderBook() limit argument must be undefined, 20 or 50');
            }
        }
        const request = {
            'symbol': market['id'],
            'level': limit, // required
        };
        //
        const response = await this.publicGetMarketOrderbook (this.extend (request, params));
        //
        //     {
        //         "asks":[
        //             ["10823.00000000","0.004000"],
        //             ["10823.10000000","0.100000"],
        //             ["10823.20000000","0.010000"]
        //         ],
        //         "bids":[
        //             ["10821.20000000","0.002000"],
        //             ["10821.10000000","0.005000"],
        //             ["10820.40000000","0.013000"]
        //         ],
        //         "e":"BTCUSDT@book_50",
        //         "t":1561543614756
        //     }
        //
        const timestamp = this.safeInteger (response, 't'); // need unix type
        return this.parseOrderBook (response, timestamp);
    }

    parseTrade (trade, market = undefined) {
        const timestamp = this.safeFloat (trade, 't');
        const id = this.safeString (trade, 'tid');
        let symbol = undefined;
        if (market !== undefined) {
            symbol = market['symbol'];
        }
        if (symbol && symbol.slice (-2) === 'FP') {
            symbol = symbol.slice (0, -2);
        }
        const price = this.safeFloat (trade, 'p');
        const amount = this.safeFloat (trade, 'q');
        const side = price > 0 ? 'buy' : 'sell';
        const cost = this.dealDecimal ('mul', price, amount);
        const currency = symbol ? symbol.split ('/')[1] : 'currency';
        return {
            'info': trade,
            'id': id,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': symbol,
            'type': undefined,
            'side': side,
            'order': undefined,
            'takerOrMaker': undefined,
            'price': Math.abs (price),
            'amount': amount,
            'cost': Math.abs (cost),
            'fee': {
                'cost': undefined,
                'currency': currency,
                'rate': undefined,
            },
        };
    }

    async fetchTrades (symbol, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
            // 'limit': 2, // max 2000
        };
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.publicGetMarketTrades (request);
        //
        //     {
        //         "e":"BTCUSDFP@trades",
        //         "trades": [
        //             {"p":"9395.50000000","q":"50.000000","t":1592563996718},
        //             {"p":"9395.50000000","q":"50.000000","t":1592563993577},
        //         ],
        //     }
        //
        const trades = this.safeValue (response, 'trades', []);
        return this.parseTrades (trades, market, since, limit);
    }

    parseOHLCV (ohlcv, market = undefined) {
        //
        //     [
        //         "1567123200",
        //         "0.01780", // open
        //         "0.01785", // high
        //         "0.01750", // low
        //         "0.01758", // close
        //         "0", // volume
        //         "-0.0002200", // change
        //         "-1.2360", // percent change?
        //     ]
        //
        return [
            this.safeTimestamp (ohlcv, 0),
            this.safeFloat (ohlcv, 1),
            this.safeFloat (ohlcv, 2),
            this.safeFloat (ohlcv, 3),
            this.safeFloat (ohlcv, 4),
            this.safeFloat (ohlcv, 5),
        ];
    }

    async fetchOHLCV (symbol, timeframe = '1m', since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            // 'limit': limit, // if set counts from now into the past
            'base': market['baseId'],
            'quote': market['quoteId'],
            'format': 'array',
            'date_scale': this.timeframes[timeframe],
        };
        limit = (limit === undefined) ? 500 : limit;
        const duration = this.parseTimeframe (timeframe);
        if (since === undefined) {
            const end = this.seconds ();
            request['from'] = end - duration * limit;
            request['to'] = end;
        } else {
            const start = parseInt (since / 1000);
            request['from'] = start;
            request['to'] = this.sum (start, duration * limit);
        }
        const response = await this.v1GetGetHistMarketData (this.extend (request, params));
        //
        //     [
        //         ["1567036800","0.01779","0.01796","0.01748","0.01780","0","0","0"],
        //         ["1567123200","0.01780","0.01785","0.01750","0.01758","0","-0.0002200","-1.2360"],
        //         ["1567209600","0.01758","0.01809","0.01739","0.01789","0","0.0003100","1.7634"],
        //     ]
        //
        return this.parseOHLCVs (response, market, timeframe, since, limit);
    }

    async fetchBalance (params = {}) {
        await this.loadMarkets ();
        const defaultType = this.safeString2 (this.options, 'fetchBalance', 'defaultType', 'spot');
        const type = this.safeString (params, 'type', defaultType);
        const types = {
            'spot': 'SPTP',
            'future': 'FUTP',
            'otc': 'F2CP',
            'saving': 'VLTP',
        };
        const purseType = this.safeString (types, type, type);
        const request = {
            'purseType': purseType,
        };
        const response = await this.privateGetAccountBalances (this.extend (request, params));
        //
        //     {
        //         "code":1,
        //         "data":[
        //             {
        //                 "purseType":"FUTP",
        //                 "currency":"BTC",
        //                 "available":"0.41000000",
        //                 "unavailable":"0.00000000"
        //             },
        //             {
        //                 "purseType":"FUTP",
        //                 "currency":"USDT",
        //                 "available":"0.21000000",
        //                 "unvaliable":"0.00000000"
        //             }
        //         ]
        //         "message":"success",
        //         "ts":1573530401020
        //     }
        //
        const data = this.safeValue (response, 'data');
        const result = { 'info': response };
        for (let i = 0; i < data.length; i++) {
            const balance = data[i];
            const balanceType = this.safeString (balance, 'purseType');
            if (balanceType === purseType) {
                const currencyId = this.safeString (balance, 'currency');
                const code = this.safeCurrencyCode (currencyId);
                const account = this.account ();
                account['free'] = this.safeFloat (balance, 'available');
                account['used'] = this.safeFloat (balance, 'unavailable');
                result[code] = account;
            }
        }
        return this.parseBalance (result);
    }

    async createOrder (symbol, type, side, amount, price = undefined, params = {}) {
        let orderType = type.toUpperCase ();
        const orderSide = side.toUpperCase ();
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            // 'orderType': orderType, // MARKET, LIMIT, STOP, STOP-LIMIT
            'symbol': market['id'],
            'orderQty': this.amountToPrecision (symbol, amount),
            'side': orderSide,
            // 'stopPrice': this.priceToPrecision (symbol, stopPrice),
            // 'clOrdID': clientOrderId, // up to 20 chars, lowercase and uppercase letters only
            // 'timeInForce': 'GTC', // GTC, IOC, FOK, default is GTC
            // 'execInst': 'Post-Only', // the only value supported by the exchange, futures-only
        };
        const timeInForce = this.safeString (params, 'timeInForce');
        if (timeInForce !== undefined) {
            request['timeInForce'] = timeInForce;
            params = this.omit (params, 'timeInForce');
        }
        const clientOrderId = this.safeString2 (params, 'clOrdID', 'clientOrderId');
        if (clientOrderId !== undefined) {
            request['clOrdID'] = clientOrderId;
            params = this.omit (params, [ 'clOrdID', 'clientOrderId' ]);
        }
        const stopPrice = this.safeFloat (params, 'stopPrice');
        if (stopPrice === undefined) {
            if ((orderType === 'STOP-LIMIT') || (orderType === 'STOP')) {
                throw new ArgumentsRequired (this.id + ' createOrder() requires a stopPrice parameter for ' + orderType + ' orders');
            }
        } else {
            if (orderType === 'LIMIT') {
                orderType = 'STOP-LIMIT';
            } else if (orderType === 'MARKET') {
                orderType = 'STOP';
            }
            request['stopPrice'] = this.priceToPrecision (symbol, stopPrice);
            params = this.omit (params, 'stopPrice');
        }
        if (orderType === 'LIMIT' || orderType === 'STOP-LIMIT') {
            request['price'] = this.priceToPrecision (symbol, price);
        }
        request['orderType'] = orderType;
        let method = undefined;
        if (market['spot']) {
            method = 'privatePostSpotOrders';
        } else if (market['futures']) {
            method = 'privatePostFuturesOrders';
        }
        const response = await this[method] (this.extend (request, params));
        //
        // spot
        //
        //     {
        //         "code":1,
        //         "data":{
        //             "symbol":"ETHUSDT",
        //             "orderType":2,
        //             "avgPrice":"0",
        //             "execInst":null,
        //             "orderStatus":0,
        //             "userID":"1362494",
        //             "quote":"USDT",
        //             "rejectReason":null,
        //             "rejectCode":null,
        //             "price":"1500",
        //             "orderQty":"1",
        //             "commission":"0",
        //             "id":"268323430253735936",
        //             "timeInForce":1,
        //             "isTriggered":false,
        //             "side":2,
        //             "orderID":"1eO51MDSpQ",
        //             "leavesQty":"0",
        //             "cumQty":"0",
        //             "updateTime":null,
        //             "lastQty":"0",
        //             "clOrdID":null,
        //             "stopPrice":null,
        //             "createTime":null,
        //             "transactTime":null,
        //             "base":"ETH",
        //             "lastPrice":"0"
        //         },
        //         "message":"success",
        //         "ts":1610245290980
        //     }
        //
        // futures
        //
        //     {
        //         "code":1,
        //         "data":{
        //             "liqType":0,
        //             "symbol":"ETHUSDTFP",
        //             "orderType":2,
        //             "leverage":"1",
        //             "marketPrice":"1318.3150000000",
        //             "code":"FP",
        //             "avgPrice":"0",
        //             "execInst":null,
        //             "orderStatus":0,
        //             "userID":"1362494",
        //             "quote":"USDT",
        //             "rejectReason":null,
        //             "rejectCode":null,
        //             "price":"500",
        //             "orderQty":"1",
        //             "commission":"0",
        //             "id":"268346885133053953",
        //             "timeInForce":1,
        //             "isTriggered":false,
        //             "side":1,
        //             "orderID":"1eOuPUAAkq",
        //             "leavesQty":"1",
        //             "cumQty":"0",
        //             "updateTime":null,
        //             "lastQty":null,
        //             "clOrdID":null,
        //             "stopPrice":null,
        //             "createTime":null,
        //             "transactTime":null,
        //             "settleType":"VANILLA",
        //             "base":"ETH",
        //             "lastPrice":"0"
        //         },
        //         "message":"success",
        //         "ts":1610250883059
        //     }
        //
        const data = this.safeValue (response, 'data', {});
        return this.parseOrder (data, market);
    }

    async editOrder (id, symbol, type, side, amount, price = undefined, params = {}) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'orderID': id,
            // 'orderQty': this.amountToPrecision (symbol, amount),
            // 'price': this.priceToPrecision (symbol, price),
            // 'stopPrice': this.priceToPrecision (symbol, stopPrice),
        };
        const stopPrice = this.safeFloat (params, 'stopPrice');
        if (stopPrice !== undefined) {
            request['stopPrice'] = this.priceToPrecision (symbol, stopPrice);
            params = this.omit (params, 'stopPrice');
        }
        if (price !== undefined) {
            request['price'] = this.priceToPrecision (symbol, price);
        }
        if (amount !== undefined) {
            request['amount'] = this.amountToPrecision (symbol, amount);
        }
        let method = undefined;
        if (market['spot']) {
            method = 'privatePutSpotOrders';
        } else if (market['futures']) {
            method = 'privatePutFuturesOrders';
        }
        const response = await this[method] (this.extend (request, params));
        //
        // spot
        //
        //     {
        //         "code":1,
        //         "data":{
        //             "symbol":"ETHUSDT",
        //             "orderType":2,
        //             "avgPrice":"0",
        //             "execInst":null,
        //             "orderStatus":0,
        //             "userID":"1362494",
        //             "quote":"USDT",
        //             "rejectReason":null,
        //             "rejectCode":null,
        //             "price":"1500",
        //             "orderQty":"1",
        //             "commission":"0",
        //             "id":"268323430253735936",
        //             "timeInForce":1,
        //             "isTriggered":false,
        //             "side":2,
        //             "orderID":"1eO51MDSpQ",
        //             "leavesQty":"0",
        //             "cumQty":"0",
        //             "updateTime":null,
        //             "lastQty":"0",
        //             "clOrdID":null,
        //             "stopPrice":null,
        //             "createTime":null,
        //             "transactTime":null,
        //             "base":"ETH",
        //             "lastPrice":"0"
        //         },
        //         "message":"success",
        //         "ts":1610245290980
        //     }
        //
        // futures
        //
        //     {
        //         "code":1,
        //         "data":{
        //             "liqType":0,
        //             "symbol":"ETHUSDTFP",
        //             "orderType":2,
        //             "leverage":"1",
        //             "marketPrice":"1318.3150000000",
        //             "code":"FP",
        //             "avgPrice":"0",
        //             "execInst":null,
        //             "orderStatus":0,
        //             "userID":"1362494",
        //             "quote":"USDT",
        //             "rejectReason":null,
        //             "rejectCode":null,
        //             "price":"500",
        //             "orderQty":"1",
        //             "commission":"0",
        //             "id":"268346885133053953",
        //             "timeInForce":1,
        //             "isTriggered":false,
        //             "side":1,
        //             "orderID":"1eOuPUAAkq",
        //             "leavesQty":"1",
        //             "cumQty":"0",
        //             "updateTime":null,
        //             "lastQty":null,
        //             "clOrdID":null,
        //             "stopPrice":null,
        //             "createTime":null,
        //             "transactTime":null,
        //             "settleType":"VANILLA",
        //             "base":"ETH",
        //             "lastPrice":"0"
        //         },
        //         "message":"success",
        //         "ts":1610250883059
        //     }
        //
        const data = this.safeValue (response, 'data', {});
        return this.parseOrder (data, market);
    }

    async cancelOrder (id, symbol = undefined, params = {}) {
        await this.loadMarkets ();
        const request = {
            'orderID': id,
        };
        let method = undefined;
        const defaultType = this.safeString2 (this.options, 'cancelOrder', 'defaultType', 'spot');
        let type = this.safeString (params, 'type', defaultType);
        params = this.omit (params, 'type');
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
            type = market['type'];
        }
        if (type === 'spot') {
            method = 'privateDeleteSpotOrdersCancelOrderID';
        } else if (type === 'futures') {
            method = 'privateDeleteFuturesOrdersCancelOrderID';
        }
        const response = await this[method] (this.extend (request, params));
        //
        // spot
        //
        //     {
        //         "code":1,
        //         "data":{
        //             "avgPrice":"0",
        //             "base":"BTC",
        //             "clOrdID":"aax",
        //             "commission":"0",
        //             "createTime":"2019-11-12T03:46:41Z",
        //             "cumQty":"0",
        //             "id":"114330021504606208",
        //             "isTriggered":false,
        //             "lastPrice":"0",
        //             "lastQty":"0",
        //             "leavesQty":"0",
        //             "orderID":"wJ4L366KB",
        //             "orderQty":"0.05",
        //             "orderStatus":1,
        //             "orderType":2,
        //             "price":"8000",
        //             "quote":"USDT",
        //             "rejectCode":0,
        //             "rejectReason":null,
        //             "side":1,
        //             "stopPrice":"0",
        //             "symbol":"BTCUSDT",
        //             "transactTime":null,
        //             "updateTime":"2019-11-12T03:46:41Z",
        //             "timeInForce":1,
        //             "userID":"216214"
        //         },
        //         "message":"success",
        //         "ts":1573530402029
        //     }
        //
        // futures
        //
        //     {
        //         "code":1,
        //         "data":{
        //             "avgPrice":"0",
        //             "base":"BTC",
        //             "clOrdID":"aax_futures",
        //             "code":"FP",
        //             "commission":"0",
        //             "createTime":"2019-11-12T06:48:58Z",
        //             "cumQty":"0",
        //             "id":"114375893764395008",
        //             "isTriggered":false,
        //             "lastPrice":"0",
        //             "lastQty":null,
        //             "leavesQty":"300",
        //             "leverage":"1",
        //             "liqType":0,
        //             "marketPrice":"8760.75",
        //             "orderID":"wJTewQc81",
        //             "orderQty":"300",
        //             "orderStatus":1,
        //             "orderType":2,
        //             "price":"8000",
        //             "quote":"USD",
        //             "rejectCode":0,
        //             "rejectReason":null,
        //             "settleType":"INVERSE",
        //             "side":1,
        //             "stopPrice":"0",
        //             "symbol":"BTCUSDFP",
        //             "transactTime":"2019-11-12T06:48:58Z",
        //             "updateTime":"2019-11-12T06:48:58Z",
        //             "timeInForce":1,
        //             "execInst": "",
        //             "userID":"216214"
        //         },
        //         "message":"success",
        //         "ts":1573541642970
        //     }
        //
        const data = this.safeValue (response, 'data', {});
        return this.parseOrder (data, market);
    }

    async cancelAllOrders (symbol = undefined, params = {}) {
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' cancelAllOrders() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        let method = undefined;
        if (market['spot']) {
            method = 'privateDeleteSpotOrdersCancelAll';
        } else if (market['futures']) {
            method = 'privateDeleteFuturesOrdersCancelAll';
        }
        const response = await this[method] (this.extend (request, params));
        //
        //     {
        //         "code":1,
        //         "data":[
        //             "vBC9rXsEE",
        //             "vBCc46OI0"
        //             ],
        //         "message":"success",
        //         "ts":1572597435470
        //     }
        //
        return response;
    }

    async fetchOrder (id, symbol = undefined, params = {}) {
        await this.loadMarkets ();
        const defaultType = this.safeString2 (this.options, 'fetchOrder', 'defaultType', 'spot');
        params['type'] = this.safeString (params, 'type', defaultType);
        const request = {};
        const clientOrderId = this.safeString2 (params, 'clOrdID', 'clientOrderId');
        if (clientOrderId === undefined) {
            request['orderID'] = id;
        } else {
            request['clOrdID'] = clientOrderId;
            params = this.omit (params, [ 'clOrdID', 'clientOrderId' ]);
        }
        const orders = await this.fetchOrders (symbol, undefined, undefined, this.extend (request, params));
        const order = this.safeValue (orders, 0);
        if (order === undefined) {
            if (clientOrderId === undefined) {
                throw new OrderNotFound (this.id + ' fetchOrder() could not find order id ' + id);
            } else {
                throw new OrderNotFound (this.id + ' fetchOrder() could not find order clientOrderID ' + clientOrderId);
            }
        }
        return order;
    }

    async fetchOpenOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const request = {
            // 'pageNum': '1',
            // 'pageSize': '10',
            // 'symbol': market['id'],
            // 'orderID': id,
            // 'side': 'undefined', // BUY, SELL
            // 'clOrdID': clientOrderId,
        };
        const defaultType = this.safeString2 (this.options, 'fetchOpenOrders', 'defaultType', 'spot');
        let type = this.safeString (params, 'type', defaultType);
        params = this.omit (params, 'type');
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['symbol'] = market['id'];
            type = market['type'];
        }
        const clientOrderId = this.safeString2 (params, 'clOrdID', 'clientOrderId');
        if (clientOrderId !== undefined) {
            request['clOrdID'] = clientOrderId;
            params = this.omit (params, [ 'clOrdID', 'clientOrderId' ]);
        }
        let method = undefined;
        if (type === 'spot') {
            method = 'privateGetSpotOpenOrders';
        } else if (type === 'futures') {
            method = 'privateGetFuturesOpenOrders';
        }
        if (limit !== undefined) {
            request['pageSize'] = limit; // default 10
        }
        const response = await this[method] (this.extend (request, params));
        //
        // spot
        //
        //     {
        //         "code":1,
        //         "data":{
        //             "total":19,
        //             "pageSize":10,
        //             "list":[
        //                 {
        //                     "orderType":2,
        //                     "symbol":"BTCUSDT",
        //                     "avgPrice":"0",
        //                     "orderStatus":0,
        //                     "userID":"7225",
        //                     "quote":"USDT",
        //                     "rejectReason":null,
        //                     "rejectCode":null,
        //                     "price":"0",
        //                     "orderQty":"0.002",
        //                     "commission":"0",
        //                     "id":"110419975166304256",
        //                     "isTriggered":null,
        //                     "side":1,
        //                     "orderID":"vBGlDcLwk",
        //                     "cumQty":"0",
        //                     "leavesQty":"0",
        //                     "updateTime":null,
        //                     "clOrdID":"0001",
        //                     "lastQty":"0",
        //                     "stopPrice":"0",
        //                     "createTime":"2019-11-01T08:49:33Z",
        //                     "transactTime":null,
        //                     "timeInForce":1,
        //                     "base":"BTC",
        //                     "lastPrice":"0"
        //                 }
        //             ],
        //             "pageNum":1
        //         },
        //         "message":"success",
        //         "ts":1572598173682
        //     }
        //
        // futures
        //
        //     {
        //         "code":1,
        //         "data":{
        //             "list":[
        //                 {
        //                     "avgPrice":"8768.99999999484997",
        //                     "base":"BTC",
        //                     "clOrdID":null,
        //                     "code":"FP",
        //                     "commission":"0.00000913",
        //                     "createTime":"2019-11-12T07:05:52.000Z,
        //                     "cumQty":"100",
        //                     "id":"114380149603028993",
        //                     "isTriggered":false,
        //                     "lastPrice":"8769",
        //                     "lastQty":"100",
        //                     "leavesQty":"0",
        //                     "leverage":"1",
        //                     "liqType":1,
        //                     "marketPrice":"8769.75",
        //                     "orderID":"wJXURIFBT",
        //                     "orderQty":"100",
        //                     "orderStatus":3,
        //                     "orderType":1,
        //                     "price":"8769.75",
        //                     "quote":"USD",
        //                     "rejectCode":0,
        //                     "rejectReason":null,
        //                     "settleType":"INVERSE",
        //                     "side":2,
        //                     "stopPrice":"0",
        //                     "symbol":"BTCUSDFP",
        //                     "transactTime":"2019-11-12T07:05:52.000Z,
        //                     "updateTime":"2019-11-12T07:05:52.000Z,
        //                     "timeInForce":1,
        //                     "execInst": "",
        //                     "userID":"216214"
        //                 },
        //             ],
        //             "pageNum":1,
        //             "pageSize":10,
        //             "total":21
        //         },
        //         "message":"success",
        //         "ts":1573546960172
        //     }
        //
        const data = this.safeValue (response, 'data', {});
        const orders = this.safeValue (data, 'list', []);
        return this.parseOrders (orders, market, since, limit);
    }

    async fetchClosedOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        const request = {
            'orderStatus': '2', // 1 new, 2 filled, 3 canceled
        };
        return await this.fetchOrders (symbol, since, limit, this.extend (request, params));
    }

    async fetchCanceledOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        const request = {
            'orderStatus': '3', // 1 new, 2 filled, 3 canceled
        };
        return await this.fetchOrders (symbol, since, limit, this.extend (request, params));
    }

    async fetchOrders (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const request = {
            // 'pageNum': '1',
            // 'pageSize': '10',
            // 'symbol': market['id'],
            // 'orderID': id,
            // 'base': market['baseId'],
            // 'quote': market['quoteId'],
            // 'orderStatus': undefined, // 1 new, 2 filled, 3 canceled
            // 'startDate': this.ymd (since),
            // 'endDate': this.ymd (this.milliseconds()),
            // 'orderType': undefined, // MARKET, LIMIT, STOP, STOP-LIMIT
            // 'side': 'undefined', // BUY, SELL
            // 'clOrdID': clientOrderId,
        };
        let method = undefined;
        const defaultType = this.safeString2 (this.options, 'fetchOrders', 'defaultType', 'spot');
        let type = this.safeString (params, 'type', defaultType);
        params = this.omit (params, 'type');
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['symbol'] = market['id'];
            type = market['type'];
        }
        if (type === 'spot') {
            method = 'privateGetSpotOrders';
        } else if (type === 'futures') {
            method = 'privateGetFuturesOrders';
        }
        const clientOrderId = this.safeString2 (params, 'clOrdID', 'clientOrderId');
        if (clientOrderId !== undefined) {
            request['clOrdID'] = clientOrderId;
            params = this.omit (params, [ 'clOrdID', 'clientOrderId' ]);
        }
        if (limit !== undefined) {
            request['pageSize'] = limit; // default 10
        }
        if (since !== undefined) {
            request['startDate'] = this.ymd (since);
        }
        const response = await this[method] (this.extend (request, params));
        //
        // spot
        //
        //     {
        //         "code":1,
        //         "data":{
        //             "total":19,
        //             "pageSize":10,
        //             "list":[
        //                 {
        //                     "orderType":2,
        //                     "symbol":"BTCUSDT",
        //                     "avgPrice":"0",
        //                     "orderStatus":0,
        //                     "userID":"7225",
        //                     "quote":"USDT",
        //                     "rejectReason":null,
        //                     "rejectCode":null,
        //                     "price":"0",
        //                     "orderQty":"0.002",
        //                     "commission":"0",
        //                     "id":"110419975166304256",
        //                     "isTriggered":null,
        //                     "side":1,
        //                     "orderID":"vBGlDcLwk",
        //                     "cumQty":"0",
        //                     "leavesQty":"0",
        //                     "updateTime":null,
        //                     "clOrdID":"0001",
        //                     "lastQty":"0",
        //                     "stopPrice":"0",
        //                     "createTime":"2019-11-01T08:49:33Z",
        //                     "transactTime":null,
        //                     "timeInForce":1,
        //                     "base":"BTC",
        //                     "lastPrice":"0"
        //                 }
        //             ],
        //             "pageNum":1
        //         },
        //         "message":"success",
        //         "ts":1572598173682
        //     }
        //
        // futures
        //
        //     {
        //         "code":1,
        //         "data":{
        //             "list":[
        //                 {
        //                     "avgPrice":"8768.99999999484997",
        //                     "base":"BTC",
        //                     "clOrdID":null,
        //                     "code":"FP",
        //                     "commission":"0.00000913",
        //                     "createTime":"2019-11-12T07:05:52.000Z,
        //                     "cumQty":"100",
        //                     "id":"114380149603028993",
        //                     "isTriggered":false,
        //                     "lastPrice":"8769",
        //                     "lastQty":"100",
        //                     "leavesQty":"0",
        //                     "leverage":"1",
        //                     "liqType":1,
        //                     "marketPrice":"8769.75",
        //                     "orderID":"wJXURIFBT",
        //                     "orderQty":"100",
        //                     "orderStatus":3,
        //                     "orderType":1,
        //                     "price":"8769.75",
        //                     "quote":"USD",
        //                     "rejectCode":0,
        //                     "rejectReason":null,
        //                     "settleType":"INVERSE",
        //                     "side":2,
        //                     "stopPrice":"0",
        //                     "symbol":"BTCUSDFP",
        //                     "transactTime":"2019-11-12T07:05:52.000Z,
        //                     "updateTime":"2019-11-12T07:05:52.000Z,
        //                     "timeInForce":1,
        //                     "execInst": "",
        //                     "userID":"216214"
        //                 },
        //             ],
        //             "pageNum":1,
        //             "pageSize":10,
        //             "total":21
        //         },
        //         "message":"success",
        //         "ts":1573546960172
        //     }
        //
        const data = this.safeValue (response, 'data', {});
        const orders = this.safeValue (data, 'list', []);
        return this.parseOrders (orders, market, since, limit);
    }

    parseOrderStatus (status) {
        const statuses = {
            '0': 'open', // pending new
            '1': 'open', // new
            '2': 'open', // partially-filled
            '3': 'closed', // filled
            '4': 'canceled', // cancel-reject
            '5': 'canceled', // canceled
            '6': 'rejected', // rejected
            '10': 'expired', // expired
            '11': 'rejected', // business-reject
        };
        return this.safeString (statuses, status, status);
    }

    parseOrderType (status) {
        const statuses = {
            '1': 'market',
            '2': 'limit',
            '3': 'stop',
            '4': 'stop-limit',
            '7': 'stop-loss',
            '8': 'take-profit',
        };
        return this.safeString (statuses, status, status);
    }

    parseTimeInForce (timeInForce) {
        const timeInForces = {
            '1': 'GTC',
            '3': 'IOC',
            '4': 'FOK',
        };
        return this.safeString (timeInForces, timeInForce, timeInForce);
    }

    parseOrder (order, market = undefined) {
        //
        //     {
        //         "avgPrice":"8768.99999999484997",
        //         "base":"BTC",
        //         "clOrdID":null,
        //         "code":"FP", // futures only
        //         "commission":"0.00000913",
        //         "createTime":"2019-11-12T07:05:52.000Z,
        //         "cumQty":"100",
        //         "id":"114380149603028993", // futures only
        //         "isTriggered":false,
        //         "lastPrice":"8769",
        //         "lastQty":"100",
        //         "leavesQty":"0",
        //         "leverage":"1", // futures only
        //         "liqType":1, // futures only
        //         "marketPrice":"8769.75", // futures only
        //         "orderID":"wJXURIFBT",
        //         "orderQty":"100",
        //         "orderStatus":3,
        //         "orderType":1,
        //         "price":"8769.75",
        //         "quote":"USD",
        //         "rejectCode":0,
        //         "rejectReason":null,
        //         "settleType":"INVERSE", // futures only
        //         "side":2,
        //         "stopPrice":"0",
        //         "symbol":"BTCUSDFP",
        //         "transactTime":"2019-11-12T07:05:52.000Z,
        //         "updateTime":"2019-11-12T07:05:52.000Z,
        //         "timeInForce":1,
        //         "execInst": "",
        //         "userID":"216214"
        //     }
        //
        // sometimes the timestamp is returned in milliseconds
        let timestamp = this.safeValue (order, 'createTime');
        if (typeof timestamp === 'string') {
            timestamp = this.parse8601 (timestamp);
        }
        const status = this.parseOrderStatus (this.safeString (order, 'orderStatus'));
        const type = this.parseOrderType (this.safeString (order, 'orderType'));
        let side = this.safeString (order, 'side');
        if (side === '1') {
            side = 'buy';
        } else if (side === '2') {
            side = 'sell';
        }
        const id = this.safeString (order, 'orderID');
        const clientOrderId = this.safeString (order, 'clOrdID');
        const marketId = this.safeString (order, 'symbol');
        market = this.safeMarket (marketId, market);
        const symbol = market['symbol'];
        const price = this.safeFloat (order, 'price');
        const stopPrice = this.safeFloat (order, 'stopPrice');
        const timeInForce = this.parseTimeInForce (this.safeString (order, 'timeInForce'));
        const execInst = this.safeString (order, 'execInst');
        const postOnly = (execInst === 'Post-Only');
        const average = this.safeFloat (order, 'avgPrice');
        const amount = this.safeFloat (order, 'orderQty');
        const filled = this.safeFloat (order, 'cumQty');
        const remaining = this.safeString (order, 'leavesQty');
        let cost = undefined;
        let lastTradeTimestamp = undefined;
        if (filled !== undefined) {
            if (price !== undefined) {
                cost = filled * price;
            }
            if (filled > 0) {
                lastTradeTimestamp = this.safeValue (order, 'transactTime');
                if (typeof lastTradeTimestamp === 'string') {
                    lastTradeTimestamp = this.parse8601 (lastTradeTimestamp);
                }
            }
        }
        let fee = undefined;
        const feeCost = this.safeFloat (order, 'commission');
        if (feeCost !== undefined) {
            fee = {
                'currency': undefined,
                'cost': feeCost,
            };
        }
        return {
            'id': id,
            'info': order,
            'clientOrderId': clientOrderId,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': lastTradeTimestamp,
            'status': status,
            'symbol': symbol,
            'type': type,
            'timeInForce': timeInForce,
            'postOnly': postOnly,
            'side': side,
            'price': price,
            'stopPrice': stopPrice,
            'average': average,
            'amount': amount,
            'filled': filled,
            'remaining': remaining,
            'cost': cost,
            'trades': undefined,
            'fee': fee,
        };
    }

    async fetchMyTrades (symbol = undefined, since = undefined, limit = undefined, params = {}) {
        await this.loadMarkets ();
        const request = {
            // 'pageNum': '1',
            // 'pageSize': '10',
            // 'symbol': market['id'],
            // 'orderID': id,
            // 'base': market['baseId'],
            // 'quote': market['quoteId'],
            // 'startDate': this.ymd (since),
            // 'endDate': this.ymd (this.milliseconds()),
            // 'orderType': undefined, // MARKET, LIMIT, STOP, STOP-LIMIT
            // 'side': 'undefined', // BUY, SELL
        };
        let method = undefined;
        const defaultType = this.safeString2 (this.options, 'fetchMyTrades', 'defaultType', 'spot');
        let type = this.safeString (params, 'type', defaultType);
        params = this.omit (params, 'type');
        let market = undefined;
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['symbol'] = market['id'];
            type = market['type'];
        }
        if (type === 'spot') {
            method = 'privateGetSpotTrades';
        } else if (type === 'futures') {
            method = 'privateGetFuturesTrades';
        }
        if (limit !== undefined) {
            request['pageSize'] = limit; // default 10
        }
        if (since !== undefined) {
            request['startDate'] = this.ymd (since);
        }
        const response = await this[method] (this.extend (request, params));
        //
        // spot
        //
        //     {
        //         "code":1,
        //         "data":{
        //             "total":19,
        //             "pageSize":10,
        //             "list":[
        //                 {
        //                     "orderType":2,
        //                     "symbol":"BTCUSDT",
        //                     "avgPrice":"0",
        //                     "orderStatus":0,
        //                     "userID":"7225",
        //                     "quote":"USDT",
        //                     "rejectReason":null,
        //                     "rejectCode":null,
        //                     "price":"0",
        //                     "orderQty":"0.002",
        //                     "commission":"0",
        //                     "id":"110419975166304256",
        //                     "isTriggered":null,
        //                     "side":1,
        //                     "orderID":"vBGlDcLwk",
        //                     "cumQty":"0",
        //                     "leavesQty":"0",
        //                     "updateTime":null,
        //                     "clOrdID":"0001",
        //                     "lastQty":"0",
        //                     "stopPrice":"0",
        //                     "createTime":"2019-11-01T08:49:33Z",
        //                     "transactTime":null,
        //                     "timeInForce":1,
        //                     "base":"BTC",
        //                     "lastPrice":"0"
        //                 }
        //             ],
        //             "pageNum":1
        //         },
        //         "message":"success",
        //         "ts":1572598173682
        //     }
        //
        // futures
        //
        //     {
        //         "code":1,
        //         "data":{
        //             "list":[
        //                 {
        //                     "avgPrice":"8768.99999999484997",
        //                     "base":"BTC",
        //                     "clOrdID":null,
        //                     "code":"FP",
        //                     "commission":"0.00000913",
        //                     "createTime":"2019-11-12T07:05:52.000Z,
        //                     "cumQty":"100",
        //                     "id":"114380149603028993",
        //                     "isTriggered":false,
        //                     "lastPrice":"8769",
        //                     "lastQty":"100",
        //                     "leavesQty":"0",
        //                     "leverage":"1",
        //                     "liqType":1,
        //                     "marketPrice":"8769.75",
        //                     "orderID":"wJXURIFBT",
        //                     "orderQty":"100",
        //                     "orderStatus":3,
        //                     "orderType":1,
        //                     "price":"8769.75",
        //                     "quote":"USD",
        //                     "rejectCode":0,
        //                     "rejectReason":null,
        //                     "settleType":"INVERSE",
        //                     "side":2,
        //                     "stopPrice":"0",
        //                     "symbol":"BTCUSDFP",
        //                     "transactTime":"2019-11-12T07:05:52.000Z,
        //                     "updateTime":"2019-11-12T07:05:52.000Z,
        //                     "timeInForce":1,
        //                     "execInst": "",
        //                     "userID":"216214"
        //                 },
        //             ],
        //             "pageNum":1,
        //             "pageSize":10,
        //             "total":21
        //         },
        //         "message":"success",
        //         "ts":1573546960172
        //     }
        //
        const data = this.safeValue (response, 'data', {});
        const trades = this.safeValue (data, 'list', []);
        return this.parseTrades (trades, market, since, limit);
    }

    async fetchDepositAddress (code, params = {}) {
        await this.loadMarkets ();
        const currency = this.currency (code);
        const request = {
            'currency': currency['id'],
            // 'network': undefined, // 'ERC20
        };
        const response = await this.privateGetAccountDepositAddress (this.extend (request, params));
        //
        //     {
        //         "code":1,
        //         "data":{
        //             "address":"0x080c5c667381404cca9be0be9a04b2e47691ff86",
        //             "tag":null,
        //             "currency":"USDT",
        //             "network":"ERC20"
        //         },
        //         "message":"success",
        //         "ts":1610270465132
        //     }
        //
        const data = this.safeValue (response, 'data', {});
        return this.parseDepositAddress (data, currency);
    }

    parseDepositAddress (depositAddress, currency = undefined) {
        //
        //     {
        //         "address":"0x080c5c667381404cca9be0be9a04b2e47691ff86",
        //         "tag":null,
        //         "currency":"USDT",
        //         "network":"ERC20"
        //     }
        //
        const address = this.safeString (depositAddress, 'address');
        const tag = this.safeString (depositAddress, 'tag');
        const currencyId = this.safeString (depositAddress, 'currency');
        const code = this.safeCurrencyCode (currencyId);
        return {
            'info': depositAddress,
            'code': code,
            'address': address,
            'tag': tag,
        };
    }

    nonce () {
        return this.milliseconds ();
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let url = '/' + this.implodeParams (path, params);
        const query = this.omit (params, this.extractParams (path));
        if (api === 'v1') {
            if (Object.keys (query).length) {
                url += '?' + this.urlencode (query);
            }
        } else {
            url = '/' + this.version + url;
            if (api === 'public') {
                if (Object.keys (query).length) {
                    url += '?' + this.urlencode (query);
                }
            } else if (api === 'private') {
                this.checkRequiredCredentials ();
                const nonce = this.nonce ().toString ();
                headers = {
                    'X-ACCESS-KEY': this.apiKey,
                    'X-ACCESS-NONCE': nonce,
                };
                let auth = nonce + ':' + method;
                if (method === 'GET') {
                    if (Object.keys (query).length) {
                        url += '?' + this.urlencode (query);
                    }
                    auth += url;
                } else {
                    headers['Content-Type'] = 'application/json';
                    body = this.json (query);
                    auth += url + body;
                }
                const signature = this.hmac (this.encode (auth), this.encode (this.secret));
                headers['X-ACCESS-SIGN'] = signature;
            }
        }
        url = this.implodeParams (this.urls['api'][api], { 'hostname': this.hostname }) + url;
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (code, reason, url, method, headers, body, response, requestHeaders, requestBody) {
        if (response === undefined) {
            return; // fallback to default error handler
        }
        //
        //     {"code":40102,"message":"Unauthorized(invalid key)"}
        //
        const errorCode = this.safeString (response, 'code');
        if ((errorCode !== undefined) && (errorCode !== '1')) {
            const feedback = this.id + ' ' + this.json (response);
            this.throwExactlyMatchedException (this.exceptions['exact'], errorCode, feedback);
            this.throwBroadlyMatchedException (this.exceptions['broad'], body, feedback);
        }
    }
};
