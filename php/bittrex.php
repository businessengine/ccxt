<?php

namespace ccxtpro;

// PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:
// https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code

use Exception; // a common import
use \ccxt\BadRequest;
use \ccxt\InvalidNonce;

class bittrex extends \ccxt\async\bittrex {

    use ClientTrait;

    public function describe() {
        return $this->deep_extend(parent::describe (), array(
            'has' => array(
                'ws' => true,
                'watchBalance' => true,
                'watchHeartbeat' => true,
                'watchMyTrades' => true,
                'watchOHLCV' => true,
                'watchOrderBook' => true,
                'watchOrders' => true,
                'watchTicker' => true,
                'watchTickers' => false, // for now
                'watchTrades' => true,
            ),
            'urls' => array(
                'api' => array(
                    'ws' => 'wss://socket-v3.bittrex.com/signalr/connect',
                    'signalr' => 'https://socket-v3.bittrex.com/signalr',
                ),
            ),
            'api' => array(
                'signalr' => array(
                    'get' => array(
                        'negotiate',
                        'start',
                    ),
                ),
            ),
            'options' => array(
                'tradesLimit' => 1000,
                'hub' => 'c3',
                'I' => $this->milliseconds(),
            ),
        ));
    }

    public function get_signal_r_url($negotiation) {
        $connectionToken = $this->safe_string($negotiation['response'], 'ConnectionToken');
        $query = array_merge($negotiation['request'], array(
            'connectionToken' => $connectionToken,
            // 'tid' => $this->milliseconds(fmod(), 10),
        ));
        return $this->urls['api']['ws'] . '?' . $this->urlencode($query);
    }

    public function make_request($requestId, $method, $args) {
        $hub = $this->safe_string($this->options, 'hub', 'c3');
        return array(
            'H' => $hub,
            'M' => $method,
            'A' => $args, // arguments
            'I' => $requestId, // invocation request id
        );
    }

    public function make_request_to_subscribe($requestId, $args) {
        $method = 'Subscribe';
        return $this->make_request($requestId, $method, $args);
    }

    public function make_request_to_authenticate($requestId) {
        $timestamp = $this->milliseconds();
        $uuid = $this->uuid();
        $auth = (string) $timestamp . $uuid;
        $signature = $this->hmac($this->encode($auth), $this->encode($this->secret), 'sha512');
        $args = array( $this->apiKey, $timestamp, $uuid, $signature );
        $method = 'Authenticate';
        return $this->make_request($requestId, $method, $args);
    }

    public function request_id() {
        // their support said that $reqid must be an int32, not documented
        $reqid = $this->sum($this->safe_integer($this->options, 'I', 0), 1);
        $this->options['I'] = $reqid;
        return $reqid;
    }

    public function send_request_to_subscribe($negotiation, $messageHash, $subscription, $params = array ()) {
        $args = array( $messageHash );
        $requestId = (string) $this->request_id();
        $request = $this->make_request_to_subscribe($requestId, array( $args ));
        $subscription = array_merge(array(
            'id' => $requestId,
            'negotiation' => $negotiation,
        ), $subscription);
        $url = $this->get_signal_r_url($negotiation);
        return yield $this->watch($url, $messageHash, $request, $messageHash, $subscription);
    }

    public function authenticate($params = array ()) {
        yield $this->load_markets();
        $request = yield $this->negotiate();
        return yield $this->send_request_to_authenticate($request, false, $params);
    }

    public function send_request_to_authenticate($negotiation, $expired = false, $params = array ()) {
        $url = $this->get_signal_r_url($negotiation);
        $client = $this->client($url);
        $messageHash = 'authenticate';
        $future = $this->safe_value($client->subscriptions, $messageHash);
        if (($future === null) || $expired) {
            $future = $client->future ($messageHash);
            $client->subscriptions[$messageHash] = $future;
            $requestId = (string) $this->request_id();
            $request = $this->make_request_to_authenticate($requestId);
            $subscription = array(
                'id' => $requestId,
                'params' => $params,
                'negotiation' => $negotiation,
                'method' => array($this, 'handle_authenticate'),
            );
            $this->spawn(array($this, 'watch'), $url, $messageHash, $request, $requestId, $subscription);
        }
        return yield $future;
    }

