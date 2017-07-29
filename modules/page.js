const fs = require('fs');
const path = require('path');
const pug = require('pug');

module.exports = function(Handlebars) {
    walk('www/assets/templates', (filePath, rootDir, subDir, fileName) => {
        let file = fileName.split('.');
        let partialName = (subDir == 'base' && file[(file.length - 1)] == 'partial') ? file[0] : subDir.replace(/\//g, '.') + '.' + file[0];
        fs.readFile(filePath, 'utf8', (error, partial) => Handlebars.registerPartial(partialName, partial));
    });

    Handlebars.registerHelper('compare', function (lvalue, operator, rvalue, options) {
        var operators, result;

        if (arguments.length < 3) {
            throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
        }

        if (options === undefined) {
            options = rvalue;
            rvalue = operator;
            operator = "===";
        }

        operators = {
            '==': function (l, r) { return l == r; },
            '===': function (l, r) { return l === r; },
            '!=': function (l, r) { return l != r; },
            '!==': function (l, r) { return l !== r; },
            '<': function (l, r) { return l < r; },
            '>': function (l, r) { return l > r; },
            '<=': function (l, r) { return l <= r; },
            '>=': function (l, r) { return l >= r; },
            'typeof': function (l, r) { return typeof l == r; }
        };

        if (!operators[operator]) {
            throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
        }

        result = operators[operator](lvalue, rvalue);

        if (result) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }

    });

    var page = {
        compile: function(template, data) {
            let fileTypes = ['mustache', 'pug'];
            let templatePath = `templates/${template}`;
            let fileExt = false;

            fileTypes.map((ext) => {
                if (fileExt === false && fs.existsSync(`${templatePath}.${ext}`)) {
                    fileExt = ext;
                }
            });

            return Promise.resolve().then((next) => {
                return new Promise((resolve, reject) => {
                    fs.readFile(`${templatePath}.${fileExt}`, 'utf8', (error, source) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(source);
                        }
                    });
                });
            }).then((source) => {
                if (fileExt.toLowerCase() == 'pug') {
                    source = pug.render(source, data);
                }
                return Promise.resolve(source);
            }).then((source) => {
                let createHtml = Handlebars.compile(`{{> header}}${source}{{> footer}}`);
                source = createHtml(data);
                return Promise.resolve(source);
            });
        },
    }

    return page;
};

var walk = function(rootDir, callBack, subDir) {
    function unixifyPath(filePath) {
        return (process.platform === 'win32') ? filePath.replace(/\\/g, '/') : filePath;
    }

    var absolutePath = subDir ? path.join(rootDir, subDir) : rootDir;
    fs.readdirSync(absolutePath).forEach((fileName) => {
        var filePath = path.join(absolutePath, fileName);
        if (fs.statSync(filePath).isDirectory()) {
            walk(rootDir, callBack, unixifyPath(path.join(subDir || '', fileName || '')));
        } else {
            callBack(unixifyPath(filePath), rootDir, subDir, fileName);
        }
    })
}
