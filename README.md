enb-bevis-helper [![Build Status](https://travis-ci.org/enb-make/enb-bevis-helper.png?branch=master)](https://travis-ci.org/enb-make/enb-bevis-helper)
==========

Надстройка над `ENB` для типовой конфигурации `BEViS`-проекта

`ENB` - инструмент для сборки, разбитый на несколько отдельных модулей. При ручном конфигурировании сборки нужно устанавливать каждый модуль самостоятельно,
указывать нужные версии и зависимости между ними, указывать технологии для сборки, параметризировать их.

Модуль `enb-bevis-helper` упрощает эту процедуру, сводя все конфги к трём типам:

- сборка статических страниц

- сборка динамических страниц

- сборка тестов

###package.json

Укажите зависимость от последней версии пакета `enb-bevis-helper`, и все нужные модули для сборки вашего проекта подтянутся самостоятельно.

```javascript
//...
    "dependencies": {
        "enb-bevis-helper": "1.0.0",
        //...
    }
//...
```

Здесь же в дополнительной секции `enb` укажите пути к ресурсам вашего проекта и сборщик подхватит их автоматически.

```javascript
//...
    "dependencies": {
        "enb-bevis-helper": "1.0.0",
        //...
    },
    "enb": {
        // директории с исходниками
        "sources": [
            "blocks",
            "core",
            "pages"
        ]
    }
//...
```
Дальнейшие объяснения основаны на предположении, что исходный код страниц хранится в папке `/pages`, собранные страницы оказываются в `/build`, а имена файлов выглядят так:
```
/pages
    /index-page
    /news-page
...
/build/
    /index
    /news
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
5. Настроить `enb-bevis-helper`
    ```javascript
    module.exports = function(config) {
        config.includeConfig('enb-bevis-helper');

        var browserSupport = [
            'IE >= 9',
            'Safari >= 5',
            'Chrome >= 33',
            'Opera >= 12.16',
            'Firefox >= 28'
        ];

        var bevisHelper = config.module('enb-bevis-helper')
            .browserSupport(browserSupport) // Какие браузеры будем поддерживать в проекте
            .useAutopolyfiller();           // Будем использовать Autopolyfiller.js
    };
    ```
6. Теперь нужно настроить ноду. Для примера, приведу вариант настройки ноды `build/index`. Это страница, которая строится из динамических данных на основе технологии `priv-js`
    ```javascript
    module.exports = function(config) {
        config.includeConfig('enb-bevis-helper');

        var browserSupport = [
            'IE >= 9',
            'Safari >= 5',
            'Chrome >= 33',
            'Opera >= 12.16',
            'Firefox >= 28'
        ];

        var bevisHelper = config.module('enb-bevis-helper')
            .browserSupport(browserSupport)
            .useAutopolyfiller();

        // Языки для проекта
        config.setLanguages(['ru', 'en']);

        // Динамическая страница
        config.node('build/index', function (nodeConfig) {
            bevisHelper
                .sourceDeps('index-page') // Нода будет искать зависимости внутри блока index-page
                .forServerPage()          // Конфигурирует динамическую страницу
                .configureNode(nodeConfig);
            nodeConfig.addTech(require('./techs/priv-js'));
            nodeConfig.addTarget('?.priv.js');
        });

    };
    ```
7. Сконфигурировать статическую страницу. Она собирается на основе `btjson.js` декларации
    ```javascript
    module.exports = function(config) {
        config.includeConfig('enb-bevis-helper');

        var browserSupport = [
            'IE >= 9',
            'Safari >= 5',
            'Chrome >= 33',
            'Opera >= 12.16',
            'Firefox >= 28'
        ];

        var bevisHelper = config.module('enb-bevis-helper')
            .browserSupport(browserSupport)
            .useAutopolyfiller();

        config.setLanguages(['ru', 'en']);

        config.node('build/index', function (nodeConfig) {
            bevisHelper
                .sourceDeps('index-page')
                .forServerPage()
                .configureNode(nodeConfig);
            nodeConfig.addTech(require('./techs/priv-js'));
            nodeConfig.addTarget('?.priv.js');
        });

        // Статическая страница
        config.node('build/examples', function (nodeConfig) {
            bevisHelper
                .forStaticHtmlPage() // Конфигурирует статическую страницу
                .configureNode(nodeConfig);
        });

    };
    ```
9. Сконфигурировать тесты.
    ```javascript
    module.exports = function(config) {
        config.includeConfig('enb-bevis-helper');

        var browserSupport = [
            'IE >= 9',
            'Safari >= 5',
            'Chrome >= 33',
            'Opera >= 12.16',
            'Firefox >= 28'
        ];

        var bevisHelper = config.module('enb-bevis-helper')
            .browserSupport(browserSupport)
            .useAutopolyfiller();

        config.setLanguages(['ru', 'en']);

        config.node('build/index', function (nodeConfig) {
            bevisHelper
                .sourceDeps('index-page')
                .forServerPage()
                .configureNode(nodeConfig);
            nodeConfig.addTech(require('./techs/priv-js'));
            nodeConfig.addTarget('?.priv.js');
        });

        config.node('build/examples', function (nodeConfig) {
            bevisHelper
                .forStaticHtmlPage()
                .configureNode(nodeConfig);
        });

        // Тесты
        bevisHelper.configureUnitTests('test/client');
    };
    ```
### Примеры

1. [Простой проект на bevis-stub](https://github.com/bevis-ui/bevis-stub/blob/master/.enb/make.js)