    public function send_authenticated_request_to_subscribe($authentication, $messageHash, $params = array ()) {
        $negotiation = $this->safe_value($authentication, 'negotiation');
        $subscription = array( 'params' => $params );
        return yield $this->send_request_to_subscribe($negotiation, $messageHash, $subscription, $params);
    }

    public function handle_authenticate($client, $message, $subscription) {
        $requestId = $this->safe_string($subscription, 'id');
        if (is_array($client->subscriptions) && array_key_exists($requestId, $client->subscriptions)) {
            unset($client->subscriptions[$requestId]);
        }
        $client->resolve ($subscription, 'authenticate');
    }

    public function handle_authentication_expiring_helper() {
        $negotiation = yield $this->negotiate();
        return yield $this->send_request_to_authenticate($negotiation, true);
    }

    public function handle_authentication_expiring($client, $message) {
        //
        //     {
        //         C => 'd-B1733F58-B,0|vT7,1|vT8,2|vBR,3',
        //         M => array( array( H => 'C3', M => 'authenticationExpiring', A => array() ) )
        //     }
        //
        // resend the authentication request and refresh the subscription
        //
        $this->spawn(array($this, 'handle_authentication_expiring_helper'));
    }

    public function create_signal_r_query($params = array ()) {
        $hub = $this->safe_string($this->options, 'hub', 'c3');
        $hubs = array(
            array( 'name' => $hub ),
        );
        $ms = $this->milliseconds();
        return array_merge(array(
            'transport' => 'webSockets',
            'connectionData' => $this->json($hubs),
            'clientProtocol' => 1.5,
            '_' => $ms, // no cache
            'tid' => $this->sum(fmod($ms, 10), 1), // random
        ), $params);
    }

    public function negotiate($params = array ()) {
        $client = $this->client($this->urls['api']['ws']);
        $messageHash = 'negotiate';
        $future = $this->safe_value($client->subscriptions, $messageHash);
        if ($future === null) {
            $future = $client->future ($messageHash);
            $client->subscriptions[$messageHash] = $future;
            $request = $this->create_signal_r_query($params);
            $response = yield $this->signalrGetNegotiate (array_merge($request, $params));
            //
            //     {
            //         Url => '/signalr/v1.1/signalr',
            //         ConnectionToken => 'lT/sa19+FcrEb4W53On2v+Pcc3d4lVCHV5/WJtmQw1RQNQMpm7K78w/WnvfTN2EgwQopTUiFX1dioHN7Bd1p8jAbfdxrqf5xHAMntJfOrw1tON0O',
            //         ConnectionId => 'a2afb0f7-346f-4f32-b7c7-01e04584b86a',
            //         KeepAliveTimeout => 20,
            //         DisconnectTimeout => 30,
            //         ConnectionTimeout => 110,
            //         TryWebSockets => true,
            //         ProtocolVersion => '1.5',
            //         TransportConnectTimeout => 5,
            //         LongPollDelay => 0
            //     }
            //
            $result = array(
                'request' => $request,
                'response' => $response,
            );
            $client->resolve ($result, $messageHash);
        }
        return yield $future;
    }

    public function start($negotiation, $params = array ()) {
        $connectionToken = $this->safe_string($negotiation['response'], 'ConnectionToken');
        $request = $this->create_signal_r_query(array_merge($negotiation['request'], array(
            'connectionToken' => $connectionToken,
        )));
        return yield $this->signalrGetStart ($request);
    }

    public function watch_orders($symbol = null, $since = null, $limit = null, $params = array ()) {
        yield $this->load_markets();
        $authentication = yield $this->authenticate();
        $orders = yield $this->subscribe_to_orders($authentication, $params);
        if ($this->newUpdates) {
            $limit = $orders->getLimit ($symbol, $limit);
        }
        return $this->filter_by_symbol_since_limit($orders, $symbol, $since, $limit, true);
    }

    public function subscribe_to_orders($authentication, $params = array ()) {
        $messageHash = 'order';
        return yield $this->send_authenticated_request_to_subscribe($authentication, $messageHash, $params);
    }

