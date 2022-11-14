# -*- coding: utf-8 -*-

"""CCXT: CryptoCurrency eXchange Trading Library (Async)"""

# ----------------------------------------------------------------------------

__version__ = '2.1.78'

# ----------------------------------------------------------------------------

# Pro Exchange

from ccxt.pro.base.exchange import Exchange  # noqa: F401

# CCXT Pro exchanges (now this is mainly used for importing exchanges in WS tests)

from ccxt.pro.binance import binance                                      # noqa: F401
from ccxt.pro.binanceusdm import binanceusdm                              # noqa: F401

exchanges = [
    'binance',
    'binanceusdm',
]
