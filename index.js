const puppeteer = require("puppeteer");
const ProgressBar = require("progress");
const prettier = require("prettier");
const fs = require("fs");
const prompts = require("prompts");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null /* , args: [ "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", ],  */,
  });
  let data;
  try {
    const outputFilename = "reservations.ontarioparks.com.json";
    const page = await browser.newPage();
    page.on("console", (msg) => console.log(msg.text()));
    await page.setDefaultNavigationTimeout(0);
    await page.goto(
      "https://reservations.ontarioparks.com/create-booking/results?resourceLocationId=-2147483601&mapId=-2147483432&searchTabGroupId=0&bookingCategoryId=0&startDate=2021-06-10&endDate=2021-06-01&nights=9&isReserving=true&equipmentId=-32768&subEquipmentId=-32768&partySize=1&searchTime=2021-02-23T20:14:50.983"
    );
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

    console.log({
      location: formattedPageName,
      calendarTable: formattedCalendarTable,
    });
    data = {
      location: formattedPageName,
      calendarTable: formattedCalendarTable,
    };
    fs.writeFile(
      outputFilename ?? `./${new Date()}.json`,
      prettier.format(JSON.stringify(data), { parser: "json" }),
      (err) => {
        if (err) return console.log(err);
      }
    );

    await browser.close();
  } catch (e) {
    await browser.close();
    throw e;
  }
})();
