const fs = require('fs');
const sw = require('./swagger.json'); 
const summary = {}; 

Object.keys(sw.paths || {}).forEach(p => { 
    const methods = Object.keys(sw.paths[p]); 
    methods.forEach(m => { 
        const tags = sw.paths[p][m].tags || ['Uncategorized']; 
        tags.forEach(t => { 
            if (!summary[t]) summary[t] = []; 
            summary[t].push(`${m.toUpperCase()} ${p}`); 
        }); 
    }); 
}); 
fs.writeFileSync('swagger_summary.json', JSON.stringify(summary, null, 2));