    public function handle_order($client, $message) {
        //
        //     {
        //         accountId => '2832c5c6-ac7a-493e-bc16-ebca06c73670',
        //         sequence => 41,
        //         $delta => {
        //             id => 'b91eff76-10eb-4382-834a-b753b770283e',
        //             marketSymbol => 'BTC-USDT',
        //             direction => 'BUY',
        //             type => 'LIMIT',
        //             quantity => '0.01000000',
        //             $limit => '3000.00000000',
        //             timeInForce => 'GOOD_TIL_CANCELLED',
        //             fillQuantity => '0.00000000',
        //             commission => '0.00000000',
        //             proceeds => '0.00000000',
        //             status => 'OPEN',
        //             createdAt => '2020-10-07T12:51:43.16Z',
        //             updatedAt => '2020-10-07T12:51:43.16Z'
        //         }
        //     }
        //
        $delta = $this->safe_value($message, 'delta', array());
        $parsed = $this->parse_order($delta);
        if ($this->orders === null) {
            $limit = $this->safe_integer($this->options, 'ordersLimit', 1000);
            $this->orders = new ArrayCacheBySymbolById ($limit);
        }
        $orders = $this->orders;
        $orders->append ($parsed);
        $messageHash = 'order';
        $client->resolve ($this->orders, $messageHash);
    }

    public function watch_balance($params = array ()) {
        yield $this->load_markets();
        $authentication = yield $this->authenticate();
        return yield $this->subscribe_to_balance($authentication, $params);
    }

    public function subscribe_to_balance($authentication, $params = array ()) {
        $messageHash = 'balance';
        return yield $this->send_authenticated_request_to_subscribe($authentication, $messageHash, $params);
    }

    public function handle_balance($client, $message) {
        //
        //     {
        //         accountId => '2832c5c6-ac7a-493e-bc16-ebca06c73670',
        //         sequence => 9,
        //         $delta => {
        //             currencySymbol => 'USDT',
        //             total => '32.88918476',
        //             available => '2.82918476',
        //             updatedAt => '2020-10-06T13:49:20.29Z'
        //         }
        //     }
        //
        $delta = $this->safe_value($message, 'delta', array());
        $currencyId = $this->safe_string($delta, 'currencySymbol');
        $code = $this->safe_currency_code($currencyId);
        $account = $this->account();
        $account['free'] = $this->safe_string($delta, 'available');
        $account['total'] = $this->safe_string($delta, 'total');
        $this->balance[$code] = $account;
        $this->balance = $this->parse_balance($this->balance, false);
        $messageHash = 'balance';
        $client->resolve ($this->balance, $messageHash);
    }

    public function watch_heartbeat($params = array ()) {
        yield $this->load_markets();
        $negotiation = yield $this->negotiate();
        return yield $this->subscribe_to_heartbeat($negotiation, $params);
    }

    public function subscribe_to_heartbeat($negotiation, $params = array ()) {
        yield $this->load_markets();
        $url = $this->get_signal_r_url($negotiation);
        $requestId = (string) $this->milliseconds();
        $messageHash = 'heartbeat';
        $args = array( $messageHash );
        $request = $this->make_request_to_subscribe($requestId, array( $args ));
        $subscription = array(
            'id' => $requestId,
            'params' => $params,
            'negotiation' => $negotiation,
        );
        return yield $this->watch($url, $messageHash, $request, $messageHash, $subscription);
    }

    public function handle_heartbeat($client, $message) {
        //
        // every 20 seconds (approx) if no other updates are sent
        //
        //     array()
        //
        $client->resolve ($message, 'heartbeat');
    }

    public function watch_ticker($symbol, $params = array ()) {
        yield $this->load_markets();
        $negotiation = yield $this->negotiate();
        return yield $this->subscribe_to_ticker($negotiation, $symbol, $params);
    }

    public function subscribe_to_ticker($negotiation, $symbol, $params = array ()) {
        yield $this->load_markets();
        $market = $this->market($symbol);
        $name = 'ticker';
        $messageHash = $name . '_' . $market['id'];
        $subscription = array(
            'marketId' => $market['id'],
            'symbol' => $symbol,
            'params' => $params,
        );
        return yield $this->send_request_to_subscribe($negotiation, $messageHash, $subscription);
    }

