function s(o){return String(o??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function b(o,e,t){const c=e.map(d=>`<th style="background:#0b0d12;color:#9fe8ff;border:1px solid #1c2230;padding:8px 12px;font-family:Consolas,monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;text-align:left;"${d.width?` width="${d.width}"`:""}>${s(d.header)}</th>`).join(""),r=o.map((d,a)=>{const i=a%2===0?"#ffffff":"#f2f6fa";return`<tr>${e.map(p=>`<td style="background:${i};border:1px solid #d7dee6;padding:6px 12px;font-family:Segoe UI,Arial,sans-serif;font-size:12px;color:#0b0d12;">${s(p.value(d))}</td>`).join("")}</tr>`}).join(""),l=e.length,n=t.generatedAt??new Date().toLocaleString("ru-RU");return`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"/>
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>${s(t.title)}</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head>
<body>
<table border="0" cellspacing="0" cellpadding="0">
<tr><td colspan="${l}" style="background:#0b0d12;color:#beef8d;padding:12px;font-family:Segoe UI,Arial,sans-serif;font-size:18px;font-weight:bold;">PROTOCOL · ${s(t.title)}</td></tr>
${t.subtitle?`<tr><td colspan="${l}" style="background:#11151d;color:#9fe8ff;padding:6px 12px;font-family:Consolas,monospace;font-size:11px;">${s(t.subtitle)}</td></tr>`:""}
<tr><td colspan="${l}" style="background:#11151d;color:#7d8794;padding:6px 12px;font-family:Consolas,monospace;font-size:10px;">Сформировано: ${s(n)} · Записей: ${o.length}</td></tr>
<tr>${c}</tr>
${r}
</table>
</body></html>`}function f(o,e,t){const r=new Blob(["\uFEFF"+o],{type:t}),l=URL.createObjectURL(r),n=document.createElement("a");n.href=l,n.download=e,document.body.appendChild(n),n.click(),document.body.removeChild(n),URL.revokeObjectURL(l)}function g(o,e){f(o,e.endsWith(".xls")?e:e+".xls","application/vnd.ms-excel")}export{b,g as d};
