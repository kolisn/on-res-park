const puppeteer = require("puppeteer");
const ProgressBar = require("progress");
const prettier = require("prettier");
const fs = require("fs");
const { program } = require("commander");

program
  .version("1.0.0", "-v, --version")
  .usage("[OPTIONS]...")
  .requiredOption("-w, --www <URL>", "Campground URL")
  .requiredOption("-s, --site <#1>,<#2>", "Site numbers: 31,40,45 ")
  .requiredOption("-b, --start <YYYY/MM/DD>", "End date: 2020/01/20")
  .requiredOption("-e, --end <YYYY/MM/DD>", "End date: 2020/01/25")
  .option("-o, --outputfile <FILENAME>", "Filename/path")
  .parse(process.argv);

Date.prototype.yyyymmdd = function () {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [
    this.getFullYear(),
    (mm > 9 ? "" : "0") + mm,
    (dd > 9 ? "" : "0") + dd,
  ].join("");
};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    /* , args: [ "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", ],  */
  });
  let data;
  try {
    const options = program.opts();
    const outputFilename = options.outputfile ?? "output.json";
    const siteOptions = options.site.split(",");
    const startDateOption = new Date(options.start);
    const endDateOption = new Date(options.end);

    const page = await browser.newPage();
    /*   page.on("console", (msg) => console.log(msg.text())); */
    await page.setDefaultNavigationTimeout(0);
    await page.goto(options.www);
    await page.waitForSelector("#grid-view-button");
    await page.click("#grid-view-button");
    try {
      await page.waitForSelector("#calendar-title");
    } catch {
      console.log("Couldn't find #calendar-title");
    }
    const pageName = await page.evaluate(() => {
      const element = document.querySelector("#breadcrumb");

      return element?.textContent;
    });
    let formattedPageName = pageName;
    try {
      await page.waitForSelector("#grid-table");
    } catch {
      console.log("Couldn't find #grid-table");
    }

    const calendarTable = await page.evaluate(() => {
      let outArr = [];
      document.querySelectorAll("table#grid-table td").forEach((val) => {
        let label = val.getAttribute("aria-label") ?? "";
        label = label.replace(/(\r\n|\n|\r)/gm, "");
        let labelTemp = label;
        let site = label.substring(0, label.indexOf(","));
        labelTemp = labelTemp.substring(labelTemp.indexOf(",") + 1).trim();

        let dateStr = labelTemp.substring(0, 19).trim();
        let statusStr = labelTemp.substring(20).trim();

        let obj = {};
        obj.site = site;
        obj.date = dateStr;
        obj.status = statusStr;
        if (obj.site != "" && obj.dateStr != "" && obj.status != "") {
          outArr.push(obj);
        }
      });

      return outArr;
    });

    let formattedCalendarTable = calendarTable;

    /*   console.log({
      location: formattedPageName,
      calendarTable: formattedCalendarTable,
    }); */
    data = {
      location: formattedPageName,
      calendarTable: formattedCalendarTable,
    };

    if (options.outputfile) {
      let fileOut = outputFilename ?? `./${new Date()}.json`;
      fs.writeFile(
        outputFilename ?? `./${new Date()}.json`,
        prettier.format(JSON.stringify(data), { parser: "json" }),
        (err) => {
          if (err) return console.log(err);
        }
      );
      /*  console.log("Saved fileOut", fileOut); */
    }
    let availability = checkForAvailability(
      data.calendarTable,
      siteOptions,
      startDateOption,
      endDateOption
    );
    console.log(availability);

    await browser.close();
  } catch (e) {
    await browser.close();
    throw e;
  }
})();

function checkForAvailability(data, sites, startDate, endDate) {
  /* for each site, see if all dates available */
  let calc = {};
  sites.forEach((site) => {
    let siteData = data.filter((val) => val.site == site);
    siteData.forEach((siteVal) => {
      siteVal.jsdate = new Date(siteVal.date);
    });

    /* check each date */
    calc[site] = {};
    let allAvailable = true;
    let curDate = new Date(startDate);
    while (curDate <= endDate) {
      let curEntry = siteData.find((siteDataRow) => {
        return siteDataRow.jsdate.yyyymmdd() == curDate.yyyymmdd();
      });
      calc[site][curDate.yyyymmdd()] = curEntry?.status;
      curDate.setDate(curDate.getDate() + 1);
    }
  });

  let calcArr = [];

  Object.keys(calc).forEach((val) => {
    let obj = calc[val];
    let objArr = Object.entries(obj).map((val) => val[1]);
    calcArr.push(objArr.every((arrVal) => arrVal == "Available"));
  });

  return calcArr.some((val) => val == true);
}
