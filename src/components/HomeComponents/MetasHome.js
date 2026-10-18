import React,{useState} from 'react';
import {View,Text,Pressable,ActivityIndicator} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
const style={card:{padding:16,marginHorizontal:18,marginBottom:14,borderRadius:18,backgroundColor:'#FFFFFF',gap:8},title:{fontSize:18,fontWeight:'700',color:'#594367'},note:{fontSize:13,lineHeight:19,color:'#655A70'},touch:{minHeight:48,justifyContent:'center'},link:{fontWeight:'600',color:'#893467'}};
export default function MetasHome({metas=[],loading,error,onRetry,onCreate}){
 const [all,setAll]=useState(false);
 return <View style={style.card}><Text style={style.title}>Minhas metas</Text>
 {loading?<ActivityIndicator accessibilityLabel="Carregando metas"/>:error?<><Text style={style.note}>Não foi possível consultar suas metas.</Text><Pressable onPress={onRetry} accessibilityRole="button" style={style.touch}><Text style={style.link}>Tentar novamente</Text></Pressable></>:metas.length===0?<><Text style={style.note}>Qual objetivo você quer acompanhar?</Text><Pressable onPress={onCreate} accessibilityRole="button" style={style.touch}><Text style={style.link}>Criar uma meta</Text></Pressable></>:<>
 {(all?metas:metas.slice(0,2)).map(g=><View key={g.id} style={{padding:12,borderRadius:14,backgroundColor:'#FAF7FC',gap:5}}><Text style={style.title}>{g.nome}</Text><Text style={style.note}>Objetivo: {g.valor===null||g.valor===undefined?'Valor não informado':!Number.isFinite(Number(g.valor))?'Valor não informado':Number(g.valor).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Text><Text style={style.note}>{g.concluida?'Marcada como concluída':'Em acompanhamento'}</Text>{g.data&&Number.isFinite(Date.parse(g.data))&&<Text style={style.note}>Data da meta: {new Date(g.data).toLocaleDateString('pt-BR',{timeZone:'UTC'})}</Text>}</View>)}
 <Text style={style.note}>O app ainda não registra aportes para calcular o progresso.</Text>
 {metas.length>2&&<Pressable accessibilityRole="button" accessibilityState={{expanded:all}} onPress={()=>setAll(!all)} style={style.touch}><Text style={style.link}>{all?'Mostrar menos':'Ver as '+metas.length+' metas'}</Text></Pressable>}
 </>}
 </View>;
}