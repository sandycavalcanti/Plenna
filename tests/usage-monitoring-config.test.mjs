import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createRenderer} from './helpers/componentRenderer.mjs';

const configSource=fs.readFileSync('src/constants/config.js','utf8');
function target(development,env={},platform='android') {
 const context=vm.createContext({__DEV__:development,process:{env},Platform:{OS:platform}});
 const source=configSource.replace(/^import .*;\r?\n/gm,'').replaceAll('export const ','const ');
 return vm.runInContext(source+';({devMode,urlAPI});',context);
}
test('local fallback only exists in a development build; release has a remote default',()=>{
 assert.equal(target(true).urlAPI,'http://10.0.2.2:3000');
 assert.equal(target(true,{},'ios').urlAPI,'http://localhost:3000');
 const release=target(false);assert.equal(release.devMode,false);assert.equal(release.urlAPI,'https://plenna-api.vercel.app/');
 assert.equal(target(true,{EXPO_PUBLIC_API_URL:' https://dev.example.invalid/ '}).urlAPI,'https://dev.example.invalid/');
 assert.equal(target(false,{EXPO_PUBLIC_API_URL:'https://dev.example.invalid/'}).urlAPI,'https://dev.example.invalid/');
});
test('the existing build preflight validates config without rewriting or persisting a different environment',()=>{
 execFileSync(process.execPath,['src/utils/buildScript.js'],{windowsHide:true});
 assert.equal(fs.readFileSync('src/constants/config.js','utf8'),configSource);
});
