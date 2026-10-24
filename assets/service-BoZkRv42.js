import{ao as s}from"./index-CLBRcgoe.js";async function i(){return(await s("institutions",{sort:"name",fields:["*"]})).map(t=>({id:String(t.id),name:t.name,shortName:t.short_name}))}export{i as f};
