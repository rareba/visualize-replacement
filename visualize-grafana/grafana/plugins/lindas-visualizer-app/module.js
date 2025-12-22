define(["@grafana/data","react","@emotion/css","@grafana/ui","@grafana/runtime"],function(e,t,a,n,s){return function(){"use strict";var r={7:function(e){e.exports=n},89:function(e){e.exports=a},531:function(e){e.exports=s},781:function(t){t.exports=e},959:function(e){e.exports=t}},i={};function l(e){var t=i[e];if(void 0!==t)return t.exports;var a=i[e]={exports:{}};return r[e](a,a.exports,l),a.exports}l.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return l.d(t,{a:t}),t},l.d=function(e,t){for(var a in t)l.o(t,a)&&!l.o(e,a)&&Object.defineProperty(e,a,{enumerable:!0,get:t[a]})},l.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},l.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var o={};l.r(o),l.d(o,{plugin:function(){return I}});var c=l(781),d=l(959),u=l.n(d),p=l(89),m=l(7),b=l(531);const h="lindas-catalog-language",g=[{label:"DE",value:"de",description:"Deutsch"},{label:"FR",value:"fr",description:"Francais"},{label:"IT",value:"it",description:"Italiano"},{label:"EN",value:"en",description:"English"}],f=["de","fr","it","en"];function y(){const e=new URLSearchParams(window.location.search).get("lang");if(e&&f.includes(e))return e;try{const e=localStorage.getItem(h);if(e&&f.includes(e))return e}catch(e){}return"de"}function v(e){const t={de:["de","en","fr","it"],fr:["fr","de","en","it"],it:["it","de","fr","en"],en:["en","de","fr","it"]}[e];return`\nPREFIX cube: <https://cube.link/>\nPREFIX schema: <http://schema.org/>\nPREFIX dcterms: <http://purl.org/dc/terms/>\n\nSELECT DISTINCT ?cube ?label ?description ?publisher WHERE {\n  ?cube a cube:Cube .\n\n  # CRITICAL FILTERS (same as visualize-tool):\n  # 1. Only cubes marked for the visualize application\n  ?cube schema:workExample <https://ld.admin.ch/application/visualize> .\n\n  # 2. Only published cubes (not drafts)\n  ?cube schema:creativeWorkStatus <https://ld.admin.ch/vocabulary/CreativeWorkStatus/Published> .\n\n  # 3. Must have observation constraint (valid cube structure)\n  ?cube cube:observationConstraint ?shape .\n\n  # 4. Exclude expired cubes\n  FILTER NOT EXISTS { ?cube schema:expires ?expires }\n\n  # Get label with language preference (${e} first)\n  OPTIONAL { ?cube schema:name ?label0 . FILTER(LANG(?label0) = "${t[0]}") }\n  OPTIONAL { ?cube schema:name ?label1 . FILTER(LANG(?label1) = "${t[1]}") }\n  OPTIONAL { ?cube schema:name ?label2 . FILTER(LANG(?label2) = "${t[2]}") }\n  OPTIONAL { ?cube schema:name ?label3 . FILTER(LANG(?label3) = "${t[3]}") }\n  OPTIONAL { ?cube schema:name ?labelAny . FILTER(LANG(?labelAny) = "") }\n  BIND(COALESCE(?label0, ?label1, ?label2, ?label3, ?labelAny, STR(?cube)) AS ?label)\n\n  # Get description with language preference\n  OPTIONAL { ?cube schema:description ?desc0 . FILTER(LANG(?desc0) = "${t[0]}") }\n  OPTIONAL { ?cube schema:description ?desc1 . FILTER(LANG(?desc1) = "${t[1]}") }\n  OPTIONAL { ?cube schema:description ?desc2 . FILTER(LANG(?desc2) = "${t[2]}") }\n  OPTIONAL { ?cube schema:description ?desc3 . FILTER(LANG(?desc3) = "${t[3]}") }\n  BIND(COALESCE(?desc0, ?desc1, ?desc2, ?desc3, "") AS ?description)\n\n  # Get publisher with language preference\n  OPTIONAL {\n    ?cube dcterms:creator ?creatorIri .\n    OPTIONAL { ?creatorIri schema:name ?pub0 . FILTER(LANG(?pub0) = "${t[0]}") }\n    OPTIONAL { ?creatorIri schema:name ?pub1 . FILTER(LANG(?pub1) = "${t[1]}") }\n    OPTIONAL { ?creatorIri schema:name ?pub2 . FILTER(LANG(?pub2) = "${t[2]}") }\n    OPTIONAL { ?creatorIri schema:name ?pub3 . FILTER(LANG(?pub3) = "${t[3]}") }\n    OPTIONAL { ?creatorIri schema:name ?pubAny . FILTER(LANG(?pubAny) = "") }\n  }\n  BIND(COALESCE(?pub0, ?pub1, ?pub2, ?pub3, ?pubAny, "") AS ?publisher)\n}\nORDER BY ?label\n`}async function L(e,t){const a=v(t),n=await fetch("https://lindas.admin.ch/query",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Accept:"application/sparql-results+json"},body:`query=${encodeURIComponent(a)}`});if(!n.ok)throw new Error(`SPARQL query failed: ${n.status}`);return E(await n.json(),e)}function E(e,t){const a=e.results.bindings.map(e=>({uri:e.cube?.value||"",label:e.label?.value||"Unknown",description:e.description?.value||void 0,publisher:e.publisher?.value||void 0}));if(t){const e=t.toLowerCase();return a.filter(t=>t.label.toLowerCase().includes(e)||t.description?.toLowerCase().includes(e)||t.publisher?.toLowerCase().includes(e))}return a}const w=e=>({container:p.css`
    padding: ${e.spacing(3)};
    max-width: 1400px;
    margin: 0 auto;
  `,header:p.css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: ${e.spacing(3)};
    flex-wrap: wrap;
    gap: ${e.spacing(2)};
  `,headerActions:p.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(2)};
    flex-wrap: wrap;
  `,languageSelector:p.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(1)};
  `,languageLabel:p.css`
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
  `,title:p.css`
    margin: 0;
    font-size: ${e.typography.h2.fontSize};
  `,subtitle:p.css`
    margin: ${e.spacing(.5)} 0 0 0;
    color: ${e.colors.text.secondary};
  `,searchContainer:p.css`
    margin-bottom: ${e.spacing(3)};
  `,searchInput:p.css`
    max-width: 600px;
  `,resultsCount:p.css`
    margin-bottom: ${e.spacing(2)};
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
  `,grid:p.css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: ${e.spacing(2)};
  `,card:p.css`
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: ${e.shadows.z3};
    }
  `,publisher:p.css`
    display: flex;
    align-items: center;
    gap: ${e.spacing(.5)};
    color: ${e.colors.text.secondary};
  `,description:p.css`
    color: ${e.colors.text.secondary};
    font-size: ${e.typography.size.sm};
  `,loadingContainer:p.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: ${e.spacing(8)};
    color: ${e.colors.text.secondary};
    gap: ${e.spacing(2)};
  `,emptyContainer:p.css`
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
  `,emptyIcon:p.css`
    color: ${e.colors.text.disabled};
  `}),I=(new c.AppPlugin).setRootPage(()=>{const e=(0,m.useStyles2)(w),[t,a]=(0,d.useState)(""),[n,s]=(0,d.useState)(y),[r,i]=(0,d.useState)([]),[l,o]=(0,d.useState)(!0),[c,p]=(0,d.useState)(null),[f,I]=(0,d.useState)(null),x=(0,d.useCallback)(e=>{s(e),function(e){try{localStorage.setItem(h,e)}catch(e){}const t=new URL(window.location.href);t.searchParams.set("lang",e),window.history.replaceState({},"",t.toString())}(e)},[]);(0,d.useEffect)(()=>{let e=!1;const a=setTimeout(async()=>{o(!0),p(null);try{const a=await async function(e="",t="de"){const a=v(t);try{const n=(await(0,b.getBackendSrv)().get("/api/datasources")).find(e=>"lindas-datasource"===e.type);return n?E(await(0,b.getBackendSrv)().post(`/api/datasources/proxy/${n.id}`,`query=${encodeURIComponent(a)}`,{headers:{"Content-Type":"application/x-www-form-urlencoded",Accept:"application/sparql-results+json"}}),e):await L(e,t)}catch(a){return console.error("Failed to fetch via proxy, trying direct:",a),await L(e,t)}}(t,n);e||i(a)}catch(t){e||p(t.message||"Failed to load datasets")}finally{e||o(!1)}},300);return()=>{e=!0,clearTimeout(a)}},[t,n]);const S=(0,d.useCallback)(async e=>{I(e.uri),p(null);try{const t=await async function(e,t){const a={title:e.label,tags:["lindas","swiss-data",`lang-${t}`],timezone:"browser",schemaVersion:38,panels:[{id:1,type:"text",title:"Getting Started (click to collapse, or delete this panel)",gridPos:{x:0,y:0,w:24,h:6},options:{mode:"markdown",content:'\n# Welcome to Your Dataset Dashboard\n\nThis dashboard was created from a Swiss Open Data dataset. You can customize it to your needs.\n\n## Quick Start\n\n1. **Edit panels**: Hover over a panel title and click to open the menu, then select "Edit"\n2. **Add panels**: Click "Add" in the top menu bar, then "Visualization"\n3. **Change visualization**: In the panel editor, switch between Table, Bar chart, Pie chart, etc.\n4. **Save changes**: Press Ctrl+S or click the save icon in the top right\n\n## Panel Types Available\n\n| Type | Best For |\n|------|----------|\n| Table | Exploring raw data |\n| Bar chart | Comparing categories |\n| Pie chart | Showing proportions |\n| Time series | Trends over time |\n| Stat | Single important numbers |\n\n## Tips\n\n- The data comes from LINDAS (Swiss Linked Data Service)\n- Use the row limit in queries to control data volume\n- Create variables for interactive filtering (Settings > Variables)\n\n---\n\n**You can safely delete this panel** once you are familiar with the dashboard. Just hover over the title and select "Remove".\n'}},{id:2,type:"piechart",title:e.label,gridPos:{x:0,y:6,w:12,h:12},datasource:{type:"lindas-datasource",uid:"lindas-datasource"},targets:[{refId:"A",cubeUri:e.uri,cubeLabel:e.label,limit:20}],options:{reduceOptions:{values:!0,calcs:[],fields:""},pieType:"pie",legend:{displayMode:"table",placement:"right",showLegend:!0,values:["value","percent"]},tooltip:{mode:"single",sort:"none"},displayLabels:["name","percent"]},fieldConfig:{defaults:{color:{mode:"palette-classic"},custom:{hideFrom:{legend:!1,tooltip:!1,viz:!1}}},overrides:[]}},{id:3,type:"barchart",title:`${e.label} - Distribution`,gridPos:{x:12,y:6,w:12,h:12},datasource:{type:"lindas-datasource",uid:"lindas-datasource"},targets:[{refId:"A",cubeUri:e.uri,cubeLabel:e.label,limit:20}],options:{orientation:"vertical",showValue:"auto",stacking:"none",groupWidth:.8,barWidth:.9,barRadius:.1,xTickLabelRotation:-45,xTickLabelMaxLength:20,legend:{displayMode:"list",placement:"bottom",showLegend:!1},tooltip:{mode:"single",sort:"none"}},fieldConfig:{defaults:{color:{mode:"palette-classic"},custom:{axisCenteredZero:!1,axisColorMode:"text",axisLabel:"",axisPlacement:"auto",fillOpacity:85,gradientMode:"hue",hideFrom:{legend:!1,tooltip:!1,viz:!1},lineWidth:0,scaleDistribution:{type:"linear"},thresholdsStyle:{mode:"off"}},thresholds:{mode:"absolute",steps:[{color:"green",value:null}]}},overrides:[]}},{id:4,type:"table",title:"Data Table",gridPos:{x:0,y:18,w:24,h:10},datasource:{type:"lindas-datasource",uid:"lindas-datasource"},targets:[{refId:"A",cubeUri:e.uri,cubeLabel:e.label,limit:500}],options:{showHeader:!0,cellHeight:"sm",footer:{show:!0,reducer:["count"],countRows:!0,fields:""},sortBy:[]},fieldConfig:{defaults:{custom:{align:"auto",cellOptions:{type:"auto"},inspect:!0,filterable:!0}},overrides:[]}}],annotations:{list:[]},templating:{list:[]},links:[{title:"View in Swiss Open Data Catalog",url:`/a/lindas-visualizer-app?lang=${t}`,icon:"external link",type:"link",targetBlank:!1}]};return(await(0,b.getBackendSrv)().post("/api/dashboards/db",{dashboard:a,folderUid:"",message:`Created from LINDAS dataset: ${e.label} (${t})`,overwrite:!0})).uid}(e,n);b.locationService.push(`/d/${t}`)}catch(e){p(`Failed to create dashboard: ${e.message}`),I(null)}},[n]);return u().createElement("div",{className:e.container},u().createElement("div",{className:e.header},u().createElement("div",null,u().createElement("h1",{className:e.title},"Swiss Open Data"),u().createElement("p",{className:e.subtitle},"Browse and visualize datasets from LINDAS")),u().createElement("div",{className:e.headerActions},u().createElement("div",{className:e.languageSelector},u().createElement("span",{className:e.languageLabel},"Language:"),u().createElement(m.RadioButtonGroup,{options:g,value:n,onChange:x,size:"sm"})),u().createElement(m.LinkButton,{href:"https://lindas.admin.ch",target:"_blank",variant:"secondary",icon:"external-link-alt"},"About LINDAS"))),u().createElement("div",{className:e.searchContainer},u().createElement(m.Input,{prefix:u().createElement(m.Icon,{name:"search"}),placeholder:"Search datasets by name, description, or publisher...",value:t,onChange:e=>a(e.currentTarget.value),className:e.searchInput})),c&&u().createElement(m.Alert,{title:"Error",severity:"error",onRemove:()=>p(null)},c),l?u().createElement("div",{className:e.loadingContainer},u().createElement(m.Spinner,{size:"xl"}),u().createElement("p",null,"Loading datasets from LINDAS...")):0===r.length?u().createElement("div",{className:e.emptyContainer},u().createElement(m.Icon,{name:"database",size:"xxxl",className:e.emptyIcon}),u().createElement("h2",null,"No datasets found"),u().createElement("p",null,"Try a different search term")):u().createElement(u().Fragment,null,u().createElement("div",{className:e.resultsCount},r.length," dataset",1!==r.length?"s":""," found"),u().createElement("div",{className:e.grid},r.map(t=>u().createElement(m.Card,{key:t.uri,className:e.card,onClick:()=>S(t),isSelected:f===t.uri},u().createElement(m.Card.Heading,null,t.label),t.publisher&&u().createElement(m.Card.Meta,null,u().createElement("span",{className:e.publisher},u().createElement(m.Icon,{name:"building",size:"sm"})," ",t.publisher)),t.description&&u().createElement(m.Card.Description,{className:e.description},t.description.length>150?t.description.slice(0,150)+"...":t.description),u().createElement(m.Card.Actions,null,u().createElement(m.Button,{size:"sm",icon:f===t.uri?void 0:"plus",disabled:!!f,onClick:e=>{e.stopPropagation(),S(t)}},f===t.uri?u().createElement(u().Fragment,null,u().createElement(m.Spinner,{inline:!0,size:"sm"})," Creating..."):"Create Dashboard")))))))});return o}()});