const axios = require('axios')
const fs = require('fs')
const cheerio = require('cheerio')
const CleanCSS = require('clean-css')

module.exports = async function (req, res, next) {
    try {
        console.log('css middleware')
        const $ = await cheerio.load(res.locals.html);
        const cssLinks = []
        // get all css links
        $('link[rel="stylesheet"]').each((i, el) => {
            if ($(el).attr('href'))
                cssLinks.push($(el).attr('href'))
            if ($(el).attr('data-href'))
                cssLinks.push($(el).attr('data-href'))
            $(el).remove();
        })

        async function performCSSminification() {
            try {


                let code = {}

                const promisesCss = cssLinks.map(url => {
                    return axios.get(url)
                        .then(response => {
                            code += response.data
                        })
                        .catch(err => {
                            console.error(err)
                        })
                });
                await Promise.all(promisesCss);

                let options = { level: 1 };
                let result = new CleanCSS(options).minify(code);

                fs.writeFile('./public/minihtml/css_clean.css', result.styles, (err) => {
                    if (err) {
                        console.error(err)
                        return res.status(500).json({ msg: "fs error" })
                    }
                });
                res.locals.html=$.html()
                next()
            } catch (err) {
                console.log(err);
            }
        }
        performCSSminification()
        $('<link/>').attr({ rel: 'stylesheet', type: 'text/css', href: 'css_clean.css' }).appendTo('head');
    } catch (err) {
        console.error(err)
    }
}