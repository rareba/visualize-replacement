define(["@grafana/data","react","@grafana/ui","@emotion/css","@grafana/runtime"],function(e,a,t,n,r){return function(){"use strict";var s={7:function(e){e.exports=t},89:function(e){e.exports=n},531:function(e){e.exports=r},781:function(a){a.exports=e},959:function(e){e.exports=a}},i={};function l(e){var a=i[e];if(void 0!==a)return a.exports;var t=i[e]={exports:{}};return s[e](t,t.exports,l),t.exports}l.n=function(e){var a=e&&e.__esModule?function(){return e.default}:function(){return e};return l.d(a,{a:a}),a},l.d=function(e,a){for(var t in a)l.o(a,t)&&!l.o(e,t)&&Object.defineProperty(e,t,{enumerable:!0,get:a[t]})},l.o=function(e,a){return Object.prototype.hasOwnProperty.call(e,a)},l.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var o={};l.r(o),l.d(o,{plugin:function(){return I}});var c=l(781),d=l(959),p=l.n(d),m=l(7),u=l(89),h=l(531);async function g(e){try{const a=await(0,h.getBackendSrv)().fetch({url:"/api/datasources/proxy/uid/lindas-datasource",method:"POST",headers:{"Content-Type":"application/sparql-query",Accept:"application/sparql-results+json"},data:e}).toPromise();return a?.data}catch(a){console.log("Proxy failed, trying direct fetch:",a);try{const a=await fetch("https://lindas.admin.ch/query",{method:"POST",headers:{"Content-Type":"application/sparql-query",Accept:"application/sparql-results+json"},body:e});if(!a.ok){const e=await a.text();throw new Error(`HTTP ${a.status}: ${e||a.statusText}`)}return a.json()}catch(e){throw new Error(`SPARQL request failed: ${e instanceof Error?e.message:"Unknown error"}`)}}}function b(e){const{cubeIri:a,fieldMapping:t,dimensions:n,measures:r,chartType:s}=e,i=[],l=[];return l.push(`<${a}> <https://cube.link/observationSet>/<https://cube.link/observation> ?obs .`),"table"===s?(n.forEach((e,a)=>{i.push(`?dim${a}`),l.push(`?obs <${e.iri}> ?dim${a} .`)}),r.forEach((e,a)=>{i.push(`?measure${a}`),l.push(`?obs <${e.iri}> ?measure${a} .`)})):"piechart"===s?(t.value&&(i.push("?value"),l.push(`?obs <${t.value}> ?value .`)),t.segment&&(i.push("?segment"),l.push(`?obs <${t.segment}> ?segment .`))):(t.x&&(i.push("?x"),l.push(`?obs <${t.x}> ?x .`)),t.y&&(i.push("?y"),l.push(`?obs <${t.y}> ?y .`)),t.series&&(i.push("?series"),l.push(`?obs <${t.series}> ?series .`))),t.filters&&Object.entries(t.filters).forEach(([e,a])=>{const n=a;if(n&&n.length>0){let a=`?obs_filter_${Math.random().toString(36).substring(7)}`;t.x===e?a="?x":t.series===e?a="?series":t.segment===e?a="?segment":l.push(`?obs <${e}> ${a} .`);const r=n.map(e=>`<${e}>`).join(", ");l.push(`FILTER(${a} IN (${r}))`)}}),`SELECT ${i.join(" ")} WHERE {\n  ${l.join("\n  ")}\n}\nORDER BY ?x ?segment\nLIMIT 10000`}const f=[{id:"barchart",label:"Column",icon:"graph-bar",description:"Vertical bars for comparing categories"},{id:"barchart-horizontal",label:"Bar",icon:"bars",description:"Horizontal bars for ranking"},{id:"timeseries",label:"Line",icon:"gf-interpolation-linear",description:"Lines for trends over time"},{id:"timeseries-area",label:"Area",icon:"gf-interpolation-linear",description:"Filled areas for cumulative data"},{id:"piechart",label:"Pie",icon:"circle",description:"Parts of a whole"},{id:"table",label:"Table",icon:"table",description:"Raw data display"}],y=e=>e.isTemporal?{text:"Time",color:"blue",icon:"clock-nine"}:e.isNumerical?{text:"Numeric",color:"green",icon:"calculator-alt"}:"ordinal"===e.scaleType?{text:"Ordinal",color:"orange",icon:"sort-amount-down"}:{text:"Category",color:"purple",icon:"tag-alt"},E=({dataset:e,onDatasetChange:a})=>{const t=(0,m.useStyles2)(v),n=e.dimensions.map(e=>{const a=y(e);return{label:e.label,value:e.iri,description:a.text,icon:a.icon}}),r=e.measures.map(e=>({label:e.label,value:e.iri,description:e.unit||"Measure"})),s=(t,n)=>{a({...e,fieldMapping:{...e.fieldMapping,[t]:n}})};return e.chartType.includes("timeseries")?e.dimensions.find(e=>e.isTemporal):e.dimensions.find(e=>"nominal"===e.scaleType||"ordinal"===e.scaleType),p().createElement("div",{className:t.container},p().createElement(m.FieldSet,{label:"Chart Settings"},p().createElement(m.Field,{label:"Title"},p().createElement(m.Input,{value:e.title,onChange:t=>a({...e,title:t.currentTarget.value}),placeholder:"Enter chart title..."})),p().createElement(m.Field,{label:"Chart Type"},p().createElement("div",{className:t.chartTypeGrid},f.map(n=>p().createElement(m.Tooltip,{key:n.id,content:n.description,placement:"top"},p().createElement("button",{title:n.label,className:`${t.chartTypeBtn} ${e.chartType===n.id?t.chartTypeBtnActive:""}`,onClick:()=>{return t=n.id,void a("piechart"===t?{...e,chartType:t,fieldMapping:{...e.fieldMapping,value:e.measures[0]?.iri,segment:e.dimensions.find(e=>!e.isTemporal)?.iri}}:"table"===t?{...e,chartType:t,fieldMapping:{}}:{...e,chartType:t});var t}},p().createElement(m.Icon,{name:n.icon,size:"xl"}),p().createElement("span",{className:t.chartLabels},n.label))))))),p().createElement(m.FieldSet,{label:"Data Mapping"},"table"!==e.chartType&&"piechart"!==e.chartType&&p().createElement(p().Fragment,null,p().createElement(m.Field,{label:"X Axis",description:e.chartType.includes("timeseries")?"Select a temporal dimension":"Category or time dimension"},p().createElement(m.Select,{options:n,value:n.find(a=>a.value===e.fieldMapping.x),onChange:e=>s("x",e?.value),isClearable:!0,placeholder:"Select dimension...",formatOptionLabel:e=>p().createElement("div",{className:t.optionLabel},e.icon&&p().createElement(m.Icon,{name:e.icon,size:"sm"}),p().createElement("span",null,e.label),e.description&&p().createElement(m.Badge,{text:e.description,color:"blue",className:t.optionBadge}))})),p().createElement(m.Field,{label:"Y Axis",description:"Numeric measure to display"},p().createElement(m.Select,{options:r,value:r.find(a=>a.value===e.fieldMapping.y),onChange:e=>s("y",e?.value),isClearable:!0,placeholder:"Select measure..."})),p().createElement(m.Field,{label:"Series / Color",description:"Optional: Split data by category"},p().createElement(m.Select,{options:n,value:n.find(a=>a.value===e.fieldMapping.series),onChange:e=>s("series",e?.value),isClearable:!0,placeholder:"None (optional)"}))),"piechart"===e.chartType&&p().createElement(p().Fragment,null,p().createElement(m.Field,{label:"Value (Size)",description:"Numeric measure for slice size"},p().createElement(m.Select,{options:r,value:r.find(a=>a.value===e.fieldMapping.value),onChange:e=>s("value",e?.value),isClearable:!0,placeholder:"Select measure..."})),p().createElement(m.Field,{label:"Segment (Slices)",description:"Category dimension for pie slices"},p().createElement(m.Select,{options:n,value:n.find(a=>a.value===e.fieldMapping.segment),onChange:e=>s("segment",e?.value),isClearable:!0,placeholder:"Select dimension..."}))),"table"===e.chartType&&p().createElement("div",{className:t.infoBox},p().createElement(m.Icon,{name:"info-circle"}),p().createElement("div",null,p().createElement("strong",null,"Table View"),p().createElement("p",null,"All dimensions and measures will be displayed. Use filters on the right to limit the data.")))),p().createElement(m.FieldSet,{label:"Dataset Info",className:t.infoSection},p().createElement("div",{className:t.statsGrid},p().createElement("div",{className:t.statItem},p().createElement("span",{className:t.statLabel},"Dimensions"),p().createElement("span",{className:t.statValue},e.dimensions.length)),p().createElement("div",{className:t.statItem},p().createElement("span",{className:t.statLabel},"Measures"),p().createElement("span",{className:t.statValue},e.measures.length))),p().createElement("div",{className:t.dimensionList},e.dimensions.slice(0,5).map(e=>{const a=y(e);return p().createElement("div",{key:e.iri,className:t.dimensionItem},p().createElement(m.Icon,{name:a.icon,size:"sm"}),p().createElement("span",{className:t.dimensionLabel},e.label),p().createElement(m.Badge,{text:a.text,color:a.color}))}),e.dimensions.length>5&&p().createElement("div",{className:t.moreItems},"+",e.dimensions.length-5," more dimensions"))))},v=e=>({container:u.css`
    display: flex;
    flex-direction: column;
    gap: ${e.spacing(2)};
  `,chartTypeGrid:u.css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: ${e.spacing(1)};
    margin-top: ${e.spacing(1)};
  `,chartTypeBtn:u.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: ${e.spacing(1.5)};
    background: ${e.colors.background.secondary};
    border: 2px solid ${e.colors.border.weak};
    border-radius: ${e.shape.borderRadius()};
    cursor: pointer;
    transition: all 0.2s;
    color: ${e.colors.text.secondary};

    &:hover {
      background: ${e.colors.emphasize(e.colors.background.secondary,.03)};
      border-color: ${e.colors.border.medium};
    }
  `,chartTypeBtnActive:u.css`
    background: ${e.colors.action.selected};
    border-color: ${e.colors.primary.main};
    color: ${e.colors.primary.text};
  `,chartLabels:u.css`
    font-size: ${e.typography.size.xs};
    margin-top: ${e.spacing(.5)};
  `,optionLabel:u.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
  `,optionBadge:u.css`
    margin-left: auto;
  `,infoBox:u.css`
    display: flex;
    gap: ${e.spacing(1.5)};
    padding: ${e.spacing(2)};
    background: ${e.colors.background.secondary};
    border-radius: ${e.shape.borderRadius()};
    border: 1px solid ${e.colors.border.weak};

    p {
      margin: ${e.spacing(.5)} 0 0 0;
      font-size: ${e.typography.size.sm};
      color: ${e.colors.text.secondary};
    }
  `,infoSection:u.css`
    margin-top: auto;
  `,statsGrid:u.css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${e.spacing(1)};
    margin-bottom: ${e.spacing(2)};
  `,statItem:u.css`
    display: flex;
    flex-direction: column;
    padding: ${e.spacing(1)};
    background: ${e.colors.background.secondary};
    border-radius: ${e.shape.borderRadius()};
    text-align: center;
  `,statLabel:u.css`
    font-size: ${e.typography.size.xs};
    color: ${e.colors.text.secondary};
  `,statValue:u.css`
    font-size: ${e.typography.h4.fontSize};
    font-weight: ${e.typography.fontWeightBold};
    color: ${e.colors.primary.main};
  `,dimensionList:u.css`
    display: flex;
    flex-direction: column;
    gap: ${e.spacing(.5)};
  `,dimensionItem:u.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
    padding: ${e.spacing(.5,1)};
    background: ${e.colors.background.secondary};
    border-radius: ${e.shape.borderRadius(.5)};
    font-size: ${e.typography.size.sm};
  `,dimensionLabel:u.css`
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,moreItems:u.css`
    font-size: ${e.typography.size.sm};
    color: ${e.colors.text.disabled};
    font-style: italic;
    padding: ${e.spacing(.5,1)};
  `}),$=e=>({container:u.css`
    display: flex;
    flex-direction: column;
    gap: ${e.spacing(2)};
  `,filterItem:u.css`
    margin-bottom: ${e.spacing(1.5)};
  `,loadingContainer:u.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
    font-size: ${e.typography.size.sm};
    color: ${e.colors.text.disabled};
  `}),N=({cubeIri:e,dimensions:a,selectedFilters:t,onFiltersChange:n})=>{const r=(0,m.useStyles2)($),[s,i]=(0,d.useState)({}),[l,o]=(0,d.useState)({});return(0,d.useEffect)(()=>{e&&a.length>0&&(async()=>{a.forEach(async a=>{if(!l[a.iri]&&!s[a.iri]){i(e=>({...e,[a.iri]:!0}));try{const t=await async function(e,a){const t=`\nPREFIX schema: <http://schema.org/>\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nPREFIX cube: <https://cube.link/>\n\nSELECT DISTINCT ?value ?displayLabel WHERE {\n  <${e}> <https://cube.link/observationSet>/<https://cube.link/observation> ?obs .\n  ?obs <${a}> ?value .\n  OPTIONAL { ?value schema:name ?schemaLabel . FILTER(LANG(?schemaLabel) = "en" || LANG(?schemaLabel) = "") }\n  OPTIONAL { ?value rdfs:label ?rdfsLabel . FILTER(LANG(?rdfsLabel) = "en" || LANG(?rdfsLabel) = "") }\n  BIND(COALESCE(?schemaLabel, ?rdfsLabel, STR(?value)) AS ?displayLabel)\n}\nORDER BY ?displayLabel\nLIMIT 100\n  `.trim(),n=await g(t);return(n?.results?.bindings||[]).map(e=>({iri:e.value?.value,label:e.displayLabel?.value||e.value?.value}))}(e,a.iri);o(e=>({...e,[a.iri]:t}))}catch(e){console.error(`Failed to load values for ${a.label}`,e)}finally{i(e=>({...e,[a.iri]:!1}))}}})})()},[e,a]),p().createElement("div",{className:r.container},p().createElement(m.FieldSet,{label:"Filters"},a.map(e=>p().createElement("div",{key:e.iri,className:r.filterItem},p().createElement(m.Field,{label:e.label},s[e.iri]?p().createElement("div",{className:r.loadingContainer},p().createElement(m.Spinner,{size:"sm"}),p().createElement("span",null,"Loading values...")):p().createElement(m.MultiSelect,{options:(l[e.iri]||[]).map(e=>({label:e.label,value:e.iri})),value:(l[e.iri]||[]).filter(a=>(t[e.iri]||[]).includes(a.iri)).map(e=>({label:e.label,value:e.iri})),onChange:a=>((e,a)=>{const r=a.map(e=>e.value);n({...t,[e]:r})})(e.iri,a),placeholder:"All values",isClearable:!0}))))))},x=({dataset:e})=>{const[a,t]=(0,d.useState)(null),[n,r]=(0,d.useState)(!1),[s,i]=(0,d.useState)(null),[l,o]=(0,d.useState)(0),h=(0,m.useTheme2)();(0,d.useEffect)(()=>{let a=!0;return(async()=>{if("table"!==e.chartType){const a=e.fieldMapping.x||e.fieldMapping.segment,n=e.fieldMapping.y||e.fieldMapping.value;if(!a&&!n)return void t(null)}r(!0),i(null);try{const n=b(e),s=await async function(e){return g(e)}(n),i=function(e){const a=e?.head?.vars||[],t=e?.results?.bindings||[],n=new c.MutableDataFrame({fields:a.map(e=>{let a=c.FieldType.string;if(t.length>0){const n=t[0][e];n?.datatype?.includes("decimal")||n?.datatype?.includes("integer")||n?.datatype?.includes("float")||n?.datatype?.includes("double")?a=c.FieldType.number:(n?.datatype?.includes("date")||n?.datatype?.includes("dateTime"))&&(a=c.FieldType.time)}return("y"===e||"value"===e||e.startsWith("measure"))&&(a=c.FieldType.number),"x"===e&&(t[0]?.x?.datatype?.includes("date")||t[0]?.x?.datatype?.includes("dateTime"))&&(a=c.FieldType.time),{name:e,type:a,config:{displayName:e.charAt(0).toUpperCase()+e.slice(1)}}})});return t.forEach(e=>{const t={};a.forEach(a=>{const r=e[a]?.value,s=n.fields.find(e=>e.name===a)?.type;s===c.FieldType.number?t[a]=parseFloat(r):s===c.FieldType.time?t[a]=new Date(r).getTime():t[a]=r}),n.add(t)}),n}(s);a&&(t(i),o(i.length),r(!1))}catch(e){a&&(i(e.message||"Failed to fetch chart data"),r(!1))}})(),()=>{a=!1}},[e]);const f=(0,d.useMemo)(()=>({container:u.css`
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: ${h.colors.background.secondary};
      border-radius: ${h.shape.borderRadius()};
      overflow: hidden;
      min-height: 400px;
      padding: ${h.spacing(2)};
    `,chartWrapper:u.css`
      width: 100%;
      flex-grow: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    `,chartTitle:u.css`
      font-size: ${h.typography.h4.fontSize};
      font-weight: ${h.typography.fontWeightMedium};
      margin-bottom: ${h.spacing(2)};
      color: ${h.colors.text.primary};
    `,rowCount:u.css`
      margin-top: ${h.spacing(1)};
      font-size: ${h.typography.size.sm};
      color: ${h.colors.text.secondary};
    `,emptyState:u.css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: ${h.colors.text.secondary};
      padding: ${h.spacing(4)};

      h4 {
        margin: ${h.spacing(2)} 0 ${h.spacing(1)} 0;
        color: ${h.colors.text.primary};
      }

      p {
        margin: 0;
        max-width: 300px;
      }
    `,previewBadge:u.css`
      position: absolute;
      top: ${h.spacing(1)};
      right: ${h.spacing(1)};
      background: ${h.colors.warning.main};
      color: ${h.colors.warning.contrastText};
      padding: ${h.spacing(.5,1)};
      border-radius: ${h.shape.borderRadius(.5)};
      font-size: ${h.typography.size.xs};
    `,chartContainer:u.css`
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    `,previewNote:u.css`
      font-size: ${h.typography.size.sm};
      color: ${h.colors.text.secondary};
      background: ${h.colors.background.secondary};
      padding: ${h.spacing(.5,1)};
      border-radius: ${h.shape.borderRadius(.5)};
      margin-bottom: ${h.spacing(1)};
      text-align: center;
    `}),[h]);return n?p().createElement("div",{className:f.container},p().createElement(m.Spinner,{size:32}),p().createElement("div",{style:{marginTop:h.spacing(1)}},"Loading visualization...")):s?p().createElement("div",{className:f.container},p().createElement(m.Alert,{title:"Error loading data",severity:"error"},s)):a||"table"===e.chartType?a&&0!==a.length?p().createElement("div",{className:f.container},p().createElement("div",{className:f.chartTitle},e.title),p().createElement("div",{className:f.chartWrapper},(()=>{const{chartType:t}=e;return a?"table"===t?p().createElement(m.Table,{data:a,width:800,height:400}):p().createElement("div",{className:f.chartContainer},p().createElement("div",{className:f.previewNote},(e=>({timeseries:"Line Chart","timeseries-area":"Area Chart",barchart:"Column Chart","barchart-horizontal":"Bar Chart",piechart:"Pie Chart",table:"Table"}[e]||e))(t)," - Data Preview (Full chart in exported dashboard)"),p().createElement(m.Table,{data:a,width:800,height:350})):null})()),p().createElement("div",{className:f.rowCount},l," data point",1!==l?"s":""," loaded")):p().createElement("div",{className:f.container},p().createElement(m.Alert,{title:"No data",severity:"info"},"No data found for this configuration. Try adjusting your filters.")):p().createElement("div",{className:f.container},p().createElement("div",{className:f.emptyState},p().createElement("svg",{width:"64",height:"64",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5"},p().createElement("path",{d:"M3 3v18h18"}),p().createElement("path",{d:"M18 9l-5 5-4-4-3 3"})),p().createElement("h4",null,"Configure Your Chart"),p().createElement("p",null,"Select dimensions and measures on the left panel to preview your visualization.")))},L=({onSelectDataset:e,onClose:a})=>{const t=(0,m.useStyles2)(T),[n,r]=(0,d.useState)(""),[s,i]=(0,d.useState)([]),[l,o]=(0,d.useState)(!1),[c,u]=(0,d.useState)(!1);(0,d.useEffect)(()=>{h("")},[]);const h=(0,d.useCallback)(async e=>{o(!0),u(!0);try{const a=await async function(e="",a=50){const t=`\nPREFIX schema: <http://schema.org/>\nPREFIX cube: <https://cube.link/>\nPREFIX dcterms: <http://purl.org/dc/terms/>\nPREFIX dcat: <http://www.w3.org/ns/dcat#>\n\nSELECT DISTINCT ?cube ?label ?description ?publisher ?dateModified WHERE {\n  ?cube a cube:Cube .\n  OPTIONAL {\n    ?cube schema:name ?labelRaw .\n    FILTER(LANG(?labelRaw) = "en" || LANG(?labelRaw) = "de" || LANG(?labelRaw) = "")\n  }\n  OPTIONAL {\n    ?cube schema:description ?descRaw .\n    FILTER(LANG(?descRaw) = "en" || LANG(?descRaw) = "de" || LANG(?descRaw) = "")\n  }\n  OPTIONAL {\n    ?cube schema:creator/schema:name ?publisherName .\n    FILTER(LANG(?publisherName) = "en" || LANG(?publisherName) = "de" || LANG(?publisherName) = "")\n  }\n  OPTIONAL { ?cube schema:dateModified ?dateModified }\n\n  BIND(COALESCE(?labelRaw, STR(?cube)) AS ?label)\n  BIND(COALESCE(?descRaw, "") AS ?description)\n  BIND(COALESCE(?publisherName, "") AS ?publisher)\n\n  ${e?`FILTER(CONTAINS(LCASE(?label), LCASE("${e}")) || CONTAINS(LCASE(?description), LCASE("${e}")))`:""}\n}\nORDER BY DESC(?dateModified)\nLIMIT ${a}\n  `.trim();try{const e=await g(t);return(e?.results?.bindings||[]).map(e=>({iri:e.cube?.value,label:e.label?.value||e.cube?.value?.split("/").pop()||"Unnamed",description:e.description?.value,publisher:e.publisher?.value,dateModified:e.dateModified?.value}))}catch(e){return console.error("Failed to search cubes:",e),[]}}(e,50);i(a)}catch(e){console.error("Search failed:",e),i([])}finally{o(!1)}},[]),b=()=>{h(n)};return p().createElement("div",{className:t.container},p().createElement("div",{className:t.header},p().createElement("h2",{className:t.title},p().createElement(m.Icon,{name:"database"})," Browse LINDAS Datasets"),p().createElement(m.Button,{variant:"secondary",size:"sm",onClick:a,icon:"times"},"Close")),p().createElement("div",{className:t.searchBar},p().createElement(m.Input,{value:n,onChange:e=>r(e.currentTarget.value),onKeyPress:e=>{"Enter"===e.key&&b()},placeholder:"Search datasets by name or description...",prefix:p().createElement(m.Icon,{name:"search"}),className:t.searchInput}),p().createElement(m.Button,{onClick:b,disabled:l},l?p().createElement(m.Spinner,{size:"sm"}):"Search")),p().createElement("div",{className:t.resultsInfo},c&&!l&&p().createElement("span",null,s.length," dataset",1!==s.length?"s":""," found",n&&` for "${n}"`)),p().createElement("div",{className:t.resultsList},l&&!c?p().createElement("div",{className:t.loadingState},p().createElement(m.Spinner,{size:32}),p().createElement("p",null,"Loading datasets...")):0===s.length&&c?p().createElement("div",{className:t.emptyState},p().createElement(m.Icon,{name:"info-circle",size:"xl"}),p().createElement("p",null,"No datasets found. Try a different search term.")):s.map(a=>p().createElement(m.Card,{key:a.iri,className:t.resultCard,onClick:()=>e(a.iri)},p().createElement(m.Card.Heading,{className:t.cardHeading},a.label),p().createElement(m.Card.Meta,{className:t.cardMeta},a.publisher&&p().createElement(m.Badge,{text:a.publisher,color:"blue",icon:"building"}),a.dateModified&&p().createElement("span",{className:t.dateModified},p().createElement(m.Icon,{name:"clock-nine",size:"sm"}),(e=>{if(!e)return"";try{return new Date(e).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"})}catch{return e}})(a.dateModified))),p().createElement(m.Card.Description,{className:t.cardDescription},((e,a=150)=>e?e.length<=a?e:e.substring(0,a)+"...":"")(a.description)||"No description available"),p().createElement(m.Card.Actions,null,p().createElement(m.Button,{size:"sm",variant:"primary",onClick:t=>{t.stopPropagation(),e(a.iri)}},"Select Dataset"))))))},T=e=>({container:u.css`
    display: flex;
    flex-direction: column;
    height: 100%;
    background: ${e.colors.background.primary};
  `,header:u.css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${e.spacing(2)};
    border-bottom: 1px solid ${e.colors.border.weak};
  `,title:u.css`
    margin: 0;
    font-size: ${e.typography.h4.fontSize};
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
  `,searchBar:u.css`
    display: flex;
    gap: ${e.spacing(1)};
    padding: ${e.spacing(2)};
    border-bottom: 1px solid ${e.colors.border.weak};
    background: ${e.colors.background.secondary};
  `,searchInput:u.css`
    flex: 1;
  `,resultsInfo:u.css`
    padding: ${e.spacing(1,2)};
    font-size: ${e.typography.size.sm};
    color: ${e.colors.text.secondary};
    background: ${e.colors.background.secondary};
    border-bottom: 1px solid ${e.colors.border.weak};
  `,resultsList:u.css`
    flex: 1;
    overflow-y: auto;
    padding: ${e.spacing(2)};
    display: flex;
    flex-direction: column;
    gap: ${e.spacing(1.5)};
  `,loadingState:u.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: ${e.colors.text.secondary};
    gap: ${e.spacing(2)};
  `,emptyState:u.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: ${e.colors.text.disabled};
    gap: ${e.spacing(1)};
  `,resultCard:u.css`
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid ${e.colors.border.weak};

    &:hover {
      border-color: ${e.colors.primary.main};
      box-shadow: ${e.shadows.z2};
    }
  `,cardHeading:u.css`
    color: ${e.colors.text.primary};
    font-weight: ${e.typography.fontWeightMedium};
  `,cardMeta:u.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1.5)};
    margin-top: ${e.spacing(.5)};
  `,cardDescription:u.css`
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
    margin-top: ${e.spacing(1)};
  `,dateModified:u.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(.5)};
    font-size: ${e.typography.size.sm};
    color: ${e.colors.text.secondary};
  `}),w=e=>({container:u.css`
    height: 100%;
    display: flex;
    flex-direction: column;
    background: ${e.colors.background.canvas};
  `,header:u.css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${e.spacing(1.5,3)};
    background: ${e.colors.background.primary};
    border-bottom: 1px solid ${e.colors.border.weak};
  `,headerTitle:u.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
  `,headerIcon:u.css`
    color: ${e.colors.primary.main};
  `,titleInput:u.css`
    width: 300px;
    input {
      font-size: ${e.typography.size.lg};
      font-weight: ${e.typography.fontWeightBold};
      border-color: transparent;
      &:hover, &:focus {
        border-color: ${e.colors.border.medium};
      }
    }
  `,headerActions:u.css`
    display: flex;
    gap: ${e.spacing(1)};
  `,mainLayout:u.css`
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,tabsBar:u.css`
    padding: ${e.spacing(0,2)};
    background: ${e.colors.background.primary};
  `,tabContent:u.css`
    flex: 1;
    overflow: hidden;
  `,threeColumn:u.css`
    display: grid;
    grid-template-columns: 320px 1fr 300px;
    height: 100%;
    overflow: hidden;
  `,columnLeft:u.css`
    border-right: 1px solid ${e.colors.border.weak};
    background: ${e.colors.background.primary};
    padding: ${e.spacing(2)};
    overflow-y: auto;
  `,columnCenter:u.css`
    background: ${e.colors.background.canvas};
    padding: ${e.spacing(4)};
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  `,columnRight:u.css`
    border-left: 1px solid ${e.colors.border.weak};
    background: ${e.colors.background.primary};
    padding: ${e.spacing(2)};
    overflow-y: auto;
  `,sectionHeader:u.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
    padding-bottom: ${e.spacing(1.5)};
    margin-bottom: ${e.spacing(2)};
    border-bottom: 1px solid ${e.colors.border.weak};
    font-weight: ${e.typography.fontWeightMedium};
    color: ${e.colors.text.secondary};
  `,emptyState:u.css`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${e.colors.background.canvas};
  `,emptyCard:u.css`
    background: ${e.colors.background.primary};
    padding: ${e.spacing(6)};
    border-radius: ${e.shape.borderRadius()};
    border: 1px solid ${e.colors.border.weak};
    text-align: center;
    max-width: 500px;
    box-shadow: ${e.shadows.z2};
    h2 { margin-bottom: 12px; }
    p { color: ${e.colors.text.secondary}; margin-bottom: 24px; }
  `,emptyActions:u.css`
    display: flex;
    gap: ${e.spacing(2)};
    justify-content: center;
  `,tabWrapper:u.css`
    display: inline-flex;
    align-items: center;
    position: relative;
  `,removeTabBtn:u.css`
    background: none;
    border: none;
    cursor: pointer;
    padding: ${e.spacing(.5)};
    margin-left: ${e.spacing(.5)};
    opacity: 0.6;
    color: ${e.colors.text.secondary};
    border-radius: ${e.shape.borderRadius(.5)};

    &:hover {
      opacity: 1;
      color: ${e.colors.error.main};
      background: ${e.colors.action.hover};
    }
  `}),I=(new c.AppPlugin).setRootPage(e=>{const a=(0,m.useStyles2)(w),[t,n]=(0,d.useState)({title:"New Lindas Dashboard",datasets:[]}),[r,s]=(0,d.useState)(-1),[i,l]=(0,d.useState)(!1),[o,u]=(0,d.useState)(""),[f,y]=(0,d.useState)(!1),[v,$]=(0,d.useState)("browse"),[T,I]=(0,d.useState)(!1),[C,S]=(0,d.useState)(!1),[A,k]=(0,d.useState)(null);(0,d.useEffect)(()=>{const e=new URLSearchParams(window.location.search).get("cube");e&&0===t.datasets.length&&R(e)},[]);const R=async e=>{y(!0);try{const a=await async function(e){const a=`\nPREFIX schema: <http://schema.org/>\nPREFIX cube: <https://cube.link/>\nPREFIX dcterms: <http://purl.org/dc/terms/>\n\nSELECT ?label ?description ?publisher ?dateModified WHERE {\n  <${e}> a cube:Cube .\n  OPTIONAL { <${e}> schema:name ?label . FILTER(LANG(?label) = "en" || LANG(?label) = "de" || LANG(?label) = "") }\n  OPTIONAL { <${e}> schema:description ?description . FILTER(LANG(?description) = "en" || LANG(?description) = "de" || LANG(?description) = "") }\n  OPTIONAL { <${e}> schema:creator/schema:name ?publisher . FILTER(LANG(?publisher) = "en" || LANG(?publisher) = "de" || LANG(?publisher) = "") }\n  OPTIONAL { <${e}> schema:dateModified ?dateModified }\n} LIMIT 1\n  `.trim(),t=`\nPREFIX schema: <http://schema.org/>\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nPREFIX cube: <https://cube.link/>\nPREFIX sh: <http://www.w3.org/ns/shacl#>\nPREFIX qudt: <http://qudt.org/schema/qudt/>\nPREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\nPREFIX meta: <https://cube.link/meta/>\n\nSELECT DISTINCT ?dimension ?label ?order ?datatype ?scaleType WHERE {\n  <${e}> cube:observationConstraint ?shape .\n  ?shape sh:property ?prop .\n  ?prop sh:path ?dimension .\n\n  FILTER NOT EXISTS { ?prop qudt:unit ?unit }\n  FILTER NOT EXISTS { ?prop schema:unitCode ?unitCode }\n  FILTER NOT EXISTS { ?prop qudt:hasUnit ?hasUnit }\n\n  OPTIONAL { ?prop schema:name ?propLabel . FILTER(LANG(?propLabel) = "en" || LANG(?propLabel) = "de" || LANG(?propLabel) = "") }\n  OPTIONAL { ?prop rdfs:label ?rdfsLabel . FILTER(LANG(?rdfsLabel) = "en" || LANG(?rdfsLabel) = "de" || LANG(?rdfsLabel) = "") }\n  OPTIONAL { ?prop sh:order ?order }\n  OPTIONAL { ?prop sh:datatype ?datatype }\n  OPTIONAL { ?prop meta:scaleType ?scaleType }\n\n  BIND(COALESCE(?propLabel, ?rdfsLabel) AS ?label)\n}\nORDER BY ?order ?label\n  `.trim(),n=`\nPREFIX schema: <http://schema.org/>\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nPREFIX cube: <https://cube.link/>\nPREFIX sh: <http://www.w3.org/ns/shacl#>\nPREFIX qudt: <http://qudt.org/schema/qudt/>\n\nSELECT DISTINCT ?measure ?label ?unit ?datatype WHERE {\n  <${e}> cube:observationConstraint ?shape .\n  ?shape sh:property ?prop .\n  ?prop sh:path ?measure .\n\n  { ?prop qudt:unit ?unitUri }\n  UNION { ?prop schema:unitCode ?unitCode }\n  UNION { ?prop qudt:hasUnit ?hasUnit }\n\n  OPTIONAL { ?prop schema:name ?propLabel . FILTER(LANG(?propLabel) = "en" || LANG(?propLabel) = "de" || LANG(?propLabel) = "") }\n  OPTIONAL { ?prop rdfs:label ?rdfsLabel . FILTER(LANG(?rdfsLabel) = "en" || LANG(?rdfsLabel) = "de" || LANG(?rdfsLabel) = "") }\n  OPTIONAL { ?unitUri rdfs:label ?unitLabel }\n  OPTIONAL { ?prop sh:datatype ?datatype }\n\n  BIND(COALESCE(?propLabel, ?rdfsLabel) AS ?label)\n  BIND(COALESCE(?unitLabel, ?unitCode, STR(?unitUri)) AS ?unit)\n}\nORDER BY ?label\n  `.trim(),[r,s,i]=await Promise.all([g(a),g(t),g(n)]),l=r?.results?.bindings||[],o=l[0]?.label?.value||e.split("/").pop()||"Unnamed Cube",c=l[0]?.description?.value,d=l[0]?.publisher?.value,p=l[0]?.dateModified?.value,m=new Map;(s?.results?.bindings||[]).forEach(e=>{const a=e.dimension?.value;if(a&&!m.has(a)){const n=e.datatype?.value,r=e.scaleType?.value,s=!!(t=n)&&["date","dateTime","gYear","gYearMonth","time"].some(e=>t.toLowerCase().includes(e.toLowerCase())),i=(e=>!!e&&["decimal","integer","float","double","int","long","short"].some(a=>e.toLowerCase().includes(a.toLowerCase())))(n);let l="nominal";s?l="temporal":i?l="numerical":r?.includes("Ordinal")&&(l="ordinal"),m.set(a,{iri:a,label:e.label?.value||a.split("/").pop()||a,order:e.order?.value?parseInt(e.order.value,10):void 0,dataType:n,scaleType:l,isTemporal:s,isNumerical:i})}var t});const u=new Map;return(i?.results?.bindings||[]).forEach(e=>{const a=e.measure?.value;a&&!u.has(a)&&u.set(a,{iri:a,label:e.label?.value||a.split("/").pop()||a,unit:e.unit?.value,dataType:e.datatype?.value})}),{iri:e,label:o,description:c,dimensions:Array.from(m.values()),measures:Array.from(u.values()),publisher:d,dateModified:p}}(e),r=a.dimensions.find(e=>e.isTemporal),i=a.measures[0],o=a.dimensions.find(e=>!e.isTemporal&&"nominal"===e.scaleType),d={cubeIri:e,chartType:r?"timeseries":"barchart",title:a.label||"New Dataset",fieldMapping:{x:r?.iri||a.dimensions[0]?.iri,y:i?.iri,series:o?.iri},dimensions:a.dimensions,measures:a.measures};n(e=>({...e,datasets:[...e.datasets,d]})),s(t.datasets.length),l(!1),I(!1),u(""),$("configure"),(0,h.getAppEvents)().publish({type:c.AppEvents.alertSuccess.name,payload:["Dataset added successfully",`Loaded "${a.label}"`]})}catch(e){(0,h.getAppEvents)().publish({type:c.AppEvents.alertError.name,payload:["Failed to fetch cube metadata",String(e)]})}finally{y(!1)}},F=(e,a)=>{n(t=>{const n=[...t.datasets];return n[e]=a,{...t,datasets:n}})},O=t.datasets[r];return T?p().createElement("div",{className:a.container},p().createElement(L,{onSelectDataset:R,onClose:()=>I(!1)})):p().createElement("div",{className:a.container},p().createElement("div",{className:a.header},p().createElement("div",{className:a.headerTitle},p().createElement(m.Icon,{name:"chart-line",size:"xl",className:a.headerIcon}),p().createElement(m.Input,{value:t.title,onChange:e=>n({...t,title:e.currentTarget.value}),className:a.titleInput,placeholder:"Dashboard Title"})),p().createElement("div",{className:a.headerActions},p().createElement(m.Button,{variant:"secondary",onClick:()=>I(!0),icon:"search"},"Browse Datasets"),p().createElement(m.Button,{variant:"secondary",onClick:()=>l(!0),icon:"link"},"Add by IRI"),t.datasets.length>0&&p().createElement(m.Button,{variant:"primary",onClick:async()=>{if(0!==t.datasets.length){S(!0);try{const e=await async function(e){const a=(new Date).toISOString().slice(0,19).replace("T"," "),t={title:`${e.title} (${a})`,tags:["lindas","auto-generated"],timezone:"browser",schemaVersion:38,panels:e.datasets.map((e,a)=>{const t=function(e){switch(e){case"barchart":case"barchart-horizontal":return"barchart";case"timeseries":case"timeseries-area":default:return"timeseries";case"piechart":return"piechart";case"table":return"table"}}(e.chartType),n=b(e),r=function(e){switch(e){case"barchart":return{orientation:"vertical",xTickLabelRotation:-45,legend:{displayMode:"list",placement:"bottom"}};case"barchart-horizontal":return{orientation:"horizontal",legend:{displayMode:"list",placement:"right"}};case"timeseries":case"timeseries-area":return{legend:{displayMode:"list",placement:"bottom"}};case"piechart":return{legend:{displayMode:"table",placement:"right",values:["value","percent"]},pieType:"pie",displayLabels:["name","percent"]};case"table":return{showHeader:!0,sortBy:[]};default:return{}}}(e.chartType),s=function(e){const a={custom:{}};return"timeseries-area"===e&&(a.custom.fillOpacity=50,a.custom.lineWidth=1),{defaults:a,overrides:[]}}(e.chartType),i=a%2*12,l=10*Math.floor(a/2);return{id:a+1,type:t,title:e.title,gridPos:{x:i,y:l,w:12,h:10},datasource:{type:"flandersmake-sparql-datasource",uid:"lindas-datasource"},targets:[{refId:"A",rawQuery:n,format:"table"}],options:r,fieldConfig:s}}),annotations:{list:[{builtIn:1,datasource:{type:"grafana",uid:"-- Grafana --"},enable:!0,hide:!0,iconColor:"rgba(0, 211, 255, 1)",name:"Annotations & Alerts",type:"dashboard"}]},templating:{list:[]},time:{from:"now-6h",to:"now"},refresh:"",links:e.datasets.map(e=>({title:`Source: ${e.title}`,url:e.cubeIri,icon:"external link",type:"link",targetBlank:!0}))};return(await(0,h.getBackendSrv)().post("/api/dashboards/db",{dashboard:t,folderUid:"",message:"Created from LINDAS cubes",overwrite:!1})).uid}(t);(0,h.getAppEvents)().publish({type:c.AppEvents.alertSuccess.name,payload:["Dashboard created!","Opening in new tab..."]}),window.open(`/d/${e}`,"_blank")}catch(e){(0,h.getAppEvents)().publish({type:c.AppEvents.alertError.name,payload:["Failed to create dashboard",String(e)]})}finally{S(!1)}}else(0,h.getAppEvents)().publish({type:c.AppEvents.alertWarning.name,payload:["No datasets to export","Add at least one dataset first"]})},icon:"external-link-alt",disabled:C},C?"Creating...":"Create Dashboard"))),t.datasets.length>0?p().createElement("div",{className:a.mainLayout},p().createElement(m.TabsBar,{className:a.tabsBar},t.datasets.map((e,t)=>p().createElement("div",{key:t,className:a.tabWrapper},p().createElement(m.Tab,{label:e.title,active:t===r,onChangeTab:()=>s(t)}),p().createElement("button",{className:a.removeTabBtn,onClick:e=>{e.stopPropagation(),k(t)},title:"Remove dataset"},p().createElement(m.Icon,{name:"times",size:"sm"}))))),p().createElement(m.TabContent,{className:a.tabContent},O&&p().createElement("div",{className:a.threeColumn},p().createElement("div",{className:a.columnLeft},p().createElement("div",{className:a.sectionHeader},p().createElement(m.Icon,{name:"sliders-v-alt"}),p().createElement("span",null,"Chart Configuration")),p().createElement(E,{dataset:O,onDatasetChange:e=>F(r,e)})),p().createElement("div",{className:a.columnCenter},p().createElement(x,{dataset:O})),p().createElement("div",{className:a.columnRight},p().createElement("div",{className:a.sectionHeader},p().createElement(m.Icon,{name:"filter"}),p().createElement("span",null,"Data Filters")),p().createElement(N,{cubeIri:O.cubeIri,dimensions:O.dimensions,selectedFilters:O.fieldMapping.filters||{},onFiltersChange:e=>F(r,{...O,fieldMapping:{...O.fieldMapping,filters:e}})}))))):p().createElement("div",{className:a.emptyState},p().createElement("div",{className:a.emptyCard},p().createElement(m.Icon,{name:"database",size:"xxxl",style:{marginBottom:20,color:"gray"}}),p().createElement("h2",null,"Create Visualizations from LINDAS Data"),p().createElement("p",null,"Browse available datasets from the Swiss Linked Data Service or enter a cube IRI directly."),p().createElement("div",{className:a.emptyActions},p().createElement(m.Button,{size:"lg",onClick:()=>I(!0),icon:"search"},"Browse Datasets"),p().createElement(m.Button,{size:"lg",variant:"secondary",onClick:()=>l(!0),icon:"link"},"Enter Cube IRI")))),p().createElement(m.Modal,{title:"Add Dataset by IRI",isOpen:i,onDismiss:()=>l(!1)},p().createElement(m.Field,{label:"Cube IRI",description:"Enter the IRI of the LINDAS cube (found on visualize.admin.ch)"},p().createElement(m.Input,{value:o,onChange:e=>u(e.currentTarget.value),placeholder:"https://ld.admin.ch/cube/...",autoFocus:!0})),f&&p().createElement(m.LoadingPlaceholder,{text:"Fetching metadata..."}),p().createElement("div",{style:{display:"flex",justifyContent:"flex-end",gap:8,marginTop:16}},p().createElement(m.Button,{variant:"secondary",onClick:()=>l(!1)},"Cancel"),p().createElement(m.Button,{onClick:()=>R(o),disabled:!o||f},"Add Dataset"))),p().createElement(m.ConfirmModal,{isOpen:null!==A,title:"Remove Dataset",body:`Are you sure you want to remove "${t.datasets[A??0]?.title}"?`,confirmText:"Remove",dismissText:"Cancel",onConfirm:()=>{return e=A,n(a=>{const t=a.datasets.filter((a,t)=>t!==e);return{...a,datasets:t}}),r>=e&&s(Math.max(0,r-1)),void k(null);var e},onDismiss:()=>k(null)}))});return o}()});