    public function handle_ticker($client, $message) {
        //
        // summary subscription update
        //
        //     ...
        //
        // $ticker subscription update
        //
        //     {
        //         $symbol => 'BTC-USDT',
        //         lastTradeRate => '10701.02140008',
        //         bidRate => '10701.02140007',
        //         askRate => '10705.71049998'
        //     }
        //
        $ticker = $this->parse_ticker($message);
        $symbol = $ticker['symbol'];
        $market = $this->market($symbol);
        $this->tickers[$symbol] = $ticker;
        $name = 'ticker';
        $messageHash = $name . '_' . $market['id'];
        $client->resolve ($ticker, $messageHash);
    }

    public function watch_ohlcv($symbol, $timeframe = '1m', $since = null, $limit = null, $params = array ()) {
        yield $this->load_markets();
        $negotiation = yield $this->negotiate();
        $ohlcv = yield $this->subscribe_to_ohlcv($negotiation, $symbol, $timeframe, $params);
        if ($this->newUpdates) {
            $limit = $ohlcv->getLimit ($symbol, $limit);
        }
        return $this->filter_by_since_limit($ohlcv, $since, $limit, 0, true);
    }

    public function subscribe_to_ohlcv($negotiation, $symbol, $timeframe = '1m', $params = array ()) {
        yield $this->load_markets();
        $market = $this->market($symbol);
        $interval = $this->timeframes[$timeframe];
        $name = 'candle';
        $messageHash = $name . '_' . $market['id'] . '_' . $interval;
        $subscription = array(
            'symbol' => $symbol,
            'timeframe' => $timeframe,
            'messageHash' => $messageHash,
            'params' => $params,
        );
        return yield $this->send_request_to_subscribe($negotiation, $messageHash, $subscription);
    }

    public function handle_ohlcv($client, $message) {
        //
        //     {
        //         sequence => 28286,
        //         marketSymbol => 'BTC-USD',
        //         $interval => 'MINUTE_1',
        //         $delta => {
        //             startsAt => '2020-10-05T18:52:00Z',
        //             open => '10706.62600000',
        //             high => '10706.62600000',
        //             low => '10703.25900000',
        //             close => '10703.26000000',
        //             volume => '0.86822264',
        //             quoteVolume => '9292.84594774'
        //         }
        //     }
        //
        $name = 'candle';
        $marketId = $this->safe_string($message, 'marketSymbol');
        $symbol = $this->safe_symbol($marketId, null, '-');
        $interval = $this->safe_string($message, 'interval');
        $messageHash = $name . '_' . $marketId . '_' . $interval;
        $timeframe = $this->find_timeframe($interval);
        $delta = $this->safe_value($message, 'delta', array());
        $parsed = $this->parse_ohlcv($delta);
        $this->ohlcvs[$symbol] = $this->safe_value($this->ohlcvs, $symbol, array());
        $stored = $this->safe_value($this->ohlcvs[$symbol], $timeframe);
        if ($stored === null) {
            $limit = $this->safe_integer($this->options, 'OHLCVLimit', 1000);
            $stored = new ArrayCacheByTimestamp ($limit);
            $this->ohlcvs[$symbol][$timeframe] = $stored;
        }
        $stored->append ($parsed);
        $client->resolve ($stored, $messageHash);
    }

    public function watch_trades($symbol, $since = null, $limit = null, $params = array ()) {
        yield $this->load_markets();
        $negotiation = yield $this->negotiate();
        $trades = yield $this->subscribe_to_trades($negotiation, $symbol, $params);
        if ($this->newUpdates) {
            $limit = $trades->getLimit ($symbol, $limit);
        }
        return $this->filter_by_since_limit($trades, $since, $limit, 'timestamp', true);
    }

