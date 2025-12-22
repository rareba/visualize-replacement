define(["@grafana/data","react","@emotion/css","@grafana/ui","@grafana/runtime"],function(e,t,a,n,r){return function(){"use strict";var s={7:function(e){e.exports=n},89:function(e){e.exports=a},531:function(e){e.exports=r},781:function(t){t.exports=e},959:function(e){e.exports=t}},i={};function o(e){var t=i[e];if(void 0!==t)return t.exports;var a=i[e]={exports:{}};return s[e](a,a.exports,o),a.exports}o.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return o.d(t,{a:t}),t},o.d=function(e,t){for(var a in t)o.o(t,a)&&!o.o(e,a)&&Object.defineProperty(e,a,{enumerable:!0,get:t[a]})},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var l={};o.r(l),o.d(l,{plugin:function(){return L}});var c=o(781),d=o(959),u=o.n(d),p=o(89),m=o(7),b=o(531);const h=[{label:"DE",value:"de",description:"Deutsch"},{label:"FR",value:"fr",description:"Francais"},{label:"IT",value:"it",description:"Italiano"},{label:"EN",value:"en",description:"English"}];function g(e){const t={de:["de","en","fr","it"],fr:["fr","de","en","it"],it:["it","de","fr","en"],en:["en","de","fr","it"]}[e];return`\nPREFIX cube: <https://cube.link/>\nPREFIX schema: <http://schema.org/>\nPREFIX dcterms: <http://purl.org/dc/terms/>\n\nSELECT DISTINCT ?cube ?label ?description ?publisher WHERE {\n  ?cube a cube:Cube .\n\n  # Get label with language preference (${e} first)\n  OPTIONAL { ?cube schema:name ?label0 . FILTER(LANG(?label0) = "${t[0]}") }\n  OPTIONAL { ?cube schema:name ?label1 . FILTER(LANG(?label1) = "${t[1]}") }\n  OPTIONAL { ?cube schema:name ?label2 . FILTER(LANG(?label2) = "${t[2]}") }\n  OPTIONAL { ?cube schema:name ?label3 . FILTER(LANG(?label3) = "${t[3]}") }\n  OPTIONAL { ?cube schema:name ?labelAny . FILTER(LANG(?labelAny) = "") }\n  BIND(COALESCE(?label0, ?label1, ?label2, ?label3, ?labelAny, STR(?cube)) AS ?label)\n\n  # Get description with language preference\n  OPTIONAL { ?cube schema:description ?desc0 . FILTER(LANG(?desc0) = "${t[0]}") }\n  OPTIONAL { ?cube schema:description ?desc1 . FILTER(LANG(?desc1) = "${t[1]}") }\n  OPTIONAL { ?cube schema:description ?desc2 . FILTER(LANG(?desc2) = "${t[2]}") }\n  OPTIONAL { ?cube schema:description ?desc3 . FILTER(LANG(?desc3) = "${t[3]}") }\n  BIND(COALESCE(?desc0, ?desc1, ?desc2, ?desc3, "") AS ?description)\n\n  # Get publisher with language preference\n  OPTIONAL {\n    ?cube dcterms:creator ?creatorIri .\n    OPTIONAL { ?creatorIri schema:name ?pub0 . FILTER(LANG(?pub0) = "${t[0]}") }\n    OPTIONAL { ?creatorIri schema:name ?pub1 . FILTER(LANG(?pub1) = "${t[1]}") }\n    OPTIONAL { ?creatorIri schema:name ?pub2 . FILTER(LANG(?pub2) = "${t[2]}") }\n    OPTIONAL { ?creatorIri schema:name ?pub3 . FILTER(LANG(?pub3) = "${t[3]}") }\n    OPTIONAL { ?creatorIri schema:name ?pubAny . FILTER(LANG(?pubAny) = "") }\n  }\n  BIND(COALESCE(?pub0, ?pub1, ?pub2, ?pub3, ?pubAny, "") AS ?publisher)\n\n  # Only cubes with actual observations\n  FILTER EXISTS { ?cube cube:observationSet/cube:observation ?obs }\n}\nORDER BY ?label\nLIMIT 200\n`}async function f(e,t){const a=g(t),n=await fetch("https://lindas.admin.ch/query",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Accept:"application/sparql-results+json"},body:`query=${encodeURIComponent(a)}`});if(!n.ok)throw new Error(`SPARQL query failed: ${n.status}`);return y(await n.json(),e)}function y(e,t){const a=e.results.bindings.map(e=>({uri:e.cube?.value||"",label:e.label?.value||"Unknown",description:e.description?.value||void 0,publisher:e.publisher?.value||void 0}));if(t){const e=t.toLowerCase();return a.filter(t=>t.label.toLowerCase().includes(e)||t.description?.toLowerCase().includes(e)||t.publisher?.toLowerCase().includes(e))}return a}const E=e=>({container:p.css`
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
  `}),L=(new c.AppPlugin).setRootPage(()=>{const e=(0,m.useStyles2)(E),[t,a]=(0,d.useState)(""),[n,r]=(0,d.useState)("de"),[s,i]=(0,d.useState)([]),[o,l]=(0,d.useState)(!0),[c,p]=(0,d.useState)(null),[L,I]=(0,d.useState)(null);(0,d.useEffect)(()=>{let e=!1;const a=setTimeout(async()=>{l(!0),p(null);try{const a=await async function(e="",t="de"){const a=g(t);try{const n=(await(0,b.getBackendSrv)().get("/api/datasources")).find(e=>"lindas-datasource"===e.type);return n?y(await(0,b.getBackendSrv)().post(`/api/datasources/proxy/${n.id}`,`query=${encodeURIComponent(a)}`,{headers:{"Content-Type":"application/x-www-form-urlencoded",Accept:"application/sparql-results+json"}}),e):await f(e,t)}catch(a){return console.error("Failed to fetch via proxy, trying direct:",a),await f(e,t)}}(t,n);e||i(a)}catch(t){e||p(t.message||"Failed to load datasets")}finally{e||l(!1)}},300);return()=>{e=!0,clearTimeout(a)}},[t,n]);const w=(0,d.useCallback)(async e=>{I(e.uri),p(null);try{const t=await async function(e){const t={title:e.label,tags:["lindas","swiss-data"],timezone:"browser",schemaVersion:38,panels:[{id:1,type:"text",title:"Getting Started",gridPos:{x:0,y:0,w:24,h:8},options:{mode:"markdown",content:'\n# How to Customize Your Dashboard\n\nWelcome to your new Swiss Open Data dashboard! Here\'s how to make it your own:\n\n## Adding New Panels\n\n1. Click the **"Add"** button in the top menu bar\n2. Select **"Visualization"** to add a new panel\n3. The LINDAS datasource is already configured - just select your dataset\n\n## Editing Panels\n\n1. **Hover** over any panel and click the **title** to open the menu\n2. Select **"Edit"** to modify the visualization\n3. In the panel editor:\n   - **Query tab**: Change the dataset or limit\n   - **Panel options**: Change title, description\n   - **Visualization**: Switch between Table, Bar chart, Pie chart, etc.\n\n## Visualization Types\n\n- **Table**: Best for exploring raw data\n- **Bar chart**: Compare values across categories\n- **Time series**: Show trends over time\n- **Stat**: Display a single important number\n- **Pie chart**: Show proportions\n\n## Tips\n\n- Use **Ctrl+S** (or Cmd+S) to save your dashboard\n- Click the **floppy disk icon** in the top right to save\n- Use **Variables** (gear icon > Variables) to make interactive filters\n\n---\n*This panel can be deleted once you\'re familiar with the dashboard.*\n'}},{id:2,type:"barchart",title:`${e.label} - Bar Chart`,gridPos:{x:0,y:8,w:24,h:10},datasource:{type:"lindas-datasource",uid:"lindas-datasource"},targets:[{refId:"A",cubeUri:e.uri,cubeLabel:e.label,limit:100}],options:{orientation:"horizontal",showValue:"auto",stacking:"none",groupWidth:.7,barWidth:.97,legend:{displayMode:"list",placement:"bottom",showLegend:!0},tooltip:{mode:"single",sort:"none"}},fieldConfig:{defaults:{color:{mode:"palette-classic"},custom:{axisCenteredZero:!1,axisColorMode:"text",axisLabel:"",axisPlacement:"auto",fillOpacity:80,gradientMode:"none",hideFrom:{legend:!1,tooltip:!1,viz:!1},lineWidth:1,scaleDistribution:{type:"linear"}}},overrides:[]}},{id:3,type:"table",title:`${e.label} - Data Table`,gridPos:{x:0,y:18,w:24,h:10},datasource:{type:"lindas-datasource",uid:"lindas-datasource"},targets:[{refId:"A",cubeUri:e.uri,cubeLabel:e.label,limit:1e3}],options:{showHeader:!0,cellHeight:"sm",footer:{show:!0,reducer:["count"],fields:""}},fieldConfig:{defaults:{},overrides:[]}}],annotations:{list:[]},templating:{list:[]}};return(await(0,b.getBackendSrv)().post("/api/dashboards/db",{dashboard:t,folderUid:"",message:`Created from LINDAS dataset: ${e.label}`,overwrite:!0})).uid}(e);b.locationService.push(`/d/${t}`)}catch(e){p(`Failed to create dashboard: ${e.message}`),I(null)}},[]);return u().createElement("div",{className:e.container},u().createElement("div",{className:e.header},u().createElement("div",null,u().createElement("h1",{className:e.title},"Swiss Open Data"),u().createElement("p",{className:e.subtitle},"Browse and visualize datasets from LINDAS")),u().createElement("div",{className:e.headerActions},u().createElement("div",{className:e.languageSelector},u().createElement("span",{className:e.languageLabel},"Language:"),u().createElement(m.RadioButtonGroup,{options:h,value:n,onChange:e=>r(e),size:"sm"})),u().createElement(m.LinkButton,{href:"https://lindas.admin.ch",target:"_blank",variant:"secondary",icon:"external-link-alt"},"About LINDAS"))),u().createElement("div",{className:e.searchContainer},u().createElement(m.Input,{prefix:u().createElement(m.Icon,{name:"search"}),placeholder:"Search datasets by name, description, or publisher...",value:t,onChange:e=>a(e.currentTarget.value),className:e.searchInput})),c&&u().createElement(m.Alert,{title:"Error",severity:"error",onRemove:()=>p(null)},c),o?u().createElement("div",{className:e.loadingContainer},u().createElement(m.Spinner,{size:"xl"}),u().createElement("p",null,"Loading datasets from LINDAS...")):0===s.length?u().createElement("div",{className:e.emptyContainer},u().createElement(m.Icon,{name:"database",size:"xxxl",className:e.emptyIcon}),u().createElement("h2",null,"No datasets found"),u().createElement("p",null,"Try a different search term")):u().createElement(u().Fragment,null,u().createElement("div",{className:e.resultsCount},s.length," dataset",1!==s.length?"s":""," found"),u().createElement("div",{className:e.grid},s.map(t=>u().createElement(m.Card,{key:t.uri,className:e.card,onClick:()=>w(t),isSelected:L===t.uri},u().createElement(m.Card.Heading,null,t.label),t.publisher&&u().createElement(m.Card.Meta,null,u().createElement("span",{className:e.publisher},u().createElement(m.Icon,{name:"building",size:"sm"})," ",t.publisher)),t.description&&u().createElement(m.Card.Description,{className:e.description},t.description.length>150?t.description.slice(0,150)+"...":t.description),u().createElement(m.Card.Actions,null,u().createElement(m.Button,{size:"sm",icon:L===t.uri?void 0:"plus",disabled:!!L,onClick:e=>{e.stopPropagation(),w(t)}},L===t.uri?u().createElement(u().Fragment,null,u().createElement(m.Spinner,{inline:!0,size:"sm"})," Creating..."):"Create Dashboard")))))))});return l}()});