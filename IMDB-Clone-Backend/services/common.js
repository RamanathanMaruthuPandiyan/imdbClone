export function extractSearchKeys(enums, searchTerm) {
    try {
        let descriptionsArray = Object.values(enums.descriptions);
        let regex = new RegExp(searchTerm, "i");
        let filteredResults = descriptionsArray.filter(value => regex.test(value));
        let matchingKeys = filteredResults.map(description => {
            return Object.keys(enums.descriptions).find(key => enums.descriptions[key] === description);
        });
        return matchingKeys;
    } catch (e) {
        throw e;
    }
}