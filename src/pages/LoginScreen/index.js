import React from 'react';
import { styles } from './styles';
import { Text, Image, KeyboardAvoidingView, TouchableOpacity, View } from 'react-native';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';

// Tela de Login
// Após clicar em "Login", o usuário é direcionado para a área principal (Tabs)
export default function LoginScreen({ navigation }) {

    // Função chamada ao clicar no botão
    function handleLogin() {
        // replace impede voltar para a tela de login
        navigation.replace('App');
    }
    function handleForgotPassword() {
        navigation.navigate('ForgotPassword');
    }

    return (
        // Ajusta a tela quando o teclado aparece
        <KeyboardAvoidingView style={styles.container} behavior="padding">
            {/* Logo do app */}
            <Image source={require('../../../assets/img/logoPlennaIcon.png')} style={styles.logo} />
            <Text style={styles.titulo}> Bem-vindo! </Text>
            <View style={styles.overlay}> 
                {/* Campos de entrada */}
                <CustomTextInput placeholder="Email"/>
                <CustomTextInput placeholder="Password" secureTextEntry/>
                {/* Botão de login */}
                <CustomButton title="Entrar" onPress={handleLogin} />
                {/* Botão de 'esqueci a senha' */}
                <Text style={[styles.texto, { color: '#a31414' }]} onPress={handleForgotPassword}>
                Esqueceu sua senha?
                </Text>
            </View>
            {/* Link para criar conta */} 
            <Text style={[styles.texto, { color: '#fff' }]}>
                Não tem uma conta? Crie uma aqui!
            </Text>
        </KeyboardAvoidingView>
    );
}