const fs = require("fs");

const { exec } = require("child_process");

const { nits_scraper } = require("./scraper");
const { scrapeEmails } = require("./email_scraper");
const { sleep } = require("./aux_functions");



async function main() {
    const search = process.argv[2];
    if (!search) {
        console.error("Please provide a search query");
        return;
    };

    /* -- Scrape all data from each local in Google Maps -- */
    await nits_scraper(search);
    await sleep(1000);

    /* -- Get emails from webpage -- */
    data_path = "../data/dades.json";
    if (fs.existsSync(data_path)) {
        await scrapeEmails();
    } else {
        console.error("Data file not found");
    }

    /* -- Execute the python file to clean the data -- */
    /* const py_file = "./data_prep_nits.py";
    exec(`python ${py_file}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing the python file: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Error executing the python file: ${stderr}`);
            return;
        }
        console.log(`Python file executed: ${stdout}`);
    }); */
};

main().catch((error) => {
    console.error("Error in the main function: ", error.message);
});