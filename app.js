const puppeteer = require('puppeteer');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const entrada = () => {
  return new Promise((resolve, reject) => {
    readline.question('Ingresa el captcha', txt => {
      resolve(txt);
      readline.close();
    });
  });
}

const obtenerUUIDs = async (page) => {
  await page.$eval("#ctl00_MainContent_RdoFechas", (el) => el.click());
  await page.$eval("#ctl00_MainContent_CldFechaInicial2_Calendario_text", (el) => {
    function getFecha(dias = 0, meses = 0) {
        const fecha = new Date(new Date().getTime() + (dias * 86400000) + (meses * 2592000000));
        const dia = fecha.getDate();
        const mes = fecha.getMonth() + 1;
        return `${dia}/${mes}/${fecha.getFullYear()}`;
    }
    el.value = getFecha(); // <------------------------------------------------------ fecha inicial
  });
  await page.$eval("#ctl00_MainContent_CldFechaFinal2_Calendario_text", (el) => {
    function getFecha(dias = 0, meses = 0) {
        const fecha = new Date(new Date().getTime() + (dias * 86400000) + (meses * 2592000000));
        const dia = fecha.getDate();
        const mes = fecha.getMonth() + 1;
        return `${dia}/${mes}/${fecha.getFullYear()}`;
    }
    el.value = getFecha(1); // <----------------------------------------------------- fecha final
  });
  await page.$eval("#ctl00_MainContent_BtnBusqueda", el => el.click());
  await page.waitForSelector("#ctl00_MainContent_UpnlResultados");
  await page.waitForSelector("#ctl00_MainContent_tblResult > tbody > tr:nth-child(2) > td:nth-child(2) > span");
  const uuid_array = await page.evaluate(() => {
    const evaluuid = []
    document.querySelectorAll("#ctl00_MainContent_tblResult > tbody > tr > td:nth-child(2) > span").forEach(el => {
      evaluuid.push(el.innerHTML);
    })
    return evaluuid
  });
  return uuid_array
}

const descargarCFDI = async (page) => {
  await page.waitForSelector("#ctl00_MainContent_UpnlResultados");
  await page.waitForSelector("#ctl00_MainContent_tblResult > tbody > tr:nth-child(2) > td:nth-child(2) > span");
  await page.evaluate(() => {
      document.querySelectorAll("span[name='BtnDescarga']").forEach(el => {
      window.open("https://portalcfdi.facturaelectronica.sat.gob.mx/"+el.getAttribute("onclick").split('\'')[1]);
    });
  });
}

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    try {
        const page = await browser.newPage();
        await page.goto('https://portalcfdi.facturaelectronica.sat.gob.mx/');
        await page.waitForSelector("#divCaptcha > img");
        const captcha_img = await page.$('#divCaptcha > img');
        await captcha_img.screenshot({ path: 'captcha_img.png' });
        const rfc_input = await page.$("#rfc");
        await rfc_input.type("SUF810227460"); //<------------------------------------ RFC
        const password_input = await page.$("#password");
        await password_input.type("SUF00440"); //<---------------------------------- CIEF
        const userCaptcha_input = await page.$("#userCaptcha");
        await userCaptcha_input.type(await entrada());
        await page.$eval("#submit", el => el.click());
        await page.waitForNavigation();
        await page.goto("https://portalcfdi.facturaelectronica.sat.gob.mx/ConsultaEmisor.aspx");
        const folios = await obtenerUUIDs(page);
        console.log(folios)
        //await descargarCFDI(page);
    } catch (error) {
        browser.close();
    }
})();

function getFecha(dias = 0, meses = 0) {
    const fecha = new Date(new Date().getTime() + (dias * 86400000) + (meses * 2592000000));
    const dia = fecha.getDate();
    const mes = fecha.getMonth() + 1;
    return `${dia}/${mes}/${fecha.getFullYear()}`;
}
