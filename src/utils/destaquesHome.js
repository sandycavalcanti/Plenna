export function destaquesHome(dados,metas=[],unread=0,hoje=new Date()){
 const candidates=[];
 if(dados?.orcamento?.excessoConhecidoCentavos>0)candidates.push({codigo:'ORCAMENTO_EXCEDIDO',prioridade:1,titulo:'Orçamento ultrapassado',mensagem:'O valor conhecido supera a referência deste mês. Podem faltar outros gastos.',acao:'dashboard'});
 const today=[hoje.getFullYear(),String(hoje.getMonth()+1).padStart(2,'0'),String(hoje.getDate()).padStart(2,'0')].join('-');
 const due=metas.filter(g=>!g.concluida&&g.data&&Number.isFinite(Date.parse(g.data))&&new Date(g.data).toISOString().slice(0,10)<today);
 if(due.length)candidates.push({codigo:'METAS_DATA',prioridade:2,titulo:'Reveja a data das suas metas',mensagem:due.length+' meta(s) em acompanhamento têm uma data anterior a hoje. Isso não comprova que o objetivo não foi alcançado.',acao:'metas'});
 if(Number.isInteger(unread)&&unread>0)candidates.push({codigo:'NOTIFICACOES',prioridade:3,titulo:'Há avisos para você',mensagem:unread+' aviso(s) ainda não lido(s). Consulte o contexto antes de decidir.',acao:'notificacoes'});
 return candidates.sort((a,b)=>a.prioridade-b.prioridade||a.codigo.localeCompare(b.codigo)).slice(0,3);
}