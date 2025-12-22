define(["@grafana/data","react","@emotion/css","@grafana/ui","@grafana/runtime"],function(e,a,t,n,s){return function(){"use strict";var r={7:function(e){e.exports=n},89:function(e){e.exports=t},531:function(e){e.exports=s},781:function(a){a.exports=e},959:function(e){e.exports=a}},i={};function l(e){var a=i[e];if(void 0!==a)return a.exports;var t=i[e]={exports:{}};return r[e](t,t.exports,l),t.exports}l.n=function(e){var a=e&&e.__esModule?function(){return e.default}:function(){return e};return l.d(a,{a:a}),a},l.d=function(e,a){for(var t in a)l.o(a,t)&&!l.o(e,t)&&Object.defineProperty(e,t,{enumerable:!0,get:a[t]})},l.o=function(e,a){return Object.prototype.hasOwnProperty.call(e,a)},l.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var o={};l.r(o),l.d(o,{plugin:function(){return C}});var c=l(781),u=l(959),d=l.n(u),m=l(89),p=l(7),h=l(531);const g=({onSearch:e,onSelectCube:a,onQueryConfigChange:t,onRunQuery:n,isLoading:s=!1,error:r,initialResults:i=[]})=>{const l=(0,p.useStyles2)(f),[o,c]=(0,u.useState)(""),[m,h]=(0,u.useState)(i),[g,$]=(0,u.useState)(!1),[E,v]=(0,u.useState)(null),[x,w]=(0,u.useState)(!1),[S,N]=(0,u.useState)(new Set),[C,T]=(0,u.useState)(new Set),[k,I]=(0,u.useState)([]),[z,L]=(0,u.useState)(1e4),[O,M]=(0,u.useState)(!0),[P,A]=(0,u.useState)(!0),[D,F]=(0,u.useState)(!1);(0,u.useEffect)(()=>{if(E){const e={cubeUri:E.uri,selectedDimensions:Array.from(S),selectedMeasures:Array.from(C),filters:k,limit:z};t(e)}},[E,S,C,k,z,t]);const R=(0,u.useCallback)(async()=>{$(!0);try{const a=await e(o);h(a)}catch(e){console.error("Search failed:",e)}finally{$(!1)}},[o,e]),B=(0,u.useCallback)(async e=>{w(!0);try{const t=await a(e);t&&(v(t),N(new Set(t.dimensions.map(e=>e.uri))),T(new Set(t.measures.map(e=>e.uri))),I([]))}catch(e){console.error("Failed to load cube:",e)}finally{w(!1)}},[a]),q=(0,u.useCallback)(e=>{N(a=>{const t=new Set(a);return t.has(e)?t.delete(e):t.add(e),t})},[]),G=(0,u.useCallback)(e=>{T(a=>{const t=new Set(a);return t.has(e)?t.delete(e):t.add(e),t})},[]),Q=(0,u.useCallback)(()=>{v(null),N(new Set),T(new Set),I([])},[]),j=[{label:"100 rows",value:100},{label:"1,000 rows",value:1e3},{label:"10,000 rows",value:1e4},{label:"50,000 rows",value:5e4}];return d().createElement("div",{className:l.container},r&&d().createElement(p.Alert,{title:"Error",severity:"error",className:l.alert},r),!E&&d().createElement("div",{className:l.section},d().createElement("h4",{className:l.sectionTitle},d().createElement(p.Icon,{name:"search",className:l.sectionIcon}),"Search Data Cubes"),d().createElement("div",{className:l.searchRow},d().createElement(p.Input,{value:o,onChange:e=>c(e.currentTarget.value),onKeyDown:e=>"Enter"===e.key&&R(),placeholder:"Search by name or keyword...",className:l.searchInput}),d().createElement(p.Button,{onClick:R,disabled:g},g?d().createElement(p.Spinner,{inline:!0,size:"sm"}):"Search")),d().createElement("div",{className:l.resultsList},0===m.length&&!g&&d().createElement("p",{className:l.hint},"Enter a search term or click Search to browse available cubes"),m.map(e=>d().createElement("div",{key:e.uri,className:l.resultItem,onClick:()=>B(e),role:"button",tabIndex:0,onKeyDown:a=>"Enter"===a.key&&B(e)},d().createElement("div",{className:l.resultTitle},e.label),e.description&&d().createElement("div",{className:l.resultDesc},e.description.length>100?`${e.description.slice(0,100)}...`:e.description),e.publisher&&d().createElement("div",{className:l.resultMeta},e.publisher)))),x&&d().createElement("div",{className:l.loadingOverlay},d().createElement(p.Spinner,null)," Loading cube metadata...")),E&&d().createElement(d().Fragment,null,d().createElement("div",{className:l.section},d().createElement("div",{className:l.selectedCubeHeader},d().createElement("div",null,d().createElement("h4",{className:l.sectionTitle},d().createElement(p.Icon,{name:"database",className:l.sectionIcon}),"Selected Cube"),d().createElement("div",{className:l.selectedCubeLabel},E.label),E.publisher&&d().createElement("div",{className:l.selectedCubeMeta},E.publisher)),d().createElement(p.Button,{variant:"secondary",size:"sm",onClick:Q,icon:"times"},"Change"))),d().createElement("div",{className:l.section},d().createElement(p.Collapse,{label:d().createElement("span",{className:l.collapseLabel},d().createElement(p.Icon,{name:"list-ul",className:l.sectionIcon}),"Dimensions (",E.dimensions.length,")"),isOpen:O,onToggle:()=>M(!O)},d().createElement("div",{className:l.checkboxList},E.dimensions.map(e=>d().createElement(b,{key:e.uri,dimension:e,checked:S.has(e.uri),onChange:()=>q(e.uri)})),0===E.dimensions.length&&d().createElement("p",{className:l.hint},"No dimensions found")))),d().createElement("div",{className:l.section},d().createElement(p.Collapse,{label:d().createElement("span",{className:l.collapseLabel},d().createElement(p.Icon,{name:"calculator-alt",className:l.sectionIcon}),"Measures (",E.measures.length,")"),isOpen:P,onToggle:()=>A(!P)},d().createElement("div",{className:l.checkboxList},E.measures.map(e=>d().createElement(y,{key:e.uri,measure:e,checked:C.has(e.uri),onChange:()=>G(e.uri)})),0===E.measures.length&&d().createElement("p",{className:l.hint},"No measures found")))),d().createElement("div",{className:l.section},d().createElement(p.Collapse,{label:d().createElement("span",{className:l.collapseLabel},d().createElement(p.Icon,{name:"cog",className:l.sectionIcon}),"Query Options"),isOpen:D,onToggle:()=>F(!D)},d().createElement("div",{className:l.optionRow},d().createElement("label",null,"Row Limit:"),d().createElement(p.Select,{options:j,value:j.find(e=>e.value===z),onChange:e=>e.value&&L(e.value),width:20})))),d().createElement("div",{className:l.actionSection},d().createElement(p.Button,{variant:"primary",size:"lg",onClick:n,disabled:s||0===S.size&&0===C.size,fullWidth:!0},s?d().createElement(d().Fragment,null,d().createElement(p.Spinner,{inline:!0,size:"sm"})," Generating..."):d().createElement(d().Fragment,null,d().createElement(p.Icon,{name:"code-branch"})," Generate Query")),d().createElement("p",{className:l.selectionSummary},S.size," dimensions, ",C.size," measures selected"))))},b=({dimension:e,checked:a,onChange:t})=>{const n=(0,p.useStyles2)(f);return d().createElement("div",{className:n.checkboxItem},d().createElement(p.Checkbox,{value:a,onChange:t,label:""}),d().createElement(p.Icon,{name:e.isTemporal||"temporal"===e.scaleType?"clock-nine":e.isNumerical||"numerical"===e.scaleType?"calculator-alt":"tag-alt",className:n.typeIcon}),d().createElement("span",{className:n.checkboxLabel},e.label),e.scaleType&&d().createElement("span",{className:n.typeBadge},e.scaleType))},y=({measure:e,checked:a,onChange:t})=>{const n=(0,p.useStyles2)(f);return d().createElement("div",{className:n.checkboxItem},d().createElement(p.Checkbox,{value:a,onChange:t,label:""}),d().createElement(p.Icon,{name:"graph-bar",className:n.typeIcon}),d().createElement("span",{className:n.checkboxLabel},e.label),e.unit&&d().createElement("span",{className:n.unitBadge},e.unit))},f=e=>({container:m.css`
    display: flex;
    flex-direction: column;
    gap: ${e.spacing(2)};
    padding: ${e.spacing(2)};
    height: 100%;
    overflow-y: auto;
  `,section:m.css`
    background: ${e.colors.background.secondary};
    border-radius: ${e.shape.radius.default};
    padding: ${e.spacing(2)};
  `,sectionTitle:m.css`
    margin: 0 0 ${e.spacing(1.5)} 0;
    font-size: ${e.typography.h5.fontSize};
    font-weight: ${e.typography.fontWeightMedium};
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
  `,sectionIcon:m.css`
    color: ${e.colors.text.secondary};
  `,searchRow:m.css`
    display: flex;
    gap: ${e.spacing(1)};
    margin-bottom: ${e.spacing(2)};
  `,searchInput:m.css`
    flex: 1;
  `,resultsList:m.css`
    display: flex;
    flex-direction: column;
    gap: ${e.spacing(1)};
    max-height: 300px;
    overflow-y: auto;
  `,resultItem:m.css`
    padding: ${e.spacing(1.5)};
    background: ${e.colors.background.primary};
    border: 1px solid ${e.colors.border.weak};
    border-radius: ${e.shape.radius.default};
    cursor: pointer;
    transition: border-color 0.2s;

    &:hover {
      border-color: ${e.colors.primary.main};
    }

    &:focus {
      outline: none;
      border-color: ${e.colors.primary.main};
      box-shadow: 0 0 0 2px ${e.colors.primary.transparent};
    }
  `,resultTitle:m.css`
    font-weight: ${e.typography.fontWeightMedium};
    margin-bottom: ${e.spacing(.5)};
  `,resultDesc:m.css`
    font-size: ${e.typography.size.sm};
    color: ${e.colors.text.secondary};
    margin-bottom: ${e.spacing(.5)};
  `,resultMeta:m.css`
    font-size: ${e.typography.size.xs};
    color: ${e.colors.text.disabled};
  `,hint:m.css`
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
    text-align: center;
    padding: ${e.spacing(2)};
  `,loadingOverlay:m.css`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${e.spacing(1)};
    padding: ${e.spacing(2)};
    color: ${e.colors.text.secondary};
  `,selectedCubeHeader:m.css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  `,selectedCubeLabel:m.css`
    font-weight: ${e.typography.fontWeightMedium};
    margin-bottom: ${e.spacing(.5)};
  `,selectedCubeMeta:m.css`
    font-size: ${e.typography.size.sm};
    color: ${e.colors.text.secondary};
  `,collapseLabel:m.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
    font-weight: ${e.typography.fontWeightMedium};
  `,checkboxList:m.css`
    display: flex;
    flex-direction: column;
    gap: ${e.spacing(.5)};
    padding: ${e.spacing(1)} 0;
  `,checkboxItem:m.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
    padding: ${e.spacing(.5)} ${e.spacing(1)};
    border-radius: ${e.shape.radius.default};

    &:hover {
      background: ${e.colors.action.hover};
    }
  `,checkboxLabel:m.css`
    flex: 1;
    font-size: ${e.typography.size.sm};
  `,typeIcon:m.css`
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
  `,typeBadge:m.css`
    font-size: ${e.typography.size.xs};
    color: ${e.colors.text.disabled};
    background: ${e.colors.background.canvas};
    padding: 2px 6px;
    border-radius: ${e.shape.radius.pill};
  `,unitBadge:m.css`
    font-size: ${e.typography.size.xs};
    color: ${e.colors.info.text};
    background: ${e.colors.info.transparent};
    padding: 2px 6px;
    border-radius: ${e.shape.radius.pill};
  `,optionRow:m.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(2)};
    padding: ${e.spacing(1)} 0;

    label {
      font-size: ${e.typography.size.sm};
      color: ${e.colors.text.secondary};
    }
  `,actionSection:m.css`
    margin-top: auto;
    padding-top: ${e.spacing(2)};
  `,selectionSummary:m.css`
    text-align: center;
    font-size: ${e.typography.size.sm};
    color: ${e.colors.text.secondary};
    margin-top: ${e.spacing(1)};
  `,alert:m.css`
    margin-bottom: ${e.spacing(2)};
  `}),$="PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nPREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\nPREFIX qb: <http://purl.org/linked-data/cube#>\nPREFIX cube: <https://cube.link/>\nPREFIX schema: <http://schema.org/>\nPREFIX sh: <http://www.w3.org/ns/shacl#>\nPREFIX qudt: <http://qudt.org/schema/qudt/>\n";class E{constructor(e,a=[],t=[]){this.config=e,this.dimensions=a,this.measures=t}uriToVariable(e){const a=e.split(/[/#]/);return(a[a.length-1]||"var").replace(/[^a-zA-Z0-9]/g,"_").toLowerCase()}escapeString(e){return e.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}buildFilterClause(e,a){if(0===e.values.length)return"";const t=e.values.map(e=>e.startsWith("http://")||e.startsWith("https://")?`<${e}>`:`"${this.escapeString(e)}"`);switch(e.operator){case"in":return`FILTER(?${a} IN (${t.join(", ")}))`;case"equals":return`FILTER(?${a} = ${t[0]})`;case"notEquals":return`FILTER(?${a} != ${t[0]})`;default:return""}}buildObservationQuery(){const{cubeUri:e,selectedDimensions:a,selectedMeasures:t,filters:n,limit:s,orderBy:r}=this.config,i=[],l=[],o=[];l.push(`<${e}> cube:observationSet/cube:observation ?obs .`),a.forEach((e,a)=>{const t=this.dimensions.find(a=>a.uri===e),s=t?this.uriToVariable(t.uri):`dim${a}`,r=`${s}_raw`,c=`${s}_label`;i.push(`?${s}`),l.push(`OPTIONAL { ?obs <${e}> ?${r} . }`),l.push(`OPTIONAL { ?${r} schema:name ?${c} . FILTER(LANG(?${c}) = "en" || LANG(?${c}) = "de" || LANG(?${c}) = "") }`),l.push(`BIND(COALESCE(?${c}, STR(?${r})) AS ?${s})`);const u=n.find(a=>a.dimensionUri===e);u&&o.push(this.buildFilterClause(u,r))}),t.forEach((e,a)=>{const t=this.measures.find(a=>a.uri===e),n=t?this.uriToVariable(t.uri):`measure${a}`;i.push(`?${n}`),l.push(`OPTIONAL { ?obs <${e}> ?${n} . }`)}),0===i.length&&(i.push("?property","?value"),l.push("?obs ?property ?value ."),l.push("FILTER(?property != rdf:type)"),l.push("FILTER(?property != cube:observedBy)"),l.push("FILTER(?property != <https://cube.link/observedBy>)"));let c="";if(r){const e=this.uriToVariable(r.variable);i.some(a=>a.includes(e))&&(c=`ORDER BY ${r.direction}(?${e})`)}return`${$}\nSELECT ${i.join(" ")} WHERE {\n  ${l.join("\n  ")}\n  ${o.join("\n  ")}\n}\n${c}\nLIMIT ${s}`.trim()}buildTimeSeriesQuery(e){const{cubeUri:a,selectedDimensions:t,selectedMeasures:n,filters:s,limit:r}=this.config,i=["?time"],l=[],o=[];l.push(`<${a}> cube:observationSet/cube:observation ?obs .`),l.push(`?obs <${e}> ?time .`);const c=s.find(a=>a.dimensionUri===e);return c&&o.push(this.buildFilterClause(c,"time")),t.filter(a=>a!==e).forEach((e,a)=>{const t=this.dimensions.find(a=>a.uri===e),n=t?this.uriToVariable(t.uri):`dim${a}`,r=`${n}_raw`,c=`${n}_label`;i.push(`?${n}`),l.push(`OPTIONAL { ?obs <${e}> ?${r} . }`),l.push(`OPTIONAL { ?${r} schema:name ?${c} . FILTER(LANG(?${c}) = "en" || LANG(?${c}) = "") }`),l.push(`BIND(COALESCE(?${c}, STR(?${r})) AS ?${n})`);const u=s.find(a=>a.dimensionUri===e);u&&o.push(this.buildFilterClause(u,r))}),n.forEach((e,a)=>{const t=this.measures.find(a=>a.uri===e),n=t?this.uriToVariable(t.uri):`value${a}`;i.push(`?${n}`),l.push(`OPTIONAL { ?obs <${e}> ?${n} . }`)}),`${$}\nSELECT ${i.join(" ")} WHERE {\n  ${l.join("\n  ")}\n  ${o.join("\n  ")}\n}\nORDER BY ASC(?time)\nLIMIT ${r}`.trim()}buildTableQuery(){return this.buildObservationQuery()}build(e="observation"){switch(e){case"timeseries":{const e=this.dimensions.find(e=>e.isTemporal||"temporal"===e.scaleType);return e&&this.config.selectedDimensions.includes(e.uri)?this.buildTimeSeriesQuery(e.uri):this.buildObservationQuery()}case"table":return this.buildTableQuery();default:return this.buildObservationQuery()}}}const v=[{uri:"https://environment.ld.admin.ch/foen/cube/air-quality-2023",label:"Air Quality Measurements Switzerland 2023",description:"Hourly air quality measurements from monitoring stations across Switzerland, including PM2.5, PM10, NO2, and O3 concentrations.",publisher:"Federal Office for the Environment FOEN",dateModified:"2024-01-15",dimensions:[{uri:"https://environment.ld.admin.ch/foen/dimension/measurementDate",label:"Measurement Date",range:"xsd:dateTime",scaleType:"temporal",isTemporal:!0,isNumerical:!1,order:1},{uri:"https://environment.ld.admin.ch/foen/dimension/station",label:"Monitoring Station",range:"xsd:string",scaleType:"nominal",isTemporal:!1,isNumerical:!1,order:2},{uri:"https://environment.ld.admin.ch/foen/dimension/canton",label:"Canton",range:"xsd:string",scaleType:"nominal",isTemporal:!1,isNumerical:!1,order:3},{uri:"https://environment.ld.admin.ch/foen/dimension/pollutant",label:"Pollutant Type",range:"xsd:string",scaleType:"nominal",isTemporal:!1,isNumerical:!1,order:4}],measures:[{uri:"https://environment.ld.admin.ch/foen/measure/concentration",label:"Concentration",unit:"ug/m3",dataType:"xsd:decimal"},{uri:"https://environment.ld.admin.ch/foen/measure/aqi",label:"Air Quality Index",unit:"index",dataType:"xsd:integer"}]},{uri:"https://agriculture.ld.admin.ch/foag/cube/MilkProduction_Canton_Year",label:"Milk Production by Canton",description:"Annual milk production statistics by canton in Switzerland, including organic and conventional production volumes.",publisher:"Federal Office for Agriculture FOAG",dateModified:"2024-02-20",dimensions:[{uri:"https://agriculture.ld.admin.ch/foag/dimension/year",label:"Year",range:"xsd:gYear",scaleType:"temporal",isTemporal:!0,isNumerical:!1,order:1},{uri:"https://agriculture.ld.admin.ch/foag/dimension/canton",label:"Canton",range:"xsd:string",scaleType:"nominal",isTemporal:!1,isNumerical:!1,order:2},{uri:"https://agriculture.ld.admin.ch/foag/dimension/productionType",label:"Production Type",range:"xsd:string",scaleType:"nominal",isTemporal:!1,isNumerical:!1,order:3}],measures:[{uri:"https://agriculture.ld.admin.ch/foag/measure/volume",label:"Production Volume",unit:"kg",dataType:"xsd:decimal"},{uri:"https://agriculture.ld.admin.ch/foag/measure/numberOfFarms",label:"Number of Farms",unit:"count",dataType:"xsd:integer"},{uri:"https://agriculture.ld.admin.ch/foag/measure/averagePrice",label:"Average Price",unit:"CHF/kg",dataType:"xsd:decimal"}]}],x={"https://environment.ld.admin.ch/foen/dimension/canton":[{value:"https://ld.admin.ch/canton/ZH",label:"Zurich"},{value:"https://ld.admin.ch/canton/BE",label:"Bern"},{value:"https://ld.admin.ch/canton/GE",label:"Geneva"},{value:"https://ld.admin.ch/canton/VD",label:"Vaud"},{value:"https://ld.admin.ch/canton/BS",label:"Basel-Stadt"},{value:"https://ld.admin.ch/canton/AG",label:"Aargau"}],"https://environment.ld.admin.ch/foen/dimension/station":[{value:"https://environment.ld.admin.ch/station/ZH-Kaserne",label:"Zurich Kaserne"},{value:"https://environment.ld.admin.ch/station/BE-Bollwerk",label:"Bern Bollwerk"},{value:"https://environment.ld.admin.ch/station/GE-Wilson",label:"Geneva Wilson"},{value:"https://environment.ld.admin.ch/station/BS-Feldberg",label:"Basel Feldberg"}],"https://environment.ld.admin.ch/foen/dimension/pollutant":[{value:"https://environment.ld.admin.ch/pollutant/PM25",label:"PM2.5"},{value:"https://environment.ld.admin.ch/pollutant/PM10",label:"PM10"},{value:"https://environment.ld.admin.ch/pollutant/NO2",label:"NO2"},{value:"https://environment.ld.admin.ch/pollutant/O3",label:"O3"}],"https://agriculture.ld.admin.ch/foag/dimension/canton":[{value:"https://ld.admin.ch/canton/ZH",label:"Zurich"},{value:"https://ld.admin.ch/canton/BE",label:"Bern"},{value:"https://ld.admin.ch/canton/LU",label:"Lucerne"},{value:"https://ld.admin.ch/canton/SG",label:"St. Gallen"},{value:"https://ld.admin.ch/canton/FR",label:"Fribourg"},{value:"https://ld.admin.ch/canton/TG",label:"Thurgau"}],"https://agriculture.ld.admin.ch/foag/dimension/productionType":[{value:"https://agriculture.ld.admin.ch/type/conventional",label:"Conventional"},{value:"https://agriculture.ld.admin.ch/type/organic",label:"Organic"},{value:"https://agriculture.ld.admin.ch/type/alpine",label:"Alpine"}],"https://agriculture.ld.admin.ch/foag/dimension/year":[{value:"2023",label:"2023"},{value:"2022",label:"2022"},{value:"2021",label:"2021"},{value:"2020",label:"2020"},{value:"2019",label:"2019"}]};const w=new class{constructor(e){this.simulateDelay=e?.simulateDelay??!0,this.delayMs=e?.delayMs??500}async delay(){if(this.simulateDelay)return new Promise(e=>setTimeout(e,this.delayMs))}async searchCubes(e=""){await this.delay();const a=e.toLowerCase();return v.filter(t=>!e||t.label.toLowerCase().includes(a)||(t.description?.toLowerCase().includes(a)??!1)||(t.publisher?.toLowerCase().includes(a)??!1)).map(e=>({uri:e.uri,label:e.label,description:e.description,publisher:e.publisher,dateModified:e.dateModified}))}async getCubeMetadata(e){return await this.delay(),v.find(a=>a.uri===e)||null}async getDimensionValues(e,a){await this.delay();return x[a]||[]}getAllCubes(){return v.map(e=>({uri:e.uri,label:e.label,description:e.description,publisher:e.publisher,dateModified:e.dateModified}))}},S="lindas-datasource",N=e=>({container:m.css`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: ${e.spacing(2)};
    gap: ${e.spacing(2)};
  `,header:m.css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: ${e.spacing(3)};
    flex-wrap: wrap;
  `,headerContent:m.css`
    h1 {
      margin: 0 0 ${e.spacing(.5)} 0;
      font-size: ${e.typography.h3.fontSize};
    }
    p {
      margin: 0;
      color: ${e.colors.text.secondary};
    }
  `,headerInfo:m.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
    padding: ${e.spacing(1)} ${e.spacing(2)};
    background: ${e.colors.info.transparent};
    border-radius: ${e.shape.radius.default};
    color: ${e.colors.info.text};
    font-size: ${e.typography.size.sm};
    max-width: 500px;
  `,mainContent:m.css`
    display: flex;
    flex: 1;
    gap: ${e.spacing(2)};
    min-height: 0;
  `,leftPane:m.css`
    width: 400px;
    min-width: 350px;
    max-width: 450px;
    background: ${e.colors.background.secondary};
    border-radius: ${e.shape.radius.default};
    overflow: hidden;
  `,rightPane:m.css`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: ${e.spacing(2)};
    min-width: 0;
    overflow-y: auto;
  `,emptyState:m.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: ${e.spacing(6)};
    background: ${e.colors.background.secondary};
    border-radius: ${e.shape.radius.default};
    flex: 1;

    h2 {
      margin: ${e.spacing(2)} 0 ${e.spacing(1)} 0;
    }
    p {
      color: ${e.colors.text.secondary};
      max-width: 400px;
      margin-bottom: ${e.spacing(3)};
    }
  `,emptyIcon:m.css`
    color: ${e.colors.text.disabled};
  `,features:m.css`
    display: flex;
    flex-direction: column;
    gap: ${e.spacing(1)};
    text-align: left;
  `,feature:m.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
  `,cubeInfo:m.css`
    padding: ${e.spacing(2)};
    background: ${e.colors.background.secondary};
    border-radius: ${e.shape.radius.default};

    h3 {
      margin: 0 0 ${e.spacing(1)} 0;
    }
  `,cubeDescription:m.css`
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
    margin: 0 0 ${e.spacing(1)} 0;
  `,cubeMeta:m.css`
    display: flex;
    gap: ${e.spacing(2)};
    flex-wrap: wrap;
    font-size: ${e.typography.size.sm};
    color: ${e.colors.text.secondary};

    span {
      display: flex;
      align-items: center;
      gap: ${e.spacing(.5)};
    }
  `,querySection:m.css`
    background: ${e.colors.background.secondary};
    border-radius: ${e.shape.radius.default};
    overflow: hidden;
  `,querySectionHeader:m.css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${e.spacing(1.5)} ${e.spacing(2)};
    border-bottom: 1px solid ${e.colors.border.weak};

    h4 {
      margin: 0;
      font-size: ${e.typography.size.sm};
      display: flex;
      align-items: center;
      gap: ${e.spacing(1)};
    }
  `,queryPreview:m.css`
    margin: 0;
    padding: ${e.spacing(2)};
    background: ${e.colors.background.canvas};
    font-size: ${e.typography.size.sm};
    font-family: ${e.typography.fontFamilyMonospace};
    overflow-x: auto;
    max-height: 300px;
    white-space: pre-wrap;
    word-break: break-word;
  `,actions:m.css`
    padding: ${e.spacing(2)};
    background: ${e.colors.background.secondary};
    border-radius: ${e.shape.radius.default};

    h4 {
      margin: 0 0 ${e.spacing(2)} 0;
    }
  `,actionButtons:m.css`
    display: flex;
    gap: ${e.spacing(2)};
    margin-bottom: ${e.spacing(2)};
  `,actionHint:m.css`
    display: flex;
    align-items: flex-start;
    gap: ${e.spacing(1)};
    font-size: ${e.typography.size.sm};
    color: ${e.colors.text.secondary};
    margin: 0;
  `,previewSection:m.css`
    display: flex;
    justify-content: center;
  `}),C=(new c.AppPlugin).setRootPage(()=>{const e=(0,p.useStyles2)(N),[a,t]=(0,u.useState)(null),[n,s]=(0,u.useState)(null),[r,i]=(0,u.useState)(null),[l,o]=(0,u.useState)(!1),[c,m]=(0,u.useState)(null),[b,y]=(0,u.useState)(null),f=(0,u.useCallback)(async e=>{try{return await w.searchCubes(e)}catch(e){return m(`Search failed: ${e instanceof Error?e.message:"Unknown error"}`),[]}},[]),$=(0,u.useCallback)(async e=>{try{m(null);const a=await w.getCubeMetadata(e.uri);return a&&(t(a),s({cubeUri:a.uri,selectedDimensions:a.dimensions.map(e=>e.uri),selectedMeasures:a.measures.map(e=>e.uri),filters:[],limit:1e4})),a}catch(e){return m(`Failed to load cube: ${e instanceof Error?e.message:"Unknown error"}`),null}},[]),v=(0,u.useCallback)(e=>{s(e)},[]),x=(0,u.useCallback)(()=>{if(!n||!a)return;const e=new E(n,a.dimensions,a.measures).build("observation");i(e)},[n,a]),C=(0,u.useCallback)(()=>{r||x();const e={datasource:S,queries:[{refId:"A",queryText:r||"",format:"table"}]},a=encodeURIComponent(JSON.stringify(e));h.locationService.push(`/explore?left=${a}`)},[r,x]),T=(0,u.useCallback)(async()=>{if(a&&n){o(!0),m(null);try{let e=r;e||(e=new E(n,a.dimensions,a.measures).build("observation"));const t=(new Date).toISOString().slice(0,16).replace("T"," "),s={title:`${a.label} - ${t}`,tags:["lindas","auto-generated"],timezone:"browser",schemaVersion:38,panels:[{id:1,type:"table",title:a.label,gridPos:{x:0,y:0,w:24,h:12},datasource:{type:"flandersmake-sparql-datasource",uid:S},targets:[{refId:"A",queryText:e,format:"table"}],options:{showHeader:!0,cellHeight:"sm"},fieldConfig:{defaults:{},overrides:[]}}],annotations:{list:[]},templating:{list:[]},time:{from:"now-6h",to:"now"},refresh:""},i=await(0,h.getBackendSrv)().post("/api/dashboards/db",{dashboard:s,folderUid:"",message:`Created from LINDAS cube: ${a.label}`,overwrite:!1});y("Dashboard created! Opening..."),setTimeout(()=>{h.locationService.push(`/d/${i.uid}`)},500)}catch(e){m(`Failed to create dashboard: ${e.message||"Unknown error"}`)}finally{o(!1)}}else m("Please select a cube and configure your query first")},[a,n,r]);return d().useEffect(()=>{if(b){const e=setTimeout(()=>y(null),3e3);return()=>clearTimeout(e)}},[b]),d().createElement("div",{className:e.container},d().createElement("div",{className:e.header},d().createElement("div",{className:e.headerContent},d().createElement("h1",null,"LINDAS Data Browser"),d().createElement("p",null,"Discover Swiss Linked Data cubes and create visualizations using Grafana's native tools.")),d().createElement("div",{className:e.headerInfo},d().createElement(p.Icon,{name:"info-circle"}),d().createElement("span",null,"This tool helps you find data and build queries. Use Grafana's ",d().createElement("strong",null,"Explore")," or ",d().createElement("strong",null,"Dashboards")," to visualize."))),c&&d().createElement(p.Alert,{title:"Error",severity:"error",onRemove:()=>m(null)},c),b&&d().createElement(p.Alert,{title:"Success",severity:"success"},b),d().createElement("div",{className:e.mainContent},d().createElement("div",{className:e.leftPane},d().createElement(g,{onSearch:f,onSelectCube:$,onQueryConfigChange:v,onRunQuery:x,isLoading:l,error:null})),d().createElement("div",{className:e.rightPane},a?d().createElement(d().Fragment,null,d().createElement("div",{className:e.cubeInfo},d().createElement("h3",null,a.label),a.description&&d().createElement("p",{className:e.cubeDescription},a.description),d().createElement("div",{className:e.cubeMeta},a.publisher&&d().createElement("span",null,d().createElement(p.Icon,{name:"building",size:"sm"})," ",a.publisher),d().createElement("span",null,d().createElement(p.Icon,{name:"list-ul",size:"sm"})," ",a.dimensions.length," dimensions"),d().createElement("span",null,d().createElement(p.Icon,{name:"calculator-alt",size:"sm"})," ",a.measures.length," measures"))),r&&d().createElement("div",{className:e.querySection},d().createElement("div",{className:e.querySectionHeader},d().createElement("h4",null,d().createElement(p.Icon,{name:"code-branch"})," Generated SPARQL Query"),d().createElement(p.ClipboardButton,{variant:"secondary",size:"sm",getText:()=>r,icon:"copy"},"Copy")),d().createElement("pre",{className:e.queryPreview},r)),d().createElement("div",{className:e.actions},d().createElement("h4",null,"What would you like to do?"),d().createElement("div",{className:e.actionButtons},d().createElement(p.Tooltip,{content:"Test your query interactively in Grafana Explore"},d().createElement(p.Button,{variant:"primary",size:"lg",icon:"compass",onClick:C,disabled:!n||0===n.selectedDimensions.length&&0===n.selectedMeasures.length},"Open in Explore")),d().createElement(p.Tooltip,{content:"Create a new dashboard with a panel using this query"},d().createElement(p.Button,{variant:"secondary",size:"lg",icon:"apps",onClick:T,disabled:l||!n||0===n.selectedDimensions.length&&0===n.selectedMeasures.length},l?d().createElement(d().Fragment,null,d().createElement(p.Spinner,{inline:!0,size:"sm"})," Creating..."):"Create Dashboard"))),d().createElement("p",{className:e.actionHint},d().createElement(p.Icon,{name:"info-circle",size:"sm"}),"After opening in Explore or Dashboard, use Grafana's panel editor to change visualization type (table, time series, bar chart, pie chart, etc.)")),!r&&n&&(n.selectedDimensions.length>0||n.selectedMeasures.length>0)&&d().createElement("div",{className:e.previewSection},d().createElement(p.Button,{variant:"secondary",icon:"eye",onClick:x},"Preview SPARQL Query"))):d().createElement("div",{className:e.emptyState},d().createElement(p.Icon,{name:"database",size:"xxxl",className:e.emptyIcon}),d().createElement("h2",null,"Select a Data Cube"),d().createElement("p",null,"Search for a LINDAS data cube in the left panel. Once selected, you can configure your query and open it in Grafana."),d().createElement("div",{className:e.features},d().createElement("div",{className:e.feature},d().createElement(p.Icon,{name:"compass"}),d().createElement("span",null,d().createElement("strong",null,"Explore")," - Interactive query testing")),d().createElement("div",{className:e.feature},d().createElement(p.Icon,{name:"apps"}),d().createElement("span",null,d().createElement("strong",null,"Dashboard")," - Create shareable visualizations")),d().createElement("div",{className:e.feature},d().createElement(p.Icon,{name:"lock"}),d().createElement("span",null,d().createElement("strong",null,"Secure")," - Only LINDAS data accessible")))))))});return o}()});