    public function subscribe_to_trades($negotiation, $symbol, $params = array ()) {
        yield $this->load_markets();
        $market = $this->market($symbol);
        $name = 'trade';
        $messageHash = $name . '_' . $market['id'];
        $subscription = array(
            'symbol' => $symbol,
            'messageHash' => $messageHash,
            'params' => $params,
        );
        return yield $this->send_request_to_subscribe($negotiation, $messageHash, $subscription);
    }

    public function handle_trades($client, $message) {
        //
        //     {
        //         $deltas => array(
        //             {
        //                 id => '5bf67885-a0a8-4c62-b73d-534e480e3332',
        //                 executedAt => '2020-10-05T23:02:17.49Z',
        //                 quantity => '0.00166790',
        //                 rate => '10763.97000000',
        //                 takerSide => 'BUY'
        //             }
        //         ),
        //         sequence => 24391,
        //         marketSymbol => 'BTC-USD'
        //     }
        //
        $deltas = $this->safe_value($message, 'deltas', array());
        $marketId = $this->safe_string($message, 'marketSymbol');
        $symbol = $this->safe_symbol($marketId, null, '-');
        $market = $this->market($symbol);
        $name = 'trade';
        $messageHash = $name . '_' . $marketId;
        $stored = $this->safe_value($this->trades, $symbol);
        if ($stored === null) {
            $limit = $this->safe_integer($this->options, 'tradesLimit', 1000);
            $stored = new ArrayCache ($limit);
        }
        $trades = $this->parse_trades($deltas, $market);
        for ($i = 0; $i < count($trades); $i++) {
            $stored->append ($trades[$i]);
        }
        $this->trades[$symbol] = $stored;
        $client->resolve ($stored, $messageHash);
    }

    public function watch_my_trades($symbol = null, $since = null, $limit = null, $params = array ()) {
        yield $this->load_markets();
        $authentication = yield $this->authenticate();
        $trades = yield $this->subscribe_to_my_trades($authentication, $params);
        if ($this->newUpdates) {
            $limit = $trades->getLimit ($symbol, $limit);
        }
        return $this->filter_by_symbol_since_limit($trades, $symbol, $since, $limit, true);
    }

    public function subscribe_to_my_trades($authentication, $params = array ()) {
        $messageHash = 'execution';
        return yield $this->send_authenticated_request_to_subscribe($authentication, $messageHash, $params);
    }

    public function handle_my_trades($client, $message) {
        //
        //     {
        //         accountId => '2832c5c6-ac7a-493e-bc16-ebca06c73670',
        //         sequence => 42,
        //         $deltas => array(
        //             {
        //                 id => '5bf67885-a0a8-4c62-b73d-534e480e3332',
        //                 marketSymbol => 'BTC-USDT',
        //                 executedAt => '2020-10-05T23:02:17.49Z',
        //                 quantity => '0.00166790',
        //                 rate => '10763.97000000',
        //                 orderId => "string (uuid)",
        //                 commission => '0.00000000',
        //                 isTaker => False
        //             }
        //         )
        //     }
        //
        $deltas = $this->safe_value($message, 'deltas', array());
        $trades = $this->parse_trades($deltas);
        $stored = $this->myTrades;
        if ($stored === null) {
            $limit = $this->safe_integer($this->options, 'tradesLimit', 1000);
            $stored = new ArrayCacheBySymbolById ($limit);
            $this->myTrades = $stored;
        }
        for ($i = 0; $i < count($trades); $i++) {
            $stored->append ($trades[$i]);
        }
        $messageHash = 'execution';
        $client->resolve ($stored, $messageHash);
    }

