define(["@grafana/data","react","@emotion/css","@grafana/ui","@grafana/runtime"],function(e,t,a,n,l){return function(){"use strict";var s={7:function(e){e.exports=n},89:function(e){e.exports=a},531:function(e){e.exports=l},781:function(t){t.exports=e},959:function(e){e.exports=t}},r={};function i(e){var t=r[e];if(void 0!==t)return t.exports;var a=r[e]={exports:{}};return s[e](a,a.exports,i),a.exports}i.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return i.d(t,{a:t}),t},i.d=function(e,t){for(var a in t)i.o(t,a)&&!i.o(e,a)&&Object.defineProperty(e,a,{enumerable:!0,get:t[a]})},i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},i.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var o={};i.r(o),i.d(o,{plugin:function(){return D}});var c=i(781),d=i(959),u=i.n(d),m=i(89),p=i(7);const g="\nPREFIX cube: <https://cube.link/>\nPREFIX schema: <http://schema.org/>\nPREFIX sh: <http://www.w3.org/ns/shacl#>\nPREFIX qudt: <http://qudt.org/schema/qudt/>\nPREFIX cubeMeta: <https://cube.link/meta/>\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nPREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\nPREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\nPREFIX dcterms: <http://purl.org/dc/terms/>\n",h={de:["de","en","fr","it"],fr:["fr","de","en","it"],it:["it","de","fr","en"],en:["en","de","fr","it"]},b={"http://www.w3.org/2001/XMLSchema#integer":c.FieldType.number,"http://www.w3.org/2001/XMLSchema#int":c.FieldType.number,"http://www.w3.org/2001/XMLSchema#long":c.FieldType.number,"http://www.w3.org/2001/XMLSchema#short":c.FieldType.number,"http://www.w3.org/2001/XMLSchema#byte":c.FieldType.number,"http://www.w3.org/2001/XMLSchema#decimal":c.FieldType.number,"http://www.w3.org/2001/XMLSchema#float":c.FieldType.number,"http://www.w3.org/2001/XMLSchema#double":c.FieldType.number,"http://www.w3.org/2001/XMLSchema#nonNegativeInteger":c.FieldType.number,"http://www.w3.org/2001/XMLSchema#positiveInteger":c.FieldType.number,"http://www.w3.org/2001/XMLSchema#negativeInteger":c.FieldType.number,"http://www.w3.org/2001/XMLSchema#nonPositiveInteger":c.FieldType.number,"http://www.w3.org/2001/XMLSchema#unsignedLong":c.FieldType.number,"http://www.w3.org/2001/XMLSchema#unsignedInt":c.FieldType.number,"http://www.w3.org/2001/XMLSchema#unsignedShort":c.FieldType.number,"http://www.w3.org/2001/XMLSchema#unsignedByte":c.FieldType.number,"http://www.w3.org/2001/XMLSchema#dateTime":c.FieldType.time,"http://www.w3.org/2001/XMLSchema#date":c.FieldType.time,"http://www.w3.org/2001/XMLSchema#time":c.FieldType.time,"http://www.w3.org/2001/XMLSchema#gYear":c.FieldType.time,"http://www.w3.org/2001/XMLSchema#gYearMonth":c.FieldType.time,"http://www.w3.org/2001/XMLSchema#boolean":c.FieldType.boolean,"http://www.w3.org/2001/XMLSchema#string":c.FieldType.string};async function f(e){try{const t=await fetch("https://lindas.admin.ch/query",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Accept:"application/sparql-results+json"},body:`query=${encodeURIComponent(e)}`});if(!t.ok){const e=await t.text();throw new Error(`SPARQL query failed: ${t.status} ${t.statusText} - ${e.slice(0,200)}`)}return await t.json()}catch(e){throw console.error("SPARQL query failed:",e),new Error(`SPARQL query failed: ${e.message||"Unknown error"}`)}}function y(e){if("uri"===e.type)return c.FieldType.string;if(e.datatype){const t=b[e.datatype];if(t)return t}const t=e.value;return/^-?\d+(\.\d+)?$/.test(t)?c.FieldType.number:/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(t)||/^\d{4}$/.test(t)?c.FieldType.time:c.FieldType.string}const w="/a/lindas-visualizer-app",v={columns:"barchart",bars:"barchart",lines:"timeseries",table:"table",stat:"stat",pie:"piechart",map:"geomap"},E=[{value:"columns",label:"Columns",icon:"graph-bar"},{value:"bars",label:"Bars",icon:"bars"},{value:"lines",label:"Lines",icon:"gf-interpolation-linear"},{value:"table",label:"Table",icon:"table"},{value:"stat",label:"Stats",icon:"calculator-alt"},{value:"pie",label:"Pie",icon:"grafana"}],x=[{value:"de",label:"DE",description:"Deutsch"},{value:"fr",label:"FR",description:"Francais"},{value:"it",label:"IT",description:"Italiano"},{value:"en",label:"EN",description:"English"}],$=[{value:50,label:"50 rows"},{value:100,label:"100 rows"},{value:500,label:"500 rows"},{value:1e3,label:"1,000 rows"},{value:5e3,label:"5,000 rows"}],S=()=>{const e=(0,p.useStyles2)(L),[t,a]=(0,d.useState)("de"),[n,l]=(0,d.useState)(""),[s,r]=(0,d.useState)([]),[i,o]=(0,d.useState)(!0),[c,m]=(0,d.useState)(null);(0,d.useEffect)(()=>{let e=!1;const a=setTimeout(async()=>{o(!0),m(null);try{const a=await async function(e,t){const a=t?`FILTER(CONTAINS(LCASE(?label), LCASE("${t.replace(/"/g,'\\"')}")))`:"",n=`${g}\nSELECT DISTINCT ?cube ?label WHERE {\n  ?cube a cube:Cube .\n  ?cube schema:workExample <https://ld.admin.ch/application/visualize> .\n  ?cube schema:creativeWorkStatus <https://ld.admin.ch/vocabulary/CreativeWorkStatus/Published> .\n  FILTER NOT EXISTS { ?cube schema:expires ?expires }\n\n  # Get label - try selected language first, then any language\n  OPTIONAL { ?cube schema:name ?labelLang . FILTER(LANG(?labelLang) = "${e}") }\n  OPTIONAL { ?cube schema:name ?labelAny }\n  BIND(COALESCE(?labelLang, ?labelAny, STR(?cube)) AS ?label)\n\n  ${a}\n}\nORDER BY ?label\nLIMIT 100`;return(await f(n)).results.bindings.map(e=>({uri:e.cube?.value||"",label:e.label?.value||"Unknown"}))}(t,n);e||r(a)}catch(t){e||(console.error("Failed to load datasets:",t),m(t.message||"Failed to load datasets"))}finally{e||o(!1)}},300);return()=>{e=!0,clearTimeout(a)}},[n,t]);const h=(0,d.useCallback)(e=>{const t=encodeURIComponent(e.uri);window.location.hash=`#/builder/${t}`},[]),b=x.map(e=>({label:e.label,value:e.value,description:e.description}));return u().createElement("div",{className:e.container},u().createElement("div",{className:e.header},u().createElement("div",null,u().createElement("h1",{className:e.title},"Swiss Open Data"),u().createElement("p",{className:e.subtitle},"Browse and visualize datasets from LINDAS")),u().createElement("div",{className:e.headerActions},u().createElement("div",{className:e.languageSelector},u().createElement("span",{className:e.languageLabel},"Language:"),u().createElement(p.RadioButtonGroup,{options:b,value:t,onChange:a,size:"sm"})),u().createElement(p.LinkButton,{href:"https://lindas.admin.ch",target:"_blank",variant:"secondary",icon:"external-link-alt"},"About LINDAS"))),u().createElement("div",{className:e.searchContainer},u().createElement(p.Input,{prefix:u().createElement(p.Icon,{name:"search"}),placeholder:"Search datasets by name, description, or publisher...",value:n,onChange:e=>l(e.currentTarget.value),className:e.searchInput})),c&&u().createElement(p.Alert,{title:"Error loading datasets",severity:"error",onRemove:()=>m(null)},c),i?u().createElement("div",{className:e.loadingContainer},u().createElement(p.Spinner,{size:"xl"}),u().createElement("p",null,"Loading datasets from LINDAS...")):0===s.length?u().createElement("div",{className:e.emptyContainer},u().createElement(p.Icon,{name:"database",size:"xxxl",className:e.emptyIcon}),u().createElement("h2",null,"No datasets found"),u().createElement("p",null,"Try a different search term or change the language")):u().createElement(u().Fragment,null,u().createElement("div",{className:e.resultsCount},s.length," dataset",1!==s.length?"s":""," found"),u().createElement("div",{className:e.grid},s.map(t=>u().createElement(p.Card,{key:t.uri,className:e.card,onClick:()=>h(t)},u().createElement(p.Card.Heading,null,t.label),u().createElement(p.Card.Actions,null,u().createElement(p.Button,{size:"sm",icon:"chart-line",onClick:e=>{e.stopPropagation(),h(t)}},"Visualize")))))))},L=e=>({container:m.css`
    padding: ${e.spacing(3)};
    max-width: 1400px;
    margin: 0 auto;
  `,header:m.css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: ${e.spacing(3)};
    flex-wrap: wrap;
    gap: ${e.spacing(2)};
  `,headerActions:m.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(2)};
    flex-wrap: wrap;
  `,languageSelector:m.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
  `,languageLabel:m.css`
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
  `,title:m.css`
    margin: 0;
    font-size: ${e.typography.h2.fontSize};
  `,subtitle:m.css`
    margin: ${e.spacing(.5)} 0 0 0;
    color: ${e.colors.text.secondary};
  `,searchContainer:m.css`
    margin-bottom: ${e.spacing(3)};
  `,searchInput:m.css`
    max-width: 600px;
  `,resultsCount:m.css`
    margin-bottom: ${e.spacing(2)};
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
  `,grid:m.css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: ${e.spacing(2)};
  `,card:m.css`
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: ${e.shadows.z3};
    }
  `,publisher:m.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(.5)};
    color: ${e.colors.text.secondary};
  `,description:m.css`
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
  `,loadingContainer:m.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: ${e.spacing(8)};
    color: ${e.colors.text.secondary};
    gap: ${e.spacing(2)};
  `,emptyContainer:m.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: ${e.spacing(8)};
    color: ${e.colors.text.secondary};
    text-align: center;

    h2 {
      margin: ${e.spacing(2)} 0 ${e.spacing(1)} 0;
    }

    p {
      margin: 0;
    }
  `,emptyIcon:m.css`
    color: ${e.colors.text.disabled};
  `});var T=i(531);const N=({data:e})=>{const t=(0,p.useStyles2)(z);if(0===e.length)return u().createElement(F,null);const a=e.slice(0,25),n=Math.max(...a.map(e=>e.value),1);return u().createElement("div",{className:t.barChart},a.map((e,a)=>u().createElement("div",{key:a,className:t.barRow},u().createElement("div",{className:t.barLabel,title:e.label},e.label.length>30?e.label.slice(0,30)+"...":e.label),u().createElement("div",{className:t.barContainer},u().createElement("div",{className:t.bar,style:{width:e.value/n*100+"%"}})),u().createElement("div",{className:t.barValue},e.value.toLocaleString()))),e.length>25&&u().createElement("div",{className:t.moreRows},"+",e.length-25," more rows"))},C=({data:e})=>{const t=(0,p.useStyles2)(z);if(0===e.length)return u().createElement(F,null);const a=e.slice(0,10),n=a.reduce((e,t)=>e+t.value,0),l=["#7EB26D","#EAB839","#6ED0E0","#EF843C","#E24D42","#1F78C1","#BA43A9","#705DA0","#508642","#CCA300"];let s=0;const r=a.map((e,t)=>{const a=e.value/n*100,r=s;return s+=a,{...e,percent:a,start:r,end:s,color:l[t%l.length]}});return u().createElement("div",{className:t.pieChart},u().createElement("svg",{viewBox:"0 0 100 100",className:t.pieSvg},r.map((e,t)=>{const a=e.start/100*360-90,n=e.end/100*360-90,l=e.percent>50?1:0,s=`M 50 50 L ${50+40*Math.cos(a*Math.PI/180)} ${50+40*Math.sin(a*Math.PI/180)} A 40 40 0 ${l} 1 ${50+40*Math.cos(n*Math.PI/180)} ${50+40*Math.sin(n*Math.PI/180)} Z`;return u().createElement("path",{key:t,d:s,fill:e.color})})),u().createElement("div",{className:t.pieLegend},r.map((e,a)=>u().createElement("div",{key:a,className:t.legendItem},u().createElement("span",{className:t.legendColor,style:{backgroundColor:e.color}}),u().createElement("span",{className:t.legendLabel},e.label.length>25?e.label.slice(0,25)+"...":e.label),u().createElement("span",{className:t.legendValue},e.percent.toFixed(1),"%")))))},I=({frame:e})=>{const t=(0,p.useStyles2)(z);if(0===e.fields.length)return u().createElement(F,null);const a=Math.min(e.length,100);return u().createElement("div",{className:t.tableContainer},u().createElement("table",{className:t.table},u().createElement("thead",null,u().createElement("tr",null,e.fields.map((e,t)=>u().createElement("th",{key:t},e.name)))),u().createElement("tbody",null,Array.from({length:a},(t,a)=>u().createElement("tr",{key:a},e.fields.map((e,t)=>u().createElement("td",{key:t},function(e,t){if(null==e)return"-";switch(t){case c.FieldType.number:return"number"==typeof e?e.toLocaleString():String(e);case c.FieldType.time:return new Date(e).toLocaleDateString();default:return String(e)}}(e.values[a],e.type))))))),e.length>100&&u().createElement("div",{className:t.moreRows},"Showing 100 of ",e.length," rows"))},A=({data:e})=>{const t=(0,p.useStyles2)(z);if(0===e.length)return u().createElement(F,null);const a=e.reduce((e,t)=>e+t.value,0),n=e.length,l=a/n;return u().createElement("div",{className:t.statContainer},u().createElement("div",{className:t.statCard},u().createElement("div",{className:t.statValue},a.toLocaleString()),u().createElement("div",{className:t.statLabel},"Total")),u().createElement("div",{className:t.statCard},u().createElement("div",{className:t.statValue},n.toLocaleString()),u().createElement("div",{className:t.statLabel},"Count")),u().createElement("div",{className:t.statCard},u().createElement("div",{className:t.statValue},l.toLocaleString(void 0,{maximumFractionDigits:2})),u().createElement("div",{className:t.statLabel},"Average")))},F=()=>{const e=(0,p.useStyles2)(z);return u().createElement("div",{className:e.noData},u().createElement(p.Icon,{name:"exclamation-triangle",size:"xl"}),u().createElement("p",null,"No data available"))},R=({data:e,chartType:t,loading:a=!1,error:n=null,title:l})=>{const s=(0,p.useStyles2)(z),r=(0,d.useMemo)(()=>e?function(e){if(e.fields.length<2)return[];const t=e.fields.find(e=>e.type===c.FieldType.string),a=e.fields.find(e=>e.type===c.FieldType.number);if(!t||!a){const t=e.fields[0]?.values||[],a=e.fields[1]?.values||[],n=new Map;for(let e=0;e<Math.min(t.length,a.length);e++){const l=String(t[e]||"Unknown"),s=Number(a[e])||0;n.set(l,(n.get(l)||0)+s)}return Array.from(n.entries()).map(([e,t])=>({label:e,value:t}))}const n=t.values,l=a.values,s=new Map;for(let e=0;e<Math.min(n.length,l.length);e++){const t=String(n[e]||"Unknown"),a=Number(l[e])||0;s.set(t,(s.get(t)||0)+a)}return Array.from(s.entries()).map(([e,t])=>({label:e,value:t})).sort((e,t)=>t.value-e.value)}(e):[],[e]);return a?u().createElement("div",{className:s.loading},u().createElement(p.Spinner,{size:"xl"}),u().createElement("p",null,"Loading data...")):n?u().createElement("div",{className:s.error},u().createElement(p.Icon,{name:"exclamation-circle",size:"xl"}),u().createElement("p",null,n)):e&&0!==e.length?u().createElement("div",{className:s.container},l&&u().createElement("h3",{className:s.title},l),u().createElement("div",{className:s.chartArea},"bar"===t&&u().createElement(N,{data:r}),"line"===t&&u().createElement(N,{data:r}),"pie"===t&&u().createElement(C,{data:r}),"table"===t&&u().createElement(I,{frame:e}),"stat"===t&&u().createElement(A,{data:r}))):u().createElement(F,null)},z=e=>({container:m.css`
    width: 100%;
    height: 100%;
    min-height: 300px;
    display: flex;
    flex-direction: column;
  `,title:m.css`
    margin: 0 0 ${e.spacing(2)} 0;
    font-size: ${e.typography.h5.fontSize};
    font-weight: ${e.typography.fontWeightMedium};
  `,chartArea:m.css`
    flex: 1;
    overflow: auto;
  `,loading:m.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 300px;
    color: ${e.colors.text.secondary};
    gap: ${e.spacing(2)};
  `,error:m.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 300px;
    color: ${e.colors.error.text};
    gap: ${e.spacing(2)};
  `,noData:m.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 300px;
    color: ${e.colors.text.secondary};
    gap: ${e.spacing(1)};
  `,barChart:m.css`
    display: flex;
    flex-direction: column;
    gap: ${e.spacing(.5)};
  `,barRow:m.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
  `,barLabel:m.css`
    width: 180px;
    flex-shrink: 0;
    text-align: right;
    font-size: ${e.typography.size.sm};
    color: ${e.colors.text.primary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,barContainer:m.css`
    flex: 1;
    height: 24px;
    background: ${e.colors.background.secondary};
    border-radius: ${e.shape.borderRadius()};
    overflow: hidden;
  `,bar:m.css`
    height: 100%;
    background: ${e.colors.primary.main};
    border-radius: ${e.shape.borderRadius()};
    transition: width 0.3s ease;
  `,barValue:m.css`
    width: 80px;
    flex-shrink: 0;
    font-size: ${e.typography.size.sm};
    color: ${e.colors.text.secondary};
  `,moreRows:m.css`
    text-align: center;
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
    padding: ${e.spacing(1)};
  `,pieChart:m.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(4)};

    @media (max-width: 600px) {
      flex-direction: column;
    }
  `,pieSvg:m.css`
    width: 200px;
    height: 200px;
    flex-shrink: 0;
  `,pieLegend:m.css`
    display: flex;
    flex-direction: column;
    gap: ${e.spacing(.5)};
  `,legendItem:m.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
    font-size: ${e.typography.size.sm};
  `,legendColor:m.css`
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
  `,legendLabel:m.css`
    flex: 1;
    color: ${e.colors.text.primary};
  `,legendValue:m.css`
    color: ${e.colors.text.secondary};
  `,tableContainer:m.css`
    overflow: auto;
    max-height: 400px;
  `,table:m.css`
    width: 100%;
    border-collapse: collapse;
    font-size: ${e.typography.size.sm};

    th, td {
      padding: ${e.spacing(1)} ${e.spacing(2)};
      text-align: left;
      border-bottom: 1px solid ${e.colors.border.weak};
    }

    th {
      background: ${e.colors.background.secondary};
      font-weight: ${e.typography.fontWeightMedium};
      position: sticky;
      top: 0;
    }

    tr:hover td {
      background: ${e.colors.action.hover};
    }
  `,statContainer:m.css`
    display: flex;
    gap: ${e.spacing(3)};
    justify-content: center;
    flex-wrap: wrap;
  `,statCard:m.css`
    text-align: center;
    padding: ${e.spacing(3)};
    background: ${e.colors.background.secondary};
    border-radius: ${e.shape.borderRadius()};
    min-width: 120px;
  `,statValue:m.css`
    font-size: ${e.typography.h2.fontSize};
    font-weight: ${e.typography.fontWeightBold};
    color: ${e.colors.text.primary};
  `,statLabel:m.css`
    font-size: ${e.typography.size.sm};
    color: ${e.colors.text.secondary};
    margin-top: ${e.spacing(.5)};
  `}),O=({cubeUri:e})=>{const t=(0,p.useStyles2)(k),[a,n]=(0,d.useState)("de"),[l,s]=(0,d.useState)("columns"),[r,i]=(0,d.useState)(null),[o,m]=(0,d.useState)(null),[b,S]=(0,d.useState)(null),[L,N]=(0,d.useState)({}),[C,I]=(0,d.useState)(100),[A,F]=(0,d.useState)(null),[z,O]=(0,d.useState)(!0),[P,D]=(0,d.useState)(null),[B,X]=(0,d.useState)(null),[U,j]=(0,d.useState)(!1),[G,_]=(0,d.useState)(null);(0,d.useEffect)(()=>{if(!e)return D("No dataset selected"),void O(!1);let t=!1;return O(!0),D(null),async function(e,t){const a=h[t],n=`${g}\nSELECT DISTINCT\n  ?cubeLabel\n  ?dimension\n  ?dimLabel\n  ?unit\n  ?dataKind\n  ?scaleType\n  ?order\nWHERE {\n  <${e}> schema:name ?cubeLabelRaw .\n  FILTER(LANG(?cubeLabelRaw) = "${a[0]}" || LANG(?cubeLabelRaw) = "${a[1]}" || LANG(?cubeLabelRaw) = "")\n  BIND(STR(?cubeLabelRaw) AS ?cubeLabel)\n\n  <${e}> cube:observationConstraint ?shape .\n  ?shape sh:property ?prop .\n  ?prop sh:path ?dimension .\n\n  # Exclude internal properties\n  FILTER(?dimension != rdf:type && ?dimension != cube:observedBy)\n\n  # Dimension label\n  OPTIONAL { ?prop schema:name ?dimLabel0 . FILTER(LANG(?dimLabel0) = "${a[0]}") }\n  OPTIONAL { ?prop schema:name ?dimLabel1 . FILTER(LANG(?dimLabel1) = "${a[1]}") }\n  OPTIONAL { ?prop schema:name ?dimLabel2 . FILTER(LANG(?dimLabel2) = "${a[2]}") }\n  OPTIONAL { ?prop rdfs:label ?dimLabelRdfs }\n  BIND(COALESCE(?dimLabel0, ?dimLabel1, ?dimLabel2, ?dimLabelRdfs,\n    STRAFTER(STR(?dimension), "#"),\n    REPLACE(STR(?dimension), "^.*/", "")) AS ?dimLabel)\n\n  # Unit (indicates a measure)\n  OPTIONAL { ?prop qudt:unit ?unitIri . BIND(STRAFTER(STR(?unitIri), "unit/") AS ?unit) }\n  OPTIONAL { ?prop qudt:hasUnit ?hasUnitIri . BIND(STRAFTER(STR(?hasUnitIri), "unit/") AS ?unit) }\n  OPTIONAL { ?prop schema:unitCode ?unitCode . BIND(?unitCode AS ?unit) }\n\n  # Data kind (Temporal, GeoShape, etc.)\n  OPTIONAL {\n    ?prop cubeMeta:dataKind/a ?dataKindType .\n    BIND(STRAFTER(STR(?dataKindType), "cube.link/") AS ?dataKind)\n  }\n\n  # Scale type\n  OPTIONAL {\n    ?prop qudt:scaleType ?scaleTypeIri .\n    BIND(STRAFTER(STR(?scaleTypeIri), "scales/") AS ?scaleType)\n  }\n\n  # Order\n  OPTIONAL { ?prop sh:order ?order }\n}\nORDER BY ?order ?dimLabel`,l=await f(n);if(0===l.results.bindings.length)throw new Error(`Cube not found or has no properties: ${e}`);const s=l.results.bindings[0]?.cubeLabel?.value||e,r=[],i=[],o=new Set;for(const e of l.results.bindings){const t=e.dimension?.value;if(!t||o.has(t))continue;o.add(t);const a=e.dimLabel?.value||t.split(/[/#]/).pop()||t,n=e.unit?.value,l=e.dataKind?.value,s=e.scaleType?.value,c=e.order?.value?parseInt(e.order.value,10):void 0;n?i.push({uri:t,label:a,unit:n}):r.push({uri:t,label:a,dataKind:l,scaleType:s,order:c})}return{uri:e,label:s,dimensions:r,measures:i}}(e,a).then(e=>{t||(F(e),!r&&e.dimensions.length>0&&i(e.dimensions[0].uri),!o&&e.measures.length>0&&m(e.measures[0].uri))}).catch(e=>{t||(console.error("Failed to load metadata:",e),D(e.message||"Failed to load dataset"))}).finally(()=>{t||O(!1)}),()=>{t=!0}},[e,a]),(0,d.useEffect)(()=>{if(!A||!r&&!o)return void X(null);const t={cubeUri:e,xAxis:r,yAxis:o,groupBy:b,filters:L,limit:C};let n=!1;j(!0),_(null);const l=setTimeout(()=>{(async function(e,t,a){const{cubeUri:n,xAxis:l,yAxis:s,groupBy:r,filters:i,limit:o}=e,d=h[a];if(!l&&!s)return new c.MutableDataFrame({name:"Empty",fields:[]});const u=[],m=[],p={};m.push(`<${n}> cube:observationSet/cube:observation ?obs .`);const b=(e,a,n)=>{if(u.push(`?${a}`),n){m.push(`OPTIONAL { ?obs <${e}> ?${a} . }`);const n=t.measures.find(t=>t.uri===e);p[a]=n?.label||a}else{m.push(`OPTIONAL { ?obs <${e}> ?${a}_raw . }`),m.push(`OPTIONAL { ?${a}_raw schema:name ?${a}_l0 . FILTER(LANG(?${a}_l0) = "${d[0]}") }`),m.push(`OPTIONAL { ?${a}_raw schema:name ?${a}_l1 . FILTER(LANG(?${a}_l1) = "${d[1]}") }`),m.push(`BIND(COALESCE(?${a}_l0, ?${a}_l1, STR(?${a}_raw)) AS ?${a})`);const n=t.dimensions.find(t=>t.uri===e);p[a]=n?.label||a}},w=e=>t.measures.some(t=>t.uri===e);l&&b(l,"x",w(l)),s&&b(s,"y",w(s)),r&&r!==l&&b(r,"group",w(r));for(const[e,t]of Object.entries(i))if(t.length>0){const a=t.map(e=>`<${e}>`).join(", ");m.push(`?obs <${e}> ?filterVal_${m.length} .`),m.push(`FILTER(?filterVal_${m.length} IN (${a}))`)}const v=`${g}\nSELECT ${u.join(" ")} WHERE {\n  ${m.join("\n  ")}\n}\nLIMIT ${o}`;return function(e,t){const{head:a,results:n}=e,l=n.bindings;if(0===l.length)return new c.MutableDataFrame({name:t?.name||"SPARQL Result",fields:a.vars.map(e=>({name:t?.fieldLabels?.[e]||e,type:c.FieldType.string,values:[]}))});const s={},r=Math.min(10,l.length);for(const e of a.vars){let t=c.FieldType.string;for(let a=0;a<r;a++){const n=l[a][e];if(n&&(t=y(n),t!==c.FieldType.string))break}s[e]=t}const i=a.vars.map(e=>({name:t?.fieldLabels?.[e]||e,type:s[e],values:l.map(t=>function(e,t){if(!e)return null;const a=e.value;switch(t){case c.FieldType.number:const e=parseFloat(a);return isNaN(e)?null:e;case c.FieldType.time:if(/^\d{4}$/.test(a))return new Date(`${a}-01-01T00:00:00Z`).getTime();if(/^\d{4}-\d{2}-\d{2}$/.test(a))return new Date(`${a}T00:00:00Z`).getTime();const t=new Date(a);return isNaN(t.getTime())?null:t.getTime();case c.FieldType.boolean:return"true"===a||"1"===a;default:return a}}(t[e],s[e])),config:{}}));return{name:t?.name||"SPARQL Result",length:l.length,fields:i}}(await f(v),{name:t.label,fieldLabels:p})})(t,A,a).then(e=>{n||X(e)}).catch(e=>{n||(console.error("Failed to fetch data:",e),_(e.message||"Failed to load data"))}).finally(()=>{n||j(!1)})},300);return()=>{n=!0,clearTimeout(l)}},[e,r,o,b,L,C,A,a]);const V=(0,d.useMemo)(()=>A?[{label:"-- None --",value:""},...A.dimensions.map(e=>({label:e.label,value:e.uri,description:"Temporal"===e.dataKind?"Time dimension":void 0}))]:[],[A]),q=(0,d.useMemo)(()=>A?[{label:"-- None --",value:""},...A.measures.map(e=>({label:e.unit?`${e.label} (${e.unit})`:e.label,value:e.uri}))]:[],[A]),W=E.map(e=>({label:e.label,value:e.value,icon:e.icon})),H=x.map(e=>({label:e.label,value:e.value,description:e.description})),K=$.map(e=>({label:e.label,value:e.value})),Y=(0,d.useCallback)(()=>{T.locationService.push(w)},[]),Q=(0,d.useCallback)(async()=>{if(!A)return;const t=v[l]||"table",a={uid:`lindas-${Date.now().toString(36)}`,title:A.label,tags:["lindas","swiss-open-data"],editable:!0,panels:[{id:1,type:t,title:A.label,gridPos:{x:0,y:0,w:24,h:14},datasource:{type:"lindas-datasource",uid:"lindas-datasource"},targets:[{refId:"A",cubeUri:e,xAxis:r,yAxis:o,groupBy:b,limit:C}],options:"bars"===l?{orientation:"horizontal"}:{}}]};try{const e=await(0,T.getBackendSrv)().post("/api/dashboards/db",{dashboard:a,folderUid:"",overwrite:!1});T.locationService.push(`/d/${e.uid}`)}catch(e){console.error("Failed to save dashboard:",e),D(`Failed to save: ${e.message}`)}},[A,l,e,r,o,b,C]),Z=(0,d.useCallback)(()=>{const t=new URLSearchParams;t.set("chart",l),r&&t.set("x",r),o&&t.set("y",o),b&&t.set("group",b),t.set("lang",a),t.set("limit",String(C));const n=encodeURIComponent(e),s=`${window.location.origin}${w}/builder/${n}?${t.toString()}`;navigator.clipboard.writeText(s)},[e,l,r,o,b,a,C]),J=(0,d.useCallback)((e,t)=>{N(a=>({...a,[e]:t}))},[]);if(z)return u().createElement("div",{className:t.loading},u().createElement(p.Spinner,{size:"xl"}),u().createElement("p",null,"Loading dataset structure..."));if(P&&!A)return u().createElement("div",{className:t.errorContainer},u().createElement(p.Alert,{title:"Error",severity:"error"},P,u().createElement("div",{style:{marginTop:16}},u().createElement(p.Button,{onClick:Y},"Back to Catalog"))));if(!A)return null;const ee="columns"===l||"bars"===l||"lines"===l?"bar":l;return u().createElement("div",{className:t.container},u().createElement("div",{className:t.header},u().createElement(p.Button,{variant:"secondary",icon:"arrow-left",onClick:Y,size:"sm"},"Back"),u().createElement("div",{className:t.titleSection},u().createElement("h1",{className:t.title},A.label),u().createElement("p",{className:t.subtitle},"Configure your visualization")),u().createElement("div",{className:t.headerActions},u().createElement(p.RadioButtonGroup,{options:H,value:a,onChange:n,size:"sm"}),u().createElement(p.Button,{variant:"secondary",icon:"link",onClick:Z,size:"sm"},"Copy Link"),u().createElement(p.Button,{variant:"primary",icon:"save",onClick:Q,disabled:!r&&!o},"Save as Dashboard"))),P&&u().createElement(p.Alert,{title:"Error",severity:"error",onRemove:()=>D(null)},P),u().createElement("div",{className:t.content},u().createElement("div",{className:t.sidebar},u().createElement(p.Card,{className:t.configCard},u().createElement(p.Card.Heading,null,"Chart Settings"),u().createElement("div",{className:t.configForm},u().createElement(p.Field,{label:"Chart Type"},u().createElement(p.RadioButtonGroup,{options:W,value:l,onChange:s,size:"md"})),u().createElement(p.Field,{label:"X Axis (Categories)",description:"What to show along the horizontal axis"},u().createElement(p.Select,{options:V,value:r||"",onChange:e=>i(e?.value||null),placeholder:"Select a dimension..."})),u().createElement(p.Field,{label:"Y Axis (Values)",description:"The numeric values to display"},u().createElement(p.Select,{options:q,value:o||"",onChange:e=>m(e?.value||null),placeholder:"Select a measure..."})),u().createElement(p.Field,{label:"Group By (Color)",description:"Split data into colored groups"},u().createElement(p.Select,{options:V,value:b||"",onChange:e=>S(e?.value||null),placeholder:"Optional grouping...",isClearable:!0})),u().createElement(p.Field,{label:"Data Limit"},u().createElement(p.Select,{options:K,value:C,onChange:e=>I(e?.value||100)})))),u().createElement(p.Card,{className:t.configCard},u().createElement(p.Card.Heading,null,u().createElement(p.Icon,{name:"filter"})," Filters"),u().createElement("div",{className:t.configForm},A.dimensions.length>0?A.dimensions.slice(0,5).map(t=>u().createElement(M,{key:t.uri,dimension:t,cubeUri:e,language:a,selectedValues:L[t.uri]||[],onChangeValues:e=>J(t.uri,e)})):u().createElement("p",{className:t.noFilters},"No dimensions available")))),u().createElement("div",{className:t.canvas},u().createElement(p.Card,{className:t.vizCard},u().createElement(p.Card.Heading,null,u().createElement("div",{className:t.vizHeader},u().createElement("span",null,"Preview"),U&&u().createElement(p.Spinner,{inline:!0,size:"sm"}))),u().createElement("div",{className:t.vizContent},r||o?u().createElement(R,{data:B,chartType:ee,loading:U,error:G}):u().createElement("div",{className:t.placeholder},u().createElement(p.Icon,{name:"chart-line",size:"xxxl"}),u().createElement("h3",null,"Select dimensions to visualize"),u().createElement("p",null,"Choose an X axis and Y axis from the settings panel"))),B&&B.length>0&&u().createElement("div",{className:t.dataInfo},u().createElement(p.Icon,{name:"info-circle",size:"sm"}),u().createElement("span",null,B.length," rows loaded"))))))};function M({dimension:e,cubeUri:t,language:a,selectedValues:n,onChangeValues:l}){const[s,r]=(0,d.useState)([]),[i,o]=(0,d.useState)(!1),[c,m]=(0,d.useState)(!1);(0,d.useEffect)(()=>{c&&0===s.length&&(o(!0),async function(e,t,a,n=100){const l=h[a],s=`${g}\nSELECT DISTINCT ?value ?label WHERE {\n  <${e}> cube:observationSet/cube:observation ?obs .\n  ?obs <${t}> ?value .\n\n  # Try to get label\n  OPTIONAL { ?value schema:name ?label0 . FILTER(LANG(?label0) = "${l[0]}") }\n  OPTIONAL { ?value schema:name ?label1 . FILTER(LANG(?label1) = "${l[1]}") }\n  OPTIONAL { ?value rdfs:label ?labelRdfs }\n  BIND(COALESCE(?label0, ?label1, ?labelRdfs, STR(?value)) AS ?label)\n}\nORDER BY ?label\nLIMIT ${n}`;return(await f(s)).results.bindings.map(e=>({value:e.value?.value||"",label:e.label?.value||e.value?.value||""}))}(t,e.uri,a).then(r).catch(e=>console.error("Failed to load dimension values:",e)).finally(()=>o(!1)))},[c,t,e.uri,a,s.length]);const b=s.map(e=>({label:e.label,value:e.value}));return u().createElement(p.Collapse,{label:e.label,isOpen:c,onToggle:()=>m(!c),collapsible:!0},i?u().createElement(p.Spinner,{size:"sm"}):u().createElement(p.Select,{options:b,value:n,onChange:e=>{Array.isArray(e)?l(e.map(e=>e.value||"").filter(Boolean)):l(e?.value?[e.value]:[])},placeholder:"Select values...",isMulti:!0,isClearable:!0}))}const k=e=>({container:m.css`
    padding: ${e.spacing(3)};
    max-width: 1800px;
    margin: 0 auto;
  `,header:m.css`
    display: flex;
    align-items: flex-start;
    gap: ${e.spacing(2)};
    margin-bottom: ${e.spacing(3)};
    flex-wrap: wrap;
  `,titleSection:m.css`
    flex: 1;
    min-width: 200px;
  `,title:m.css`
    margin: 0;
    font-size: ${e.typography.h3.fontSize};
  `,subtitle:m.css`
    margin: ${e.spacing(.5)} 0 0 0;
    color: ${e.colors.text.secondary};
  `,headerActions:m.css`
    display: flex;
    gap: ${e.spacing(1)};
    flex-wrap: wrap;
    align-items: center;
  `,content:m.css`
    display: grid;
    grid-template-columns: 360px 1fr;
    gap: ${e.spacing(3)};

    @media (max-width: 1200px) {
      grid-template-columns: 1fr;
    }
  `,sidebar:m.css`
    display: flex;
    flex-direction: column;
    gap: ${e.spacing(2)};
  `,canvas:m.css`
    min-height: 600px;
  `,configCard:m.css`
    height: fit-content;
  `,configForm:m.css`
    margin-top: ${e.spacing(2)};
    display: flex;
    flex-direction: column;
    gap: ${e.spacing(2)};
  `,vizCard:m.css`
    height: 100%;
    min-height: 600px;
    display: flex;
    flex-direction: column;
  `,vizHeader:m.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
  `,vizContent:m.css`
    flex: 1;
    min-height: 500px;
    padding: ${e.spacing(2)};
  `,placeholder:m.css`
    height: 100%;
    min-height: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: ${e.colors.text.secondary};

    svg {
      opacity: 0.3;
      margin-bottom: ${e.spacing(2)};
    }

    h3 {
      margin: 0 0 ${e.spacing(1)} 0;
      color: ${e.colors.text.primary};
    }

    p {
      margin: 0;
    }
  `,dataInfo:m.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
    padding: ${e.spacing(2)};
    border-top: 1px solid ${e.colors.border.weak};
  `,noFilters:m.css`
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
    font-style: italic;
  `,loading:m.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: ${e.spacing(8)};
    color: ${e.colors.text.secondary};
    gap: ${e.spacing(2)};
  `,errorContainer:m.css`
    padding: ${e.spacing(4)};
    max-width: 600px;
    margin: 0 auto;
  `});function P(){const e=window.location.hash;return e.startsWith("#/builder/")?{view:"builder",cubeUri:decodeURIComponent(e.slice(10))}:{view:"catalog",cubeUri:null}}const D=(new c.AppPlugin).setRootPage(()=>{const[e,t]=(0,d.useState)(P);return(0,d.useEffect)(()=>{const e=()=>{t(P())};return window.addEventListener("hashchange",e),()=>window.removeEventListener("hashchange",e)},[]),"builder"===e.view&&e.cubeUri?u().createElement(O,{cubeUri:e.cubeUri}):u().createElement(S,null)});return o}()});