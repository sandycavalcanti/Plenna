const definitions = [
 ['IMPULSIVA','Marcadas como impulsivas','#AA719C'],
 ['NAO_IMPULSIVA','Marcadas como não impulsivas','#688574'],
 ['PENDENTE','Sem classificação definida','#9A87AF'],
];
export function distribuicaoClassificacoes(rows = []) {
 const counts = new Map(definitions.map(([code])=>[code,0])); let other=0, missing=0, legacy=false;
 for(const row of rows){
  const n=row?.quantidade_total??row?.quantidade;
  if(typeof n!=='number'||!Number.isInteger(n)||n<0)continue;
  if(row.quantidade_total===undefined)legacy=true;
  missing+=Number.isInteger(row.quantidade_sem_valor)&&row.quantidade_sem_valor>0?row.quantidade_sem_valor:0;
  const code=row.compra_classificacao;
  if(counts.has(code))counts.set(code,counts.get(code)+n);else other+=n;
 }
 const total=[...counts.values()].reduce((a,b)=>a+b,other);
 const groups=definitions.map(([codigo,nome,cor])=>({codigo,nome,cor,quantidade:counts.get(codigo),percentual:total>0?counts.get(codigo)/total*100:0}));
 if(other>0)groups.push({codigo:'NAO_IDENTIFICADA',nome:'Marcação não identificada',cor:'#76658A',quantidade:other,percentual:other/total*100});
 return {total,groups,comprasSemValor:missing,coberturaLegada:legacy};
}