    public function watch_order_book($symbol, $limit = null, $params = array ()) {
        $limit = ($limit === null) ? 25 : $limit; // 25 by default
        if (($limit !== 1) && ($limit !== 25) && ($limit !== 500)) {
            throw new BadRequest($this->id . ' watchOrderBook() $limit argument must be null, 1, 25 or 500, default is 25');
        }
        yield $this->load_markets();
        $negotiation = yield $this->negotiate();
        //
        //     1. Subscribe to the relevant socket streams
        //     2. Begin to queue up messages without processing them
        //     3. Call the equivalent v3 REST API and record both the results and the value of the returned Sequence header. Refer to the descriptions of individual streams to find the corresponding REST API. Note that you must call the REST API with the same parameters as you used to subscribed to the stream to get the right snapshot. For example, $orderbook snapshots of different depths will have different sequence numbers.
        //     4. If the Sequence header is less than the sequence number of the first queued socket message received (unlikely), discard the results of step 3 and then repeat step 3 until this check passes.
        //     5. Discard all socket messages where the sequence number is less than or equal to the Sequence header retrieved from the REST call
        //     6. Apply the remaining socket messages in order on top of the results of the REST call. The objects received in the socket deltas have the same schemas as the objects returned by the REST API. Each socket delta is a snapshot of an object. The identity of the object is defined by a unique key made up of one or more fields in the message (see documentation of individual streams for details). To apply socket deltas to a local cache of data, simply replace the objects in the cache with those coming from the socket where the keys match.
        //     7. Continue to apply messages as they are received from the socket as long as sequence number on the stream is always increasing by 1 each message (Note => for private streams, the sequence number is scoped to a single account or subaccount).
        //     8. If a message is received that is not the next in order, return to step 2 in this process
        //
        $orderbook = yield $this->subscribe_to_order_book($negotiation, $symbol, $limit, $params);
        return $orderbook->limit ($limit);
    }

    public function subscribe_to_order_book($negotiation, $symbol, $limit = null, $params = array ()) {
        yield $this->load_markets();
        $market = $this->market($symbol);
        $name = 'orderbook';
        $messageHash = $name . '_' . $market['id'] . '_' . (string) $limit;
        $subscription = array(
            'symbol' => $symbol,
            'messageHash' => $messageHash,
            'method' => array($this, 'handle_subscribe_to_order_book'),
            'limit' => $limit,
            'params' => $params,
        );
        return yield $this->send_request_to_subscribe($negotiation, $messageHash, $subscription);
    }

    public function fetch_order_book_snapshot($client, $message, $subscription) {
        $symbol = $this->safe_string($subscription, 'symbol');
        $limit = $this->safe_integer($subscription, 'limit');
        $messageHash = $this->safe_string($subscription, 'messageHash');
        try {
            // 2. Initiate a REST request to get the $snapshot data of Level 2 order book.
            // todo => this is a synch blocking call in ccxt.php - make it async
            $snapshot = yield $this->fetch_order_book($symbol, $limit);
            $orderbook = $this->orderbooks[$symbol];
            $messages = $orderbook->cache;
            // make sure we have at least one delta before fetching the $snapshot
            // otherwise we cannot synchronize the feed with the $snapshot
            // and that will lead to a bidask cross as reported here
            // https://github.com/ccxt/ccxt/issues/6762
            $firstMessage = $this->safe_value($messages, 0, array());
            $sequence = $this->safe_integer($firstMessage, 'sequence');
            $nonce = $this->safe_integer($snapshot, 'nonce');
            // if the received $snapshot is earlier than the first cached delta
            // then we cannot align it with the cached deltas and we need to
            // retry synchronizing in $maxAttempts
            if (($sequence !== null) && ($nonce < $sequence)) {
                $options = $this->safe_value($this->options, 'fetchOrderBookSnapshot', array());
                $maxAttempts = $this->safe_integer($options, 'maxAttempts', 3);
                $numAttempts = $this->safe_integer($subscription, 'numAttempts', 0);
                // retry to syncrhonize if we haven't reached $maxAttempts yet
                if ($numAttempts < $maxAttempts) {
                    // safety guard
                    if (is_array($client->subscriptions) && array_key_exists($messageHash, $client->subscriptions)) {
                        $numAttempts = $this->sum($numAttempts, 1);
                        $subscription['numAttempts'] = $numAttempts;
                        $client->subscriptions[$messageHash] = $subscription;
                        $this->spawn(array($this, 'fetch_order_book_snapshot'), $client, $message, $subscription);
                    }
                } else {
                    // throw upon failing to synchronize in $maxAttempts
                    throw new InvalidNonce($this->id . ' failed to synchronize WebSocket feed with the $snapshot for $symbol ' . $symbol . ' in ' . (string) $maxAttempts . ' attempts');
                }
            } else {
                $orderbook->reset ($snapshot);
                // unroll the accumulated deltas
                // 3. Playback the cached Level 2 data flow.
                for ($i = 0; $i < count($messages); $i++) {
                    $message = $messages[$i];
                    $this->handle_order_book_message($client, $message, $orderbook);
                }
                $this->orderbooks[$symbol] = $orderbook;
                $client->resolve ($orderbook, $messageHash);
            }
        } catch (Exception $e) {
            $client->reject ($e, $messageHash);
        }
    }

