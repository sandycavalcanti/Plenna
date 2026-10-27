export function destaquesHome(dados,metas=[],unread=0,hoje=new Date()){
 const candidates=[];
 if(dados?.orcamento?.excessoConhecidoCentavos>0)candidates.push({codigo:'ORCAMENTO_EXCEDIDO',prioridade:1,titulo:'Orçamento ultrapassado',mensagem:'O valor conhecido supera a referência deste mês. Podem faltar outros gastos.',acao:'dashboard'});
 const today=[hoje.getFullYear(),String(hoje.getMonth()+1).padStart(2,'0'),String(hoje.getDate()).padStart(2,'0')].join('-');
 const due=metas.filter(g=>!g.concluida&&g.data&&Number.isFinite(Date.parse(g.data))&&new Date(g.data).toISOString().slice(0,10)<today);
 if(due.length)candidates.push({codigo:'METAS_DATA',prioridade:2,titulo:'Reveja a data das suas metas',mensagem:due.length+' meta(s) em acompanhamento têm uma data anterior a hoje. Isso não comprova que o objetivo não foi alcançado.',acao:'metas'});
 if(Number.isInteger(unread)&&unread>0)candidates.push({codigo:'NOTIFICACOES',prioridade:3,titulo:'Há avisos para você',mensagem:unread+' aviso(s) ainda não lido(s). Consulte o contexto antes de decidir.',acao:'notificacoes'});
 return candidates.sort((a,b)=>a.prioridade-b.prioridade||a.codigo.localeCompare(b.codigo)).slice(0,3);
}

function textoNormalizado(valor) {
 return String(valor ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toUpperCase();
}

function contextoDoItem(item) {
 const tipo = textoNormalizado(item?.tipo ?? item?.codigo);
 const texto = textoNormalizado(`${item?.titulo ?? ''} ${item?.texto ?? ''} ${item?.mensagem ?? ''}`);
 const completo = `${tipo} ${texto}`;

 if (/ORCAMENTO|BUDGET|MENSAL/.test(completo)) return 'ORCAMENTO';
 if (/LIMITE|LIMIT/.test(completo)) return 'LIMITE';
 if (/META|OBJETIVO|GOAL/.test(completo)) return 'META';
 if (/RECORREN|PARCEL/.test(completo)) return 'RECORRENCIA';
 if (/IMPULS|FREQUEN|HABITO/.test(completo)) return 'COMPORTAMENTO';
 if (/NOTIFIC/.test(completo)) return 'NOTIFICACOES';
 return tipo || texto.slice(0, 80);
}

/**
 * Une recomendações persistidas e destaques locais sem duplicar o mesmo
 * contexto financeiro. A lista persistida tem prioridade; os destaques locais
 * continuam disponíveis para avisos comuns, como notificações não lidas.
 */
export function unificarDestaquesHome(
 recomendacoes = [],
 locais = [],
 consentimentoAtivo = false,
 descobertas = [],
) {
 const itensInteligentes = [];
 const itensFallback = [];
 const contextos = new Set();
 const contextosFallback = new Set();

 if (consentimentoAtivo === true && Array.isArray(recomendacoes)) {
  for (const item of recomendacoes) {
   if (!item || item.id === undefined || item.id === null) continue;
   const contexto = contextoDoItem(item);
   if (contextos.has(contexto)) continue;
   contextos.add(contexto);
   itensInteligentes.push({
    ...item,
    tipoItem: 'RECOMENDACAO',
    chave: `recomendacao-${item.id}`,
    codigo: `RECOMENDACAO_${item.id}`,
    contexto,
    mensagem: item.texto,
   });
  }
 }

 // Descobertas e observações históricas são cards sistêmicos de fallback.
 // Recomendações persistidas têm prioridade e não são misturadas com eles.
 for (const item of Array.isArray(descobertas) ? descobertas : []) {
  if (!item?.codigo) continue;
  const contexto = contextoDoItem(item);
  if (contextos.has(contexto) || contextosFallback.has(contexto)) continue;
  contextosFallback.add(contexto);
  itensFallback.push({
   ...item,
   tipoItem: 'DESTAQUE_SISTEMA',
   chave: `descoberta-${item.codigo}`,
   contexto,
   mensagem: item.mensagem ?? item.informacao ?? item.texto ?? '',
  });
 }

 for (const item of Array.isArray(locais) ? locais : []) {
  const contexto = contextoDoItem(item);
  if (contextos.has(contexto) || contextosFallback.has(contexto)) continue;
  contextosFallback.add(contexto);
  itensFallback.push({
   ...item,
   tipoItem: 'DESTAQUE_LOCAL',
   chave: `local-${item.codigo}`,
   contexto,
  });
 }

 if (itensInteligentes.length > 0) return itensInteligentes.slice(0, 3);
 return [...itensFallback].slice(0, 3);
}
