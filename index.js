const puppet = require('puppeteer');
const fs = require('fs');
const mkdir = require('mkdirp');

let scrape = async (url = 'https://mika.house') => {
    const browser = await puppet.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    await page.goto(url, {
        waitUntil: 'networkidle2'
    });

    const results = await page.$$eval('a', as => as.map(a => a.href));

    browser.close();

    return results.filter(link => link.indexOf('mika.house') !== -1);
}

let getData = async url => {
    const browser = await puppet.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#content');

    const html = await page.content();

    browser.close();

    let dir = `./static/${url.replace('https://mika.house/', '')}`
    if (!fs.existsSync(dir)) {
        mkdir(dir, err => {
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
    });
});