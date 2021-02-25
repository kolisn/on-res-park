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
    headless: true,
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

    try {
      await page.waitForSelector("#grid-table");
    } catch {
      console.log("Couldn't find #grid-table");
    }

    try {
      await page.waitForSelector("table#grid-table td");
    } catch {
      console.log("Couldn't find table#grid-table td");
    }

    const calendarTable = await page.evaluate(() => {
      let siteItem = [];
      document.querySelectorAll("table#grid-table td").forEach((val) => {
        /* for each td elem, hopefully one containins SVG */
        /* TODO check that td elem has svg child */
        let label = val.getAttribute("aria-label") ?? "";
        label = label.replace(/(\r\n|\n|\r)/gm, "");
        let labelTemp = label;

        let site = label
          .substring(0, label.indexOf(","))
          .trim(); /* site has comma after */

        labelTemp = labelTemp
          .substring(labelTemp.indexOf(",") + 1)
          .trim(); /* cut+trim from comma onwards */
        let dateStr = labelTemp.substring(0, 19).trim();
        let statusStr = labelTemp.substring(20).trim();

        let siteObj = {};

        siteObj.site = site;
        siteObj.date = dateStr;
        siteObj.status = statusStr;

        if (
          siteObj.site != "" &&
          siteObj.dateStr != "" &&
          siteObj.status != ""
        ) {
          siteItem.push(siteObj);
        }
      });

      return siteItem;
    });

    let formattedPageName = pageName;
    let formattedCalendarTable = calendarTable;

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
  /* use nested object to calculate */
  /* build site object */

  let siteCheck = {};
  sites.forEach((site) => {
    let siteData = data.filter((val) => val.site == site);
    siteData.forEach((siteVal) => {
      siteVal.jsdate = new Date(siteVal.date);
    });

    /* siteCheck each date */
    /* build date object*/

    siteCheck[site] = {};
    let curDate = new Date(startDate);
    /* loop startDate -> endDate */
    while (curDate <= endDate) {
      let curEntry = siteData.find((siteDataRow) => {
        return siteDataRow.jsdate.yyyymmdd() == curDate.yyyymmdd();
      });
      siteCheck[site][curDate.yyyymmdd()] = curEntry?.status; //uniquely key the status
      curDate.setDate(curDate.getDate() + 1);
    }
  });

  let siteArr = [];

  /* perform availability check */

  Object.keys(siteCheck).forEach((val) => {
    let siteObj = siteCheck[val];
    let siteStatusArr = Object.entries(siteObj).map((val) => val[1]);
    /* ensure EVERY date for this site available */
    siteArr.push(
      siteStatusArr.every((siteStatus) => {
        return siteStatus == "Available";
      })
    );
  });

  /* check atleast one site has FULL DATE RANGE availability */
  return siteArr.some((val) => val == true);
}
