enb-bevis-helper [![Build Status](https://travis-ci.org/enb-make/enb-bevis-helper.png?branch=master)](https://travis-ci.org/enb-make/enb-bevis-helper)
==========

Надстройка над `ENB` для простой конфигурации `BEViS`-проекта

ENB - инструмент для сборки, разбитый на много маленьких модулей. При ручном конфигурировании  нужно установить каждый модуль самостоятельно,
указать нужные версии и зависимости между ними.

С помощью модуля `enb-bevis-helper` эту процедуру можно упростить до одной строки в `package.json`

###package.json

Укажите зависимость от последней версии пакета `enb-bevis-helper`, и все нужные модули для сборки вашего проекта подтянутся самостоятельно.

```javascript
//...
    "dependencies": {
        "enb-bevis-helper": "1.0.0",
        //...
    },
    "enb": {
        // директории с исходным кодом проекта
        "sources": [
            "blocks",
            "core",
            "pages"
        ],
        "source-pages": "pages", // директория с исходным кодом страниц
        "build-pages": "build"   // директория с собранными страницами
    }
//...
```
Здесь же в дополнительной секции `enb` укажите пути к ресурсам вашего проекта и сборщик подхватит их автоматически.

Предполагается, что исходный код страниц хранится в папке `/pages`, а собранные страницы оказываются в `/build`:
```
/build/
    /index
    /news
...
/pages
    /index-page
    /news-page
...
```


##Руководство

1. Выполнить `npm install`.
2. Проверить, что `ENB` установлен. Команда `node_modules/.bin/enb` должна выполниться без ошибок.
3. Создать `.enb/make.js`
    ```javascript
    module.exports = function(config) {

    };
    ```
4. Подключить конфиг `enb-bevis-helper`
    ```javascript
    module.exports = function(config) {
        config.includeConfig('enb-bevis-helper');
    };

    ```
5. Подключить модуль `fs`, прочитать `package.json`, получить список страниц, которые вы будете собирать в проекте.
    ```javascript
    var fs = require('fs');
    var pckg = require('../package.json');

    module.exports = function(config) {
        config.includeConfig('enb-bevis-helper');

        // Имена страниц с исходным кодом
        var pagesNames = fs.readdirSync(pckg.enb['source-pages']);
    };
    ```
6. Настроить `enb-bevis-helper`
    ```javascript
    var fs = require('fs');
    var pckg = require('../package.json');

    module.exports = function(config) {
        config.includeConfig('enb-bevis-helper');

        var pagesNames = fs.readdirSync(pckg.enb['source-pages']);

        var browserSupport = [
            'IE >= 9',
            'Safari >= 5',
            'Chrome >= 33',
            'Opera >= 12.16',
            'Firefox >= 28'
        ];

        var bevisHelper = config.module('enb-bevis-helper')
            .sourceDeps(pagesNames)         // Указываем сборщику, куда смотреть, чтобы узнать из каких блоков собирать страницы
            .browserSupport(browserSupport) // Какие браузеры будем поддерживать в проекте
            .useAutopolyfiller()            // Будем использовать Autopolyfiller.js
            .autopolyfillerExcludes(['Promise']);
    };
    ```
7. Теперь нужно настроить ноду. Для примера, приведу вариант настройки ноды `build/index`
    ```javascript
    var fs = require('fs');
    var pckg = require('../package.json');

    module.exports = function(config) {
        config.includeConfig('enb-bevis-helper');

        var pagesNames = fs.readdirSync(pckg.enb['source-pages']);

        var browserSupport = [
            'IE >= 9',
            'Safari >= 5',
            'Chrome >= 33',
            'Opera >= 12.16',
            'Firefox >= 28'
        ];

        var bevisHelper = config.module('enb-bevis-helper')
            .sourceDeps(pagesNames)
            .browserSupport(browserSupport)
            .useAutopolyfiller()
            .autopolyfillerExcludes(['Promise']);

        // Языки для проекта
        config.setLanguages(['ru', 'en']);

        // Добавление ноды в сборку + конфигурирование ноды
        config.node('build/index', function (nodeConfig) {
            bevisHelper
                .forServerPage()
                .configureNode(nodeConfig);
            nodeConfig.addTech(require('./techs/priv-js'));
            nodeConfig.addTarget('?.priv.js');
        });

    };
    ```
8. Сконфигурировать статическую страницу:
    ```javascript
    //...
        config.node('pages/examples', function (nodeConfig) {
            bevisHelper
                .forStaticHtmlPage()
                .configureNode(nodeConfig);
        });
    //...
    ```
9. Сконфигурировать тесты:
    ```javascript
    //...
        bevisHelper.configureUnitTests('test/client');
    //...
    ```
10. Если в вашем проекте все ноды динамические и собираются, к примеру, технологией `priv-js`, можно конфигурировать сразу все ноды:
    ```javascript
    var fs = require('fs');
    var pckg = require('../package.json');

    module.exports = function(config) {
        config.includeConfig('enb-bevis-helper');

        var pagesNames = fs.readdirSync(pckg.enb['source-pages']);

        var browserSupport = [
            'IE >= 9',
            'Safari >= 5',
            'Chrome >= 33',
            'Opera >= 12.16',
            'Firefox >= 28'
        ];

        var bevisHelper = config.module('enb-bevis-helper')
            .sourceDeps(pagesNames)
            .browserSupport(browserSupport)
            .useAutopolyfiller()
            .autopolyfillerExcludes(['Promise']);

        config.setLanguages(['ru', 'en']);

        // Получить имена всех нод
        // pages/index-page -> build/index
        var nodesNames = pagesNames.map(function(nodeName) {
            return nodeName.replace(/(.*?)\-page/, pckg.enb['build-pages'] + '/$1');
        });

        // Метод config.nodes() вместо config.node()
        // Первым параметром массив всех нод
        config.nodes(nodesNames, function (nodeConfig) {
            bevisHelper
                .forServerPage()
                .configureNode(nodeConfig);
            nodeConfig.addTech(require('./techs/priv-js'));
            nodeConfig.addTarget('?.priv.js');
        });

    };
    ```

