define(["@grafana/data","react","@emotion/css","@grafana/ui","@grafana/runtime"],function(e,t,n,a,r){return function(){"use strict";var s={7:function(e){e.exports=a},89:function(e){e.exports=n},531:function(e){e.exports=r},781:function(t){t.exports=e},959:function(e){e.exports=t}},i={};function o(e){var t=i[e];if(void 0!==t)return t.exports;var n=i[e]={exports:{}};return s[e](n,n.exports,o),n.exports}o.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return o.d(t,{a:t}),t},o.d=function(e,t){for(var n in t)o.o(t,n)&&!o.o(e,n)&&Object.defineProperty(e,n,{enumerable:!0,get:t[n]})},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var c={};o.r(c),o.d(c,{plugin:function(){return E}});var l=o(781),d=o(959),u=o.n(d),p=o(89),m=o(7),b=o(531);const g='\nPREFIX cube: <https://cube.link/>\nPREFIX schema: <http://schema.org/>\nPREFIX dcterms: <http://purl.org/dc/terms/>\n\nSELECT DISTINCT ?cube ?label ?description ?publisher WHERE {\n  ?cube a cube:Cube .\n\n  # Get label with language preference\n  OPTIONAL { ?cube schema:name ?labelDe . FILTER(LANG(?labelDe) = "de") }\n  OPTIONAL { ?cube schema:name ?labelEn . FILTER(LANG(?labelEn) = "en") }\n  OPTIONAL { ?cube schema:name ?labelAny . FILTER(LANG(?labelAny) = "") }\n  BIND(COALESCE(?labelDe, ?labelEn, ?labelAny, STR(?cube)) AS ?label)\n\n  # Get description\n  OPTIONAL { ?cube schema:description ?descDe . FILTER(LANG(?descDe) = "de") }\n  OPTIONAL { ?cube schema:description ?descEn . FILTER(LANG(?descEn) = "en") }\n  BIND(COALESCE(?descDe, ?descEn, "") AS ?description)\n\n  # Get publisher\n  OPTIONAL {\n    ?cube dcterms:creator ?creatorIri .\n    ?creatorIri schema:name ?publisherName .\n  }\n  BIND(COALESCE(?publisherName, "") AS ?publisher)\n\n  # Only cubes with actual observations\n  FILTER EXISTS { ?cube cube:observationSet/cube:observation ?obs }\n}\nORDER BY ?label\nLIMIT 200\n';async function h(e){const t=await fetch("https://lindas.admin.ch/query",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Accept:"application/sparql-results+json"},body:`query=${encodeURIComponent(g)}`});if(!t.ok)throw new Error(`SPARQL query failed: ${t.status}`);return f(await t.json(),e)}function f(e,t){const n=e.results.bindings.map(e=>({uri:e.cube?.value||"",label:e.label?.value||"Unknown",description:e.description?.value||void 0,publisher:e.publisher?.value||void 0}));if(t){const e=t.toLowerCase();return n.filter(t=>t.label.toLowerCase().includes(e)||t.description?.toLowerCase().includes(e)||t.publisher?.toLowerCase().includes(e))}return n}const y=e=>({container:p.css`
    padding: ${e.spacing(3)};
    max-width: 1400px;
    margin: 0 auto;
  `,header:p.css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: ${e.spacing(3)};
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
  `}),E=(new l.AppPlugin).setRootPage(()=>{const e=(0,m.useStyles2)(y),[t,n]=(0,d.useState)(""),[a,r]=(0,d.useState)([]),[s,i]=(0,d.useState)(!0),[o,c]=(0,d.useState)(null),[l,p]=(0,d.useState)(null);(0,d.useEffect)(()=>{let e=!1;const n=setTimeout(async()=>{i(!0),c(null);try{const n=await async function(e=""){try{const t=(await(0,b.getBackendSrv)().get("/api/datasources")).find(e=>"lindas-datasource"===e.type);return t?f(await(0,b.getBackendSrv)().post(`/api/datasources/proxy/${t.id}`,`query=${encodeURIComponent(g)}`,{headers:{"Content-Type":"application/x-www-form-urlencoded",Accept:"application/sparql-results+json"}}),e):await h(e)}catch(t){return console.error("Failed to fetch via proxy, trying direct:",t),await h(e)}}(t);e||r(n)}catch(t){e||c(t.message||"Failed to load datasets")}finally{e||i(!1)}},300);return()=>{e=!0,clearTimeout(n)}},[t]);const E=(0,d.useCallback)(async e=>{p(e.uri),c(null);try{const t=await async function(e){const t={title:e.label,tags:["lindas","swiss-data"],timezone:"browser",schemaVersion:38,panels:[{id:1,type:"table",title:e.label,gridPos:{x:0,y:0,w:24,h:12},datasource:{type:"lindas-datasource",uid:"lindas-datasource"},targets:[{refId:"A",cubeUri:e.uri,cubeLabel:e.label,limit:1e3}],options:{showHeader:!0,cellHeight:"sm"},fieldConfig:{defaults:{},overrides:[]}}],annotations:{list:[]},templating:{list:[]}};return(await(0,b.getBackendSrv)().post("/api/dashboards/db",{dashboard:t,folderUid:"",message:`Created from LINDAS dataset: ${e.label}`,overwrite:!0})).uid}(e);b.locationService.push(`/d/${t}`)}catch(e){c(`Failed to create dashboard: ${e.message}`),p(null)}},[]);return u().createElement("div",{className:e.container},u().createElement("div",{className:e.header},u().createElement("div",null,u().createElement("h1",{className:e.title},"Swiss Open Data"),u().createElement("p",{className:e.subtitle},"Browse and visualize datasets from LINDAS")),u().createElement(m.LinkButton,{href:"https://lindas.admin.ch",target:"_blank",variant:"secondary",icon:"external-link-alt"},"About LINDAS")),u().createElement("div",{className:e.searchContainer},u().createElement(m.Input,{prefix:u().createElement(m.Icon,{name:"search"}),placeholder:"Search datasets by name, description, or publisher...",value:t,onChange:e=>n(e.currentTarget.value),className:e.searchInput})),o&&u().createElement(m.Alert,{title:"Error",severity:"error",onRemove:()=>c(null)},o),s?u().createElement("div",{className:e.loadingContainer},u().createElement(m.Spinner,{size:"xl"}),u().createElement("p",null,"Loading datasets from LINDAS...")):0===a.length?u().createElement("div",{className:e.emptyContainer},u().createElement(m.Icon,{name:"database",size:"xxxl",className:e.emptyIcon}),u().createElement("h2",null,"No datasets found"),u().createElement("p",null,"Try a different search term")):u().createElement(u().Fragment,null,u().createElement("div",{className:e.resultsCount},a.length," dataset",1!==a.length?"s":""," found"),u().createElement("div",{className:e.grid},a.map(t=>u().createElement(m.Card,{key:t.uri,className:e.card,onClick:()=>E(t),isSelected:l===t.uri},u().createElement(m.Card.Heading,null,t.label),t.publisher&&u().createElement(m.Card.Meta,null,u().createElement("span",{className:e.publisher},u().createElement(m.Icon,{name:"building",size:"sm"})," ",t.publisher)),t.description&&u().createElement(m.Card.Description,{className:e.description},t.description.length>150?t.description.slice(0,150)+"...":t.description),u().createElement(m.Card.Actions,null,u().createElement(m.Button,{size:"sm",icon:l===t.uri?void 0:"plus",disabled:!!l,onClick:e=>{e.stopPropagation(),E(t)}},l===t.uri?u().createElement(u().Fragment,null,u().createElement(m.Spinner,{inline:!0,size:"sm"})," Creating..."):"Create Dashboard")))))))});return c}()});