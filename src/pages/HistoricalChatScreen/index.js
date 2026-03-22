import React from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { styles } from './styles';
import CustomTextInput from '../../components/CustomTextInput';
import ChatItem from '../../components/ChatComponents/historicalChatItem';
import { MaterialIcons } from '@expo/vector-icons';

export default function HistoricalChatScreen({ navigation }) {

    const chats = [
        { id: '1', title: 'Compras impulsivas', message: 'Você gastou muito hoje' },
        { id: '2', title: 'Planejamento', message: 'Seu orçamento do mês...' },
        { id: '3', title: 'Dicas de economia', message: 'Aqui estão algumas dicas...' },
        { id: '4', title: 'Finanças pessoais', message: 'Here are some personal finance tips...' }
    ];

    return (
        <View style={styles.container}>
            <View style={styles.search}>
                <CustomTextInput placeholder="Pesquisar chat..." style={{ width: '90%' }}/>
                <TouchableOpacity style={styles.menuButton} onPress={() => { 
                    console.log('Abrir menu');
                }} >
                    <MaterialIcons name="more-vert" size={26} color="#fff" />
                </TouchableOpacity>
            </View>
            <FlatList data={chats} keyExtractor={(item) => item.id} renderItem={({ item }) => (
                <ChatItem
                    title={item.title}
                    lastMessage={item.message}
                    onPress={() => navigation.navigate('Chat', { chatId: item.id })}
                />
                )} style={styles.lista}
            />
        </View>
    );
}