    public function handle_subscribe_to_order_book($client, $message, $subscription) {
        $symbol = $this->safe_string($subscription, 'symbol');
        $limit = $this->safe_integer($subscription, 'limit');
        if (is_array($this->orderbooks) && array_key_exists($symbol, $this->orderbooks)) {
            unset($this->orderbooks[$symbol]);
        }
        $this->orderbooks[$symbol] = $this->order_book(array(), $limit);
        $this->spawn(array($this, 'fetch_order_book_snapshot'), $client, $message, $subscription);
    }

    public function handle_delta($bookside, $delta) {
        //
        //     {
        //         quantity => '0.05100000',
        //         rate => '10694.86410031'
        //     }
        //
        $price = $this->safe_float($delta, 'rate');
        $amount = $this->safe_float($delta, 'quantity');
        $bookside->store ($price, $amount);
    }

    public function handle_deltas($bookside, $deltas) {
        //
        //     array(
        //         array( quantity => '0.05100000', rate => '10694.86410031' ),
        //         array( quantity => '0', rate => '10665.72578226' )
        //     )
        //
        for ($i = 0; $i < count($deltas); $i++) {
            $this->handle_delta($bookside, $deltas[$i]);
        }
    }

    public function handle_order_book($client, $message) {
        //
        //     {
        //         marketSymbol => 'BTC-USDT',
        //         depth => 25,
        //         sequence => 3009387,
        //         bidDeltas => array(
        //             array( quantity => '0.05100000', rate => '10694.86410031' ),
        //             array( quantity => '0', rate => '10665.72578226' )
        //         ),
        //         askDeltas => array()
        //     }
        //
        $marketId = $this->safe_string($message, 'marketSymbol');
        $symbol = $this->safe_symbol($marketId, null, '-');
        $orderbook = $this->safe_value($this->orderbooks, $symbol, array());
        $nonce = $this->safe_integer($orderbook, 'nonce');
        if ($nonce !== null) {
            $this->handle_order_book_message($client, $message, $orderbook);
        } else {
            $orderbook->cache[] = $message;
        }
    }

    public function handle_order_book_message($client, $message, $orderbook) {
        //
        //     {
        //         marketSymbol => 'BTC-USDT',
        //         $depth => 25,
        //         sequence => 3009387,
        //         bidDeltas => array(
        //             array( quantity => '0.05100000', rate => '10694.86410031' ),
        //             array( quantity => '0', rate => '10665.72578226' )
        //         ),
        //         askDeltas => array()
        //     }
        //
        $marketId = $this->safe_string($message, 'marketSymbol');
        $depth = $this->safe_string($message, 'depth');
        $name = 'orderbook';
        $messageHash = $name . '_' . $marketId . '_' . $depth;
        $nonce = $this->safe_integer($message, 'sequence');
        if ($nonce > $orderbook['nonce']) {
            $this->handle_deltas($orderbook['asks'], $this->safe_value($message, 'askDeltas', array()));
            $this->handle_deltas($orderbook['bids'], $this->safe_value($message, 'bidDeltas', array()));
            $orderbook['nonce'] = $nonce;
            $client->resolve ($orderbook, $messageHash);
        }
        return $orderbook;
    }

    public function handle_system_status_helper() {
        $negotiation = yield $this->negotiate();
        yield $this->start($negotiation);
    }

    public function handle_system_status($client, $message) {
        // send signalR protocol start() call
        $this->spawn(array($this, 'handle_system_status_helper'));
        return $message;
    }

