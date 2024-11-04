const form = document.querySelector('form#main');
const query = document.querySelector('form#query');


const alertMsg = document.querySelector('.alert');

const asis = document.querySelector('textarea[name=asis]');
const expect = document.querySelector('textarea[name=expect]');

const resultDiv = document.querySelector('.result');

const saveButton = document.querySelector('button[name=saveResult]');
const loadButton = document.querySelector('button[name=loadResult]');

var data = {
    "is_active": true,
    "asis": {},
    "expect": {}
};

var searchResult = {
    "is_active": false,
    "asis": {},
    "expect": {}
};

var result = [];

const getDisplayValue = (value) => {
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    if (typeof value === 'string') {
        return `"${value}"`;
    }
    if (value === null) {
        return "null";
    }
    return value;
};

const compareObjects = (asis, expect, pointer="") => {
    for (let key in expect) {
        if (asis !== null && asis.hasOwnProperty(key)) {
            if (asis[key] !== null && typeof asis[key] === 'object' && expect[key]!== null &&typeof expect[key] === 'object') {
                compareObjects(asis[key], expect[key], `${pointer}${(!isNaN(Number(key))) ? `[${key}]` : "." + key}`);
            }
            else {
                /* compare type */
                if (asis[key]!==null && typeof asis[key] !== typeof expect[key]) {
                    result.push({
                        pointer: `${pointer}.${key}`,
                        asis: asis[key],
                        expect: expect[key],
                        key: key,
                        type: "danger",
                        log: "Error",
                        message: `Type mismatch at ${pointer}${(!isNaN(Number(key))) ? `[${key}]` :  "." + key} (expected ${getDisplayValue(typeof expect[key])}, actual ${getDisplayValue(typeof asis[key])})`
                    });
                }
                /* compare value */
                else if (asis[key] !== expect[key] && expect[key]!==null) {
                    result.push({
                        pointer: `${pointer}.${key}`,
                        asis: asis[key],
                        expect: expect[key],
                        key: key,
                        type: "warning",
                        log: "Warning",
                        message: `Value mismatch at ${pointer}${(!isNaN(Number(key))) ? `[${key}]` :  "." + key} (expected ${getDisplayValue(expect[key])}, actual ${getDisplayValue(asis[key])})`
                    });
                }
                /* expected null but actual is not null */
                else if (asis[key] !== expect[key] && expect[key]===null) {
                    result.push({
                        pointer: `${pointer}.${key}`,
                        asis: asis[key],
                        expect: expect[key],
                        key: key,
                        type: "info",
                        log: "Info",
                        message: `The actual JSON have value but the expected is null at ${pointer}${(!isNaN(Number(key))) ? `[${key}]` :  "." + key} (expected to be null, actual ${getDisplayValue(asis[key])})`
                    });
                }
            }
        }else{
            result.push({
                pointer: `${pointer}.${key}`,
                asis: asis[key],
                expect: expect[key],
                key: key,
                type: "danger",
                log: "Error",
                message: `Property not found at ${pointer}${(!isNaN(Number(key))) ? `[${key}]` :  "." + key}  (property: ${getDisplayValue(key)})`
            });
        }
    }

    for (const key in asis) {
        if (expect!==null && !expect.hasOwnProperty(key)) {
            result.push({
                pointer: `${pointer}.${key}`,
                asis: asis[key],
                expect: expect[key],
                key: key,
                type: "info",
                log: "Info",
                message: `The actual JSON have more property than expacted JSON at ${pointer}${(!isNaN(Number(key))) ? `[${key}]` :  "." + key} (property: ${getDisplayValue(key)})`
            });
        }
    }
};

saveButton.addEventListener('click', () => {
    const date = new Date();
    const filename = `result-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.json`;

    const focusObject = searchResult.is_active ? searchResult : data;

    const downloadJSON = {
        "expected": focusObject.expect,
        "actual": focusObject.asis,
        "result": result
    }
    const blob = new Blob([JSON.stringify(downloadJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    a.download = filename;

    document.body.appendChild(a);

    a.click();

    window.URL.revokeObjectURL(url);

    document.body.removeChild(a);
});

loadButton.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            const loadedData = JSON.parse(reader.result);
            data.asis = loadedData.actual;
            data.expect = loadedData.expected;
            asis.value = JSON.stringify(data.asis, null, 2);
            expect.value = JSON.stringify(data.expect, null, 2);
            form.dispatchEvent(new Event('submit'));
        }
    });
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
});

