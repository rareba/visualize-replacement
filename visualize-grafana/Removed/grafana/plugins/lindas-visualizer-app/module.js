define(["@grafana/data","react","@emotion/css","@grafana/ui","@grafana/runtime"],function(e,a,t,n,r){return function(){"use strict";var s={7:function(e){e.exports=n},89:function(e){e.exports=t},531:function(e){e.exports=r},781:function(a){a.exports=e},959:function(e){e.exports=a}},l={};function i(e){var a=l[e];if(void 0!==a)return a.exports;var t=l[e]={exports:{}};return s[e](t,t.exports,i),t.exports}i.n=function(e){var a=e&&e.__esModule?function(){return e.default}:function(){return e};return i.d(a,{a:a}),a},i.d=function(e,a){for(var t in a)i.o(a,t)&&!i.o(e,t)&&Object.defineProperty(e,t,{enumerable:!0,get:a[t]})},i.o=function(e,a){return Object.prototype.hasOwnProperty.call(e,a)},i.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var o={};i.r(o),i.d(o,{plugin:function(){return S}});var c=i(781),d=i(959),p=i.n(d),u=i(89),m=i(7);const g="\nPREFIX cube: <https://cube.link/>\nPREFIX schema: <http://schema.org/>\nPREFIX sh: <http://www.w3.org/ns/shacl#>\nPREFIX qudt: <http://qudt.org/schema/qudt/>\nPREFIX cubeMeta: <https://cube.link/meta/>\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nPREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\nPREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\nPREFIX dcterms: <http://purl.org/dc/terms/>\n",b={de:["de","en","fr","it"],fr:["fr","de","en","it"],it:["it","de","fr","en"],en:["en","de","fr","it"]};async function h(e){try{const a=await fetch("https://lindas.admin.ch/query",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Accept:"application/sparql-results+json"},body:`query=${encodeURIComponent(e)}`});if(!a.ok){const e=await a.text();throw new Error(`SPARQL query failed: ${a.status} ${a.statusText} - ${e.slice(0,200)}`)}return await a.json()}catch(e){throw console.error("SPARQL query failed:",e),new Error(`SPARQL query failed: ${e.message||"Unknown error"}`)}}c.FieldType.number,c.FieldType.number,c.FieldType.number,c.FieldType.number,c.FieldType.number,c.FieldType.number,c.FieldType.number,c.FieldType.number,c.FieldType.number,c.FieldType.number,c.FieldType.number,c.FieldType.number,c.FieldType.number,c.FieldType.number,c.FieldType.number,c.FieldType.number,c.FieldType.time,c.FieldType.time,c.FieldType.time,c.FieldType.time,c.FieldType.time,c.FieldType.boolean,c.FieldType.string;const y=[{value:"de",label:"DE",description:"Deutsch"},{value:"fr",label:"FR",description:"Francais"},{value:"it",label:"IT",description:"Italiano"},{value:"en",label:"EN",description:"English"}],f=()=>{const e=(0,m.useStyles2)(E),[a,t]=(0,d.useState)("de"),[n,r]=(0,d.useState)(""),[s,l]=(0,d.useState)([]),[i,o]=(0,d.useState)(!0),[c,u]=(0,d.useState)(null);(0,d.useEffect)(()=>{let e=!1;const t=setTimeout(async()=>{o(!0),u(null);try{const t=await async function(e,a){const t=a?`FILTER(CONTAINS(LCASE(?label), LCASE("${a.replace(/"/g,'\\"')}")))`:"",n=`${g}\nSELECT DISTINCT ?cube ?label WHERE {\n  ?cube a cube:Cube .\n  ?cube schema:workExample <https://ld.admin.ch/application/visualize> .\n  ?cube schema:creativeWorkStatus <https://ld.admin.ch/vocabulary/CreativeWorkStatus/Published> .\n  FILTER NOT EXISTS { ?cube schema:expires ?expires }\n\n  # Get label - try selected language first, then any language\n  OPTIONAL { ?cube schema:name ?labelLang . FILTER(LANG(?labelLang) = "${e}") }\n  OPTIONAL { ?cube schema:name ?labelAny }\n  BIND(COALESCE(?labelLang, ?labelAny, STR(?cube)) AS ?label)\n\n  ${t}\n}\nORDER BY ?label\nLIMIT 100`;return(await h(n)).results.bindings.map(e=>({uri:e.cube?.value||"",label:e.label?.value||"Unknown"}))}(a,n);e||l(t)}catch(a){e||(console.error("Failed to load datasets:",a),u(a.message||"Failed to load datasets"))}finally{e||o(!1)}},300);return()=>{e=!0,clearTimeout(t)}},[n,a]);const b=(0,d.useCallback)(e=>{const a=encodeURIComponent(e.uri);window.location.hash=`#/builder/${a}`},[]),f=y.map(e=>({label:e.label,value:e.value,description:e.description}));return p().createElement("div",{className:e.container},p().createElement("div",{className:e.header},p().createElement("div",null,p().createElement("h1",{className:e.title},"Swiss Open Data"),p().createElement("p",{className:e.subtitle},"Browse and visualize datasets from LINDAS")),p().createElement("div",{className:e.headerActions},p().createElement("div",{className:e.languageSelector},p().createElement("span",{className:e.languageLabel},"Language:"),p().createElement(m.RadioButtonGroup,{options:f,value:a,onChange:t,size:"sm"})),p().createElement(m.LinkButton,{href:"https://lindas.admin.ch",target:"_blank",variant:"secondary",icon:"external-link-alt"},"About LINDAS"))),p().createElement("div",{className:e.searchContainer},p().createElement(m.Input,{prefix:p().createElement(m.Icon,{name:"search"}),placeholder:"Search datasets by name, description, or publisher...",value:n,onChange:e=>r(e.currentTarget.value),className:e.searchInput})),c&&p().createElement(m.Alert,{title:"Error loading datasets",severity:"error",onRemove:()=>u(null)},c),i?p().createElement("div",{className:e.loadingContainer},p().createElement(m.Spinner,{size:"xl"}),p().createElement("p",null,"Loading datasets from LINDAS...")):0===s.length?p().createElement("div",{className:e.emptyContainer},p().createElement(m.Icon,{name:"database",size:"xxxl",className:e.emptyIcon}),p().createElement("h2",null,"No datasets found"),p().createElement("p",null,"Try a different search term or change the language")):p().createElement(p().Fragment,null,p().createElement("div",{className:e.resultsCount},s.length," dataset",1!==s.length?"s":""," found"),p().createElement("div",{className:e.grid},s.map(a=>p().createElement(m.Card,{key:a.uri,className:e.card,onClick:()=>b(a)},p().createElement(m.Card.Heading,null,a.label),p().createElement(m.Card.Actions,null,p().createElement(m.Button,{size:"sm",icon:"chart-line",onClick:e=>{e.stopPropagation(),b(a)}},"Visualize")))))))},E=e=>({container:u.css`
    padding: ${e.spacing(3)};
    max-width: 1400px;
    margin: 0 auto;
  `,header:u.css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: ${e.spacing(3)};
    flex-wrap: wrap;
    gap: ${e.spacing(2)};
  `,headerActions:u.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(2)};
    flex-wrap: wrap;
  `,languageSelector:u.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
  `,languageLabel:u.css`
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
  `,title:u.css`
    margin: 0;
    font-size: ${e.typography.h2.fontSize};
  `,subtitle:u.css`
    margin: ${e.spacing(.5)} 0 0 0;
    color: ${e.colors.text.secondary};
  `,searchContainer:u.css`
    margin-bottom: ${e.spacing(3)};
  `,searchInput:u.css`
    max-width: 600px;
  `,resultsCount:u.css`
    margin-bottom: ${e.spacing(2)};
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
  `,grid:u.css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: ${e.spacing(2)};
  `,card:u.css`
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: ${e.shadows.z3};
    }
  `,publisher:u.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(.5)};
    color: ${e.colors.text.secondary};
  `,description:u.css`
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
  `,loadingContainer:u.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: ${e.spacing(8)};
    color: ${e.colors.text.secondary};
    gap: ${e.spacing(2)};
  `,emptyContainer:u.css`
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
  `,emptyIcon:u.css`
    color: ${e.colors.text.disabled};
  `});var $=i(531);const v=[{id:"bar",label:"Bar Chart",description:"Compare values side by side",icon:"graph-bar",panelType:"barchart",panelOptions:{orientation:"horizontal"}},{id:"timeseries",label:"Line Chart",description:"Show trends over time",icon:"chart-line",panelType:"timeseries"},{id:"pie",label:"Pie Chart",description:"Show proportions of a whole",icon:"circle",panelType:"piechart"},{id:"stat",label:"Big Number",description:"Highlight a single value",icon:"calculator-alt",panelType:"stat"},{id:"table",label:"Data Table",description:"View all data in rows and columns",icon:"table",panelType:"table"},{id:"gauge",label:"Gauge",description:"Show progress toward a goal",icon:"dashboard",panelType:"gauge"}],T=({cubeUri:e})=>{const a=(0,m.useStyles2)(N),[t,n]=(0,d.useState)("de"),[r,s]=(0,d.useState)(null),[l,i]=(0,d.useState)(!0),[o,c]=(0,d.useState)(null),[u,f]=(0,d.useState)(!1),[E,T]=(0,d.useState)(null),[x,S]=(0,d.useState)(null),[L,C]=(0,d.useState)(null),[I,R]=(0,d.useState)("bar");(0,d.useEffect)(()=>{if(!e)return c("No dataset selected"),void i(!1);let a=!1;return i(!0),c(null),async function(e,a){const t=b[a],n=`${g}\nSELECT DISTINCT\n  ?cubeLabel\n  ?dimension\n  ?dimLabel\n  ?unit\n  ?dataKind\n  ?scaleType\n  ?order\nWHERE {\n  <${e}> schema:name ?cubeLabelRaw .\n  FILTER(LANG(?cubeLabelRaw) = "${t[0]}" || LANG(?cubeLabelRaw) = "${t[1]}" || LANG(?cubeLabelRaw) = "")\n  BIND(STR(?cubeLabelRaw) AS ?cubeLabel)\n\n  <${e}> cube:observationConstraint ?shape .\n  ?shape sh:property ?prop .\n  ?prop sh:path ?dimension .\n\n  # Exclude internal properties\n  FILTER(?dimension != rdf:type && ?dimension != cube:observedBy)\n\n  # Dimension label\n  OPTIONAL { ?prop schema:name ?dimLabel0 . FILTER(LANG(?dimLabel0) = "${t[0]}") }\n  OPTIONAL { ?prop schema:name ?dimLabel1 . FILTER(LANG(?dimLabel1) = "${t[1]}") }\n  OPTIONAL { ?prop schema:name ?dimLabel2 . FILTER(LANG(?dimLabel2) = "${t[2]}") }\n  OPTIONAL { ?prop rdfs:label ?dimLabelRdfs }\n  BIND(COALESCE(?dimLabel0, ?dimLabel1, ?dimLabel2, ?dimLabelRdfs,\n    STRAFTER(STR(?dimension), "#"),\n    REPLACE(STR(?dimension), "^.*/", "")) AS ?dimLabel)\n\n  # Unit (indicates a measure)\n  OPTIONAL { ?prop qudt:unit ?unitIri . BIND(STRAFTER(STR(?unitIri), "unit/") AS ?unit) }\n  OPTIONAL { ?prop qudt:hasUnit ?hasUnitIri . BIND(STRAFTER(STR(?hasUnitIri), "unit/") AS ?unit) }\n  OPTIONAL { ?prop schema:unitCode ?unitCode . BIND(?unitCode AS ?unit) }\n\n  # Data kind (Temporal, GeoShape, etc.)\n  OPTIONAL {\n    ?prop cubeMeta:dataKind/a ?dataKindType .\n    BIND(STRAFTER(STR(?dataKindType), "cube.link/") AS ?dataKind)\n  }\n\n  # Scale type\n  OPTIONAL {\n    ?prop qudt:scaleType ?scaleTypeIri .\n    BIND(STRAFTER(STR(?scaleTypeIri), "scales/") AS ?scaleType)\n  }\n\n  # Order\n  OPTIONAL { ?prop sh:order ?order }\n}\nORDER BY ?order ?dimLabel`,r=await h(n);if(0===r.results.bindings.length)throw new Error(`Cube not found or has no properties: ${e}`);const s=r.results.bindings[0]?.cubeLabel?.value||e,l=[],i=[],o=new Set;for(const e of r.results.bindings){const a=e.dimension?.value;if(!a||o.has(a))continue;o.add(a);const t=e.dimLabel?.value||a.split(/[/#]/).pop()||a,n=e.unit?.value,r=e.dataKind?.value,s=e.scaleType?.value,c=e.order?.value?parseInt(e.order.value,10):void 0;n?i.push({uri:a,label:t,unit:n}):l.push({uri:a,label:t,dataKind:r,scaleType:s,order:c})}return{uri:e,label:s,dimensions:l,measures:i}}(e,t).then(e=>{if(a)return;s(e);const t=e.dimensions.find(e=>"Temporal"===e.dataKind),n=e.dimensions[0],r=e.measures[0];E||T(t?.uri||n?.uri||null),!x&&r&&S(r.uri),t&&"bar"===I&&R("timeseries")}).catch(e=>{a||(console.error("Failed to load metadata:",e),c(e.message||"Failed to load dataset"))}).finally(()=>{a||i(!1)}),()=>{a=!0}},[e,t]);const A=(0,d.useMemo)(()=>r?r.dimensions.map(e=>({label:e.label,value:e.uri,description:"Temporal"===e.dataKind?"Time":void 0})):[],[r]),F=(0,d.useMemo)(()=>r?r.measures.map(e=>({label:e.unit?`${e.label} (${e.unit})`:e.label,value:e.uri})):[],[r]),k=(0,d.useMemo)(()=>r?[{label:"No grouping",value:"",description:"Show all data together"},...r.dimensions.filter(e=>e.uri!==E).map(e=>({label:e.label,value:e.uri}))]:[],[r,E]),O=y.map(e=>({label:e.label,value:e.value})),z=(0,d.useCallback)(()=>{window.location.hash=""},[]),P=(0,d.useCallback)(async()=>{if(!r||!x)return;f(!0),c(null);const a=v.find(e=>e.id===I)||v[0],n=(r.dimensions.find(e=>e.uri===E),r.measures.find(e=>e.uri===x)?.label||"Value"),s=(L&&r.dimensions.find(e=>e.uri===L),{uid:null,title:r.label,tags:["lindas","swiss-open-data","auto-generated"],editable:!0,panels:[{id:1,type:a.panelType,title:r.label,description:`Data from LINDAS: ${e}`,gridPos:{x:0,y:0,w:24,h:16},datasource:{type:"flandersmake-sparql-datasource",uid:"lindas-sparql"},targets:[{refId:"A",rawQuery:!0,queryText:w(e,E,x,L,t)}],options:a.panelOptions||{},fieldConfig:{defaults:{displayName:n},overrides:[]}}],time:{from:"now-5y",to:"now"},refresh:""});try{const e=await(0,$.getBackendSrv)().post("/api/dashboards/db",{dashboard:s,folderUid:"",overwrite:!1});window.location.href=`/d/${e.uid}?orgId=1`}catch(e){console.error("Failed to create dashboard:",e),c(`Could not create dashboard: ${e.message||"Unknown error"}`),f(!1)}},[r,e,E,x,L,I,t]);if(l)return p().createElement("div",{className:a.loading},p().createElement(m.Spinner,{size:"xl"}),p().createElement("p",null,"Loading dataset..."));if(o&&!r)return p().createElement("div",{className:a.errorContainer},p().createElement(m.Alert,{title:"Error",severity:"error"},o,p().createElement("div",{style:{marginTop:16}},p().createElement(m.Button,{onClick:z},"Back to Catalog"))));if(!r)return null;const B=E&&x;return p().createElement("div",{className:a.container},p().createElement("div",{className:a.header},p().createElement(m.Button,{variant:"secondary",icon:"arrow-left",onClick:z,size:"sm"},"Back"),p().createElement("div",{className:a.titleSection},p().createElement("h1",{className:a.title},r.label),p().createElement("p",{className:a.subtitle},"Create a visualization in 3 simple steps")),p().createElement(m.RadioButtonGroup,{options:O,value:t,onChange:n,size:"sm"})),o&&p().createElement(m.Alert,{title:"Error",severity:"error",onRemove:()=>c(null)},o),p().createElement("div",{className:a.wizard},p().createElement(m.Card,{className:a.stepCard},p().createElement("div",{className:a.stepHeader},p().createElement("span",{className:a.stepNumber},"1"),p().createElement("div",null,p().createElement("h3",{className:a.stepTitle},"What do you want to compare?"),p().createElement("p",{className:a.stepDescription},"Choose the main category for your chart"))),p().createElement("div",{className:a.stepContent},p().createElement("div",{className:a.optionGrid},A.map(e=>p().createElement("button",{key:e.value,className:`${a.optionButton} ${E===e.value?a.optionSelected:""}`,onClick:()=>T(e.value)},p().createElement(m.Icon,{name:"Time"===e.description?"clock-nine":"list-ul",size:"lg"}),p().createElement("span",null,e.label),e.description&&p().createElement("small",null,e.description)))))),p().createElement(m.Card,{className:a.stepCard},p().createElement("div",{className:a.stepHeader},p().createElement("span",{className:a.stepNumber},"2"),p().createElement("div",null,p().createElement("h3",{className:a.stepTitle},"What values do you want to show?"),p().createElement("p",{className:a.stepDescription},"Choose the numbers to display"))),p().createElement("div",{className:a.stepContent},p().createElement("div",{className:a.optionGrid},F.map(e=>p().createElement("button",{key:e.value,className:`${a.optionButton} ${x===e.value?a.optionSelected:""}`,onClick:()=>S(e.value)},p().createElement(m.Icon,{name:"calculator-alt",size:"lg"}),p().createElement("span",null,e.label)))),0===F.length&&p().createElement("p",{className:a.noOptions},"This dataset has no numeric values to display."))),p().createElement(m.Card,{className:a.stepCard},p().createElement("div",{className:a.stepHeader},p().createElement("span",{className:a.stepNumber},"3"),p().createElement("div",null,p().createElement("h3",{className:a.stepTitle},"How do you want to see it?"),p().createElement("p",{className:a.stepDescription},"Pick a visualization style"))),p().createElement("div",{className:a.stepContent},p().createElement("div",{className:a.chartGrid},v.map(e=>p().createElement("button",{key:e.id,className:`${a.chartButton} ${I===e.id?a.chartSelected:""}`,onClick:()=>R(e.id)},p().createElement(m.Icon,{name:e.icon,size:"xxl"}),p().createElement("span",{className:a.chartLabel},e.label),p().createElement("span",{className:a.chartDesc},e.description)))))),k.length>1&&p().createElement(m.Card,{className:a.stepCard},p().createElement("div",{className:a.stepHeader},p().createElement("span",{className:a.stepNumberOptional},"+"),p().createElement("div",null,p().createElement("h3",{className:a.stepTitle},"Split by category? (optional)"),p().createElement("p",{className:a.stepDescription},"Add colors to compare different groups"))),p().createElement("div",{className:a.stepContent},p().createElement("div",{className:a.optionGrid},k.map(e=>p().createElement("button",{key:e.value||"none",className:`${a.optionButton} ${a.optionSmall} ${(L||"")===e.value?a.optionSelected:""}`,onClick:()=>C(e.value||null)},p().createElement("span",null,e.label)))))),p().createElement("div",{className:a.createSection},p().createElement(m.Button,{variant:"primary",size:"lg",icon:u?void 0:"plus",onClick:P,disabled:!B||u,className:a.createButton},u?p().createElement(p().Fragment,null,p().createElement(m.Spinner,{inline:!0,size:"sm"})," Creating..."):"Create Visualization"),!B&&p().createElement("p",{className:a.createHint},"Please complete steps 1 and 2 to continue"))))};function w(e,a,t,n,r){const s=["?category","?value"];n&&s.push("?grouping");const l=[`<${e}> cube:observationSet/cube:observation ?obs .`];return a&&(l.push(`?obs <${a}> ?categoryRaw .`),l.push(`OPTIONAL { ?categoryRaw schema:name ?categoryLabel . FILTER(LANG(?categoryLabel) = "${r}") }`),l.push("BIND(COALESCE(?categoryLabel, STR(?categoryRaw)) AS ?category)")),t&&l.push(`?obs <${t}> ?value .`),n&&(l.push(`?obs <${n}> ?groupRaw .`),l.push(`OPTIONAL { ?groupRaw schema:name ?groupLabel . FILTER(LANG(?groupLabel) = "${r}") }`),l.push("BIND(COALESCE(?groupLabel, STR(?groupRaw)) AS ?grouping)")),`PREFIX cube: <https://cube.link/>\nPREFIX schema: <http://schema.org/>\nPREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\nSELECT ${s.join(" ")} WHERE {\n  ${l.join("\n  ")}\n}\nORDER BY ?category`}const N=e=>({container:u.css`
    padding: ${e.spacing(3)};
    max-width: 1200px;
    margin: 0 auto;
  `,header:u.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(2)};
    margin-bottom: ${e.spacing(4)};
    flex-wrap: wrap;
  `,titleSection:u.css`
    flex: 1;
    min-width: 200px;
  `,title:u.css`
    margin: 0;
    font-size: ${e.typography.h3.fontSize};
  `,subtitle:u.css`
    margin: ${e.spacing(.5)} 0 0 0;
    color: ${e.colors.text.secondary};
  `,wizard:u.css`
    display: flex;
    flex-direction: column;
    gap: ${e.spacing(3)};
  `,stepCard:u.css`
    padding: ${e.spacing(3)};
  `,stepHeader:u.css`
    display: flex;
    align-items: flex-start;
    gap: ${e.spacing(2)};
    margin-bottom: ${e.spacing(2)};
  `,stepNumber:u.css`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${e.colors.primary.main};
    color: ${e.colors.primary.contrastText};
    font-weight: ${e.typography.fontWeightBold};
    flex-shrink: 0;
  `,stepNumberOptional:u.css`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${e.colors.secondary.main};
    color: ${e.colors.secondary.contrastText};
    font-weight: ${e.typography.fontWeightBold};
    flex-shrink: 0;
  `,stepTitle:u.css`
    margin: 0;
    font-size: ${e.typography.h5.fontSize};
  `,stepDescription:u.css`
    margin: ${e.spacing(.5)} 0 0 0;
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
  `,stepContent:u.css`
    margin-left: 48px;
  `,optionGrid:u.css`
    display: flex;
    flex-wrap: wrap;
    gap: ${e.spacing(1)};
  `,optionButton:u.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${e.spacing(.5)};
    padding: ${e.spacing(2)};
    min-width: 140px;
    border: 2px solid ${e.colors.border.medium};
    border-radius: ${e.shape.radius.default};
    background: ${e.colors.background.primary};
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: ${e.colors.primary.border};
      background: ${e.colors.action.hover};
    }

    span {
      font-weight: ${e.typography.fontWeightMedium};
    }

    small {
      color: ${e.colors.text.secondary};
      font-size: ${e.typography.size.xs};
    }
  `,optionSmall:u.css`
    min-width: 100px;
    padding: ${e.spacing(1.5)};
  `,optionSelected:u.css`
    border-color: ${e.colors.primary.main};
    background: ${e.colors.primary.transparent};

    &:hover {
      border-color: ${e.colors.primary.main};
      background: ${e.colors.primary.transparent};
    }
  `,chartGrid:u.css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: ${e.spacing(2)};
  `,chartButton:u.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${e.spacing(1)};
    padding: ${e.spacing(3)} ${e.spacing(2)};
    border: 2px solid ${e.colors.border.medium};
    border-radius: ${e.shape.radius.default};
    background: ${e.colors.background.primary};
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;

    &:hover {
      border-color: ${e.colors.primary.border};
      background: ${e.colors.action.hover};
      transform: translateY(-2px);
    }

    svg {
      color: ${e.colors.text.secondary};
    }
  `,chartSelected:u.css`
    border-color: ${e.colors.primary.main};
    background: ${e.colors.primary.transparent};

    svg {
      color: ${e.colors.primary.main};
    }

    &:hover {
      border-color: ${e.colors.primary.main};
      background: ${e.colors.primary.transparent};
    }
  `,chartLabel:u.css`
    font-weight: ${e.typography.fontWeightMedium};
    font-size: ${e.typography.size.md};
  `,chartDesc:u.css`
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.xs};
  `,noOptions:u.css`
    color: ${e.colors.text.secondary};
    font-style: italic;
  `,createSection:u.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${e.spacing(2)};
    padding: ${e.spacing(4)} 0;
  `,createButton:u.css`
    padding: ${e.spacing(2)} ${e.spacing(6)};
    font-size: ${e.typography.size.lg};
  `,createHint:u.css`
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
  `,loading:u.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: ${e.spacing(8)};
    color: ${e.colors.text.secondary};
    gap: ${e.spacing(2)};
  `,errorContainer:u.css`
    padding: ${e.spacing(4)};
    max-width: 600px;
    margin: 0 auto;
  `});function x(){const e=window.location.hash;return e.startsWith("#/builder/")?{view:"builder",cubeUri:decodeURIComponent(e.slice(10))}:{view:"catalog",cubeUri:null}}const S=(new c.AppPlugin).setRootPage(()=>{const[e,a]=(0,d.useState)(x);return(0,d.useEffect)(()=>{const e=()=>{a(x())};return window.addEventListener("hashchange",e),()=>window.removeEventListener("hashchange",e)},[]),"builder"===e.view&&e.cubeUri?p().createElement(T,{cubeUri:e.cubeUri}):p().createElement(f,null)});return o}()});