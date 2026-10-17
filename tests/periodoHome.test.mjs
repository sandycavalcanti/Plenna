import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transformSync} from '@babel/core';
const base=new URL('../',import.meta.url);
const source=await readFile(new URL('src/utils/periodoHome.js',base),'utf8');
const {deslocarMes,apresentarMesHome,navegacaoMensalHome}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('year transitions and Portuguese month label',()=>{
 assert.equal(deslocarMes('2026-01',-1),'2025-12');
 assert.equal(deslocarMes('2025-12',1),'2026-01');
 assert.equal(apresentarMesHome('2026-10'),'Outubro de 2026');
});
test('API lower bound overrides assumptions about account creation',()=>{
 const limits={periodoMinimo:'2024-12',periodoMaximo:'2026-10'};
 assert.equal(navegacaoMensalHome('2025-01',limits,false,false,'2026-10').anterior,'2024-12');
 assert.equal(navegacaoMensalHome('2024-12',limits,false,false,'2026-10').anterior,null);
});
test('no future navigation even with erroneous upper bound',()=>{
 assert.equal(navegacaoMensalHome('2026-10',{periodoMinimo:'2026-01',periodoMaximo:'2027-12'},false,false,'2026-10').proximo,null);
});
test('missing limits loading and errors disable navigation without stale data',()=>{
 for(const [limits,loading,error] of [[null,false,false],[{periodoMinimo:'2026-10',periodoMaximo:'2026-01'},false,false],[{periodoMinimo:'2026-01',periodoMaximo:'2026-10'},true,false],[{periodoMinimo:'2026-01',periodoMaximo:'2026-10'},false,true]])
 assert.deepEqual(navegacaoMensalHome('2026-10',limits,loading,error,'2026-10'),{anterior:null,proximo:null});
});
test('Home starts current month, positions selector below header and never propagates month',async()=>{
 const home=await readFile(new URL('src/pages/HomeScreen/index.js',base),'utf8');
 assert.match(home,/useState\(\(\) => periodoMensalUTC\(\)\)/);
 assert.ok(home.indexOf('<SeletorMensalHome')<home.indexOf('<PurchaseHero'));
 assert.ok(home.indexOf('<SeletorMensalHome')>home.indexOf('styles.topBar'));
 assert.match(home,/navigation.navigate\('Dashboard', \{ indicador:'tempo' \}\)/);
 assert.doesNotMatch(home,/navigate\('Dashboard',\s*\{\s*periodo/);
 assert.doesNotMatch(home,/useAnaliseComportamento|fetchCompras/);
});
test('historical unavailable budget message and financial privacy stay explicit',async()=>{
 const component=await readFile(new URL('src/components/HomeComponents/ResumoInterativo/index.js',base),'utf8');
 const card=await readFile(new URL('src/utils/meiaLuaHome.js',base),'utf8');assert.match(card,/Orçamento deste mês não disponível/);
 assert.doesNotMatch(component,/dados\.analise|dados\.recomendacoes|compraId/);
});
test('selector exposes accessible disabled controls and guarded month taps',async()=>{
 const source=await readFile(new URL('src/components/HomeComponents/SeletorMensalHome.js',base),'utf8');
 const code=transformSync(source.replace(/^import .*;\r?\n/gm,'').replace('export default function','function'),{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-react-jsx']}).code;
 const React={createElement:(type,props,...children)=>({type,props:props||{},children})};
 const render=new Function('React','View','Text','Pressable','StyleSheet','MaterialCommunityIcons','apresentarMesHome','navegacaoMensalHome',code+';return SeletorMensalHome;')(React,'View','Text','Pressable',{create:x=>x},'Icon',apresentarMesHome,(period,limits,loading,error)=>navegacaoMensalHome(period,limits,loading,error,'2026-10'));
 const calls=[];const tree=render({periodo:'2026-10',limites:{periodoMinimo:'2026-09',periodoMaximo:'2026-10'},loading:false,error:false,onChange:p=>calls.push(p)});
 const buttons=tree.children.filter(c=>c.type==='Pressable');
 assert.equal(buttons[1].props.disabled,true);buttons[1].props.onPress();assert.equal(calls.length,0);
 buttons[0].props.onPress();assert.deepEqual(calls,['2026-09']);
 assert.equal(buttons[0].props.accessibilityLabel,'Mês anterior');assert.match(source,/minHeight:48/);
});