import{H as s}from"./index-BD6lONBy.js";async function a(){return(await s("institutions",{sort:"name",fields:["*"]})).map(t=>({id:String(t.id),name:t.name,shortName:t.short_name}))}export{a as f};
