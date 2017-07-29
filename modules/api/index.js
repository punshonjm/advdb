const fs = require('fs');
const path = require('path');
const routes = require('express').Router();

routes.get('/', (req, res) => {
    res.status(200).json({message: 'Connected'}).end();
});

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

walk('modules/api', (filePath, rootDir, subDir, fileName) => {
    if (filePath != rootDir+'/'+fileName) {
        console.log(filePath, rootDir, subDir, fileName);

        if (fileName == 'index.js') {
            let theseRoutes = require('./'+subDir);
            routes.use('/'+subDir, theseRoutes);
        } else {
            console.log('not indexjs')
        }
    }
})

module.exports = routes;
