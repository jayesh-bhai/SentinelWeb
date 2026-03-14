import fs from 'fs';

const data = fs.readFileSync('d:/sentinelweb/collector-api/dataset.csv', 'utf8').trim().split('\n');

const headers = data[0].split(',');
const rows = data.slice(1).map(row => row.split(','));

console.log(`Row count (excluding header): ${rows.length}`);
console.log(`Column count: ${headers.length}`);

let hasNaN = false;
let hasMissing = false;
const stats = headers.map(() => ({ min: Infinity, max: -Infinity, sum: 0 }));

rows.forEach((row, i) => {
    if (row.length !== headers.length) {
        console.log(`Row ${i} length mismatch: ${row.length}`);
    }
    row.forEach((col, j) => {
        if (col === '' || col === undefined) hasMissing = true;

        const val = Number(col);
        if (Number.isNaN(val)) hasNaN = true;

        if (val < stats[j].min) stats[j].min = val;
        if (val > stats[j].max) stats[j].max = val;
        stats[j].sum += val;
    });
});

console.log(`Missing values: ${hasMissing}`);
console.log(`NaN values: ${hasNaN}`);
console.log('--- Feature Statistics ---');

headers.forEach((h, j) => {
    console.log(`${h}: min=${stats[j].min}, max=${stats[j].max}, mean=${(stats[j].sum / rows.length).toFixed(4)}`);
});
