<?php

namespace ccxt;

// PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:
// https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code

use Exception; // a common import

class ftxus extends ftx {

    public function describe() {
        return $this->deep_extend(parent::describe (), array(
            'id' => 'ftxus',
            'name' => 'FTXUS',
            'countries' => ['US'],
            'hostname' => 'ftx.us',
            'urls' => array(
                'www' => 'https://ftx.us/',
                'docs' => 'https://docs.ftx.us/',
                'fees' => 'https://help.ftx.us/hc/en-us/articles/360043579273-Fees',
            ),
        ));
    }
}
