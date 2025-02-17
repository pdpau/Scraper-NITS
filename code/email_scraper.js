
const puppeteer = require("puppeteer");
const fs = require("fs");

const { sleep, returnJSON, returnCSV, clean_email } = require("./aux_functions");


/* --- Email scraping function --- */
async function scrapeEmailFromWebsite(url) {
    try {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        /* --- Go to the local page --- */
        await page.goto(url, { waitUntil: "load", timeout: 0 });

        /* --- Extract all text from the page --- */
        const pageContent = await page.content();

        /* --- Check if any text matches the email syntax --- */
        const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+/g;
        const emails = pageContent.match(emailRegex);

        /* --- Close the browser --- */
        await browser.close();

        return emails ? emails[0] : "NO_EMAIL";
    } catch (error) {
        console.error("Error scraping email web: ", error.message);
    }
}
/* --- End of Email scraping function --- */

/* --- Main function --- */
async function scrapeEmails() {
    const locals_path = "../data/dades";
    const localsArray = JSON.parse(fs.readFileSync(locals_path + ".json", "utf8"));

    try {
        for (const local of localsArray) {
            if (local.website && local.website !== "NO_WEBSITE" && local.website !== "") {
                /* --- Get the email from the local web --- */
                const email = await scrapeEmailFromWebsite(`http://${local.website}`);
                console.log(`${local.name}: ${email}`);
                /* --- Add the email to the local --- */
                local.email = clean_email(email);
            }
            await sleep(1000);
        }
        /* --- Save the data to a JSON and a CSV file --- */
        const filename = locals_path + "_amb_emails";
        returnJSON(filename + ".json", localsArray);
        returnCSV(filename + ".csv", localsArray);
        console.log("Data saved to JSON and CSV files");
    } catch (error) {
        console.log("Error scraping in the main function: ", error.message);
    }
}
/* --- End of Main function --- */


//scrapeEmails();
module.exports = { scrapeEmails };
