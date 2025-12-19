define(["@grafana/data","react","@grafana/ui","@emotion/css","@grafana/runtime"],function(e,a,t,r,n){return function(){"use strict";var s={7:function(e){e.exports=t},89:function(e){e.exports=r},531:function(e){e.exports=n},781:function(a){a.exports=e},959:function(e){e.exports=a}},l={};function i(e){var a=l[e];if(void 0!==a)return a.exports;var t=l[e]={exports:{}};return s[e](t,t.exports,i),t.exports}i.n=function(e){var a=e&&e.__esModule?function(){return e.default}:function(){return e};return i.d(a,{a:a}),a},i.d=function(e,a){for(var t in a)i.o(a,t)&&!i.o(e,t)&&Object.defineProperty(e,t,{enumerable:!0,get:a[t]})},i.o=function(e,a){return Object.prototype.hasOwnProperty.call(e,a)},i.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var o={};i.r(o),i.d(o,{plugin:function(){return E}});var c=i(781),d=i(959),p=i.n(d),u=i(7),m=i(89),b=i(531);async function h(e){try{const a=await(0,b.getBackendSrv)().fetch({url:"/api/datasources/proxy/uid/lindas-datasource",method:"POST",headers:{"Content-Type":"application/sparql-query",Accept:"application/sparql-results+json"},data:e}).toPromise();return a?.data}catch(a){console.log("Proxy failed, trying direct fetch:",a);try{const a=await fetch("https://lindas.admin.ch/query",{method:"POST",headers:{"Content-Type":"application/sparql-query",Accept:"application/sparql-results+json"},body:e});if(!a.ok){const e=await a.text();throw new Error(`HTTP ${a.status}: ${e||a.statusText}`)}return a.json()}catch(e){throw new Error(`SPARQL request failed: ${e instanceof Error?e.message:"Unknown error"}`)}}}const g=[{id:"barchart",label:"Column",icon:"graph-bar",description:"Compare values vertically"},{id:"barchart-horizontal",label:"Bar",icon:"bars",description:"Compare values horizontally"},{id:"timeseries",label:"Line",icon:"gf-interpolation-linear",description:"Show trends over time"},{id:"timeseries-area",label:"Area",icon:"gf-interpolation-linear",description:"Filled line chart"},{id:"piechart",label:"Pie",icon:"circle",description:"Show proportions"},{id:"table",label:"Table",icon:"table",description:"Tabular data view"}],f=e=>({container:m.css`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: ${e.spacing(2)};
    background: ${e.colors.background.canvas};
  `,header:m.css`
    margin-bottom: ${e.spacing(2)};
    border-bottom: 1px solid ${e.colors.border.weak};
    padding-bottom: ${e.spacing(2)};
  `,title:m.css`
    font-size: 24px;
    font-weight: 500;
    margin: 0 0 4px 0;
  `,subtitle:m.css`
    color: ${e.colors.text.secondary};
    margin: 0;
    font-size: 14px;
  `,layout:m.css`
    display: grid;
    grid-template-columns: 180px 1fr 280px;
    gap: ${e.spacing(2)};
    flex: 1;
    min-height: 0;
  `,chartTypePanel:m.css`
    display: flex;
    flex-direction: column;
    gap: ${e.spacing(1)};
  `,sectionLabel:m.css`
    font-size: 11px;
    font-weight: 600;
    color: ${e.colors.text.secondary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: ${e.spacing(.5)};
  `,chartTypeBtn:m.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1.5)};
    padding: ${e.spacing(1.5)};
    border: 1px solid ${e.colors.border.weak};
    border-radius: 4px;
    background: ${e.colors.background.primary};
    cursor: pointer;
    transition: all 0.1s ease;
    text-align: left;
    font-size: 14px;

    &:hover {
      border-color: ${e.colors.border.medium};
      background: ${e.colors.background.secondary};
    }
  `,chartTypeBtnActive:m.css`
    border-color: ${e.colors.primary.border};
    background: ${e.colors.primary.transparent};
    &:hover {
      border-color: ${e.colors.primary.border};
    }
  `,previewPanel:m.css`
    display: flex;
    flex-direction: column;
    background: ${e.colors.background.primary};
    border: 1px solid ${e.colors.border.weak};
    border-radius: 4px;
    overflow: hidden;
  `,previewHeader:m.css`
    padding: ${e.spacing(1.5)};
    border-bottom: 1px solid ${e.colors.border.weak};
    background: ${e.colors.background.secondary};
  `,previewBody:m.css`
    flex: 1;
    padding: ${e.spacing(2)};
    overflow: auto;
    display: flex;
    flex-direction: column;
  `,summaryTable:m.css`
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    margin-top: ${e.spacing(2)};

    th, td {
      padding: ${e.spacing(1)};
      border: 1px solid ${e.colors.border.weak};
      text-align: left;
    }
    th {
      background: ${e.colors.background.secondary};
      font-weight: 500;
    }
    td:last-child {
      color: ${e.colors.primary.text};
      font-weight: 500;
    }
  `,configPanel:m.css`
    display: flex;
    flex-direction: column;
    gap: ${e.spacing(2)};
  `,configSection:m.css`
    background: ${e.colors.background.primary};
    border: 1px solid ${e.colors.border.weak};
    border-radius: 4px;
    padding: ${e.spacing(2)};
  `,fieldRow:m.css`
    margin-bottom: ${e.spacing(2)};
    &:last-child { margin-bottom: 0; }
  `,fieldLabel:m.css`
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: ${e.colors.text.secondary};
    margin-bottom: 4px;
  `,createBtn:m.css`
    margin-top: auto;
  `,centerBox:m.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: ${e.spacing(2)};
    text-align: center;
  `,cubeInput:m.css`
    max-width: 500px;
    margin-bottom: ${e.spacing(2)};
  `,hint:m.css`
    font-size: 12px;
    color: ${e.colors.text.secondary};
    margin-top: ${e.spacing(1)};
  `}),E=(new c.AppPlugin).setRootPage(e=>{const a=(0,u.useStyles2)(f),[t,r]=(0,d.useState)(""),[n,s]=(0,d.useState)(null),[l,i]=(0,d.useState)(!1),[o,c]=(0,d.useState)(null),[m,E]=(0,d.useState)("barchart"),[y,v]=(0,d.useState)({}),[x,w]=(0,d.useState)(!1),[L,N]=(0,d.useState)("");(0,d.useEffect)(()=>{const e=new URLSearchParams(window.location.search).get("cube");e&&r(e)},[]),(0,d.useEffect)(()=>{t?(async()=>{i(!0),c(null);try{const e=await async function(e){const a=`\nPREFIX schema: <http://schema.org/>\nPREFIX cube: <https://cube.link/>\n\nSELECT ?label ?description WHERE {\n  <${e}> a cube:Cube .\n  OPTIONAL { <${e}> schema:name ?label . FILTER(LANG(?label) = "en" || LANG(?label) = "") }\n  OPTIONAL { <${e}> schema:description ?description . FILTER(LANG(?description) = "en" || LANG(?description) = "") }\n} LIMIT 1\n  `.trim(),t=`\nPREFIX schema: <http://schema.org/>\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nPREFIX cube: <https://cube.link/>\nPREFIX sh: <http://www.w3.org/ns/shacl#>\nPREFIX qudt: <http://qudt.org/schema/qudt/>\n\nSELECT DISTINCT ?dimension ?label ?order WHERE {\n  <${e}> cube:observationConstraint ?shape .\n  ?shape sh:property ?prop .\n  ?prop sh:path ?dimension .\n\n  FILTER NOT EXISTS { ?prop qudt:unit ?unit }\n  FILTER NOT EXISTS { ?prop schema:unitCode ?unitCode }\n  FILTER NOT EXISTS { ?prop qudt:hasUnit ?hasUnit }\n\n  OPTIONAL { ?prop schema:name ?propLabel . FILTER(LANG(?propLabel) = "en" || LANG(?propLabel) = "") }\n  OPTIONAL { ?prop rdfs:label ?rdfsLabel . FILTER(LANG(?rdfsLabel) = "en" || LANG(?rdfsLabel) = "") }\n  OPTIONAL { ?prop sh:order ?order }\n\n  BIND(COALESCE(?propLabel, ?rdfsLabel) AS ?label)\n}\nORDER BY ?order ?label\n  `.trim(),r=`\nPREFIX schema: <http://schema.org/>\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nPREFIX cube: <https://cube.link/>\nPREFIX sh: <http://www.w3.org/ns/shacl#>\nPREFIX qudt: <http://qudt.org/schema/qudt/>\n\nSELECT DISTINCT ?measure ?label WHERE {\n  <${e}> cube:observationConstraint ?shape .\n  ?shape sh:property ?prop .\n  ?prop sh:path ?measure .\n\n  { ?prop qudt:unit ?unit }\n  UNION { ?prop schema:unitCode ?unitCode }\n  UNION { ?prop qudt:hasUnit ?hasUnit }\n\n  OPTIONAL { ?prop schema:name ?propLabel . FILTER(LANG(?propLabel) = "en" || LANG(?propLabel) = "") }\n  OPTIONAL { ?prop rdfs:label ?rdfsLabel . FILTER(LANG(?rdfsLabel) = "en" || LANG(?rdfsLabel) = "") }\n\n  BIND(COALESCE(?propLabel, ?rdfsLabel) AS ?label)\n}\nORDER BY ?label\n  `.trim(),[n,s,l]=await Promise.all([h(a),h(t),h(r)]),i=n?.results?.bindings||[],o=i[0]?.label?.value||e.split("/").pop()||"Unnamed Cube",c=i[0]?.description?.value,d=new Map;(s?.results?.bindings||[]).forEach(e=>{const a=e.dimension?.value;a&&!d.has(a)&&d.set(a,{iri:a,label:e.label?.value||a.split("/").pop()||a,order:e.order?.value?parseInt(e.order.value,10):void 0})});const p=new Map;return(l?.results?.bindings||[]).forEach(e=>{const a=e.measure?.value;a&&!p.has(a)&&p.set(a,{iri:a,label:e.label?.value||a.split("/").pop()||a})}),{iri:e,label:o,description:c,dimensions:Array.from(d.values()),measures:Array.from(p.values())}}(t);s(e),N(e.label),e.measures.length>0&&v(a=>({...a,y:e.measures[0].iri,value:e.measures[0].iri})),e.dimensions.length>0&&v(a=>({...a,x:e.dimensions[0].iri,segment:e.dimensions[0].iri}))}catch(e){c(e instanceof Error?e.message:"Failed to load cube")}finally{i(!1)}})():s(null)},[t]);const T=(0,d.useMemo)(()=>n?.dimensions.map(e=>({label:e.label,value:e.iri}))||[],[n]),$=(0,d.useMemo)(()=>n?.measures.map(e=>({label:e.label,value:e.iri}))||[],[n]),I=(0,d.useMemo)(()=>!!(n&&L&&("table"===m||("piechart"===m?y.value&&y.segment:y.x&&y.y))),[n,L,m,y]);return t?l?p().createElement("div",{className:a.centerBox},p().createElement(u.Spinner,{size:"xl"}),p().createElement("p",null,"Loading cube metadata...")):o?p().createElement("div",{className:a.container},p().createElement(u.Alert,{severity:"error",title:"Error"},o),p().createElement(u.Button,{variant:"secondary",onClick:()=>{r(""),c(null)},style:{marginTop:16}},"Try different cube")):p().createElement("div",{className:a.container},p().createElement("div",{className:a.header},p().createElement("h1",{className:a.title},"Create Chart"),p().createElement("p",{className:a.subtitle},n?.label||t)),p().createElement("div",{className:a.layout},p().createElement("div",{className:a.chartTypePanel},p().createElement("div",{className:a.sectionLabel},"Chart Type"),g.map(e=>p().createElement("button",{key:e.id,className:`${a.chartTypeBtn} ${m===e.id?a.chartTypeBtnActive:""}`,onClick:()=>E(e.id),title:e.description},p().createElement(u.Icon,{name:e.icon}),p().createElement("span",null,e.label)))),p().createElement("div",{className:a.previewPanel},p().createElement("div",{className:a.previewHeader},p().createElement(u.Input,{value:L,onChange:e=>N(e.currentTarget.value),placeholder:"Chart title"})),p().createElement("div",{className:a.previewBody},p().createElement("p",{style:{color:"#666",marginBottom:8}},p().createElement("strong",null,g.find(e=>e.id===m)?.label)," with ",n?.dimensions.length," dimensions, ",n?.measures.length," measures"),p().createElement("table",{className:a.summaryTable},p().createElement("thead",null,p().createElement("tr",null,p().createElement("th",null,"Field"),p().createElement("th",null,"Name"),p().createElement("th",null,"Role"))),p().createElement("tbody",null,n?.dimensions.map(e=>p().createElement("tr",{key:e.iri},p().createElement("td",null,"Dimension"),p().createElement("td",null,e.label),p().createElement("td",null,y.x===e.iri&&"X Axis",y.segment===e.iri&&"piechart"===m&&"Segment",y.series===e.iri&&"Series"))),n?.measures.map(e=>p().createElement("tr",{key:e.iri},p().createElement("td",null,"Measure"),p().createElement("td",null,e.label),p().createElement("td",null,y.y===e.iri&&"Y Axis",y.value===e.iri&&"piechart"===m&&"Value"))))))),p().createElement("div",{className:a.configPanel},p().createElement("div",{className:a.configSection},p().createElement("div",{className:a.sectionLabel},"Field Mapping"),"piechart"===m?p().createElement(p().Fragment,null,p().createElement("div",{className:a.fieldRow},p().createElement("label",{className:a.fieldLabel},"Value (measure)"),p().createElement(u.Select,{options:$,value:$.find(e=>e.value===y.value),onChange:e=>v(a=>({...a,value:e?.value})),placeholder:"Select..."})),p().createElement("div",{className:a.fieldRow},p().createElement("label",{className:a.fieldLabel},"Segment (dimension)"),p().createElement(u.Select,{options:T,value:T.find(e=>e.value===y.segment),onChange:e=>v(a=>({...a,segment:e?.value})),placeholder:"Select..."}))):"table"===m?p().createElement("p",{style:{color:"#666",fontSize:12}},"All fields displayed as columns"):p().createElement(p().Fragment,null,p().createElement("div",{className:a.fieldRow},p().createElement("label",{className:a.fieldLabel},"X Axis (dimension)"),p().createElement(u.Select,{options:T,value:T.find(e=>e.value===y.x),onChange:e=>v(a=>({...a,x:e?.value})),placeholder:"Select..."})),p().createElement("div",{className:a.fieldRow},p().createElement("label",{className:a.fieldLabel},"Y Axis (measure)"),p().createElement(u.Select,{options:$,value:$.find(e=>e.value===y.y),onChange:e=>v(a=>({...a,y:e?.value})),placeholder:"Select..."})),p().createElement("div",{className:a.fieldRow},p().createElement("label",{className:a.fieldLabel},"Series (optional)"),p().createElement(u.Select,{options:T,value:T.find(e=>e.value===y.series),onChange:e=>v(a=>({...a,series:e?.value})),placeholder:"None",isClearable:!0})))),p().createElement(u.Button,{className:a.createBtn,variant:"primary",size:"lg",disabled:!I||x,onClick:async()=>{if(n){w(!0);try{const e={cubeIri:t,chartType:m,title:L,fieldMapping:y,dimensions:n.dimensions,measures:n.measures},a=await async function(e){const a=function(e){switch(e){case"barchart":case"barchart-horizontal":return"barchart";case"timeseries":case"timeseries-area":default:return"timeseries";case"piechart":return"piechart";case"table":return"table"}}(e.chartType),t=function(e){const{cubeIri:a,fieldMapping:t,dimensions:r,measures:n,chartType:s}=e,l=[],i=[];return i.push("?obs a <https://cube.link/Observation> ."),i.push(`?obs <https://cube.link/observedBy> <${a}> .`),"table"===s?(r.forEach((e,a)=>{l.push(`?dim${a}`),i.push(`OPTIONAL { ?obs <${e.iri}> ?dim${a} . }`)}),n.forEach((e,a)=>{l.push(`?measure${a}`),i.push(`OPTIONAL { ?obs <${e.iri}> ?measure${a} . }`)})):"piechart"===s?(t.value&&(l.push("?value"),i.push(`?obs <${t.value}> ?value .`)),t.segment&&(l.push("?segment"),i.push(`?obs <${t.segment}> ?segment .`))):(t.x&&(l.push("?x"),i.push(`?obs <${t.x}> ?x .`)),t.y&&(l.push("?y"),i.push(`?obs <${t.y}> ?y .`)),t.series&&(l.push("?series"),i.push(`?obs <${t.series}> ?series .`))),`SELECT ${l.join(" ")} WHERE {\n  ${i.join("\n  ")}\n}\nORDER BY ?x ?segment\nLIMIT 10000`}(e),r=function(e){switch(e){case"barchart":return{orientation:"vertical",xTickLabelRotation:-45,legend:{displayMode:"list",placement:"bottom"}};case"barchart-horizontal":return{orientation:"horizontal",legend:{displayMode:"list",placement:"right"}};case"timeseries":case"timeseries-area":return{legend:{displayMode:"list",placement:"bottom"}};case"piechart":return{legend:{displayMode:"table",placement:"right",values:["value","percent"]},pieType:"pie",displayLabels:["name","percent"]};case"table":return{showHeader:!0,sortBy:[]};default:return{}}}(e.chartType),n=function(e){const a={custom:{}};return"timeseries-area"===e&&(a.custom.fillOpacity=50,a.custom.lineWidth=1),{defaults:a,overrides:[]}}(e.chartType),s={title:e.title,tags:["lindas","auto-generated"],timezone:"browser",schemaVersion:38,panels:[{id:1,type:a,title:e.title,gridPos:{x:0,y:0,w:24,h:16},datasource:{type:"flandersmake-sparql-datasource",uid:"lindas-datasource"},targets:[{refId:"A",rawQuery:t,format:"table"}],options:r,fieldConfig:n}],annotations:{list:[{builtIn:1,datasource:{type:"grafana",uid:"-- Grafana --"},enable:!0,hide:!0,iconColor:"rgba(0, 211, 255, 1)",name:"Annotations & Alerts",type:"dashboard"}]},templating:{list:[]},time:{from:"now-6h",to:"now"},refresh:"",links:[{title:"Source Cube",url:e.cubeIri,icon:"external link",type:"link",targetBlank:!0}]};return(await(0,b.getBackendSrv)().post("/api/dashboards/db",{dashboard:s,folderUid:"",message:`Created from LINDAS cube: ${e.cubeIri}`,overwrite:!1})).uid}(e);b.locationService.push(`/d/${a}`)}catch(e){c(e instanceof Error?e.message:"Failed to create dashboard"),w(!1)}}}},x?"Creating...":"Create Dashboard")))):p().createElement("div",{className:a.container},p().createElement("div",{className:a.header},p().createElement("h1",{className:a.title},"Create Chart"),p().createElement("p",{className:a.subtitle},"Enter a LINDAS cube IRI to start")),p().createElement("div",{className:a.cubeInput},p().createElement(u.Input,{placeholder:"https://example.org/cube/...",onChange:e=>r(e.currentTarget.value)}),p().createElement("p",{className:a.hint},"Tip: Pass cube IRI via URL: ?cube=https://...")))});return o}()});