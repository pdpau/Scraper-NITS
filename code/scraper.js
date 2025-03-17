const puppeteer = require("puppeteer");

const { sleep, returnJSON, returnCSV, data_cleaning } = require("./aux_functions");

/* --- Auxiliary async functions --- */
async function clickOnElementByText(page, elementType, elementText) { // Nomes per al principi
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
    //await sleep(1000);
}
/* --- End of Auxiliary async functions --- */



/* -- Main function -- */
async function nits_scraper(query) {
    if (!query) {
        console.log("Please provide a query");
        return;
    };

    let locals = [];
    let num_locals = 40; // Personalitzar

    try {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        /* --- Go to Google Maps search page and search for the query --- */
        const search = "https://www.google.com/maps/search/" + query;
        await page.goto(search);

        /* --- Click on the "Rechazar todo" span element to reject the cookies --- */
        await clickOnElementByText(page, "span", "Rechazar todo");

        /* --- Wait for the results section to load --- */
        let resultsSectionTag = "div[aria-label='Resultados de " + query + "']";
        await page.waitForSelector(resultsSectionTag);
        let resultsSection = await page.$(resultsSectionTag);

        /* -- Store all locals in elements array -- */
        let elements = await resultsSection.$$("div.Nv2PK.THOPZb.CpccDe"); // + .CdoAJb

        /* -- Scraper the data from every element (local) -- */
        for (let i = 0; i < num_locals; i++) {
            console.log("-------------------");
            console.log("-------------------");
            console.log("Length: " + elements.length);
            let e = elements[i];

            console.log("Element: " + (i+1));
            console.log("-------------------");

            let local = {};
            local.images = {};

            try {
                /* -- Get the local name -- */
                let nameElement = await e.$("div.qBF1Pd.fontHeadlineSmall");
                if (!nameElement) {
                    // Alternative name element tag
                    nameElement = await e.$("div.qBF1Pd.fontHeadlineSmall.kiIehc.Hi2drd");
                }
                if (nameElement) {
                    let name = await nameElement.evaluate((el) => el.textContent);
                    local.name = name;
                    console.log(name);
                }

                /* -- Main image in div.FQ2IWe.p0Hhde -- */
                let img1Element = await e.$("div.SpFAAb");
                if (img1Element) {
                    let img1tag = await img1Element.$("img");
                    if (img1tag) {
                        let img1src = await img1tag.evaluate(img => img.src || img.getAttribute('src'));
                        local.images.main = img1src;
                        console.log("Image URL: ", img1src);
                    } else {
                        local.images.main = "NOT_FOUND";
                    }
                } else {
                    local.images.main = "NOT_FOUND";
                }

                /* -- Click into the element to get the local details -- */
                if (e) {
                    await Promise.all([
                        e.click(),
                        page.waitForNavigation({ waitUntil: "networkidle2" })
                    ]);
                } else {
                    console.log("Element not found");
                }
                await sleep(4000);

                /* --- Get the other 3 images --- */
                /* -- Click into images to access the array of images (button.aoRNLd.kn2E5e.NMjTrf.lvtCsd) */
                let imageGalleryButton = await page.$("button.aoRNLd.kn2E5e.NMjTrf.lvtCsd");
                if (imageGalleryButton) {
                    await Promise.all([
                        imageGalleryButton.click(),
                        page.waitForNavigation({ waitUntil: "networkidle2" })
                    ]);
                } else {
                    console.log("Image gallery button not found");
                }
                await sleep(1000);

                /* -- Get the first 5 images (images are in the div.U39Pmb or div.U39Pmb.loaded but in the style parameter of the div, like this: "background-image: url(&quot;https://lh5.googleusercontent.com/p/AF1QipOdeCDRAAeo9kEv3FG0FEVZa9d6tV-kKm3xZbZK=w203-h152-k-no&quot;);" ) -- */
                const imageUrls = await page.evaluate(() => {
                    const imageContainers = document.querySelectorAll("div.U39Pmb, div.U39Pmb.loaded");
                    const urls = [];

                    const containers = Array.from(imageContainers).slice(0, 5);

                    containers.forEach((container) => {
                        const style = container.getAttribute("style");
                        if (style && style.includes('background-image')) {
                            // Extract URL from background-image: url("https://...")
                            const urlMatch = style.match(/background-image:\s*url\(['"](.*?)['"]\)/);
                            if (urlMatch && urlMatch[1]) {
                                urls.push(urlMatch[1]);
                            }
                        }
                    });
                    return urls;
                });
                console.log(`Found ${imageUrls.length} images`);

                // Save the first 3 images
                for (let j = 0; j < 3; j++) {
                    if (j < imageUrls.length) {
                        local.images[`img${j+1}`] = imageUrls[j];
                        console.log(`Image ${j+1}: ${imageUrls[j]}`);
                    } else {
                        local.images[`img${j+1}`] = "NOT_FOUND";
                        console.log(`Image ${j+1}: NOT_FOUND`);
                    }
                }

                /* -- Exit the images section (span.google-symbols.G47vBd) */
                let exitImagesButton = await page.$("span.google-symbols.G47vBd");
                if (exitImagesButton) {
                    await Promise.all([
                        exitImagesButton.click(),
                        page.waitForNavigation({ waitUntil: "networkidle2" })
                    ]);
                } else {
                    console.log("Exit images button not found");
                }
                /* --- END OF Get the other 3 images --- */

                /* -- Get the category of the local -- */
                let categoryElement = await page.$("button.DkEaL");
                if (categoryElement) {
                    let category = await categoryElement.evaluate((el) => el.textContent);
                    local.category = category;
                } else {
                    local.category = "NOT_FOUND";
                }
                //console.log("Category: " + local.category);

                /* -- Get details (address, web, phone, city) -- */
                let details = await page.$$("div.Io6YTe.fontBodyMedium.kR99db.fdkmkc", { waitUntil: "networkidle2", timeout: 2000 });
                console.log("Details length: " + details.length);
                if (details.length > 0) {
                    local.address = await details[0].evaluate((el) => el.textContent); //console.log("Address: " + local.address);
                    if (details.length > 1) local.website = await details[1].evaluate((el) => el.textContent); else local.website = "NOT_FOUND"; //console.log("Website: " + local.website);
                    if (details.length > 2) local.phone = await details[2].evaluate((el) => el.textContent); else local.phone = "NOT_FOUND"; //console.log("Phone: " + local.phone);
                    if (details.length > 3) local.city = await details[3].evaluate((el) => el.textContent); else local.city = "NOT_FOUND"; //console.log("City: " + local.city);
                    if (details.length > 4) local.auxiliar = await details[4].evaluate((el) => el.textContent); else local.auxiliar = "NOT_FOUND"; //console.log("Auxiliar: " + local.auxiliar);
                } else {
                    local.address = "NOT_FOUND";
                    local.website = "NOT_FOUND";
                    local.phone = "NOT_FOUND";
                    local.city = "NOT_FOUND";
                    local.auxiliar = "NOT_FOUND";
                }

                /* -- Click on the schedule dropdown (span.puWIL.hKrmvd.google-symbols.OazX1c) -- */
                let dropdownButton = await page.$("span.puWIL.hKrmvd.google-symbols.OazX1c");
                if (dropdownButton) {
                    await Promise.all([
                        dropdownButton.click(),
                        page.waitForSelector("tr.y0skZc", { timeout: 5000 })
                    ]);
                    /* -- Get schedule (tr.y0skZc) -- */
                    // Horaris com a STRING
                    /* let scheduleList = await page.$$("tr.y0skZc", { waitUntil: "networkidle2" });
                    if (scheduleList.length > 0) {
                        let scheduleData = [];
                        for (let day of scheduleList) {
                            let info = await day.evaluate((el) => el.textContent);
                            scheduleData.push(info);
                        }
                        local.schedule = scheduleData;
                    } else {
                        local.schedule = "NOT_FOUND";
                    } */
                    // Horaris com a OBJECTE
                    const scheduleData = await page.evaluate(() => {
                        const rows = document.querySelectorAll("tr.y0skZc");
                        const data = [];
                        rows.forEach(row => {
                            // You might need to adjust these selectors slightly
                            const dayEl   = row.querySelector("td:nth-child(1)") || row.querySelector(".o0xfQc");
                            const hoursEl = row.querySelector("td:nth-child(2)");
                            const day   = dayEl ? dayEl.textContent.trim()   : "";
                            const hours = hoursEl ? hoursEl.textContent.trim() : "";
                            data.push({ day, hours });
                        });
                        return data;
                    });
                    local.schedule = scheduleData;
                } else {
                    console.log("Dropdown button not found");
                    local.schedule = "NOT_FOUND";
                }
                await sleep(1000);


                /* -- Get rating (div.fontDisplayLarge) -- */
                let ratingElement = await page.$("div.fontDisplayLarge");
                if (ratingElement) {
                    let rating = await ratingElement.evaluate((el) => el.textContent);
                    local.reviews_rating = rating;
                } else {
                    local.reviews_rating = "NOT_FOUND";
                }
                //console.log("Rating: " + local.reviews_rating);

                /* -- Get number of reviews (div.HHrUdb) -- */
                //let numReviewsElement = await page.$("button.HHrUdb.fontTitleSmall.rqjGif"); // Old tag
                let numReviewsElement = await page.$("div.HHrUdb"); // New tag
                if (numReviewsElement) {
                    let numReviews = await numReviewsElement.evaluate((el) => el.textContent);
                    local.num_reviews = numReviews;
                } else {
                    local.num_reviews = "NOT_FOUND";
                }
                //console.log("Number of reviews: " + local.num_reviews);

                /* -- Get description (div.PYvSYb) -- */
                let descriptionElement = await page.$("div.PYvSYb");
                if (descriptionElement) {
                    let description = await descriptionElement.evaluate((el) => el.textContent);
                    local.description = description;
                } else {
                    local.description = "NOT_FOUND";
                }
                //console.log("Description: " + local.description);

                /* -- Clean data -- */
                local = data_cleaning(local);
                locals.push(local);

            } catch (error) {
                console.log(`Error processing local ${i + 1}: ${error.message}`);
                continue; // Skip local and go to the next one
            }

            /* -- Go back to the search results -- */
            await Promise.all([
                page.locator("span.google-symbols.G47vBd").click({ waitUntil: "networkidle2" }),
                page.waitForSelector(resultsSectionTag)
            ]);
            await sleep(1000);

            /* -- Scroll down and Re-fetch the elements after going back to results section -- */
            await scrollElement(page, resultsSectionTag, 2000);
            elements = await page.$$("div.Nv2PK.THOPZb.CpccDe");

            /* -- Save the data in JSON and CSV -- */
            returnJSON("../data/dades.json", locals);
            returnCSV("../data/dades.csv", locals);
        }

        console.log("End of scraping");

        // await browser.close();
    } catch (error) {
        console.error("Error scraping locals: ", error.message);
    };
};

module.exports = { nits_scraper };
