const puppeteer = require("puppeteer");

const { sleep, returnJSON, returnCSV, data_cleaning } = require("./aux_functions");

/* --- Auxiliary async functions --- */
async function clickOnElementByText(page, elementType, elementText) {
    return page.evaluate((type, text) => {
        const elem = Array.from(document.querySelectorAll(type)).find((el) => el.textContent === text);
        if (elem) { elem.click(); }
    }, elementType, elementText);
}

async function scrollElement(page, elementToScroll, scrollingSize) {
    return page.evaluate((element, size) => {
        const section = document.querySelector(element);
        if (section) {
            section.scrollBy(0, size);
        }
    }, elementToScroll, scrollingSize);
}

/* -- Main function -- */
async function nits_scraper(query) {
    if (!query) {
        console.log("Please provide a query");
        return;
    }

    let locals = [];
    let num_locals = 200;

    try {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        /* --- Go to Google Maps search page and search for the query --- */
        const search = "https://www.google.com/maps/search/" + query;
        await page.goto(search);

        /* --- Click "Rechazar todo" to reject cookies --- */
        await clickOnElementByText(page, "span", "Rechazar todo");

        /* --- Wait for the results section to load --- */
        let resultsSectionTag = "div[aria-label='Resultados de " + query + "']";
        await page.waitForSelector(resultsSectionTag);
        let resultsSection = await page.$(resultsSectionTag);

        /* -- Store all locals in elements array -- */
        let elements = await resultsSection.$$("div.Nv2PK.THOPZb.CpccDe");

        /* -- Scraper the data from every element (local) -- */
        for (let i = 0; i < num_locals; i++) {
            console.log("-------------------");
            console.log("Element: " + (i + 1));
            console.log("-------------------");

            let local = {};

            try {
                let e = elements[i];
                if (!e) {
                    console.log("Element not found, skipping...");
                    continue;
                }

                /* -- Get the local name -- */
                let nameElement = await e.$("div.qBF1Pd.fontHeadlineSmall");
                if (!nameElement) {
                    nameElement = await e.$("div.qBF1Pd.fontHeadlineSmall.kiIehc.Hi2drd");
                }
                if (nameElement) {
                    local.name = await nameElement.evaluate(el => el.textContent.trim());
                } else {
                    console.log("Name not found, skipping...");
                    continue;
                }

                console.log("Scraping: " + local.name);

                /* --- Click into the element to get the local details --- */
                try {
                    await Promise.all([
                        e.click(),
                        page.waitForNavigation({ waitUntil: "networkidle2" })
                    ]);
                } catch (clickError) {
                    console.log(`Click timeout for ${local.name}, skipping...`);
                    continue;
                }

                await sleep(4000);

                /* -- Get the category -- */
                let categoryElement = await page.$("button.DkEaL");
                local.category = categoryElement ? await categoryElement.evaluate(el => el.textContent.trim()) : "NOT_FOUND";

                /* -- Get details (address, website, phone, city) -- */
                let details = await page.$$("div.Io6YTe.fontBodyMedium.kR99db.fdkmkc").catch(() => []);
                if (details.length > 0) {
                    local.address = await details[0].evaluate(el => el.textContent.trim());
                    local.website = details.length > 1 ? await details[1].evaluate(el => el.textContent.trim()) : "NOT_FOUND";
                    local.phone = details.length > 2 ? await details[2].evaluate(el => el.textContent.trim()) : "NOT_FOUND";
                    local.city = details.length > 3 ? await details[3].evaluate(el => el.textContent.trim()) : "NOT_FOUND";
                } else {
                    local.address = "NOT_FOUND";
                }

                /* -- Get schedule -- */
                try {
                    let dropdownButton = await page.$("span.puWIL.hKrmvd.google-symbols.OazX1c");
                    if (dropdownButton) {
                        await dropdownButton.click();
                        await page.waitForSelector("tr.y0skZc", { timeout: 3000 });
                        
                        const scheduleData = await page.evaluate(() => {
                            const rows = document.querySelectorAll("tr.y0skZc");
                            const data = [];
                            rows.forEach(row => {
                                const dayEl = row.querySelector("td:nth-child(1)") || row.querySelector(".o0xfQc");
                                const hoursEl = row.querySelector("td:nth-child(2)");
                                const day = dayEl ? dayEl.textContent.trim() : "";
                                const hours = hoursEl ? hoursEl.textContent.trim() : "";
                                data.push({ day, hours });
                            });
                            return data;
                        });

                        local.schedule = scheduleData;
                    }
                } catch (scheduleError) {
                    console.log(`Schedule error for ${local.name}, skipping...`);
                    local.schedule = "NOT_FOUND";
                }

                /* -- Get rating -- */
                let ratingElement = await page.$("div.fontDisplayLarge");
                local.reviews_rating = ratingElement ? await ratingElement.evaluate(el => el.textContent.trim()) : "NOT_FOUND";

                /* -- Get number of reviews -- */
                let numReviewsElement = await page.$("button.HHrUdb.fontTitleSmall.rqjGif");
                local.num_reviews = numReviewsElement ? await numReviewsElement.evaluate(el => el.textContent.trim()) : "NOT_FOUND";

                /* -- Get description -- */
                let descriptionElement = await page.$("div.PYvSYb");
                local.description = descriptionElement ? await descriptionElement.evaluate(el => el.textContent.trim()) : "NOT_FOUND";

                /* -- Clean data and push to list -- */
                local = data_cleaning(local);
                locals.push(local);

                /* -- Save progress -- */
                returnJSON("../data/dades.json", locals);
                returnCSV("../data/dades.csv", locals);

            } catch (error) {
                console.log(`Error processing local ${i + 1}: ${error.message}, skipping...`);
                continue;
            }

            /* -- Go back to the search results -- */
            try {
                await Promise.all([
                    page.locator("span.google-symbols.G47vBd").click(),
                    page.waitForSelector(resultsSectionTag)
                ]);
            } catch (backError) {
                console.log("Error going back to results, refreshing...");
                await page.reload({ waitUntil: "networkidle2" });
            }

            /* -- Scroll down and Re-fetch elements -- */
            await scrollElement(page, resultsSectionTag, 1500);
            elements = await page.$$("div.Nv2PK.THOPZb.CpccDe");
        }

        console.log("End of scraping");

    } catch (error) {
        console.error("Error scraping locals: ", error.message);
    }
};

module.exports = { nits_scraper };