query.addEventListener('keyup', (e) => {

    const queryJSONText = query.querySelector('input[name="query-string"]').value;

    if (queryJSONText === '') {
        searchResult.is_active = false;
        asis.value = JSON.stringify(data.asis, null, 2);
        expect.value = JSON.stringify(data.expect, null, 2);
        form.dispatchEvent(new Event('submit'));
        form.querySelectorAll('textarea').forEach((textarea) => { textarea.readOnly = false; });
        return;
    }


    const queryJSON = queryJSONText.split('.').slice(1);

    form.querySelectorAll('textarea').forEach((textarea) => { textarea.readOnly = true; });

    searchResult.is_active = true;
    searchResult.asis = Object.assign({}, data.asis);
    searchResult.expect = Object.assign({}, data.expect);

    let asisPointer = searchResult.asis;
    let expectPointer = searchResult.expect;

    queryJSON.forEach((key) => {
        if (key.includes('[')) {
            const index = key.match(/\d+/)[0];
            key = key.split('[')[0];
            asisPointer = asisPointer[key][index];
        } else {
            asisPointer = asisPointer[key];
        }
    });

    queryJSON.forEach((key) => {
        if (key.includes('[')) {
            const index = key.match(/\d+/)[0];
            key = key.split('[')[0];
            expectPointer = expectPointer[key][index];
        } else {
            expectPointer = expectPointer[key];
        }
    });

    asis.value = JSON.stringify(asisPointer, null, 2);
    expect.value = JSON.stringify(expectPointer, null, 2);
    form.dispatchEvent(new Event('submit'));
})

form.addEventListener('submit', (e) => {

    e.preventDefault();

    useObject = searchResult.is_active ? searchResult : data;

    console.log(useObject);

    resultDiv.innerHTML = '';
    result = [];


    alertMsg.className = 'alert d-none';

    compareObjects(useObject.asis, useObject.expect);

    console.log(result);

    result.forEach((item) => {
        resultDiv.innerHTML += `<div class="result-line">
                <div class="d-flex align-items-center">
                    <div class="badge rounded-pill badge-${item.type} m-1">${item.log}</div>
                    <div>${item.message}</div>
                </div>
            </div>`;
    })

    if (result.length === 0) {
        resultDiv.innerHTML += `<div class="result-line">
                <div class="d-flex align-items-center">
                    <div class="badge rounded-pill badge-success m-1">OK</div>
                    <div>${ "Object are identical" }</div>
                </div>
        </div>`;
    }
});

asis.addEventListener('blur', () => {
    try {
        data.asis = JSON.parse(asis.value);
    }
    catch (error) {
        alertMsg.className = 'alert alert-danger';
        alertMsg.innerText = 'Invalid JSON format';
        return;
    }

    alertMsg.className = 'alert d-none';

    console.log(data.asis)

    asis.value = JSON.stringify(data.asis, null, 2);
});

expect.addEventListener('blur', () => {
    try {
        data.expect = JSON.parse(expect.value);
    }
    catch (error) {
        alertMsg.className = 'alert alert-danger';
        alertMsg.innerText = 'Invalid JSON format';
        return;
    }

    alertMsg.className = 'alert d-none';

    console.log(data.expect)

    expect.value = JSON.stringify(data.expect, null, 2);
});

const jsonPicker1 = document.querySelector('input[name=jsonPicker1]');
const jsonPicker2 = document.querySelector('input[name=jsonPicker2]');

jsonPicker1.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
        expect.value = reader.result;
        expect.dispatchEvent(new Event('blur'));
    }
    reader.readAsText(file);
});

jsonPicker2.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
        asis.value = reader.result;
        asis.dispatchEvent(new Event('blur'));
    }
    reader.readAsText(file);
});