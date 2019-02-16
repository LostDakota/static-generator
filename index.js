const puppet = require('puppeteer');
const fs = require('fs');
const mkdir = require('mkdirp');
const process = require('process').setMaxListeners(0).on('error', e => console.error(e));

let scrape = async (url = 'https://mika.house') => {
    let browser = await puppet.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    await page.goto(url, {
        waitUntil: 'networkidle2'
    });

    const results = await page.$$eval('a', as => as.map(a => a.href));

    await browser.close();

    return results.filter(link => link.indexOf('https://mika.house') !== -1 && link.indexOf('disqus') === -1);
}

let getData = async url => {
    if(!fs.existsSync('./static')){
        mkdir('./static');
    }
    const browser = await puppet.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('#content');

    await page.evaluate(() => {
        var disqus = document.querySelector('#disqus_thread');
        if(disqus) disqus.innerHTML = '';
    })

    const html = await page.content();

    browser.close();

    let dir = `./static/${url.replace('https://mika.house/', '')}`;
    if (!fs.existsSync(dir)) {
        mkdir(dir, err => {
            if(err) return err;
            fs.writeFileSync(`${dir}/index.html`, html, err => {
                if (err) return err;
            });
        })
    } else {
        fs.writeFileSync(`${dir}/index.html`, html, err => {
            if (err) return err;
        });
    }
}

let sitemapBuilder = (links) => {
    var map = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    links.forEach(link => {
        console.log(link);
        map += `<url><loc>${link}</loc></url>\n`;
    });

    map += '</urlset>';

    return map;
}

scrape().then(data => {
    let results = [];
    data.forEach(d => results.push(d));
    scrape('https://mika.house/blog').then(data => {
        data.forEach(d => {
            if (!results.includes(d)) {
                results.push(d);
            }
        });            
    }).then(() => {
        for (var i = 0; i < results.length; i++) {
            getData(results[i]);
        }    
        fs.writeFile('./static/sitemap.xml', sitemapBuilder(results), err => {
            if(err) return err;
        });
    });
});