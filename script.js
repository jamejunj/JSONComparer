const form = document.querySelector('form');

const alertMsg = document.querySelector('.alert');

const asis = document.querySelector('textarea[name=asis]');
const expect = document.querySelector('textarea[name=expect]');

const resultDiv = document.querySelector('.result');

var asisObject = {};
var expectObject = {};

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
                if (typeof asis[key] !== typeof expect[key]) {
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
                else if (asis[key] !== expect[key]) {
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

form.addEventListener('submit', (e) => {

    resultDiv.innerHTML = '';
    result = [];

    e.preventDefault();

    alertMsg.className = 'alert d-none';

    compareObjects(asisObject, expectObject);

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
        asisObject = JSON.parse(asis.value);
    }
    catch (error) {
        alertMsg.className = 'alert alert-danger';
        alertMsg.innerText = 'Invalid JSON format';
        return;
    }

    alertMsg.className = 'alert d-none';

    console.log(asisObject)

    asis.value = JSON.stringify(asisObject, null, 2);
});

expect.addEventListener('blur', () => {
    try {
        expectObject = JSON.parse(expect.value);
    }
    catch (error) {
        alertMsg.className = 'alert alert-danger';
        alertMsg.innerText = 'Invalid JSON format';
        return;
    }

    alertMsg.className = 'alert d-none';

    console.log(expectObject)

    expect.value = JSON.stringify(expectObject, null, 2);
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