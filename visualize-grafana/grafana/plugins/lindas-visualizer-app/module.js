define(["@grafana/data","react","@emotion/css","@grafana/ui","@grafana/runtime"],function(e,t,a,n,r){return function(){"use strict";var l={7:function(e){e.exports=n},89:function(e){e.exports=a},531:function(e){e.exports=r},781:function(t){t.exports=e},959:function(e){e.exports=t}},s={};function o(e){var t=s[e];if(void 0!==t)return t.exports;var a=s[e]={exports:{}};return l[e](a,a.exports,o),a.exports}o.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return o.d(t,{a:t}),t},o.d=function(e,t){for(var a in t)o.o(t,a)&&!o.o(e,a)&&Object.defineProperty(e,a,{enumerable:!0,get:t[a]})},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var i={};o.r(i),o.d(i,{plugin:function(){return N}});var c=o(781),d=o(959),m=o.n(d),p=o(89),u=o(7),h=o(531);const g=[{id:"bar",label:"Bar Chart",icon:"graph-bar",description:"Compare values across categories",supportsSeries:!0},{id:"line",label:"Line Chart",icon:"gf-interpolation-linear",description:"Show trends over time",requiresTimeDimension:!0,supportsSeries:!0},{id:"area",label:"Area Chart",icon:"gf-interpolation-linear",description:"Show cumulative trends",requiresTimeDimension:!0,supportsSeries:!0},{id:"pie",label:"Pie Chart",icon:"pie-chart",description:"Show proportions of a whole",supportsSeries:!1},{id:"scatter",label:"Scatter Plot",icon:"gf-landscape",description:"Show correlation between two measures",supportsSeries:!0},{id:"table",label:"Table",icon:"table",description:"Display raw data in rows and columns",supportsSeries:!1}],b={chartType:"bar",limit:1e4,showLegend:!0},y="\nPREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nPREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\nPREFIX cube: <https://cube.link/>\nPREFIX schema: <http://schema.org/>\nPREFIX sh: <http://www.w3.org/ns/shacl#>\nPREFIX qudt: <http://qudt.org/schema/qudt/>\nPREFIX meta: <https://cube.link/meta/>\n";async function f(e){return await(0,h.getBackendSrv)().post("https://lindas.admin.ch/query",`query=${encodeURIComponent(e)}`,{headers:{"Content-Type":"application/x-www-form-urlencoded",Accept:"application/sparql-results+json"}})}function E(e){const t=e.split(/[/#]/);return(t[t.length-1]||"var").replace(/[^a-zA-Z0-9]/g,"_").toLowerCase()}const x=["#7EB26D","#EAB839","#6ED0E0","#EF843C","#E24D42","#1F78C1","#BA43A9","#705DA0","#508642","#CCA300"];function v(e){const t=e.split(/[/#]/);return(t[t.length-1]||"var").replace(/[^a-zA-Z0-9]/g,"_").toLowerCase()}const $=({data:e,config:t,dimensions:a,measures:n})=>{const r=(0,u.useStyles2)(L),l=(0,u.useTheme2)(),s=(0,d.useMemo)(()=>{if(!t.xAxis||!t.yAxis||0===e.length)return null;const a=v(t.xAxis),n=v(t.yAxis),r=t.groupBy?v(t.groupBy):null,l=new Map;e.forEach(e=>{const t=String(e[a]??"Unknown"),s=Number(e[n])||0,o=r?String(e[r]??"Other"):"Value";l.has(t)||l.set(t,new Map);const i=l.get(t);i.set(o,(i.get(o)||0)+s)});const s=Array.from(l.keys()).slice(0,20),o=new Set;l.forEach(e=>{e.forEach((e,t)=>o.add(t))});const i=Array.from(o).slice(0,10),c=s.map(e=>{const t=l.get(e),a={};return i.forEach(e=>{a[e]=t.get(e)||0}),{category:e,values:a}});return{categories:s,seriesNames:i,values:c}},[e,t]);if(!s)return m().createElement("div",{className:r.emptyChart},m().createElement("p",null,"Configure X-Axis and Y-Axis to see a preview"));const{categories:o,seriesNames:i,values:c}=s,p=40,h=60,g=620,b=300;let y=0;c.forEach(e=>{Object.values(e.values).forEach(e=>{e>y&&(y=e)})}),y=y||1;return m().createElement("div",{className:r.chartWrapper},(()=>{switch(t.chartType){case"bar":default:return(()=>{const e=g/o.length/(i.length+1),a=.1*e;return m().createElement("svg",{viewBox:"0 0 800 400",className:r.svg},m().createElement("line",{x1:h,y1:p,x2:h,y2:340,stroke:l.colors.text.disabled}),m().createElement("line",{x1:h,y1:340,x2:680,y2:340,stroke:l.colors.text.disabled}),c.map((t,n)=>{const r=h+(n+.5)*(g/o.length);return m().createElement("g",{key:t.category},i.map((n,l)=>{const s=t.values[n]||0,o=s/y*b,c=r-i.length*e/2+l*e+a/2,d=340-o;return m().createElement("rect",{key:n,x:c,y:d,width:e-a,height:o,fill:x[l%x.length],rx:2},m().createElement("title",null,`${t.category} - ${n}: ${s.toLocaleString()}`))}),m().createElement("text",{x:r,y:360,textAnchor:"middle",fontSize:10,fill:l.colors.text.secondary},t.category.length>10?t.category.slice(0,10)+"...":t.category))}),[0,.25,.5,.75,1].map(e=>m().createElement("g",{key:e},m().createElement("text",{x:50,y:340-e*b+4,textAnchor:"end",fontSize:10,fill:l.colors.text.secondary},(y*e).toLocaleString(void 0,{maximumFractionDigits:0})),m().createElement("line",{x1:h,y1:340-e*b,x2:680,y2:340-e*b,stroke:l.colors.border.weak,strokeDasharray:"4 4"}))),t.showLegend&&i.length>1&&m().createElement("g",{transform:"translate(690, 40)"},i.map((e,t)=>m().createElement("g",{key:e,transform:`translate(0, ${20*t})`},m().createElement("rect",{width:12,height:12,fill:x[t%x.length],rx:2}),m().createElement("text",{x:18,y:10,fontSize:11,fill:l.colors.text.primary},e.length>12?e.slice(0,12)+"...":e)))),m().createElement("text",{x:400,y:20,textAnchor:"middle",fontSize:14,fontWeight:"bold",fill:l.colors.text.primary},t.title||"Chart Preview"))})();case"line":case"area":return(()=>{const e=g/(o.length-1||1);return m().createElement("svg",{viewBox:"0 0 800 400",className:r.svg},m().createElement("line",{x1:h,y1:p,x2:h,y2:340,stroke:l.colors.text.disabled}),m().createElement("line",{x1:h,y1:340,x2:680,y2:340,stroke:l.colors.text.disabled}),[.25,.5,.75,1].map(e=>m().createElement("line",{key:e,x1:h,y1:340-e*b,x2:680,y2:340-e*b,stroke:l.colors.border.weak,strokeDasharray:"4 4"})),i.map((a,n)=>{const r=c.map((t,n)=>{const r=t.values[a]||0;return{x:h+n*e,y:340-r/y*b}}),l=r.map((e,t)=>`${0===t?"M":"L"} ${e.x} ${e.y}`).join(" ");if("area"===t.chartType){const e=`${l} L ${r[r.length-1].x} 340 L ${r[0].x} 340 Z`;return m().createElement("g",{key:a},m().createElement("path",{d:e,fill:x[n%x.length],opacity:.3}),m().createElement("path",{d:l,fill:"none",stroke:x[n%x.length],strokeWidth:2}),r.map((e,t)=>m().createElement("circle",{key:t,cx:e.x,cy:e.y,r:4,fill:x[n%x.length]},m().createElement("title",null,`${c[t].category} - ${a}: ${c[t].values[a]?.toLocaleString()}`))))}return m().createElement("g",{key:a},m().createElement("path",{d:l,fill:"none",stroke:x[n%x.length],strokeWidth:2}),r.map((e,t)=>m().createElement("circle",{key:t,cx:e.x,cy:e.y,r:4,fill:x[n%x.length]},m().createElement("title",null,`${c[t].category} - ${a}: ${c[t].values[a]?.toLocaleString()}`))))}),c.map((t,a)=>m().createElement("text",{key:a,x:h+a*e,y:360,textAnchor:"middle",fontSize:10,fill:l.colors.text.secondary},t.category.length>8?t.category.slice(0,8)+"...":t.category)),t.showLegend&&i.length>1&&m().createElement("g",{transform:"translate(690, 40)"},i.map((e,t)=>m().createElement("g",{key:e,transform:`translate(0, ${20*t})`},m().createElement("line",{x1:0,y1:6,x2:12,y2:6,stroke:x[t%x.length],strokeWidth:2}),m().createElement("text",{x:18,y:10,fontSize:11,fill:l.colors.text.primary},e.length>12?e.slice(0,12)+"...":e)))),m().createElement("text",{x:400,y:20,textAnchor:"middle",fontSize:14,fontWeight:"bold",fill:l.colors.text.primary},t.title||"Chart Preview"))})();case"pie":return(()=>{const e=Math.min(g,b)/2-20,a=c.map(e=>({category:e.category,total:Object.values(e.values).reduce((e,t)=>e+t,0)})),n=a.reduce((e,t)=>e+t.total,0)||1;let s=-Math.PI/2;return m().createElement("svg",{viewBox:"0 0 800 400",className:r.svg},a.map((t,a)=>{const r=t.total/n*2*Math.PI,l=s,o=s+r;s=o;const i=400+e*Math.cos(l),c=210+e*Math.sin(l),d=400+e*Math.cos(o),p=210+e*Math.sin(o),u=r>Math.PI?1:0,h=`M 400 210 L ${i} ${c} A ${e} ${e} 0 ${u} 1 ${d} ${p} Z`;return m().createElement("path",{key:t.category,d:h,fill:x[a%x.length]},m().createElement("title",null,`${t.category}: ${t.total.toLocaleString()} (${(t.total/n*100).toFixed(1)}%)`))}),t.showLegend&&m().createElement("g",{transform:"translate(700, 40)"},a.slice(0,10).map((e,t)=>m().createElement("g",{key:e.category,transform:`translate(0, ${18*t})`},m().createElement("rect",{width:12,height:12,fill:x[t%x.length],rx:2}),m().createElement("text",{x:18,y:10,fontSize:10,fill:l.colors.text.primary},e.category.length>15?e.category.slice(0,15)+"...":e.category)))),m().createElement("text",{x:400,y:20,textAnchor:"middle",fontSize:14,fontWeight:"bold",fill:l.colors.text.primary},t.title||"Chart Preview"))})();case"scatter":return(()=>{const e=c.map((e,t)=>{const a=t/(c.length-1||1)*g,n=(Object.values(e.values)[0]||0)/y*b;return{x:h+a,y:340-n,label:e.category}});return m().createElement("svg",{viewBox:"0 0 800 400",className:r.svg},m().createElement("line",{x1:h,y1:p,x2:h,y2:340,stroke:l.colors.text.disabled}),m().createElement("line",{x1:h,y1:340,x2:680,y2:340,stroke:l.colors.text.disabled}),e.map((e,t)=>m().createElement("circle",{key:t,cx:e.x,cy:e.y,r:6,fill:x[0],opacity:.7},m().createElement("title",null,e.label))),m().createElement("text",{x:400,y:20,textAnchor:"middle",fontSize:14,fontWeight:"bold",fill:l.colors.text.primary},t.title||"Chart Preview"))})();case"table":return m().createElement("div",{className:r.tableContainer},m().createElement("table",{className:r.table},m().createElement("thead",null,m().createElement("tr",null,m().createElement("th",null,"Category"),i.map(e=>m().createElement("th",{key:e},e)))),m().createElement("tbody",null,c.slice(0,20).map(e=>m().createElement("tr",{key:e.category},m().createElement("td",null,e.category),i.map(t=>m().createElement("td",{key:t},(e.values[t]||0).toLocaleString())))))),c.length>20&&m().createElement("div",{className:r.tableMore},"Showing 20 of ",c.length," rows"))}})())},L=e=>({chartWrapper:p.css`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  `,svg:p.css`
    max-width: 100%;
    max-height: 100%;
  `,emptyChart:p.css`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: ${e.colors.text.secondary};
  `,tableContainer:p.css`
    width: 100%;
    overflow: auto;
    max-height: 100%;
  `,table:p.css`
    width: 100%;
    border-collapse: collapse;
    font-size: ${e.typography.size.sm};

    th, td {
      padding: ${e.spacing(1)};
      text-align: left;
      border-bottom: 1px solid ${e.colors.border.weak};
    }

    th {
      background: ${e.colors.background.secondary};
      font-weight: ${e.typography.fontWeightMedium};
    }

    tr:hover td {
      background: ${e.colors.action.hover};
    }
  `,tableMore:p.css`
    padding: ${e.spacing(1)};
    text-align: center;
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
  `}),S=e=>({container:p.css`
    display: flex;
    flex-direction: column;
    height: 100%;
    background: ${e.colors.background.canvas};
  `,header:p.css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${e.spacing(2)} ${e.spacing(3)};
    background: ${e.colors.background.primary};
    border-bottom: 1px solid ${e.colors.border.weak};
  `,headerTitle:p.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(2)};

    h1 {
      margin: 0;
      font-size: ${e.typography.h4.fontSize};
    }

    p {
      margin: 0;
      color: ${e.colors.text.secondary};
      font-size: ${e.typography.size.sm};
    }
  `,headerActions:p.css`
    display: flex;
    gap: ${e.spacing(1)};
  `,mainContent:p.css`
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  `,leftPanel:p.css`
    width: 280px;
    min-width: 250px;
    background: ${e.colors.background.primary};
    border-right: 1px solid ${e.colors.border.weak};
    display: flex;
    flex-direction: column;
  `,centerPanel:p.css`
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: ${e.spacing(2)};
  `,rightPanel:p.css`
    width: 300px;
    min-width: 280px;
    background: ${e.colors.background.primary};
    border-left: 1px solid ${e.colors.border.weak};
    overflow-y: auto;
  `,panelHeader:p.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
    padding: ${e.spacing(2)};
    font-weight: ${e.typography.fontWeightMedium};
    border-bottom: 1px solid ${e.colors.border.weak};
  `,searchBox:p.css`
    padding: ${e.spacing(1)};
    border-bottom: 1px solid ${e.colors.border.weak};
  `,datasetList:p.css`
    flex: 1;
    overflow-y: auto;
    padding: ${e.spacing(1)};
  `,datasetItem:p.css`
    padding: ${e.spacing(1.5)};
    border-radius: ${e.shape.radius.default};
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background: ${e.colors.action.hover};
    }
  `,datasetItemSelected:p.css`
    background: ${e.colors.action.selected};
    border-left: 3px solid ${e.colors.primary.main};
  `,datasetName:p.css`
    font-weight: ${e.typography.fontWeightMedium};
    font-size: ${e.typography.size.sm};
    margin-bottom: ${e.spacing(.5)};
  `,datasetMeta:p.css`
    font-size: ${e.typography.size.xs};
    color: ${e.colors.text.secondary};
  `,placeholder:p.css`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: ${e.colors.text.secondary};

    h2 {
      margin: ${e.spacing(2)} 0 ${e.spacing(1)} 0;
    }

    p {
      margin: 0;
    }
  `,placeholderIcon:p.css`
    color: ${e.colors.text.disabled};
  `,loadingState:p.css`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${e.spacing(2)};
    color: ${e.colors.text.secondary};
  `,emptyState:p.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${e.spacing(1)};
    padding: ${e.spacing(4)};
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
  `,chartContainer:p.css`
    flex: 1;
    display: flex;
    flex-direction: column;
    background: ${e.colors.background.primary};
    border-radius: ${e.shape.radius.default};
    overflow: hidden;
  `,chartHeader:p.css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${e.spacing(2)};
    border-bottom: 1px solid ${e.colors.border.weak};

    h2 {
      margin: 0;
      font-size: ${e.typography.h5.fontSize};
    }
  `,chartMeta:p.css`
    font-size: ${e.typography.size.sm};
    color: ${e.colors.text.secondary};
  `,chartPreview:p.css`
    flex: 1;
    padding: ${e.spacing(2)};
    min-height: 400px;
  `,configSection:p.css`
    padding: ${e.spacing(2)};
    border-bottom: 1px solid ${e.colors.border.weak};
  `,configLabel:p.css`
    display: block;
    font-size: ${e.typography.size.sm};
    font-weight: ${e.typography.fontWeightMedium};
    margin-bottom: ${e.spacing(1)};
    color: ${e.colors.text.secondary};
  `,configRow:p.css`
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,chartTypeGrid:p.css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: ${e.spacing(1)};
  `,chartTypeButton:p.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${e.spacing(.5)};
    padding: ${e.spacing(1)};
    background: ${e.colors.background.secondary};
    border: 1px solid ${e.colors.border.weak};
    border-radius: ${e.shape.radius.default};
    cursor: pointer;
    transition: all 0.2s;

    span {
      font-size: ${e.typography.size.xs};
    }

    &:hover {
      border-color: ${e.colors.primary.main};
    }
  `,chartTypeButtonActive:p.css`
    background: ${e.colors.primary.transparent};
    border-color: ${e.colors.primary.main};
    color: ${e.colors.primary.text};
  `,modalContent:p.css`
    display: flex;
    flex-direction: column;
    gap: ${e.spacing(2)};
  `,modalActions:p.css`
    display: flex;
    justify-content: flex-end;
    gap: ${e.spacing(1)};
    margin-top: ${e.spacing(2)};
  `}),N=(new c.AppPlugin).setRootPage(()=>{const e=(0,u.useStyles2)(S),[t,a]=(0,d.useState)(""),[n,r]=(0,d.useState)([]),[l,s]=(0,d.useState)(!1),[o,i]=(0,d.useState)(null),[c,p]=(0,d.useState)(!1),[x,v]=(0,d.useState)([]),[L,N]=(0,d.useState)([]),[w,A]=(0,d.useState)(!1),[T,C]=(0,d.useState)(b),[I,k]=(0,d.useState)(null),[R,O]=(0,d.useState)(!1),[P,z]=(0,d.useState)(""),[M,B]=(0,d.useState)(!1);(0,d.useEffect)(()=>{const e=setTimeout(async()=>{s(!0);try{const e=await async function(e=""){const t=e?`FILTER(CONTAINS(LCASE(?label), LCASE("${e.replace(/"/g,'\\"')}")) || CONTAINS(LCASE(?description), LCASE("${e.replace(/"/g,'\\"')}")))`:"",a=`${y}\nSELECT DISTINCT ?cube ?label ?description ?publisher ?dateModified WHERE {\n  ?cube a cube:Cube .\n\n  OPTIONAL {\n    ?cube schema:name ?labelRaw .\n    FILTER(LANG(?labelRaw) = "en" || LANG(?labelRaw) = "de" || LANG(?labelRaw) = "")\n  }\n  OPTIONAL {\n    ?cube schema:description ?descRaw .\n    FILTER(LANG(?descRaw) = "en" || LANG(?descRaw) = "de" || LANG(?descRaw) = "")\n  }\n  OPTIONAL {\n    ?cube schema:creator/schema:name ?publisherName .\n    FILTER(LANG(?publisherName) = "en" || LANG(?publisherName) = "de" || LANG(?publisherName) = "")\n  }\n  OPTIONAL { ?cube schema:dateModified ?dateModified }\n\n  BIND(COALESCE(?labelRaw, STR(?cube)) AS ?label)\n  BIND(COALESCE(?descRaw, "") AS ?description)\n  BIND(COALESCE(?publisherName, "") AS ?publisher)\n\n  ${t}\n}\nORDER BY DESC(?dateModified) ?label\nLIMIT 200`;try{return(await f(a)).results.bindings.map(e=>({uri:e.cube?.value||"",label:e.label?.value||"Unknown",description:e.description?.value||void 0,publisher:e.publisher?.value||void 0,dateModified:e.dateModified?.value||void 0}))}catch(e){return console.error("Failed to search cubes:",e),[]}}(t);r(e)}catch(e){k(`Failed to load datasets: ${e.message}`)}finally{s(!1)}},300);return()=>clearTimeout(e)},[t]);const D=(0,d.useCallback)(async e=>{p(!0),k(null);try{const t=await async function(e){const t=`${y}\nSELECT ?label ?description ?publisher WHERE {\n  <${e}> a cube:Cube .\n  OPTIONAL { <${e}> schema:name ?label . FILTER(LANG(?label) = "en" || LANG(?label) = "de" || LANG(?label) = "") }\n  OPTIONAL { <${e}> schema:description ?description . FILTER(LANG(?description) = "en" || LANG(?description) = "de" || LANG(?description) = "") }\n  OPTIONAL { <${e}> schema:creator/schema:name ?publisher . FILTER(LANG(?publisher) = "en" || LANG(?publisher) = "de" || LANG(?publisher) = "") }\n} LIMIT 1`,a=`${y}\nSELECT DISTINCT ?dimension ?label ?scaleType WHERE {\n  <${e}> cube:observationConstraint ?shape .\n  ?shape sh:property ?prop .\n  ?prop sh:path ?dimension .\n\n  # Exclude measures\n  FILTER NOT EXISTS { ?prop qudt:unit ?unit }\n  FILTER NOT EXISTS { ?prop schema:unitCode ?unitCode }\n  FILTER NOT EXISTS { ?prop qudt:hasUnit ?hasUnit }\n\n  OPTIONAL { ?prop schema:name ?propLabel . FILTER(LANG(?propLabel) = "en" || LANG(?propLabel) = "de" || LANG(?propLabel) = "") }\n  OPTIONAL { ?prop rdfs:label ?rdfsLabel . FILTER(LANG(?rdfsLabel) = "en" || LANG(?rdfsLabel) = "de" || LANG(?rdfsLabel) = "") }\n  OPTIONAL { ?prop meta:scaleType ?scaleTypeUri }\n\n  BIND(COALESCE(?propLabel, ?rdfsLabel, STRAFTER(STR(?dimension), "#"), REPLACE(STR(?dimension), "^.*/", "")) AS ?label)\n  BIND(STRAFTER(STR(?scaleTypeUri), "scaleType/") AS ?scaleType)\n}\nORDER BY ?label`,n=`${y}\nSELECT DISTINCT ?measure ?label ?unit WHERE {\n  <${e}> cube:observationConstraint ?shape .\n  ?shape sh:property ?prop .\n  ?prop sh:path ?measure .\n\n  # Measures have units\n  { ?prop qudt:unit ?unitUri }\n  UNION { ?prop schema:unitCode ?unitCode }\n  UNION { ?prop qudt:hasUnit ?hasUnit }\n\n  OPTIONAL { ?prop schema:name ?propLabel . FILTER(LANG(?propLabel) = "en" || LANG(?propLabel) = "de" || LANG(?propLabel) = "") }\n  OPTIONAL { ?prop rdfs:label ?rdfsLabel . FILTER(LANG(?rdfsLabel) = "en" || LANG(?rdfsLabel) = "de" || LANG(?rdfsLabel) = "") }\n  OPTIONAL { ?unitUri rdfs:label ?unitLabel }\n\n  BIND(COALESCE(?propLabel, ?rdfsLabel, STRAFTER(STR(?measure), "#"), REPLACE(STR(?measure), "^.*/", "")) AS ?label)\n  BIND(COALESCE(?unitLabel, ?unitCode, "") AS ?unit)\n}\nORDER BY ?label`;try{const[r,l,s]=await Promise.all([f(t),f(a),f(n)]),o=r.results.bindings[0],i=l.results.bindings.map(e=>{const t=e.scaleType?.value?.toLowerCase();return{uri:e.dimension?.value||"",label:e.label?.value||"Unknown",scaleType:t,isTemporal:"temporal"===t,isNumerical:"ratio"===t||"interval"===t}}),c=s.results.bindings.map(e=>({uri:e.measure?.value||"",label:e.label?.value||"Unknown",unit:e.unit?.value||void 0}));return{uri:e,label:o?.label?.value||e,description:o?.description?.value,publisher:o?.publisher?.value,dimensions:i,measures:c}}catch(e){return console.error("Failed to get cube metadata:",e),null}}(e.uri);if(t){i(t),C(e=>({...e,title:t.label,xAxis:t.dimensions[0]?.uri,yAxis:t.measures[0]?.uri,groupBy:void 0})),A(!0);const{data:e,columns:a}=await async function(e,t,a,n=1e4){const r=[],l=[];l.push(`<${e}> cube:observationSet/cube:observation ?obs .`),t.forEach(e=>{const t=E(e.uri),a=`${t}_raw`,n=`${t}_label`;r.push(`?${t}`),l.push(`OPTIONAL { ?obs <${e.uri}> ?${a} . }`),l.push(`OPTIONAL { ?${a} schema:name ?${n} . FILTER(LANG(?${n}) = "en" || LANG(?${n}) = "de" || LANG(?${n}) = "") }`),l.push(`BIND(COALESCE(?${n}, STR(?${a})) AS ?${t})`)}),a.forEach(e=>{const t=E(e.uri);r.push(`?${t}`),l.push(`OPTIONAL { ?obs <${e.uri}> ?${t} . }`)});const s=`${y}\nSELECT ${r.join(" ")} WHERE {\n  ${l.join("\n  ")}\n}\nLIMIT ${n}`;try{const e=await f(s),t=e.head.vars;return{data:e.results.bindings.map(e=>{const a={};for(const n of t){const t=e[n]?.value,r=e[n]?.datatype;void 0===t?a[n]=null:r?.includes("integer")||r?.includes("decimal")||r?.includes("float")||r?.includes("double")?a[n]=Number(t):a[n]=t}return a}),columns:t}}catch(e){return console.error("Failed to fetch cube data:",e),{data:[],columns:[]}}}(t.uri,t.dimensions,t.measures,T.limit);v(e),N(a)}}catch(e){k(`Failed to load dataset: ${e.message}`)}finally{p(!1),A(!1)}},[T.limit]),F=(0,d.useMemo)(()=>o?o.dimensions.map(e=>({label:e.label,value:e.uri,description:e.isTemporal?"Temporal":e.scaleType})):[],[o]),G=(0,d.useMemo)(()=>o?o.measures.map(e=>({label:e.label,value:e.uri,description:e.unit})):[],[o]),j=(0,d.useCallback)(e=>{C(t=>({...t,...e}))},[]),W=(0,d.useCallback)(async()=>{if(o&&T.xAxis&&T.yAxis){B(!0),k(null);try{const e="table"===T.chartType?"table":"pie"===T.chartType?"piechart":"scatter"===T.chartType?"scatter":"timeseries",t=(o.dimensions.find(e=>e.uri===T.xAxis),o.measures.find(e=>e.uri===T.yAxis),T.groupBy&&o.dimensions.find(e=>e.uri===T.groupBy),{title:P||`${o.label} - ${(new Date).toISOString().slice(0,16)}`,tags:["lindas","chart-studio"],timezone:"browser",schemaVersion:38,panels:[{id:1,type:e,title:T.title||o.label,gridPos:{x:0,y:0,w:24,h:16},datasource:{type:"lindas-datasource",uid:"lindas-datasource"},targets:[{refId:"A",cubeUri:o.uri,limit:T.limit}],fieldConfig:{defaults:{custom:{}},overrides:[]},options:"table"===e?{showHeader:!0}:{legend:{showLegend:T.showLegend}}}]}),a=await(0,h.getBackendSrv)().post("/api/dashboards/db",{dashboard:t,folderUid:"",message:`Created with Chart Studio from ${o.label}`,overwrite:!1});O(!1),h.locationService.push(`/d/${a.uid}`)}catch(e){k(`Failed to save dashboard: ${e.message}`)}finally{B(!1)}}else k("Please configure the chart before saving")},[o,T,P]);return g.map(e=>({label:e.label,value:e.id,icon:e.icon})),m().createElement("div",{className:e.container},m().createElement("header",{className:e.header},m().createElement("div",{className:e.headerTitle},m().createElement(u.Icon,{name:"chart-line",size:"xl"}),m().createElement("div",null,m().createElement("h1",null,"LINDAS Chart Studio"),m().createElement("p",null,"Create beautiful visualizations from Swiss Open Data"))),o&&m().createElement("div",{className:e.headerActions},m().createElement(u.Button,{variant:"primary",icon:"save",onClick:()=>O(!0),disabled:!T.xAxis||!T.yAxis},"Save to Dashboard"))),I&&m().createElement(u.Alert,{title:"Error",severity:"error",onRemove:()=>k(null)},I),m().createElement("div",{className:e.mainContent},m().createElement("aside",{className:e.leftPanel},m().createElement("div",{className:e.panelHeader},m().createElement(u.Icon,{name:"database"}),m().createElement("span",null,"Datasets")),m().createElement("div",{className:e.searchBox},m().createElement(u.Input,{prefix:m().createElement(u.Icon,{name:"search"}),placeholder:"Search datasets...",value:t,onChange:e=>a(e.currentTarget.value)})),m().createElement("div",{className:e.datasetList},l?m().createElement("div",{className:e.loadingState},m().createElement(u.Spinner,null),m().createElement("span",null,"Loading datasets...")):0===n.length?m().createElement("div",{className:e.emptyState},m().createElement(u.Icon,{name:"info-circle"}),m().createElement("span",null,"No datasets found")):n.map(t=>m().createElement("div",{key:t.uri,className:`${e.datasetItem} ${o?.uri===t.uri?e.datasetItemSelected:""}`,onClick:()=>D(t),role:"button",tabIndex:0},m().createElement("div",{className:e.datasetName},t.label),t.publisher&&m().createElement("div",{className:e.datasetMeta},t.publisher))))),m().createElement("main",{className:e.centerPanel},o?c||w?m().createElement("div",{className:e.loadingState},m().createElement(u.Spinner,{size:"xl"}),m().createElement("span",null,"Loading data...")):m().createElement("div",{className:e.chartContainer},m().createElement("div",{className:e.chartHeader},m().createElement("h2",null,T.title||o.label),m().createElement("div",{className:e.chartMeta},x.length," rows | ",L.length," columns")),m().createElement("div",{className:e.chartPreview},m().createElement($,{data:x,config:T,dimensions:o.dimensions,measures:o.measures}))):m().createElement("div",{className:e.placeholder},m().createElement(u.Icon,{name:"arrow-left",size:"xxxl",className:e.placeholderIcon}),m().createElement("h2",null,"Select a Dataset"),m().createElement("p",null,"Choose a dataset from the left panel to start creating your chart"))),o&&m().createElement("aside",{className:e.rightPanel},m().createElement("div",{className:e.panelHeader},m().createElement(u.Icon,{name:"cog"}),m().createElement("span",null,"Configure")),m().createElement("div",{className:e.configSection},m().createElement("label",{className:e.configLabel},"Chart Type"),m().createElement("div",{className:e.chartTypeGrid},g.map(t=>m().createElement(u.Tooltip,{key:t.id,content:t.description},m().createElement("button",{className:`${e.chartTypeButton} ${T.chartType===t.id?e.chartTypeButtonActive:""}`,onClick:()=>j({chartType:t.id})},m().createElement(u.Icon,{name:t.icon,size:"lg"}),m().createElement("span",null,t.label)))))),m().createElement("div",{className:e.configSection},m().createElement("label",{className:e.configLabel},"pie"===T.chartType?"Categories":"X-Axis"),m().createElement(u.Select,{options:F,value:F.find(e=>e.value===T.xAxis),onChange:e=>j({xAxis:e.value}),placeholder:"Select dimension..."})),m().createElement("div",{className:e.configSection},m().createElement("label",{className:e.configLabel},"pie"===T.chartType?"Values":"Y-Axis"),m().createElement(u.Select,{options:G,value:G.find(e=>e.value===T.yAxis),onChange:e=>j({yAxis:e.value}),placeholder:"Select measure..."})),"pie"!==T.chartType&&"table"!==T.chartType&&m().createElement("div",{className:e.configSection},m().createElement("label",{className:e.configLabel},"Group By (optional)"),m().createElement(u.Select,{options:[{label:"None",value:""},...F],value:F.find(e=>e.value===T.groupBy)||{label:"None",value:""},onChange:e=>j({groupBy:e.value||void 0}),placeholder:"Select grouping...",isClearable:!0})),m().createElement("div",{className:e.configSection},m().createElement("label",{className:e.configLabel},"Title"),m().createElement(u.Input,{value:T.title||"",onChange:e=>j({title:e.currentTarget.value}),placeholder:"Chart title..."})),m().createElement("div",{className:e.configSection},m().createElement("div",{className:e.configRow},m().createElement("label",{className:e.configLabel},"Show Legend"),m().createElement(u.Switch,{value:T.showLegend,onChange:e=>j({showLegend:e.currentTarget.checked})}))))),m().createElement(u.Modal,{title:"Save to Dashboard",isOpen:R,onDismiss:()=>O(!1)},m().createElement("div",{className:e.modalContent},m().createElement("div",{className:e.configSection},m().createElement("label",{className:e.configLabel},"Dashboard Title"),m().createElement(u.Input,{value:P,onChange:e=>z(e.currentTarget.value),placeholder:`${o?.label||"Chart"} Dashboard`})),m().createElement("div",{className:e.modalActions},m().createElement(u.Button,{variant:"secondary",onClick:()=>O(!1)},"Cancel"),m().createElement(u.Button,{variant:"primary",onClick:W,disabled:M},M?m().createElement(u.Spinner,{inline:!0,size:"sm"}):m().createElement(u.Icon,{name:"save"}),M?"Saving...":"Create Dashboard")))))});return i}()});