    public function handle_subscription_status($client, $message) {
        //
        // success
        //
        //     array( R => array( array( Success => true, ErrorCode => null ) ), $I => '1601891513224' )
        //
        // failure
        // todo add error handling and future rejections
        //
        //     {
        //         $I => '1601942374563',
        //         E => "There was an error invoking Hub $method 'c3.Authenticate'."
        //     }
        //
        $I = $this->safe_string($message, 'I'); // noqa => E741
        $subscription = $this->safe_value($client->subscriptions, $I);
        if ($subscription === null) {
            $subscriptionsById = $this->index_by($client->subscriptions, 'id');
            $subscription = $this->safe_value($subscriptionsById, $I, array());
        } else {
            // clear if subscriptionHash === requestId (one-time request)
            unset($client->subscriptions[$I]);
        }
        $method = $this->safe_value($subscription, 'method');
        if ($method === null) {
            $client->resolve ($message, $I);
        } else {
            $method($client, $message, $subscription);
        }
        return $message;
    }

    public function handle_message($client, $message) {
        // console.dir ($message, array( depth => null ));
        //
        // subscription confirmation
        //
        //     {
        //         R => array(
        //             array( Success => true, ErrorCode => null )
        //         ),
        //         I => '1601899375696'
        //     }
        //
        // heartbeat subscription $update
        //
        //     {
        //         C => 'd-6010FB90-B,0|o_b,0|o_c,2|8,1F4E',
        //         $M => array(
        //             array( H => 'C3', $M => 'heartbeat', $A => array() )
        //         )
        //     }
        //
        // heartbeat empty $message
        //
        //     array()
        //
        // subscription $update
        //
        //     {
        //         C => 'd-ED78B69D-E,0|rq4,0|rq5,2|puI,60C',
        //         $M => array(
        //             {
        //                 H => 'C3',
        //                 $M => 'ticker', // orderBook, trade, candle, balance, order
        //                 $A => array(
        //                     'q1YqrsxNys9RslJyCnHWDQ12CVHSUcpJLC4JKUpMSQ1KLEkFShkamBsa6VkYm5paGJuZAhUkZaYgpAws9QwszAwsDY1MgFKJxdlIuiz0jM3MLIHATKkWAA=='
        //                 )
        //             }
        //         )
        //     }
        //
        // authentication expiry notification
        //
        //     {
        //         C => 'd-B1733F58-B,0|vT7,1|vT8,2|vBR,3',
        //         $M => array( array( H => 'C3', $M => 'authenticationExpiring', $A => array() ) )
        //     }
        //
        $methods = array(
            'authenticationExpiring' => array($this, 'handle_authentication_expiring'),
            'order' => array($this, 'handle_order'),
            'balance' => array($this, 'handle_balance'),
            'trade' => array($this, 'handle_trades'),
            'candle' => array($this, 'handle_ohlcv'),
            'orderBook' => array($this, 'handle_order_book'),
            'heartbeat' => array($this, 'handle_heartbeat'),
            'ticker' => array($this, 'handle_ticker'),
        );
        $M = $this->safe_value($message, 'M', array());
        for ($i = 0; $i < count($M); $i++) {
            $methodType = $this->safe_value($M[$i], 'M');
            $method = $this->safe_value($methods, $methodType);
            if ($method !== null) {
                if ($methodType === 'heartbeat') {
                    $method($client, $message);
                } else if ($methodType === 'authenticationExpiring') {
                    $method($client, $message);
                } else {
                    $A = $this->safe_value($M[$i], 'A', array());
                    for ($k = 0; $k < count($A); $k++) {
                        $inflated = $this->inflate64($A[$k]);
                        $update = json_decode($inflated, $as_associative_array = true);
                        $method($client, $update);
                    }
                }
            }
        }
        // resolve invocations by request id
        if (is_array($message) && array_key_exists('I', $message)) {
            $this->handle_subscription_status($client, $message);
        }
        if (is_array($message) && array_key_exists('S', $message)) {
            $this->handle_system_status($client, $message);
        }
        $keys = is_array($message) ? array_keys($message) : array();
        $numKeys = is_array($keys) ? count($keys) : 0;
        if ($numKeys < 1) {
            $this->handle_heartbeat($client, $message);
        }
    }
}
