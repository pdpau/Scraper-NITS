const fs = require("fs");

/* --- Auxiliary functions --- */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function createDirectory(filePath) { // TODO: Not working properly
    const dir = path.substring(0, filePath.lastIndexOf("/")); // Get the directory without the file name
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true})
    }
}

function returnJSON(path, data) {
    /* Create directory if doesn't exist */
    //createDirectory(path);

    /* Save the data as a JSON file */
    fs.writeFileSync(path, JSON.stringify(data, null, 2), (err) => {
        if (err) throw err;
        console.log("Data written to file " + path);
    });
}
function returnCSV(path, data) {
    /* Create the directory if it doesn't exist */
    //createDirectory(path);

    /* Check if data is not empty */
    if (data.length === 0) {
        console.error("Data is empty");
        return;
    }

    /* Extract headers from the first element */
    const headers = Object.keys(data[0]);

    /* Map the data to CSV format */
    const csv = data.map((row) => {
        return headers.map((header) => {
            let value = row[header] || "";
            // Escape double quotes
            value = value.toString().replace(/"/g, '""');
            // If value contains a comma, quote it
            if (value.includes(",") || value.includes('"') || value.includes("\n")) {
                value = `"${value}"`;
            }
            return value;
        }).join(",");
    }).join("\n");

    /* Add the headers */
    const csvWithHeaders = headers.join(",") + "\n" + csv;

    /* Write the CSV file */
    fs.writeFileSync(path, csvWithHeaders, (err) => {
        if (err) throw err;
        console.log("Data written to file " + path);
    });
}

/* -- Clean data -- */
function data_cleaning(local) {
    /* -- First triming of the text -- */
    cleanName = local.name ? local.name.trim() : "";
    cleanCategory = local.category ? local.category.trim() : "";
    cleanAddress = local.address ? local.address.trim() : "";
    cleanWebsite = local.website ? local.website.trim() : "";
    cleanPhone = local.phone ? local.phone.trim() : "";
    cleanCity = local.city ? local.city.trim() : "";
    cleanAuxiliar = local.auxiliar ? local.auxiliar.trim() : "";
    cleanReviewsRating = local.reviews_rating ? local.reviews_rating.trim() : "";
    cleanNumReviews = local.num_reviews ? local.num_reviews.trim() : "";
    cleanDescription = local.description ? local.description.trim() : "";

    cleanSchedule = local.schedule;


    /* -- Exchange data stored in the wrong place -- */
    // Address
    let addressPattern = /\b\d{5}\b/;
    if (!addressPattern.test(cleanAddress)) {
        let aux = cleanAddress;
        if (addressPattern.test(cleanWebsite)) {
            cleanAddress = cleanWebsite;
            cleanWebsite = aux;
        } else if (addressPattern.test(cleanPhone)) {
            cleanAddress = cleanPhone;
            cleanPhone = aux;
        } else if (addressPattern.test(cleanCity)) {
            cleanAddress = cleanCity;
            cleanCity = aux;
        } else if (addressPattern.test(cleanAuxiliar)) {
            cleanAddress = cleanAuxiliar;
            cleanAuxiliar = aux;
        } else {
            cleanAddress = "NO_ADDRESS";
        };
    };

    // Website
    let websitePattern = /^.+\..+$/;
    if (!websitePattern.test(cleanWebsite)) {
        let aux = cleanWebsite;
        if (websitePattern.test(cleanAddress)) {
            cleanWebsite = cleanAddress;
            cleanAddress = aux;
        } else if (websitePattern.test(cleanCity)) {
            cleanWebsite = cleanCity;
            cleanCity = aux;
        } else if (websitePattern.test(cleanPhone)) {
            cleanWebsite = cleanPhone;
            cleanPhone = aux;
        } else if (websitePattern.test(cleanAuxiliar)) {
            cleanWebsite = cleanAuxiliar;
            cleanAuxiliar = aux;
        } else {
            cleanWebsite = "NO_WEBSITE";
        }
    }

    // Phone
    let phonePattern = /^[0-9]{3}\s[0-9]{2}\s[0-9]{2}\s[0-9]{2}$/;
    if (!phonePattern.test(cleanPhone)) {
        let aux = cleanPhone;
        if (phonePattern.test(cleanAddress)) {
            cleanPhone = cleanAddress;
            cleanAddress = aux;
        } else if (phonePattern.test(cleanCity)) {
            cleanPhone = cleanCity;
            cleanCity = aux;
        } else if (phonePattern.test(cleanAuxiliar)) {
            cleanPhone = cleanAuxiliar;
            cleanAuxiliar = aux;
        } else if (phonePattern.test(cleanWebsite)) {
            cleanPhone = cleanWebsite;
            cleanWebsite = aux;
        } else {
            cleanPhone = "NO_PHONE";
        }
    }

    // City
    let cityPattern = /^[A-Z0-9]{2,5}\+[A-Z0-9]{2,3}\s.+$/i;
    if (!cityPattern.test(cleanCity)) {
        let aux = cleanCity;
        if (cityPattern.test(cleanAddress)) {
            cleanCity = cleanAddress;
            cleanAddress = aux;
        } else if (cityPattern.test(cleanWebsite)) {
            cleanCity = cleanWebsite;
            cleanWebsite = aux;
        } else if (cityPattern.test(cleanAuxiliar)) {
            cleanCity = cleanAuxiliar;
            cleanAuxiliar = aux;
        } else if (cityPattern.test(cleanPhone)) {
            cleanCity = cleanPhone;
            cleanPhone = aux;
        } else {
            cleanCity = "NO_CITY";
        }
    }

    /* -- Cleaning strings (phone, city, reviews_rating, num_reviews) -- */
    if (cleanPhone && cleanPhone !== "") {
        cleanPhone = cleanPhone.replace(/\s+/g, "");
    }
    if (cleanCity && cleanCity !== "") {
        let parts = cleanCity.split(" ");
        if (parts.length > 1) {
            cleanCity = parts.slice(1).join(" ").trim();
        } else {
            cleanCity = cleanCity.trim();
        }
    }
    if (cleanReviewsRating && cleanReviewsRating !== "") {
        cleanReviewsRating = cleanReviewsRating.replace(",", ".");
    }
    if (cleanNumReviews && cleanNumReviews !== "") {
        cleanNumReviews = cleanNumReviews.replace(/\D/g, "");
    }

    return {
        name: cleanName,
        category: cleanCategory,
        address: cleanAddress,
        website: cleanWebsite,
        phone: cleanPhone,
        city: cleanCity,
        auxiliar: cleanAuxiliar,
        reviews_rating: cleanReviewsRating,
        num_reviews: cleanNumReviews,
        description: cleanDescription,
        schedule: cleanSchedule
    };
};
/* -- End of clean data -- */

function clean_email(email) {
    let cleanEmail = email ? email.trim() : "";

    if (cleanEmail.includes(".com") || cleanEmail.includes(".cat") || cleanEmail.includes(".es") || cleanEmail.includes(".net") || cleanEmail.includes(".org")) {
        return cleanEmail;
    } else {
        return "NO_EMAIL";
    }
}

module.exports = {
    sleep,
    returnJSON,
    returnCSV,
    data_cleaning,
    clean_email
};