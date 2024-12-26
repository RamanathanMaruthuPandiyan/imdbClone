import createEnum from "./createEnum.js";

const _Sex = {
    gender: createEnum([
        { "value": 'M', "name": "MALE", "description": 'Male' },
        { "value": "F", "name": "FEMALE", "description": "Female" },
        { "value": "O", "name": "OTHER", "description": "Other" }
    ])
}

const _Jobs = {
    names: createEnum([
        { "value": "IIMBD", "name": "IMPORT_IMBD", "description": "Import from IMBD" }
    ]),
    status: createEnum([
        { "value": "NS", "name": "NotStarted", "description": "Not Started" },
        { "value": "IP", "name": "InProgress", "description": "In Progress" },
        { "value": "CO", "name": "Completed", "description": "Completed" },
        { "value": "ER", "name": "Errored", "description": "Error" }
    ])
};

const _Action_Items = {
    action: createEnum([
        { value: "CR", name: "CREATE", description: "Create" },
        { value: "VI", name: "VIEW", description: "View" },
        { value: "ED", name: "EDIT", description: "Edit" },
        { value: "DE", name: "DELETE", description: "Delete" },
        { value: "IM", name: "IMPORT", description: "Import" },
    ])
};



export {
    _Sex as Sex,
    _Jobs as Jobs,
    _Action_Items as Action_Items
}