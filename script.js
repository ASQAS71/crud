let data;
let primaryKey;

const getIndexes = (dataObj=JSON.parse(localStorage.getItem(data))) => Object.keys(dataObj[Object.keys(dataObj)[0]]);

window.onload = () => init().catch(e => comunicateError(e)).finally(() => finalChecks())

async function init() {
    try {
        await fetchDataAndSetLocalStorage();
    } catch (e) {
        handleFetchingError(e);
    }

    setForms();
    setTable();
    // setMode(mode) ainda a ser implementada
}

function handleFetchingError(e) {
    if (localStorage.length === 0) throw Error("Não há nenhum dado local. Erro anterior: " + e.message);
    for (let i = 0; i < localStorage.length; i++){
        let key = localStorage.key(i);
        let value = localStorage.getItem(key);
        const isObjectInString = (str) => {
            try {
                JSON.parse(str);
                return true;
            } catch (e) {
                return false;
            }
        }
        if (typeof value === "object" || isObjectInString(value)) data = key;
        else primaryKey = key;
    }
    document.querySelector("#header-error-msg").textContent = "Erro na coleta de dados; Recorrendo a dados locais";
}

function comunicateError(e){
    console.log(e.message);
    let errorMsg = document.querySelector("#header-error-msg");
    errorMsg.textContent = "Erro na coleta de dados";

}
function finalChecks() {
    console.log(data);
    console.log(primaryKey);
    for (let i = 0; i < localStorage.length; i++){
        let key = localStorage.key(i);
        console.log(key);
        let value =  localStorage.getItem(key);
        console.log(value);
    }
}

async function fetchDataAndSetLocalStorage() {
    let url = document.querySelector('meta[name="database-url"]').getAttribute('content');
    let promise = await fetch(url);
    let json = await promise.json();
    let primaryKeyInfo;
    let dataInfo;
    for (let key in json){
        if (typeof json[key] !== "object"){
            primaryKeyInfo = json[key];
            primaryKey = key;
        } else {
            dataInfo = JSON.stringify(json[key], null, 2);
            data = key;
        }
    }
    if (primaryKey && data){
        localStorage.clear();
        localStorage.setItem(primaryKey, primaryKeyInfo);
        localStorage.setItem(data, dataInfo);
        // for (let i = 0; i < localStorage.length; i++){
        //     console.log(localStorage.key(i));
        //     console.log(localStorage.getItem(localStorage.key(i)));
        // }
        return;
    }
    throw ReferenceError("Invalid Json");
}

function setForms() {
    let formInputs = document.getElementById('form-inputs');

    let dataL = JSON.parse(localStorage.getItem(data));
    let firstKey = Object.keys(dataL)[0];
    let dataObj = {};
    dataObj[localStorage.getItem(primaryKey)] = firstKey;
    for (let key in dataL[firstKey]) dataObj[key] = dataL[firstKey][key];

    let newForm = getDivForms(dataObj);
    let newFormClone = newForm.cloneNode(true);


    newFormClone.id = 'form-inputs';

    formInputs.parentNode.replaceChild(newFormClone, formInputs);

    document.querySelector("#clear-form").hidden = false;
    document.querySelector("#register").hidden = false;
}
function getDivForms(dataObj, parentKey='') {
    let div = document.createElement('div');

    for (let key in dataObj) {
        let label = document.createElement('label');
        label.textContent = parentKey ? `${key}` : key;
        label.htmlFor = key;


        let input;
        let value = dataObj[key];

        if (typeof value === 'object' && !Array.isArray(value)) input = getDivForms(value, key);
        else input = createInput(value, key);

        div.appendChild(label);
        div.appendChild(input);
    }

    return div;
}

function createInput(value, key) {

    let input = document.createElement('input');

    let inputType;

    if (typeof value === 'number') inputType = 'number';
    else if (typeof value === 'boolean') inputType = 'checkbox';
    else if (Array.isArray(value)) inputType = 'array';
    else if (key.toLowerCase() === 'email') inputType = 'email';
    else inputType = 'text';

    input.id = key;
    input.name = key;
    input.required = true;

    if (inputType !== 'array') input.type = inputType;
    else {
        input.type = 'text';
        input.placeholder = input.placeholder = 'Separe valores por ;';
    }

    return input;
}

function setTable() {
    let table = document.querySelector("table");

    let headers = getHeaders();
    let dataRows = getDataRows();

    while (table.firstChild) table.removeChild(table.firstChild);

    table.appendChild(headers);
    for (let dataRow of dataRows) table.appendChild(dataRow);
}

function getHeaders() {
    let headers = document.createElement("tr");
    headers.id = "headers";

    let headersIndexes = getIndexes();
    if (primaryKey !== null && primaryKey !== "") headersIndexes.unshift(localStorage.getItem(primaryKey));

    for (let key of headersIndexes) {
        let head = document.createElement("th");
        head.textContent = key;
        head.id = key;
        headers.appendChild(head);
    }

    return headers;
}

function getDataRows(dataObj=JSON.parse(localStorage.getItem(data))) {
    let rows = [];
    let keys = Object.keys(dataObj[Object.keys(dataObj)[0]]);
    if (primaryKey !== null && primaryKey !== "") keys.unshift(primaryKey);
    for (let userKey in dataObj) {
        let row = document.createElement("tr");
        for (let key of keys){
            let col = document.createElement("td");
            col.id = `${userKey} ${key}`;
            let content;
            if (key === primaryKey) content = userKey;
            else content = dataObj[userKey][key];
            if (typeof content === "boolean"){
                if (content) col.innerHTML = "&#10004;";
                else col.innerHTML = "&#10008;";
            }
            else if (typeof content !== 'object') col.textContent = content;
            else {
                if (Array.isArray(content)) col.appendChild(createList(content, 'ul', key, col.id))
                else col.appendChild(createList(content, 'dl', key, col.id));
            }
            row.appendChild(col);
        }
        rows.push(row);
    }
    return rows;
}

function createList(obj, listType, head, colId){
    let list = document.createElement(listType);
    for(let key in obj){
        let item = document.createElement(listType === "dl" ? "dt" : "li");
        let value = obj[key];
        if (typeof value === 'object' && !Array.isArray(value)) {
            item.textContent = key + ": ";
            let innerList = createList(value, 'dl', head);
            list.appendChild(item);
            list.appendChild(innerList);
        } else if (Array.isArray(value)) {
            item.textContent = key + ": ";
            let innerList = createList(value, 'ul', head);
            list.appendChild(item);
            list.appendChild(innerList);
        } else {
            if (typeof value === "boolean"){
                let icon = value ? "&#10004;" : "&#10008;";
                item.innerHTML = `${key}: ${icon}`;
            }
            else item.textContent = listType === 'dl' ? key + ": " + value : value;
            item.id = `${colId} ${head} ${key}`
            list.appendChild(item);
        }
    }
    return list;
}