// ---------------------------------------------------------------------------
// Usage: npm run transpile
// ---------------------------------------------------------------------------

"use strict";

const fs = require ('fs')
    , log = require ('ololog')
    , ansi = require ('ansicolor').nice
    , { unCamelCase, precisionConstants, safeString } = require ('ccxt/js/base/functions.js')
    , {
        createFolderRecursively,
        overwriteFile,
    } = require ('ccxt/build/fs.js')
    , errors = require ('ccxt/js/base/errors.js')
    , Transpiler = require ('ccxt/build/transpile.js')

// ============================================================================

class CCXTProTranspiler extends Transpiler {

    getCommonRegexes () {
        return super.getCommonRegexes ().concat ([
            [ /\.callAsync\s/g, '.call_async' ],
            [ /\.orderBook\s/g, '.order_book' ],
            [ /\.limitedOrderBook\s/g, '.limited_order_book' ],
            [ /\.indexedOrderBook\s/g, '.indexed_order_book' ],
            [ /\.limitedIndexedOrderBook\s/g, '.limited_indexed_order_book' ],
            [ /\.limitedCountedOrderBook\s/g, '.limited_counted_order_book' ],
            [ /\.countedOrderBook\s/g, '.counted_order_book' ],
        ])
    }

    getPHPRegexes () {
        return super.getPHPRegexes ().concat ([
            [ /]\.store/g, ']->store' ],
        ])
    }

    getPHPPreamble () {
        return [
            "<?php",
            "namespace ccxtpro;",
            "include_once __DIR__ . '/../../vendor/autoload.php';",
            "// ----------------------------------------------------------------------------",
            "",
            "// PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:",
            "// https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code",
            "",
            "// -----------------------------------------------------------------------------",
            "",
        ].join ("\n")
    }

    createPythonClassDeclaration (className, baseClass) {
        return 'class ' + className + '(' + [ 'ccxtpro.Exchange', baseClass ].join (', ') + '):'
    }

    createPythonClassHeader (ccxtImports, bodyAsString) {
        return [
            "# -*- coding: utf-8 -*-\n",
            "# PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:",
            "# https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code\n",
            "import ccxtpro",
            ... ccxtImports,
            // 'from ' + importFrom + ' import ' + baseClass,
            ... (bodyAsString.match (/basestring/) ? [
                "\n# -----------------------------------------------------------------------------\n",
                "try:",
                "    basestring  # Python 3",
                "except NameError:",
                "    basestring = str  # Python 2",
            ] : [])
        ]
    }

    createPHPClassDeclaration (className, baseClass) {
        return (
            'class ' + className + ' extends ' + baseClass.replace ('ccxt.', '\\ccxt\\') + ' {' +
            "\n\n" +
            "    use ClientTrait;"
        )
    }

    createPHPClassHeader (className, baseClass, bodyAsString) {
        return [
            "<?php",
            "",
            "namespace ccxtpro;",
            "",
            "// PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:",
            "// https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code",
            "",
            "use \\ccxtpro\\ClientTrait; // websocket functionality",
            "use Exception; // a common import",
        ]
    }

    // ------------------------------------------------------------------------

    transpileOrderBookTest () {
        const jsFile = './js/test/base/test.OrderBook.js'
        const pyFile = './python/test/test_order_book.py'
        const phpFile = './php/test/OrderBook.php'

        log.magenta ('Transpiling from', jsFile.yellow)
        let js = fs.readFileSync (jsFile).toString ()

        js = this.regexAll (js, [
            [ /\'use strict\';?\s+/g, '' ],
            [ /[^\n]+require[^\n]+\n/g, '' ],
            [ /function equals \([\S\s]+?return true\n}\n/g, '' ],
        ])

        let { python3Body, python2Body, phpBody } = this.transpileJavaScriptToPythonAndPHP ({ js, removeEmptyLines: false })

        const pythonHeader = [
            "",
            "from ccxtpro.base.order_book import OrderBook, IndexedOrderBook, CountedOrderBook, IncrementalOrderBook, IncrementalIndexedOrderBook  # noqa: F402",
            "",
            "",
            "def equals(a, b):",
            "    return a == b",
            "",
        ].join ("\n")

        const phpHeader = [
            "",
            "function equals($a, $b) {",
            "    return json_encode($a) === json_encode($b);",
            "}",
        ].join ("\n")

        const python = this.getPythonPreamble () + pythonHeader + python2Body
        const php = this.getPHPPreamble () + phpHeader + phpBody

        log.magenta ('→', pyFile.yellow)
        log.magenta ('→', phpFile.yellow)

        overwriteFile (pyFile, python)
        overwriteFile (phpFile, php)
    }

    // ------------------------------------------------------------------------

    transpileEverything () {

        // default pattern is '.js'
        const [ /* node */, /* script */, pattern ] = process.argv
            // , python2Folder = './python/ccxtpro/', // CCXT Pro does not support Python 2
            , python3Folder = './python/ccxtpro/'
            , phpFolder     = './php/'
            , options = { /* python2Folder, */ python3Folder, phpFolder }

        // createFolderRecursively (python2Folder)
        createFolderRecursively (python3Folder)
        createFolderRecursively (phpFolder)

        this.transpileOrderBookTest ()
        const classes = this.transpileDerivedExchangeFiles ('./js/', options, pattern)

        if (classes === null) {
            log.bright.yellow ('0 files transpiled.')
            return;
        }

        // HINT: if we're going to support specific class definitions
        // this process won't work anymore as it will override the definitions
        // exportTypeScriptDeclarations (classes)

        // transpileErrorHierarchy ()

        // transpilePrecisionTests ()
        // transpileDateTimeTests ()
        // transpileCryptoTests ()

        // transpilePythonAsyncToSync ('./python/test/test_async.py', './python/test/test.py')

        log.bright.green ('Transpiled successfully.')
    }
}

// ============================================================================
// main entry point

if (require.main === module) {

    // if called directly like `node module`
    const transpiler = new CCXTProTranspiler ()
    transpiler.transpileEverything ()

} else {

    // do nothing if required as a module
}

// ============================================================================

module.exports = {}
